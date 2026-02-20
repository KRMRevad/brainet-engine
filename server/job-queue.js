/**
 * BRAINET Job Queue
 * Persistent job tracking using JSON file storage
 */

import fs from 'fs/promises'
import path from 'path'
import config from './config.js'

let jobs = []

/**
 * Initialize the job queue, loading from disk
 */
export async function initJobQueue() {
    try {
        await fs.mkdir(path.dirname(config.jobs.dbPath), { recursive: true })
        const data = await fs.readFile(config.jobs.dbPath, 'utf-8')
        jobs = JSON.parse(data)
        console.log(`[JobQueue] Loaded ${jobs.length} jobs from disk`)
    } catch {
        jobs = []
        console.log('[JobQueue] Starting fresh job queue')
    }
}

/**
 * Save jobs to disk
 */
async function persist() {
    await fs.writeFile(config.jobs.dbPath, JSON.stringify(jobs, null, 2))
}

/**
 * Create a new pipeline job
 */
export async function createJob(input) {
    const job = {
        id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: 'queued',
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

    jobs.unshift(job) // Newest first
    await persist()
    return job
}

/**
 * Update job status
 */
export async function updateJob(jobId, updates) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) throw new Error(`Job not found: ${jobId}`)

    Object.assign(job, updates, { updatedAt: new Date().toISOString() })
    await persist()
    return job
}

/**
 * Update a specific agent's status within a job
 */
export async function updateAgentStatus(jobId, agentId, status, output = null) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) throw new Error(`Job not found: ${jobId}`)

    job.agents[agentId] = {
        status, // 'running' | 'complete' | 'error'
        startedAt: job.agents[agentId]?.startedAt || new Date().toISOString(),
        completedAt: status !== 'running' ? new Date().toISOString() : null,
        outputLength: output?.length || 0,
    }

    if (output) {
        job.outputs[agentId] = output
    }

    job.currentAgent = status === 'running' ? agentId : job.currentAgent
    job.updatedAt = new Date().toISOString()

    await persist()
    return job
}

/**
 * Add an error to job
 */
export async function addJobError(jobId, error) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    job.errors.push({
        timestamp: new Date().toISOString(),
        message: error.message || String(error),
        agent: job.currentAgent,
    })
    job.updatedAt = new Date().toISOString()

    await persist()
}

/**
 * Get a job by ID
 */
export function getJob(jobId) {
    return jobs.find(j => j.id === jobId) || null
}

/**
 * Get all jobs (newest first)
 */
export function getAllJobs() {
    return jobs.map(j => ({
        id: j.id,
        status: j.status,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
        input: j.input,
        currentAgent: j.currentAgent,
        agents: j.agents,
        errors: j.errors.length,
        duration: j.duration,
    }))
}

/**
 * Get full job including outputs
 */
export function getJobFull(jobId) {
    return jobs.find(j => j.id === jobId) || null
}
