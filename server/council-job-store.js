/**
 * Council Job Store
 * Manages persistence of council jobs
 * - Supabase-backed when configured (via council-repo.js)
 * - JSON fallback when Supabase not available
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { isSupabaseConfigured, getSupabaseClient } from './supabase.js'
import * as councilRepo from './db/council-repo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const COUNCIL_JOBS_FILE = path.join(__dirname, 'data', 'council-jobs.json')

// In-memory cache for quick access
let councilJobsCache = new Map()
const useDatabase = isSupabaseConfigured()

/**
 * Load council jobs from JSON (fallback)
 */
async function loadFromJSON() {
    try {
        const data = await fs.readFile(COUNCIL_JOBS_FILE, 'utf-8')
        const jobs = JSON.parse(data)
        jobs.forEach(job => councilJobsCache.set(job.id, job))
        console.log(`[CouncilStore] Loaded ${jobs.length} council jobs from JSON`)
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.warn(`[CouncilStore] Failed to load council jobs from JSON:`, err.message)
        }
    }
}

/**
 * Persist council jobs to JSON (fallback backup)
 */
async function persistToJSON() {
    try {
        const jobs = Array.from(councilJobsCache.values())
        await fs.mkdir(path.dirname(COUNCIL_JOBS_FILE), { recursive: true })
        await fs.writeFile(COUNCIL_JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8')
    } catch (err) {
        console.error(`[CouncilStore] Failed to persist council jobs to JSON:`, err.message)
    }
}

/**
 * Clean up stuck jobs that are queued/processing for more than 1 hour
 */
async function cleanupStuckJobs() {
    if (!useDatabase) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

        const { data: stuckJobs, error: selectError } = await supabase
            .from('council_jobs')
            .select('id')
            .in('status', ['queued', 'processing', 'routing'])
            .lt('created_at', oneHourAgo)

        if (selectError) throw selectError

        if (stuckJobs && stuckJobs.length > 0) {
            console.log(`[CouncilStore] Found ${stuckJobs.length} stuck jobs, marking as timeout`)

            const { error: updateError } = await supabase
                .from('council_jobs')
                .update({ status: 'timeout' })
                .in('id', stuckJobs.map(j => j.id))

            if (updateError) throw updateError
        }
    } catch (err) {
        console.warn(`[CouncilStore] Failed to cleanup stuck jobs:`, err.message)
    }
}

/**
 * Initialize the store
 * - Load from Supabase if configured
 * - Load from JSON as fallback
 * - Cleanup stuck jobs
 */
export async function initCouncilStore() {
    try {
        if (useDatabase) {
            console.log('[CouncilStore] Using Supabase for council jobs')

            // Cleanup stuck jobs
            await cleanupStuckJobs()

            // Load recent jobs into cache
            try {
                const jobs = await councilRepo.listJobs({ limit: 100 })
                jobs.forEach(job => councilJobsCache.set(job.id, job))
                console.log(`[CouncilStore] Loaded ${jobs.length} council jobs from Supabase`)
            } catch (err) {
                console.warn('[CouncilStore] Failed to load from Supabase, falling back to JSON:', err.message)
                await loadFromJSON()
            }
        } else {
            console.log('[CouncilStore] Supabase not configured, using JSON storage')
            await loadFromJSON()
        }
    } catch (err) {
        console.error('[CouncilStore] Failed to initialize:', err.message)
    }
}

/**
 * Create a council job
 */
export async function createCouncilJob(job) {
    if (useDatabase) {
        try {
            const created = await councilRepo.createJob({
                tema: job.tema,
                contexto: job.contexto,
                objetivo: job.objetivo,
                profundidade: job.profundidade,
                fontes: job.fontes,
                restricoes: job.restricoes,
                metadados: job.metadados,
            })
            councilJobsCache.set(created.id, created)
            return created
        } catch (err) {
            console.error('[CouncilStore] Failed to create job in Supabase:', err.message)
            // Fall through to JSON
        }
    }

    // JSON fallback
    councilJobsCache.set(job.id, job)
    await persistToJSON().catch(err => console.error('[CouncilStore] Error persisting job:', err))
    return job
}

/**
 * Get a council job by ID
 */
export async function getCouncilJob(jobId) {
    // Check cache first
    const cached = councilJobsCache.get(jobId)
    if (cached) return cached

    // If not in cache and using DB, fetch from DB
    if (useDatabase) {
        try {
            const job = await councilRepo.getJob(jobId)
            if (job) {
                councilJobsCache.set(jobId, job)
                return job
            }
        } catch (err) {
            console.error('[CouncilStore] Failed to fetch job from Supabase:', err.message)
        }
    }

    return null
}

/**
 * Update a council job
 */
export async function updateCouncilJob(jobId, updates) {
    if (useDatabase) {
        try {
            const updated = await councilRepo.updateStatus(jobId, updates.status)
            councilJobsCache.set(jobId, updated)
            return updated
        } catch (err) {
            console.error('[CouncilStore] Failed to update job in Supabase:', err.message)
            // Fall through to JSON
        }
    }

    // JSON fallback
    const job = councilJobsCache.get(jobId)
    if (!job) throw new Error(`Council job not found: ${jobId}`)

    const updated = {
        ...job,
        ...updates,
        updated_at: new Date().toISOString(),
    }

    councilJobsCache.set(jobId, updated)
    await persistToJSON()
    return updated
}

/**
 * List all council jobs
 */
export async function listCouncilJobs(limit = 20) {
    if (useDatabase) {
        try {
            return await councilRepo.listJobs({ limit })
        } catch (err) {
            console.error('[CouncilStore] Failed to list jobs from Supabase:', err.message)
        }
    }

    // Fallback to cache
    return Array.from(councilJobsCache.values())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)
}

/**
 * Get all council jobs for backup/export
 */
export function getAllCouncilJobs() {
    return Array.from(councilJobsCache.values())
}

/**
 * Set audio URL and phase2 status
 */
export async function setAudioUrl(jobId, audioUrl) {
    if (useDatabase) {
        try {
            const updated = await councilRepo.setAudioUrl(jobId, audioUrl)
            councilJobsCache.set(jobId, updated)
            return updated
        } catch (err) {
            console.error('[CouncilStore] Failed to set audio URL:', err.message)
        }
    }

    const job = councilJobsCache.get(jobId)
    if (job) {
        job.audio_url = audioUrl
        job.fase2_status = 'audio_complete'
        job.updated_at = new Date().toISOString()
        await persistToJSON()
    }
    return job
}

/**
 * Set image URLs and phase2 status
 */
export async function setImageUrls(jobId, imageUrls) {
    if (useDatabase) {
        try {
            const updated = await councilRepo.setImageUrls(jobId, imageUrls)
            councilJobsCache.set(jobId, updated)
            return updated
        } catch (err) {
            console.error('[CouncilStore] Failed to set image URLs:', err.message)
        }
    }

    const job = councilJobsCache.get(jobId)
    if (job) {
        job.images_urls = imageUrls
        job.fase2_status = 'image_complete'
        job.updated_at = new Date().toISOString()
        await persistToJSON()
    }
    return job
}

/**
 * Set video URL and phase2 status
 */
export async function setVideoUrl(jobId, videoUrl) {
    if (useDatabase) {
        try {
            const updated = await councilRepo.setVideoUrl(jobId, videoUrl)
            councilJobsCache.set(jobId, updated)
            return updated
        } catch (err) {
            console.error('[CouncilStore] Failed to set video URL:', err.message)
        }
    }

    const job = councilJobsCache.get(jobId)
    if (job) {
        job.video_url = videoUrl
        job.fase2_status = 'complete'
        job.updated_at = new Date().toISOString()
        await persistToJSON()
    }
    return job
}

/**
 * Update phase2 status
 */
export async function updatePhase2Status(jobId, newStatus) {
    if (useDatabase) {
        try {
            const updated = await councilRepo.updatePhase2Status(jobId, newStatus)
            councilJobsCache.set(jobId, updated)
            return updated
        } catch (err) {
            console.error('[CouncilStore] Failed to update phase2 status:', err.message)
        }
    }

    const job = councilJobsCache.get(jobId)
    if (job) {
        job.fase2_status = newStatus
        job.updated_at = new Date().toISOString()
        await persistToJSON()
    }
    return job
}

/**
 * Update agent response
 */
export async function updateAgentResponse(jobId, agentRole, response) {
    if (useDatabase) {
        try {
            const updated = await councilRepo.updateAgentResponse(jobId, agentRole, response)
            councilJobsCache.set(jobId, updated)
            return updated
        } catch (err) {
            console.error('[CouncilStore] Failed to update agent response:', err.message)
        }
    }

    const job = councilJobsCache.get(jobId)
    if (job) {
        const columnMap = {
            pesquisador: 'resultado_pesquisador',
            visionario: 'resultado_visionario',
            desafiador: 'resultado_desafiador',
            capitao: 'resultado_capitao',
        }
        const column = columnMap[agentRole]
        if (column) {
            job[column] = response
            job.updated_at = new Date().toISOString()
            await persistToJSON()
        }
    }
    return job
}
