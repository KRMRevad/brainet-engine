/**
 * BRAINET Job Queue
 * Persistent job tracking using Supabase only
 *
 * DEA-02 (MVP): Single-user, no auth required
 */

import { getSupabaseClient, isSupabaseConfigured, cleanupStuckJobs } from './supabase.js'

let jobsCache = [] // In-memory cache for quick access
const useDatabase = isSupabaseConfigured()

/**
 * Initialize the job queue
 * - Load from Supabase and cleanup stuck jobs
 * - If Supabase not configured, start with empty cache
 */
export async function initJobQueue() {
    try {
        if (useDatabase) {
            console.log('[JobQueue] Using Supabase database for job storage')

            // Cleanup stuck jobs on startup
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
            console.warn('[JobQueue] Supabase not configured - starting with empty queue')
            jobsCache = []
        }
    } catch (e) {
        jobsCache = []
        console.warn(`[JobQueue] Failed to initialize: ${e.message}`)
        console.log('[JobQueue] Starting with empty queue')
    }
}

/**
 * Create a new pipeline job
 * - INSERT into Supabase jobs table
 */
export async function createJob(input) {
    if (!useDatabase) {
        console.warn('[JobQueue] Supabase not configured - cannot create job')
        return null
    }

    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('[JobQueue] Supabase client not available')

    try {
        const { data, error } = await supabase
            .from('jobs')
            .insert({
                nicho_id: input.nichoId,
                subtema_id: input.subtema,
                formato_id: input.formato,
                angulo: input.angulo,
                status: 'pending',
                agents: {},
                outputs: {},
            })
            .select()
            .single()

        if (error) throw error

        // Cache it locally
        jobsCache.unshift(data)
        console.log(`[JobQueue] Created job ${data.id}`)
        return data
    } catch (e) {
        console.error('[JobQueue] Failed to create job:', e.message)
        throw e
    }
}

/**
 * Update job status and other fields
 */
export async function updateJob(jobId, updates) {
    if (!useDatabase) {
        console.warn('[JobQueue] Supabase not configured - cannot update job')
        return null
    }

    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('[JobQueue] Supabase client not available')

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
        console.error('[JobQueue] Failed to update job:', e.message)
        throw e
    }
}

/**
 * Update a specific agent's status within a job
 * - Updates the agents JSONB field with agent progress
 */
export async function updateAgentStatus(jobId, agentId, status, output = null) {
    if (!useDatabase) {
        console.warn('[JobQueue] Supabase not configured - cannot update agent status')
        return null
    }

    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('[JobQueue] Supabase client not available')

    try {
        // Get current job to preserve agent state
        let { data: job, error: getError } = await supabase
            .from('jobs')
            .select('agents, outputs')
            .eq('id', jobId)
            .single()

        if (getError) throw getError

        const agents = job.agents || {}
        const outputs = job.outputs || {}

        // Update agent status
        agents[agentId] = {
            status,
            startedAt: agents[agentId]?.startedAt || new Date().toISOString(),
            completedAt: status !== 'running' ? new Date().toISOString() : null,
        }

        if (output) {
            outputs[agentId] = output
        }

        // Write back to database
        const { data: updatedJob, error: updateError } = await supabase
            .from('jobs')
            .update({
                agents,
                outputs,
                updated_at: new Date().toISOString(),
            })
            .eq('id', jobId)
            .select()
            .single()

        if (updateError) throw updateError

        // Update cache
        const idx = jobsCache.findIndex(j => j.id === jobId)
        if (idx >= 0) jobsCache[idx] = updatedJob

        return updatedJob
    } catch (e) {
        console.error('[JobQueue] Failed to update agent status:', e.message)
        throw e
    }
}

/**
 * Add an error to job
 */
export async function addJobError(jobId, error) {
    if (!useDatabase) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    try {
        await supabase
            .from('jobs')
            .update({
                error: error.message || String(error),
                updated_at: new Date().toISOString(),
            })
            .eq('id', jobId)
    } catch (e) {
        console.error('[JobQueue] Failed to log error:', e.message)
    }
}

/**
 * Get a job by ID
 */
export async function getJob(jobId) {
    // Check cache first
    let job = jobsCache.find(j => j.id === jobId)
    if (job) return job

    // If not in cache, fetch from DB
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
                console.error('[JobQueue] Failed to fetch job:', e.message)
            }
        }
    }

    return null
}

/**
 * Get all jobs (newest first)
 */
export async function getAllJobs() {
    if (!useDatabase) return []

    const supabase = getSupabaseClient()
    if (!supabase) return jobsCache

    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) throw error
        return data || []
    } catch (e) {
        console.error('[JobQueue] Failed to fetch jobs:', e.message)
        return jobsCache
    }
}

/**
 * Get full job including all details
 */
export async function getJobFull(jobId) {
    return getJob(jobId)
}
