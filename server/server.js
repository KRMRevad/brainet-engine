/**
 * BRAINET Backend Server
 * Express.js API with SSE for real-time pipeline progress
 */

import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
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
import { resolve as llmResolve, getResolverHealth } from './llm-resolver.js'
import { executeCouncil } from './council-orchestrator.js'
import { initCouncilStore, createCouncilJob, getCouncilJob, updateCouncilJob, listCouncilJobs } from './council-job-store.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// --- CORS Configuration with strict whitelist (AC-2) ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001').split(',').map(o => o.trim())
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}))
app.use(express.json())

// --- SECURITY HEADERS (QA: Helmet) ---
app.use(helmet({
    contentSecurityPolicy: false, // Vite dev proxy handles CSP
    crossOriginEmbedderPolicy: false,
}))

// --- RATE LIMITING (QA: API abuse prevention) ---
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
})
app.use('/api/', apiLimiter)

// --- PROCESS ERROR HANDLERS (QA: crash resilience) ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection:', reason)
})
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err)
    process.exit(1)
})

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

// --- AUTH MIDDLEWARE (AC-1: All /api/* endpoints require JWT except /api/health and /api/auth/login) ---
app.use((req, res, next) => {
    // Whitelist endpoints that don't require auth (only health and login)
    if (req.path === '/api/health' || req.path === '/api/auth/login') {
        return next()
    }

    // All other /api/* endpoints require JWT auth (including /api/resolver/health)
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

// --- COUNCIL ORCHESTRATOR ENDPOINTS ---

/**
 * POST /api/council/job
 * Create and execute a new council job
 * Body: council input schema (tema, objetivo, etc.)
 */
app.post('/api/council/job', async (req, res) => {
    try {
        const { tema, contexto, objetivo, profundidade, fontes, restricoes, metadados, council_config } = req.body

        // Validate required fields
        if (!tema || tema.length < 3) {
            return res.status(400).json({ error: 'tema is required (min 3 chars)' })
        }
        if (!objetivo) {
            return res.status(400).json({ error: 'objetivo is required' })
        }
        const validObjetivos = ['pesquisa', 'sintese', 'estrategia', 'analise', 'comparacao', 'criacao', 'revisao']
        if (!validObjetivos.includes(objetivo)) {
            return res.status(400).json({ error: `objetivo must be one of: ${validObjetivos.join(', ')}` })
        }

        // Build job data
        const job = {
            id: crypto.randomUUID(),
            tema: sanitizeInput(tema, 500),
            contexto: contexto ? sanitizeInput(contexto, 5000) : null,
            objetivo,
            profundidade: profundidade || 'padrao',
            fontes: fontes || [],
            restricoes: restricoes || { idioma: 'pt-BR', formato_output: 'markdown', tom: 'tecnico', max_tokens: 8000 },
            metadados: metadados || {},
            council_config: council_config || { modo: 'completo', desafiar: true },
            status: 'queued',
            created_at: new Date().toISOString(),
        }

        // Store job in council job store (fallback cache)
        createCouncilJob(job)

        // Try to persist to Supabase
        try {
            const { getSupabaseClient, isSupabaseConfigured } = await import('./supabase.js')
            if (isSupabaseConfigured()) {
                const supabase = getSupabaseClient()
                await supabase.from('council_jobs').insert(job)
            }
        } catch (dbErr) {
            console.warn('[Council API] Supabase insert failed, continuing with in-memory store:', dbErr.message)
        }

        // Return jobId immediately
        res.json({ jobId: job.id, status: 'queued', message: 'Council job created. Processing...' })

        // Execute council in background with progress tracking
        executeCouncil(job, (status, data) => {
            console.log(`[Council] Job ${job.id} — ${status}:`, JSON.stringify(data).slice(0, 200))

            // Handle critical infrastructure errors
            if (status === 'infrastructure_critical_error') {
                console.error(`[Council] 🚨 INFRASTRUCTURE CRITICAL ERROR for job ${job.id}:`, data.error)
                // Job will be marked as failed in the catch() handler
            }

            // Update intermediate status in council store
            if (status === 'processing' || status === 'synthesizing') {
                updateCouncilJob(job.id, { status }).catch(err =>
                    console.warn('[Council API] Failed to update status:', err.message))
            }
        }).then(async (result) => {
            // Update job in council store (fallback cache)
            try {
                await updateCouncilJob(job.id, {
                    status: 'complete',
                    ...result,
                    completed_at: new Date().toISOString(),
                })
            } catch (storeErr) {
                console.error('[Council API] Failed to update council job store:', storeErr.message)
            }

            // Update job in Supabase
            try {
                const { getSupabaseClient, isSupabaseConfigured } = await import('./supabase.js')
                if (isSupabaseConfigured()) {
                    const supabase = getSupabaseClient()
                    await supabase.from('council_jobs').update({
                        status: 'complete',
                        ...result,
                        completed_at: new Date().toISOString(),
                    }).eq('id', job.id)
                }
            } catch (dbErr) {
                console.warn('[Council API] Supabase update failed:', dbErr.message)
            }
            console.log(`[Council] ✅ Job ${job.id} complete in ${result.duration_ms}ms`)
        }).catch(async (err) => {
            console.error(`[Council] ❌ Job ${job.id} failed:`, err.message)

            // Determine if this is a critical infrastructure error
            const isCritical = err.message.includes('[CRITICAL]')
            const errorStatus = isCritical ? 'error_infrastructure' : 'error'

            // Update job status to reflect failure
            try {
                await updateCouncilJob(job.id, {
                    status: errorStatus,
                    error_message: err.message,
                    completed_at: new Date().toISOString(),
                })
                console.log(`[Council] Job ${job.id} marked as ${errorStatus}`)
            } catch (storeErr) {
                console.error('[Council API] Failed to update job error status:', storeErr.message)
            }

            // Also update in Supabase if configured
            try {
                const { getSupabaseClient, isSupabaseConfigured } = await import('./supabase.js')
                if (isSupabaseConfigured()) {
                    const supabase = getSupabaseClient()
                    await supabase.from('council_jobs').update({
                        status: errorStatus,
                        error_message: err.message,
                        completed_at: new Date().toISOString(),
                    }).eq('id', job.id)
                }
            } catch (dbErr) {
                console.warn('[Council API] Supabase error update failed:', dbErr.message)
            }
        })

    } catch (e) {
        console.error('[Council API] Error:', e.message)
        res.status(500).json({ error: e.message })
    }
})

/**
 * GET /api/council/job/:id
 * Get council job status and result
 */
app.get('/api/council/job/:id', async (req, res) => {
    try {
        // Try to get from Supabase first
        let job = null
        try {
            const { getSupabaseClient, isSupabaseConfigured } = await import('./supabase.js')
            if (isSupabaseConfigured()) {
                const supabase = getSupabaseClient()
                const { data, error } = await supabase
                    .from('council_jobs')
                    .select('*')
                    .eq('id', req.params.id)
                    .single()

                if (!error && data) {
                    job = data
                }
            }
        } catch (dbErr) {
            console.warn('[Council API] Supabase fetch failed, trying cache:', dbErr.message)
        }

        // Fallback to council job store
        if (!job) {
            job = getCouncilJob(req.params.id)
        }

        if (!job) return res.status(404).json({ error: 'Job not found' })
        res.json(job)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

/**
 * GET /api/council/jobs
 * List recent council jobs
 */
app.get('/api/council/jobs', async (req, res) => {
    try {
        let jobs = []

        // Try Supabase first
        try {
            const { getSupabaseClient, isSupabaseConfigured } = await import('./supabase.js')
            if (isSupabaseConfigured()) {
                const supabase = getSupabaseClient()
                const { data, error } = await supabase
                    .from('council_jobs')
                    .select('id, tema, objetivo, status, duration_ms, created_at, completed_at')
                    .order('created_at', { ascending: false })
                    .limit(50)

                if (!error && data) {
                    jobs = data
                } else {
                    throw error
                }
            }
        } catch (dbErr) {
            console.warn('[Council API] Supabase fetch failed, using cache:', dbErr.message)
            // Fallback to council job store
            jobs = listCouncilJobs(50).map(j => ({
                id: j.id,
                tema: j.tema,
                objetivo: j.objetivo,
                status: j.status,
                duration_ms: j.duration_ms,
                created_at: j.created_at,
                completed_at: j.completed_at,
            }))
        }

        res.json({ jobs })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// --- RESOLVER ENDPOINTS ---
// Note: /api/resolver/health requires JWT auth (no URL/LLM config exposure)
app.get('/api/resolver/health', async (req, res) => {
    try {
        const health = await getResolverHealth()

        // Sanitize response: remove sensitive URLs and internal configuration
        const sanitized = {
            tiers: health.tiers.map(tier => {
                const safe = {
                    name: tier.name,
                    status: tier.status,
                }
                // Only include model/count for non-config tiers (no URLs, no ais detail)
                if (tier.name === 'local' && tier.model) safe.model = tier.model
                if (tier.name === 'remote' && tier.model) safe.model = tier.model
                if (tier.name === 'browser') safe.count = tier.count || 0
                if (tier.name === 'api') safe.provider = tier.provider
                // Omit: url, models array, ais detail, description
                return safe
            }),
            activeTiers: health.tiers.filter(t => t.status === 'online').map(t => t.name),
        }

        res.json(sanitized)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.post('/api/resolver/resolve', async (req, res) => {
    try {
        let { systemPrompt, userPrompt, heavy, agentId, maxTokens, temperature } = req.body
        if (!userPrompt) return res.status(400).json({ error: 'userPrompt is required' })

        // QA: Sanitize inputs
        userPrompt = sanitizeInput(userPrompt, 16000)
        if (systemPrompt) systemPrompt = sanitizeInput(systemPrompt, 4000)
        if (agentId) agentId = sanitizeInput(String(agentId), 50)

        // QA: Validate numeric params
        if (maxTokens != null && (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 32000)) {
            return res.status(400).json({ error: 'maxTokens must be 1-32000' })
        }
        if (temperature != null && (typeof temperature !== 'number' || temperature < 0 || temperature > 2)) {
            return res.status(400).json({ error: 'temperature must be 0-2' })
        }

        const result = await llmResolve(
            systemPrompt || 'You are a helpful assistant.',
            userPrompt,
            { heavy: !!heavy, agentId, maxTokens, temperature }
        )
        res.json(result)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// --- START SERVER ---
async function start() {
    await initJobQueue()
    await initCouncilStore()
    const council = await checkCouncilHealth()
    let resolverInfo = { activeTiers: [] }
    try { resolverInfo = await getResolverHealth() } catch { }

    app.listen(config.port, () => {
        const tierStatus = resolverInfo.tiers?.map(t => `${t.name}:${t.status}`).join(' → ') || 'unknown'
        console.log(`
╔═══════════════════════════════════════════════════════╗
║   🧠 BRAINET Backend Server v4.0 — LLM Resolver      ║
║   http://localhost:${config.port}                               ║
╠═══════════════════════════════════════════════════════╣
║   Resolver Tiers: ${resolverInfo.activeTiers?.length || 0} active                           ║
║   ┣ Local Ollama:  ${(resolverInfo.tiers?.find(t => t.name === 'local')?.status === 'online' ? '✅ ' + (resolverInfo.tiers?.find(t => t.name === 'local')?.model || '') : '❌ offline').padEnd(35)}║
║   ┣ Remote Ollama: ${(resolverInfo.tiers?.find(t => t.name === 'remote')?.status === 'online' ? '✅ ' + (resolverInfo.tiers?.find(t => t.name === 'remote')?.model || '') : '— disabled').padEnd(35)}║
║   ┣ Browser AIs:   ${(resolverInfo.tiers?.find(t => t.name === 'browser')?.status === 'online' ? '✅ ' + resolverInfo.tiers?.find(t => t.name === 'browser')?.count + ' available' : '❌ offline').padEnd(35)}║
║   ┣ Cloud API:     ${(resolverInfo.tiers?.find(t => t.name === 'api')?.status === 'online' ? '✅ ' + (config.llm.provider || '') : '❌ no key').padEnd(35)}║
║   ┗ GLM5 MCP:      ${(process.env.GLM5_URL ? '✅ configured' : '— not configured').padEnd(35)}║
║   Council Mode: ${(config.council.defaultMode || 'solo').toUpperCase().padEnd(37)}║
║   Search: ${isSearchConfigured() ? 'Brave API ✅'.padEnd(38) : 'No API key ⚠️'.padEnd(38)}    ║
║   Agents: ${Object.keys(config.agents.promptFiles).length} prompt files loaded                    ║
╚═══════════════════════════════════════════════════════╝
${!council.connected ? '\n⚠️  To enable AI Council, start Chrome with:\n    /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9225\n    Then open tabs: chatgpt.com, claude.ai, gemini.google.com\n' : ''}
    `)
    })
}

start()
