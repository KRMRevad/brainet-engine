/**
 * Council Orchestrator — Browser Automation First
 *
 * Executes the 4-agent Council using EXISTING SUBSCRIPTIONS via browser automation.
 * Zero additional API cost.
 *
 * Resolution hierarchy:
 *   1. Browser tabs (ChatGPT, Claude, Gemini, Grok) → council.js + browser-llm.js
 *   2. OpenClaw Gateway → LLM via Ollama (local/remote)
 *   3. API fallback → LAST RESORT only
 *
 * Flow:
 *   Input → [Pesquisador || Visionário || Desafiador] parallel in browser tabs
 *         → Capitão waits for all 3 → synthesizes final result
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import { councilExecute } from './council.js'
import { connectToChrome, sendToAI, checkAvailableAIs } from './browser-llm.js'
import { sendViaOpenClaw, checkOpenClawHealth, webFetch } from './openclaw-driver.js'
import { scrapeUrl, batchScrape, checkScraplingHealth } from './scrapling-bridge.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SQUAD_DIR = path.join(__dirname, '..', 'squads', 'brainet-squad')

// ── Prompt Loader ────────────────────────────────
const promptCache = {}

async function loadPrompt(agentName) {
    if (promptCache[agentName]) return promptCache[agentName]

    const filePath = path.join(SQUAD_DIR, 'agents', `${agentName}.prompt.md`)
    try {
        const content = await fs.readFile(filePath, 'utf-8')
        promptCache[agentName] = content
        return content
    } catch (err) {
        console.error(`[Council] Failed to load prompt for ${agentName}:`, err.message)
        return `You are the ${agentName} agent. Respond based on the given topic.`
    }
}

// ── Routing Weights (inline to avoid yaml dependency) ────────
const ROUTING_WEIGHTS = {
    pesquisa: { pesquisador: 3, visionario: 1, desafiador: 1, foco: 'Priorize dados e citações do Pesquisador' },
    sintese: { pesquisador: 2, visionario: 1.5, desafiador: 1, foco: 'Integre todas as perspectivas de forma equilibrada' },
    estrategia: { pesquisador: 1, visionario: 3, desafiador: 2, foco: 'Priorize visão do Visionário mas valide com riscos do Desafiador' },
    analise: { pesquisador: 2, visionario: 1, desafiador: 2, foco: 'Análise rigorosa com dados + crítica' },
    comparacao: { pesquisador: 2.5, visionario: 1, desafiador: 2.5, foco: 'Compare opções com dados (Pesq) e riscos (Desaf)' },
    criacao: { pesquisador: 1, visionario: 3, desafiador: 0.5, foco: 'Maximize criatividade, minimize restrições' },
    revisao: { pesquisador: 1.5, visionario: 0.5, desafiador: 3, foco: 'Foco em identificar problemas e melhorias (Desafiador lidera)' },
}

// ── Agent → Browser Tab Mapping ──────────────────
const AGENT_TO_BROWSER = {
    pesquisador: 'gemini',    // Gemini tab → Pesquisador
    visionario: 'chatgpt',   // ChatGPT tab → Visionário
    desafiador: 'grok',      // Grok tab → Desafiador (fallback: chatgpt)
    capitao: 'claude',    // Claude tab → Capitão
}

// ── User Prompt Builder ──────────────────────────

function buildUserPrompt(job) {
    const parts = [
        `## Tema\n${job.tema}`,
    ]

    if (job.contexto) parts.push(`## Contexto\n${job.contexto}`)
    parts.push(`## Objetivo\n${job.objetivo}`)
    parts.push(`## Profundidade\n${job.profundidade || 'padrao'}`)

    if (job.fontes?.length > 0) {
        parts.push(`## Fontes de Referência\n${job.fontes.map(f => `- ${f}`).join('\n')}`)
    }

    const r = job.restricoes || {}
    parts.push(`## Restrições\n- Idioma: ${r.idioma || 'pt-BR'}\n- Formato: ${r.formato_output || 'markdown'}\n- Tom: ${r.tom || 'tecnico'}`)

    return parts.join('\n\n')
}

// ── Browser-Based Agent Execution ────────────────

/**
 * Send a prompt to an AI agent via browser tab
 * Falls back through: Browser → OpenClaw → error
 *
 * @param {string} agentName - pesquisador | visionario | desafiador | capitao
 * @param {string} systemPrompt - Agent's system prompt
 * @param {string} userPrompt - User prompt
 * @param {function} onProgress - Progress callback
 * @returns {object} { text, source, timestamp }
 */
async function executeAgent(agentName, systemPrompt, userPrompt, onProgress) {
    const browserId = AGENT_TO_BROWSER[agentName]
    const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`

    onProgress('agent_start', { agent: agentName, browser: browserId })

    // Strategy 1: Browser tab via existing browser-llm.js
    let criticalError = null
    try {
        const available = await checkAvailableAIs()
        if (available.connected && available.ais[browserId]?.available) {
            onProgress('agent_browser', { agent: agentName, method: 'browser-tab', browser: browserId })

            const text = await sendToAI(browserId, fullPrompt, { agentId: agentName }, (progress) => {
                onProgress('agent_progress', { agent: agentName, ...progress })
            })

            if (text && text.length > 50) {
                onProgress('agent_complete', { agent: agentName, method: 'browser-tab', length: text.length })
                return { text, source: `browser:${browserId}`, timestamp: new Date().toISOString() }
            } else {
                // Tab exists but returned no meaningful response
                const msg = `Browser tab ${browserId} returned empty response`
                console.warn(`[Council] ${msg} for ${agentName}`)
                onProgress('agent_fallback', { agent: agentName, from: 'browser', to: 'openclaw', reason: msg })
            }
        } else {
            // Specific agent tab not found (not a critical infra failure)
            console.warn(`[Council] Tab ${browserId} not found for ${agentName}, attempting fallback...`)
        }
    } catch (err) {
        // Check if this is a CRITICAL infrastructure error (no LLM tabs at all)
        if (err.message.includes('[CRITICAL]')) {
            criticalError = err
            console.error(`[Council] ❌ INFRASTRUCTURE CRITICAL ERROR: ${err.message}`)
            // DON'T attempt fallback for critical infrastructure errors
            throw err
        } else {
            // Non-critical error (specific execution failure)
            console.warn(`[Council] Browser execution failed for ${agentName}:`, err.message)
            onProgress('agent_fallback', { agent: agentName, from: 'browser', to: 'openclaw', reason: err.message })
        }
    }

    // If critical error occurred, don't attempt fallback
    if (criticalError) {
        throw criticalError
    }

    // Strategy 2: OpenClaw Gateway (only if not a critical infra failure)
    try {
        console.log(`[Council] Tentando fallback OpenClaw para ${agentName}...`)
        const clawHealth = await checkOpenClawHealth()
        if (clawHealth.available) {
            onProgress('agent_openclaw', { agent: agentName, method: 'openclaw' })

            const text = await sendViaOpenClaw(systemPrompt, userPrompt, {
                timeout: 120_000,
            })

            if (text && text.length > 50) {
                onProgress('agent_complete', { agent: agentName, method: 'openclaw', length: text.length })
                return { text, source: 'openclaw', timestamp: new Date().toISOString() }
            }
        } else {
            console.warn(`[Council] OpenClaw não está disponível (health check falhou)`)
        }
    } catch (err) {
        console.warn(`[Council] OpenClaw failed for ${agentName}:`, err.message)
        onProgress('agent_error', { agent: agentName, method: 'openclaw', error: err.message })
    }

    // If both methods fail, return error
    return { error: `All execution methods failed for ${agentName}`, source: 'none' }
}

// ── Source Pre-Fetching (for Pesquisador) ─────────

/**
 * Pre-fetch content from user-provided sources using Scrapling/OpenClaw
 * This gives the Researcher richer data to work with
 */
async function prefetchSources(fontes, onProgress) {
    if (!fontes || fontes.length === 0) return ''

    onProgress('prefetch_start', { count: fontes.length })

    let extractedContent = ''

    // Try Scrapling first (better anti-detection)
    const scraplingHealth = await checkScraplingHealth()
    if (scraplingHealth.available) {
        onProgress('prefetch_scrapling', { count: fontes.length })
        const results = await batchScrape(fontes, { maxConcurrent: 3 })

        for (const result of results) {
            if (result.success && result.content) {
                extractedContent += `\n\n### Fonte: ${result.url}\n${result.content.slice(0, 3000)}\n`
            }
        }
    } else {
        // Fallback: OpenClaw web_fetch
        onProgress('prefetch_openclaw', { count: fontes.length })
        for (const url of fontes.slice(0, 5)) {
            try {
                const content = await webFetch(url, 'Extract all relevant data, facts, and statistics')
                if (content) {
                    extractedContent += `\n\n### Fonte: ${url}\n${content.slice(0, 3000)}\n`
                }
            } catch (err) {
                console.warn(`[Council] Failed to fetch source ${url}:`, err.message)
            }
        }
    }

    onProgress('prefetch_complete', { chars: extractedContent.length })
    return extractedContent
}

// ── Captain Synthesis Prompt Builder ─────────────

function buildSynthesisPrompt(job, results, weights) {
    const parts = [
        `# Tarefa de Síntese\n`,
        `**Tema:** ${job.tema}`,
        `**Objetivo:** ${job.objetivo}`,
        `**Pesos:** Pesquisador=${weights.pesquisador}, Visionário=${weights.visionario}, Desafiador=${weights.desafiador}`,
        weights.foco ? `**Foco da síntese:** ${weights.foco}` : '',
        `\n---\n`,
    ]

    if (results.pesquisador?.text) {
        parts.push(`## 🔬 Pesquisador (Peso: ${weights.pesquisador})\n${results.pesquisador.text}`)
    } else {
        parts.push(`## 🔬 Pesquisador: ${results.pesquisador?.error || 'Não respondeu (timeout)'}`)
    }

    if (results.visionario?.text) {
        parts.push(`\n## 🔮 Visionário (Peso: ${weights.visionario})\n${results.visionario.text}`)
    } else if (results.visionario?.error) {
        parts.push(`\n## 🔮 Visionário: ${results.visionario.error}`)
    }

    if (results.desafiador?.text) {
        parts.push(`\n## ⚔️ Desafiador (Peso: ${weights.desafiador})\n${results.desafiador.text}`)
    } else if (results.desafiador?.error) {
        parts.push(`\n## ⚔️ Desafiador: ${results.desafiador.error}`)
    }

    const idioma = job.restricoes?.idioma || 'pt-BR'
    parts.push(`\n---\nSintetize os resultados acima seguindo seu formato de output. Responda em ${idioma}.`)

    return parts.filter(Boolean).join('\n')
}

// ── Main Orchestrator ────────────────────────────

/**
 * Execute the Council pipeline using browser automation
 *
 * @param {object} job - Council job data (tema, objetivo, etc.)
 * @param {function} onProgress - Progress callback (status, data)
 * @returns {Promise<object>} Complete result with all agent outputs
 */
export async function executeCouncil(job, onProgress = () => { }) {
    const startTime = Date.now()
    const modo = job.council_config?.modo || 'completo'
    const desafiar = job.council_config?.desafiar !== false

    const weights = ROUTING_WEIGHTS[job.objetivo] || ROUTING_WEIGHTS.pesquisa

    const results = {
        pesquisador: null,
        visionario: null,
        desafiador: null,
        capitao: null,
    }

    onProgress('routing', { modo, objetivo: job.objetivo, weights })

    // ── Step 0: Try to connect to Chrome ──
    try {
        await connectToChrome(process.env.CHROME_DEBUG_PORT || 9225)
        onProgress('browser_connected', { port: process.env.CHROME_DEBUG_PORT || 9225 })
    } catch (err) {
        console.warn('[Council] Chrome not available:', err.message)
        onProgress('browser_unavailable', { error: err.message, fallback: 'openclaw' })
    }

    // ── Step 0.5: Pre-fetch user sources for Researcher ──
    let sourcesContent = ''
    if (job.fontes?.length > 0) {
        sourcesContent = await prefetchSources(job.fontes, onProgress)
    }

    // ── Step 1: Load prompts ──
    const [pesqPrompt, visionPrompt, desafPrompt] = await Promise.all([
        loadPrompt('pesquisador'),
        modo === 'completo' ? loadPrompt('visionario') : Promise.resolve(null),
        modo === 'completo' && desafiar ? loadPrompt('desafiador') : Promise.resolve(null),
    ])

    // ── Step 2: Build user prompt ──
    let userPrompt = buildUserPrompt(job)

    // Append pre-fetched sources for the Researcher
    const pesqUserPrompt = sourcesContent
        ? `${userPrompt}\n\n## Conteúdo Pré-Extraído das Fontes\n${sourcesContent}`
        : userPrompt

    // ── Step 3: Parallel Agent Execution ──
    onProgress('processing', {
        phase: 'parallel',
        agents: getActiveAgents(modo, desafiar),
    })

    const tasks = []
    let infrastructureFailed = false
    let infrastructureError = null

    // Helper to handle agent execution with critical error detection
    const executeAgentWithCriticalCheck = async (agentName, prompt, userPrompt) => {
        try {
            return await executeAgent(agentName, prompt, userPrompt, onProgress)
        } catch (err) {
            if (err.message.includes('[CRITICAL]')) {
                // CRITICAL infrastructure error - abort entire job
                infrastructureFailed = true
                infrastructureError = err
                throw err
            } else {
                // Non-critical error - return error object
                return { error: err.message }
            }
        }
    }

    // Pesquisador always runs
    tasks.push(
        executeAgentWithCriticalCheck('pesquisador', pesqPrompt, pesqUserPrompt)
            .then(r => { results.pesquisador = r })
            .catch(err => {
                if (infrastructureFailed) throw err
                results.pesquisador = { error: err.message }
            })
    )

    if (modo === 'completo') {
        // Visionário
        tasks.push(
            executeAgentWithCriticalCheck('visionario', visionPrompt, userPrompt)
                .then(r => { results.visionario = r })
                .catch(err => {
                    if (infrastructureFailed) throw err
                    results.visionario = { error: err.message }
                })
        )

        // Desafiador
        if (desafiar) {
            tasks.push(
                executeAgentWithCriticalCheck('desafiador', desafPrompt, userPrompt)
                    .then(r => { results.desafiador = r })
                    .catch(err => {
                        if (infrastructureFailed) throw err
                        results.desafiador = { error: err.message }
                    })
            )
        }
    }

    // Wait for all parallel agents (max 5 min for browser-based responses)
    try {
        await Promise.race([
            Promise.allSettled(tasks),
            new Promise(resolve => setTimeout(resolve, 300_000)),
        ])
    } catch (err) {
        if (err.message.includes('[CRITICAL]')) {
            // Critical infrastructure error - fail the entire job
            console.error(`[Council] ❌ CRITICAL INFRASTRUCTURE ERROR - Job aborted:`, err.message)
            onProgress('infrastructure_critical_error', { error: err.message })
            throw err
        }
    }

    // If critical error was detected, throw it now
    if (infrastructureFailed) {
        console.error(`[Council] ❌ CRITICAL INFRASTRUCTURE ERROR - Job aborted:`, infrastructureError.message)
        onProgress('infrastructure_critical_error', { error: infrastructureError.message })
        throw infrastructureError
    }

    // ── Step 4: Captain Synthesis ──
    if (modo !== 'apenas_pesquisa') {
        onProgress('synthesizing', { phase: 'captain' })

        const capitaoPrompt = await loadPrompt('capitao')
        const synthesisInput = buildSynthesisPrompt(job, results, weights)

        results.capitao = await executeAgent('capitao', capitaoPrompt, synthesisInput, onProgress)

        onProgress('captain_complete', { length: results.capitao?.text?.length || 0 })
    }

    // ── Step 5: Build Final Result ──
    const duration = Date.now() - startTime
    const finalResult = results.capitao?.text || results.pesquisador?.text || 'No result produced'

    const sources = Object.entries(results)
        .filter(([, v]) => v?.source)
        .map(([k, v]) => `${k}:${v.source}`)

    onProgress('complete', {
        duration_ms: duration,
        sources,
        agents_responded: Object.keys(results).filter(k => results[k]?.text).length,
    })

    return {
        resultado_pesquisador: results.pesquisador,
        resultado_visionario: results.visionario,
        resultado_desafiador: results.desafiador,
        resultado_capitao: results.capitao,
        resultado_final: finalResult,
        duration_ms: duration,
        tokens_used: {}, // browser-based = no token tracking
    }
}

function getActiveAgents(modo, desafiar) {
    switch (modo) {
        case 'completo':
            return desafiar
                ? ['pesquisador', 'visionario', 'desafiador', 'capitao']
                : ['pesquisador', 'visionario', 'capitao']
        case 'rapido':
            return ['pesquisador', 'capitao']
        case 'apenas_pesquisa':
            return ['pesquisador']
        default:
            return ['pesquisador', 'capitao']
    }
}
