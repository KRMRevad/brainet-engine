/**
 * BRAINET Agent Executor
 * Orchestrates the real pipeline: Agent 1 → 2 → 3 → 5 → 6
 * Uses AI Council (ChatGPT + Claude + Gemini via browser) or API fallback
 */

import fs from 'fs/promises'
import path from 'path'
import config from './config.js'
import { councilExecute } from './council.js'
import { loadAgentPrompt, buildUserPrompt } from './prompt-loader.js'
import { fullResearch } from './web-search.js'
import { updateJob, updateAgentStatus, addJobError } from './job-queue.js'

/** Event emitter for SSE progress */
const listeners = new Map()

export function addProgressListener(jobId, callback) {
    if (!listeners.has(jobId)) listeners.set(jobId, [])
    listeners.get(jobId).push(callback)
}

export function removeProgressListener(jobId, callback) {
    const list = listeners.get(jobId) || []
    const idx = list.indexOf(callback)
    if (idx >= 0) list.splice(idx, 1)
}

function emitProgress(jobId, data) {
    const list = listeners.get(jobId) || []
    list.forEach(cb => cb(data))
}

/**
 * Agent definitions for the pipeline
 */
const PIPELINE_AGENTS = [
    { id: 1, nome: 'Pesquisa Profunda', emoji: '🔍', heavy: true, hasSearch: true },
    { id: 2, nome: 'Extração de Conhecimento', emoji: '⛏️', heavy: true },
    { id: 3, nome: 'Matrix Mente Superior', emoji: '🧠', heavy: true },
    // Agent 4 (Insights) can be skipped in MVP for speed
    { id: 5, nome: 'Estratégia Multicanal', emoji: '📡', heavy: false },
    { id: 6, nome: 'Roteirista Estratégico', emoji: '🎬', heavy: true },
]

// Optional QA agents
const QA_AGENTS = [
    { id: 'qa_fire', nome: 'Fire Scanner', emoji: '🔥', heavy: false },
]

/**
 * Execute the full pipeline for a job
 * @param {object} job - Job object from the queue
 * @param {object} nicho - Full nicho object from nichos.json
 */
export async function executePipeline(job, nicho) {
    const startTime = Date.now()
    const outputs = {}

    await updateJob(job.id, { status: 'running' })
    emitProgress(job.id, { type: 'pipeline_start', job: job.id, totalAgents: PIPELINE_AGENTS.length })

    // Build context
    const context = {
        nicho,
        subtema: job.input.subtema ? nicho.subtemas?.find(s => s.id === job.input.subtema) : nicho.subtemas?.[0],
        formato: job.input.formato ? findFormato(nicho, job.input.formato) : null,
        angulo: job.input.angulo,
        previousOutputs: outputs,
        searchResults: {},
    }

    // Execute each agent in sequence
    for (const agent of PIPELINE_AGENTS) {
        emitProgress(job.id, {
            type: 'agent_start',
            agentId: agent.id,
            agentNome: agent.nome,
            agentEmoji: agent.emoji,
        })

        await updateAgentStatus(job.id, agent.id, 'running')

        try {
            // Step 1: Web search (only for Agent 1)
            if (agent.hasSearch) {
                emitProgress(job.id, { type: 'agent_searching', agentId: agent.id })
                context.searchResults = await fullResearch(context.angulo)
                emitProgress(job.id, {
                    type: 'search_complete',
                    agentId: agent.id,
                    totalResults: Object.values(context.searchResults).reduce((a, r) => a + r.length, 0),
                })
            }

            // Step 2: Load agent system prompt from workspace
            const systemPrompt = await loadAgentPrompt(agent.id)

            // Step 3: Build user prompt with context
            const userPrompt = buildUserPrompt(agent.id, context)

            // Step 4: Call AI Council (routes to browser AIs or API fallback)
            emitProgress(job.id, { type: 'agent_thinking', agentId: agent.id })

            const councilResult = await councilExecute(systemPrompt, userPrompt, {
                agentId: agent.id,
                heavy: agent.heavy,
                councilMode: job.input.councilMode, // optional override from frontend
                onProgress: (data) => emitProgress(job.id, { ...data, agentId: agent.id }),
            })

            const output = councilResult.text

            // Step 5: Store output
            outputs[agent.id] = output
            context.previousOutputs = outputs

            // Step 6: Save to workspace
            await saveAgentOutput(job, agent, output, context, councilResult)

            // Step 7: Update status
            await updateAgentStatus(job.id, agent.id, 'complete', output)
            emitProgress(job.id, {
                type: 'agent_complete',
                agentId: agent.id,
                agentNome: agent.nome,
                agentEmoji: agent.emoji,
                outputLength: output.length,
                outputPreview: output.substring(0, 500),
                councilMode: councilResult.mode,
                councilSources: councilResult.sources,
                councilAnalysis: councilResult.analysis,
            })

        } catch (error) {
            console.error(`[Agent ${agent.id}] Error:`, error.message)
            await updateAgentStatus(job.id, agent.id, 'error')
            await addJobError(job.id, error)

            emitProgress(job.id, {
                type: 'agent_error',
                agentId: agent.id,
                agentNome: agent.nome,
                error: error.message,
            })

            // Continue pipeline even if one agent fails
            outputs[agent.id] = `[ERROR] ${error.message}`
        }
    }

    // Pipeline complete
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    await updateJob(job.id, {
        status: 'complete',
        duration: `${duration}s`,
        outputs,
    })

    emitProgress(job.id, {
        type: 'pipeline_complete',
        duration,
        agents: PIPELINE_AGENTS.length,
    })

    // Cleanup listeners
    listeners.delete(job.id)

    return { outputs, duration }
}

/**
 * Save agent output to the workspace
 */
async function saveAgentOutput(job, agent, output, context, councilResult = {}) {
    // Determine save path
    const channelName = context.nicho.canalExistente || `321.${context.nicho.nome}`
    const outputDir = path.join(config.workspace, config.jobs.outputDir, job.id)

    await fs.mkdir(outputDir, { recursive: true })

    // Save individual agent output
    const filename = `agent_${agent.id}_${agent.nome.replace(/\s+/g, '_').toLowerCase()}.md`
    const filePath = path.join(outputDir, filename)

    const modeLabel = councilResult.mode || 'unknown'
    const sourcesLabel = (councilResult.sources || []).join(' + ')

    const header = `# ${agent.emoji} Agente ${agent.id}: ${agent.nome}

**Job:** ${job.id}
**Nicho:** ${context.nicho.emoji} ${context.nicho.nome}
**Ângulo:** ${context.angulo}
**Data:** ${new Date().toISOString()}
**Canal alvo:** ${channelName}
**Council Mode:** ${modeLabel.toUpperCase()}
**Fontes:** ${sourcesLabel}
${councilResult.analysis ? `**Análise:** ${councilResult.analysis}` : ''}

---

`
    await fs.writeFile(filePath, header + output, 'utf-8')
    console.log(`[Agent ${agent.id}] Output saved to ${filePath} (${modeLabel})`)
}

/**
 * Find formato in nicho
 */
function findFormato(nicho, formatoId) {
    for (const sub of nicho.subtemas || []) {
        const fmt = sub.formatos?.find(f => f.id === formatoId)
        if (fmt) return fmt
    }
    return null
}

/**
 * Get the list of pipeline agent definitions
 */
export function getPipelineAgents() {
    return PIPELINE_AGENTS
}
