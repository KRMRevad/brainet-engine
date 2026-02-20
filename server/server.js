/**
 * BRAINET Backend Server
 * Express.js API with SSE for real-time pipeline progress
 */

import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import config from './config.js'
import { checkLLMHealth } from './llm-client.js'
import { isSearchConfigured } from './web-search.js'
import { checkCouncilHealth } from './council.js'
import { initJobQueue, createJob, getJob, getAllJobs, getJobFull } from './job-queue.js'
import { executePipeline, addProgressListener, removeProgressListener, getPipelineAgents } from './agent-executor.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json())

// --- HEALTH ---
app.get('/api/health', async (req, res) => {
    const llm = await checkLLMHealth()
    const search = isSearchConfigured()
    const council = await checkCouncilHealth()

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        llm,
        search: { configured: search, provider: 'brave' },
        council,
        workspace: config.workspace,
        agents: Object.keys(config.agents.promptFiles).length,
    })
})

// --- GET NICHOS (from data file) ---
app.get('/api/nichos', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, '..', 'data', 'nichos.json'), 'utf-8')
        res.json(JSON.parse(data))
    } catch (e) {
        res.status(500).json({ error: `Failed to load nichos: ${e.message}` })
    }
})

// --- GET PIPELINE AGENTS ---
app.get('/api/agents', (req, res) => {
    res.json({ agents: getPipelineAgents() })
})

// --- START PIPELINE ---
app.post('/api/pipeline/start', async (req, res) => {
    const { nichoId, angulo, subtema, formato, councilMode } = req.body

    if (!nichoId || !angulo) {
        return res.status(400).json({ error: 'nichoId and angulo are required' })
    }

    // Load nicho from data
    let nichosData
    try {
        const raw = await fs.readFile(path.join(__dirname, '..', 'data', 'nichos.json'), 'utf-8')
        nichosData = JSON.parse(raw)
    } catch (e) {
        return res.status(500).json({ error: `Failed to load nichos: ${e.message}` })
    }

    const nicho = nichosData.nichos.find(n => n.id === nichoId)
    if (!nicho) {
        return res.status(404).json({ error: `Nicho not found: ${nichoId}` })
    }

    // Create job
    const job = await createJob({
        nichoId,
        nichoNome: nicho.nome,
        subtema,
        formato,
        angulo,
        councilMode: councilMode || config.council.defaultMode,
    })

    // Start pipeline execution in background
    executePipeline(job, nicho).catch(err => {
        console.error(`[Pipeline] Fatal error for job ${job.id}:`, err)
    })

    res.json({
        jobId: job.id,
        status: 'queued',
        message: 'Pipeline started. Use SSE endpoint to track progress.',
        sseUrl: `/api/pipeline/events/${job.id}`,
    })
})

// --- SSE: PIPELINE PROGRESS ---
app.get('/api/pipeline/events/:jobId', (req, res) => {
    const { jobId } = req.params

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    })

    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: 'connected', jobId })}\n\n`)

    // Listen for progress
    const onProgress = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`)

        // Close connection when pipeline completes
        if (data.type === 'pipeline_complete' || data.type === 'pipeline_error') {
            setTimeout(() => res.end(), 1000)
        }
    }

    addProgressListener(jobId, onProgress)

    // Cleanup on disconnect
    req.on('close', () => {
        removeProgressListener(jobId, onProgress)
    })
})

// --- GET JOB STATUS ---
app.get('/api/pipeline/status/:jobId', (req, res) => {
    const job = getJob(req.params.jobId)
    if (!job) return res.status(404).json({ error: 'Job not found' })
    res.json(job)
})

// --- GET JOB FULL (with outputs) ---
app.get('/api/pipeline/output/:jobId', (req, res) => {
    const job = getJobFull(req.params.jobId)
    if (!job) return res.status(404).json({ error: 'Job not found' })
    res.json(job)
})

// --- LIST ALL JOBS ---
app.get('/api/jobs', (req, res) => {
    res.json({ jobs: getAllJobs() })
})

// --- START SERVER ---
async function start() {
    await initJobQueue()
    const council = await checkCouncilHealth()

    app.listen(config.port, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║   🧠 BRAINET Backend Server v3.0 — AI Council    ║
║   http://localhost:${config.port}                           ║
╠═══════════════════════════════════════════════════╣
║   Council Mode: ${(config.council.defaultMode || 'solo').toUpperCase().padEnd(31)}║
║   Chrome CDP: ${council.connected ? '✅ Connected' : '❌ Not connected'.padEnd(20)}              ║
║   💚 ChatGPT: ${(council.ais?.chatgpt?.available ? '✅ Ready' : '—').padEnd(33)}║
║   🟠 Claude:  ${(council.ais?.claude?.available ? '✅ Ready' : '—').padEnd(33)}║
║   🔵 Gemini:  ${(council.ais?.gemini?.available ? '✅ Ready' : '—').padEnd(33)}║
║   LLM Fallback: ${config.llm.provider.padEnd(31)}║
║   Search: ${isSearchConfigured() ? 'Brave API ✅'.padEnd(30) : 'No API key ⚠️'.padEnd(30)}          ║
║   Agents: ${Object.keys(config.agents.promptFiles).length} prompt files loaded                ║
╚═══════════════════════════════════════════════════╝
${!council.connected ? '\n⚠️  To enable AI Council, start Chrome with:\n    /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9225\n    Then open tabs: chatgpt.com, claude.ai, gemini.google.com\n' : ''}
    `)
    })
}

start()
