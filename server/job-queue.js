/**
 * BRAINET Job Queue
 * Persistent job tracking using Supabase with JSON fallback
 *
 * DEA-02 (MVP): Single-user, no auth required
 * Falls back to JSON if Supabase not configured
 */

import fs from 'fs/promises'
import path from 'path'
import config from './config.js'
import { getSupabaseClient, isSupabaseConfigured, cleanupStuckJobs } from './supabase.js'

let jobsCache = [] // In-memory cache for non-DB mode
const useDatabase = isSupabaseConfigured()

/**
 * Initialize the job queue
 * - If Supabase: Load from DB and cleanup stuck jobs
 * - Else: Load from JSON file
 */
export async function initJobQueue() {
    try {
        if (useDatabase) {
            console.log('[JobQueue] Using Supabase database for job storage')

            // Cleanup stuck jobs on startup (DEA-05)
            await cleanupStuckJobs()

            // Load existing jobs into cache for quick access
            const supabase = getSupabaseClient()
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100) // Cache last 100 jobs

            if (error) throw error
            jobsCache = data || []
            console.log(`[JobQueue] Loaded ${jobsCache.length} recent jobs from Supabase`)
        } else {
            // Fallback to JSON
            console.log('[JobQueue] Supabase not configured, using JSON fallback')
            await fs.mkdir(path.dirname(config.jobs.dbPath), { recursive: true })
            const data = await fs.readFile(config.jobs.dbPath, 'utf-8')
            jobsCache = JSON.parse(data)
            console.log(`[JobQueue] Loaded ${jobsCache.length} jobs from ${config.jobs.dbPath}`)
        }
    } catch (e) {
        jobsCache = []
        console.warn(`[JobQueue] Failed to initialize: ${e.message}`)
        console.log('[JobQueue] Starting with empty queue')
    }
}

/**
 * Persist to JSON (fallback when DB is unavailable)
 */
async function persistToJSON() {
    try {
        await fs.writeFile(config.jobs.dbPath, JSON.stringify(jobsCache, null, 2))
    } catch (e) {
        console.error('[JobQueue] Failed to persist to JSON:', e.message)
    }
}

/**
 * Create a new pipeline job
 * - If Supabase: INSERT into jobs table
 * - Else: Add to cache and persist to JSON
 */
export async function createJob(input) {
    const supabase = getSupabaseClient()

    if (useDatabase && supabase) {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .insert({
                    nicho_id: input.nichoId,
                    subtema_id: input.subtema,
                    formato_id: input.formato,
                    angulo: input.angulo,
                    mode: input.mode || 'solo',
                    status: 'pending',
                })
                .select()
                .single()

            if (error) throw error

            // Cache it locally
            jobsCache.unshift(data)

            console.log(`[JobQueue] Created job ${data.id} in Supabase`)
            return data
        } catch (e) {
            console.error('[JobQueue] Failed to create job in Supabase:', e.message)
            // Fall through to JSON fallback
        }
    }

    // Fallback: JSON-based job creation
    const job = {
        id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        input: {
            nichoId: input.nichoId,
            nichoNome: input.nichoNome,
            subtema: input.subtema || null,
            formato: input.formato || null,
            angulo: input.angulo,
        },
        currentAgent: null,
        agents: {},
        outputs: {},
        errors: [],
        duration: null,
    }

    jobsCache.unshift(job)
    await persistToJSON()
    return job
}

/**
 * Update job status
 * - If Supabase: UPDATE in jobs table
 * - Else: Update cache and persist to JSON
 */
export async function updateJob(jobId, updates) {
    const supabase = getSupabaseClient()

    if (useDatabase && supabase) {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', jobId)
                .select()
                .single()

            if (error) throw error

            // Update cache
            const idx = jobsCache.findIndex(j => j.id === jobId)
            if (idx >= 0) jobsCache[idx] = data

            return data
        } catch (e) {
            console.error('[JobQueue] Failed to update job in Supabase:', e.message)
            // Fall through to JSON fallback
        }
    }

    // Fallback: JSON-based job update
    const job = jobsCache.find(j => j.id === jobId)
    if (!job) throw new Error(`Job not found: ${jobId}`)

    Object.assign(job, updates, { updatedAt: new Date().toISOString() })
    await persistToJSON()
    return job
}

/**
 * Update a specific agent's status within a job
 * - If Supabase: INSERT into job_agents table + UPDATE jobs table
 * - Else: Update cache and persist to JSON
 */
export async function updateAgentStatus(jobId, agentId, status, output = null) {
    const supabase = getSupabaseClient()

    if (useDatabase && supabase) {
        try {
            // Update job_agents table
            const agentData = {
                job_id: jobId,
                agent_number: agentId,
                status,
                started_at: null,
                completed_at: null,
            }

            // Set timestamps based on status
            if (status === 'running') {
                agentData.started_at = new Date().toISOString()
            } else if (status !== 'pending') {
                agentData.completed_at = new Date().toISOString()
            }

            const { error: agentError } = await supabase
                .from('job_agents')
                .upsert(agentData, { onConflict: 'job_id,agent_number' })

            if (agentError) throw agentError

            // Save output if provided (T6)
            if (output) {
                const { error: outputError } = await supabase
                    .from('job_outputs')
                    .upsert(
                        {
                            job_id: jobId,
                            agent_number: agentId,
                            content: output,
                        },
                        { onConflict: 'job_id,agent_number' }
                    )

                if (outputError) throw outputError
            }

            // Update job's current_agent
            const { error: jobError } = await supabase
                .from('jobs')
                .update({
                    current_agent: status === 'running' ? agentId : null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', jobId)

            if (jobError) throw jobError

            // Update cache
            const job = jobsCache.find(j => j.id === jobId)
            if (job) {
                if (!job.agents) job.agents = {}
                job.agents[agentId] = {
                    status,
                    startedAt: job.agents[agentId]?.startedAt || new Date().toISOString(),
                    completedAt: status !== 'running' ? new Date().toISOString() : null,
                    outputLength: output?.length || 0,
                }
                if (output) {
                    if (!job.outputs) job.outputs = {}
                    job.outputs[agentId] = output
                }
            }

            return job
        } catch (e) {
            console.error('[JobQueue] Failed to update agent status in Supabase:', e.message)
            // Fall through to JSON fallback
        }
    }

    // Fallback: JSON-based agent status update
    const job = jobsCache.find(j => j.id === jobId)
    if (!job) throw new Error(`Job not found: ${jobId}`)

    job.agents[agentId] = {
        status,
        startedAt: job.agents[agentId]?.startedAt || new Date().toISOString(),
        completedAt: status !== 'running' ? new Date().toISOString() : null,
        outputLength: output?.length || 0,
    }

    if (output) {
        job.outputs[agentId] = output
    }

    job.currentAgent = status === 'running' ? agentId : job.currentAgent
    job.updatedAt = new Date().toISOString()

    await persistToJSON()
    return job
}

/**
 * Add an error to job
 * - If Supabase: Would INSERT into job_errors table (not yet implemented)
 * - Else: Add to cache errors array
 */
export async function addJobError(jobId, error) {
    const job = jobsCache.find(j => j.id === jobId)
    if (!job) return

    if (!job.errors) job.errors = []

    job.errors.push({
        timestamp: new Date().toISOString(),
        message: error.message || String(error),
        agent: job.currentAgent,
    })

    job.updatedAt = new Date().toISOString()

    if (useDatabase) {
        // TODO: Implement job_errors table in T6.3 if needed
        // For now, just update job status
        const supabase = getSupabaseClient()
        if (supabase) {
            await supabase
                .from('jobs')
                .update({
                    error_message: error.message || String(error),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', jobId)
                .catch(e => console.error('[JobQueue] Failed to log error:', e.message))
        }
    } else {
        await persistToJSON()
    }
}

/**
 * Get a job by ID
 * - First check cache
 * - If not in cache and using DB, fetch from DB
 */
export async function getJob(jobId) {
    // Check cache first
    let job = jobsCache.find(j => j.id === jobId)
    if (job) return job

    // If using DB and not in cache, fetch from DB
    if (useDatabase) {
        const supabase = getSupabaseClient()
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('jobs')
                    .select('*')
                    .eq('id', jobId)
                    .single()

                if (error) throw error
                if (data) {
                    jobsCache.push(data) // Add to cache
                    return data
                }
            } catch (e) {
                console.error('[JobQueue] Failed to fetch job from Supabase:', e.message)
            }
        }
    }

    return null
}

/**
 * Get all jobs (newest first)
 * - If Supabase: Fetch from DB
 * - Else: Return from cache
 */
export async function getAllJobs() {
    if (useDatabase) {
        const supabase = getSupabaseClient()
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('jobs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50) // Limit to recent 50 for API response

                if (error) throw error

                return (data || []).map(j => ({
                    id: j.id,
                    status: j.status,
                    createdAt: j.created_at,
                    updatedAt: j.updated_at,
                    input: {
                        nichoId: j.nicho_id,
                        subtema: j.subtema_id,
                        formato: j.formato_id,
                        angulo: j.angulo,
                    },
                    currentAgent: j.current_agent,
                    agents: {}, // TODO: Fetch from job_agents table if needed
                    errors: 0, // TODO: Fetch from job_errors table if needed
                    duration: j.duration_seconds,
                }))
            } catch (e) {
                console.error('[JobQueue] Failed to fetch jobs from Supabase:', e.message)
            }
        }
    }

    // Fallback: Return from cache (JSON mode or DB failure)
    return jobsCache.map(j => ({
        id: j.id,
        status: j.status,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
        input: j.input,
        currentAgent: j.currentAgent,
        agents: j.agents,
        errors: j.errors?.length || 0,
        duration: j.duration,
    }))
}

/**
 * Get full job including outputs
 * - Queries job, job_agents, and job_outputs if using Supabase
 */
export async function getJobFull(jobId) {
    let job = jobsCache.find(j => j.id === jobId)
    if (job) return job

    if (useDatabase) {
        const supabase = getSupabaseClient()
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('jobs')
                    .select('*')
                    .eq('id', jobId)
                    .single()

                if (error) throw error
                if (data) {
                    // Fetch related job_agents and job_outputs
                    const { data: agents } = await supabase
                        .from('job_agents')
                        .select('*')
                        .eq('job_id', jobId)

                    const { data: outputs } = await supabase
                        .from('job_outputs')
                        .select('*')
                        .eq('job_id', jobId)

                    // Format as legacy structure for compatibility
                    const formatted = {
                        ...data,
                        agents: {},
                        outputs: {},
                    }

                    agents?.forEach(a => {
                        formatted.agents[a.agent_number] = {
                            status: a.status,
                            startedAt: a.started_at,
                            completedAt: a.completed_at,
                            outputLength: a.output_length || 0,
                        }
                    })

                    outputs?.forEach(o => {
                        formatted.outputs[o.agent_number] = o.content
                    })

                    jobsCache.push(formatted)
                    return formatted
                }
            } catch (e) {
                console.error('[JobQueue] Failed to fetch full job from Supabase:', e.message)
            }
        }
    }

    return null
}
