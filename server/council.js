/**
 * BRAINET AI Council
 * Orchestrates ChatGPT, Claude, and Gemini via browser automation
 * Supports SOLO, COUNCIL, and CASCADE modes
 */

import { connectToChrome, sendToAI, checkAvailableAIs, getAIDrivers } from './browser-llm.js'
import { mergeResponses } from './merge-engine.js'
import { llmComplete } from './llm-client.js'
import config from './config.js'

/**
 * Execute a council request
 * @param {string} systemPrompt - Agent system prompt
 * @param {string} userPrompt - User prompt with context
 * @param {object} opts - { mode, lead, order, agentId, onProgress }
 * @returns {object} { text, mode, sources, analysis }
 */
export async function councilExecute(systemPrompt, userPrompt, opts = {}) {
    const routing = getRouting(opts.agentId, opts)
    const onProgress = opts.onProgress || (() => { })

    console.log(`[Council] Mode: ${routing.mode}, Agent: ${opts.agentId || 'generic'}`)

    // Build the full prompt (system + user combined for browser UIs)
    const fullPrompt = buildBrowserPrompt(systemPrompt, userPrompt)

    // Try browser-based execution first
    try {
        await connectToChrome(config.council?.chromePort || 9222)
    } catch (e) {
        console.warn(`[Council] Chrome not connected: ${e.message}`)
        console.log('[Council] Falling back to API-based LLM...')
        onProgress({ type: 'council_fallback', reason: e.message })

        // Fallback to API-based LLM
        const text = await llmComplete(systemPrompt, userPrompt, { heavy: opts.heavy })
        return { text, mode: 'api_fallback', sources: [config.llm.provider], analysis: `Fallback to ${config.llm.provider} API` }
    }

    switch (routing.mode) {
        case 'solo':
            return await executeSolo(fullPrompt, routing, onProgress)
        case 'council':
            return await executeCouncil(fullPrompt, routing, onProgress)
        case 'cascade':
            return await executeCascade(fullPrompt, systemPrompt, userPrompt, routing, onProgress)
        default:
            return await executeSolo(fullPrompt, routing, onProgress)
    }
}

/**
 * SOLO MODE — Single AI responds
 */
async function executeSolo(prompt, routing, onProgress) {
    const ai = routing.lead || routing.order?.[0] || 'chatgpt'

    onProgress({ type: 'council_mode', mode: 'SOLO', ais: [ai] })
    onProgress({ type: 'ai_start', ai, total: 1, current: 1 })

    const text = await sendToAI(ai, prompt, routing, onProgress)

    const driver = getAIDrivers().find(d => d.id === ai)

    return {
        text,
        mode: 'solo',
        sources: [ai],
        analysis: `${driver?.emoji || '🤖'} ${driver?.name || ai} responded (${text.length} chars)`,
    }
}

/**
 * COUNCIL MODE — All AIs respond, merge selects best
 */
async function executeCouncil(prompt, routing, onProgress) {
    const members = routing.members || ['chatgpt', 'claude', 'gemini']

    onProgress({ type: 'council_mode', mode: 'COUNCIL', ais: members })

    // Check which AIs are available
    const available = await checkAvailableAIs()
    const activeMembers = members.filter(m => available.ais[m]?.available)

    if (activeMembers.length === 0) {
        throw new Error('No AI tabs available. Open ChatGPT, Claude, or Gemini in Chrome.')
    }

    // Send to all available AIs simultaneously using Promise.allSettled
    const promises = activeMembers.map(async (ai, i) => {
        const driver = getAIDrivers().find(d => d.id === ai)

        onProgress({
            type: 'ai_start',
            ai,
            name: driver?.name,
            emoji: driver?.emoji,
            total: activeMembers.length,
            current: i + 1,
        })

        try {
            const text = await sendToAI(ai, prompt, routing, onProgress)

            onProgress({
                type: 'ai_complete',
                ai,
                name: driver?.name,
                emoji: driver?.emoji,
                length: text.length,
            })

            return {
                ai,
                name: driver?.name || ai,
                emoji: driver?.emoji || '🤖',
                text,
                length: text.length,
                success: true
            }
        } catch (e) {
            console.error(`[Council] ${ai} failed:`, e.message)
            onProgress({ type: 'ai_error', ai, error: e.message })
            return { ai, success: false, error: e.message }
        }
    })

    const results = await Promise.allSettled(promises)

    const responses = []
    for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
            responses.push(result.value)
        }
    }

    if (responses.length === 0) {
        throw new Error('All AIs failed to respond.')
    }

    // Merge responses
    onProgress({ type: 'council_merging', responses: responses.length })
    const merged = mergeResponses(responses, routing.mergeMode || 'combine')

    onProgress({
        type: 'council_complete',
        mode: 'COUNCIL',
        sources: merged.sources,
        analysis: merged.analysis,
    })

    return {
        text: merged.merged,
        mode: 'council',
        sources: merged.sources,
        analysis: merged.analysis,
        scores: merged.scores,
        individualResponses: responses.map(r => ({
            ai: r.ai,
            name: r.name,
            emoji: r.emoji,
            length: r.length,
            preview: r.text.substring(0, 300),
        })),
    }
}

/**
 * CASCADE MODE — Each AI refines the previous output
 */
async function executeCascade(fullPrompt, systemPrompt, userPrompt, routing, onProgress) {
    const order = routing.order || ['chatgpt', 'claude', 'gemini']

    onProgress({ type: 'council_mode', mode: 'CASCADE', ais: order })

    const available = await checkAvailableAIs()
    const activeOrder = order.filter(m => available.ais[m]?.available)

    if (activeOrder.length === 0) {
        throw new Error('No AI tabs available.')
    }

    let currentOutput = ''
    const stages = []

    for (let i = 0; i < activeOrder.length; i++) {
        const ai = activeOrder[i]
        const driver = getAIDrivers().find(d => d.id === ai)
        const isFirst = i === 0
        const isLast = i === activeOrder.length - 1

        onProgress({
            type: 'cascade_stage',
            ai,
            name: driver?.name,
            emoji: driver?.emoji,
            stage: i + 1,
            total: activeOrder.length,
            isFirst,
            isLast,
        })

        // Build cascade prompt
        let cascadePrompt
        if (isFirst) {
            cascadePrompt = fullPrompt
        } else {
            const prevAI = getAIDrivers().find(d => d.id === activeOrder[i - 1])
            cascadePrompt = buildCascadePrompt(systemPrompt, userPrompt, currentOutput, prevAI?.name || 'IA anterior', isLast)
        }

        try {
            const text = await sendToAI(ai, cascadePrompt, routing, onProgress)
            currentOutput = text

            stages.push({
                ai,
                name: driver?.name || ai,
                emoji: driver?.emoji || '🤖',
                length: text.length,
                stage: i + 1,
            })

            onProgress({
                type: 'cascade_stage_complete',
                ai,
                name: driver?.name,
                emoji: driver?.emoji,
                stage: i + 1,
                length: text.length,
            })
        } catch (e) {
            console.error(`[Council] Cascade stage ${i + 1} (${ai}) failed:`, e.message)
            onProgress({ type: 'ai_error', ai, error: e.message })
            // Continue with what we have
        }
    }

    const stagesSummary = stages.map(s => `${s.emoji}${s.name}(${s.length})`).join(' → ')

    return {
        text: currentOutput,
        mode: 'cascade',
        sources: stages.map(s => s.ai),
        analysis: `CASCADE: ${stagesSummary}`,
        stages,
    }
}

/**
 * Build prompt for browser UIs (system + user combined)
 */
function buildBrowserPrompt(systemPrompt, userPrompt) {
    // Browser UIs don't have separate system/user fields
    // Combine them into a single structured prompt
    return `# INSTRUÇÃO DO SISTEMA (siga exatamente)

${systemPrompt}

---

# SEU INPUT / TAREFA

${userPrompt}

---

**EXECUTE agora todas as instruções acima em uma resposta completa e estruturada.**`
}

/**
 * Build cascade refinement prompt
 */
function buildCascadePrompt(systemPrompt, userPrompt, previousOutput, previousAIName, isFinal) {
    return `# INSTRUÇÃO DO SISTEMA

${systemPrompt}

---

# CONTEXTO: Você é parte de um CONSELHO DE IAs

Uma IA anterior (${previousAIName}) já processou este input. Seu trabalho é:
1. **ANALISAR** a resposta anterior criticamente
2. **EXPANDIR** o que ficou superficial ou incompleto
3. **CORRIGIR** erros ou imprecisões
4. **ADICIONAR** perspectivas e insights que faltaram
5. **REFINAR** a qualidade geral do output
${isFinal ? '\n6. **SINTETIZAR** tudo em um documento final definitivo\n' : ''}

## INPUT ORIGINAL:

${userPrompt}

## RESPOSTA DA IA ANTERIOR (${previousAIName}):

${previousOutput.substring(0, 12000)}
${previousOutput.length > 12000 ? '\n\n[... truncado por limite de contexto ...]' : ''}

---

**Gere sua versão REFINADA E APRIMORADA, mantendo o que há de bom e melhorando significativamente o output.**`
}

/**
 * Get routing config for an agent
 */
function getRouting(agentId, overrides = {}) {
    const defaultRouting = config.council?.agentRouting?.[agentId] || {
        mode: config.council?.defaultMode || 'solo',
        lead: 'chatgpt',
        order: ['chatgpt', 'claude', 'gemini'],
        members: ['chatgpt', 'claude', 'gemini'],
    }

    return {
        ...defaultRouting,
        ...overrides,
        // Override mode if explicitly passed
        mode: overrides.councilMode || overrides.mode || defaultRouting.mode,
    }
}

/**
 * Check council readiness
 */
export async function checkCouncilHealth() {
    try {
        await connectToChrome(config.council?.chromePort || 9222)
        const ais = await checkAvailableAIs()
        return {
            connected: true,
            ...ais,
            totalAvailable: Object.values(ais.ais).filter(a => a.available).length,
        }
    } catch (e) {
        // SYS-23: Do NOT expose Chrome path or debugging port in public response
        return {
            connected: false,
            error: 'Chrome connection failed',
        }
    }
}
