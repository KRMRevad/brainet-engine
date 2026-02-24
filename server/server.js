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
import { requireAuth, authenticate } from './auth.js'
import { sanitizeInput } from '../src/utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// --- CORS Configuration with whitelist (AC-2) ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim())
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}))
app.use(express.json())

// Cache nichos data for validation
let nichosCache = null

async function getNichosData() {
    if (nichosCache) return nichosCache
    try {
        const raw = await fs.readFile(path.join(__dirname, '..', 'data', 'nichos.json'), 'utf-8')
        nichosCache = JSON.parse(raw)
        return nichosCache
    } catch (e) {
        console.error('[Server] Failed to load nichos cache:', e.message)
        return null
    }
}

function isValidNichoId(nichoId, nichosData) {
    if (!nichosCache) return true // Skip validation if cache unavailable
    return nichosCache.nichos.some(n => n.id === nichoId)
}

// --- HEALTH (No auth required) ---
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
        agents: Object.keys(config.agents.promptFiles).length,
    })
})

// --- AUTH LOGIN (No auth required) (AC-1) ---
/**
 * POST /api/auth/login
 * Body: { password }
 * Returns: { token }
 */
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body

    if (!password) {
        return res.status(400).json({ error: 'Password required' })
    }

    const token = authenticate(password)
    if (!token) {
        return res.status(401).json({ error: 'Invalid password' })
    }

    res.json({ token })
})

// --- AUTH MIDDLEWARE (AC-1: All endpoints require auth except health and login) ---
app.use((req, res, next) => {
    // Whitelist endpoints that don't require auth
    if (req.path === '/api/health' || req.path === '/api/auth/login') {
        return next()
    }

    // All other /api/* endpoints require auth
    if (req.path.startsWith('/api/')) {
        return requireAuth(req, res, next)
    }

    next()
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
    let { nichoId, angulo, subtema, formato, councilMode } = req.body

    if (!nichoId || !angulo) {
        return res.status(400).json({ error: 'nichoId and angulo are required' })
    }

    // AC-3: Sanitize input fields
    angulo = sanitizeInput(angulo, 500)
    if (subtema) subtema = sanitizeInput(subtema, 500)
    if (formato) formato = sanitizeInput(formato, 500)

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
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await getAllJobs()
        res.json({ jobs })
    } catch (e) {
        console.error('[API] Error fetching jobs:', e.message)
        res.status(500).json({ error: e.message })
    }
})

// --- EXPLORATION TRACKING (T7) ---
/**
 * POST /api/exploration
 * Record a dice roll / niche exploration
 * Body: { nichoId, sessionId, userAgent?, ipAddress? }
 */
app.post('/api/exploration', async (req, res) => {
    try {
        const { nichoId, sessionId, userAgent, ipAddress } = req.body

        if (!nichoId || !sessionId) {
            return res.status(400).json({ error: 'nichoId and sessionId required' })
        }

        // Validate nichoId against known nichos
        const nichosData = await getNichosData()
        if (!isValidNichoId(nichoId, nichosData)) {
            return res.status(400).json({ error: `Invalid nichoId: ${nichoId}` })
        }

        const { getSupabaseClient, isSupabaseConfigured } = await import('./supabase.js')

        if (isSupabaseConfigured()) {
            const supabase = getSupabaseClient()
            const { error } = await supabase
                .from('exploration_history')
                .insert({
                    nicho_id: nichoId,
                    session_id: sessionId,
                    user_agent: userAgent,
                    ip_address: ipAddress,
                })

            if (error) throw error
        } else {
            console.log('[API] Exploration recorded (DB not configured):', nichoId)
        }

        res.json({ success: true })
    } catch (e) {
        console.error('[API] Error recording exploration:', e.message)
        res.status(500).json({ error: e.message })
    }
})

/**
 * GET /api/exploration/stats
 * Get exploration statistics by niche
 * Returns: { stats: { nichoId: count, ... } }
 */
app.get('/api/exploration/stats', async (req, res) => {
    try {
        const { getSupabaseClient, isSupabaseConfigured } = await import('./supabase.js')

        if (isSupabaseConfigured()) {
            const supabase = getSupabaseClient()
            const { data, error } = await supabase
                .from('exploration_history')
                .select('nicho_id')

            if (error) throw error

            // Count by nicho_id
            const stats = {}
            data?.forEach(row => {
                stats[row.nicho_id] = (stats[row.nicho_id] || 0) + 1
            })

            res.json({ stats })
        } else {
            res.json({ stats: {}, note: 'Database not configured' })
        }
    } catch (e) {
        console.error('[API] Error fetching exploration stats:', e.message)
        res.status(500).json({ error: e.message })
    }
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
