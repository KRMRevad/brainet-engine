/**
 * BRAINET Supabase Client
 * Centralized database connection for BRAINET backend
 *
 * DEA-02 (Single-user MVP): No authentication layer yet
 * Uses SUPABASE_ANON_KEY for public operations
 * Will migrate to auth in Sprint 2 (TD-1.3)
 */

import { createClient } from '@supabase/supabase-js'

// Validate required env vars
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Environment variables not configured')
    console.warn('[Supabase] Using fallback: JSON-based job queue (server/data/jobs.json)')
    console.warn('[Supabase] Set SUPABASE_URL and SUPABASE_ANON_KEY to enable database')
}

/**
 * Supabase client instance
 * @type {ReturnType<createClient>}
 */
const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false, // No session persistence for MVP
        },
        realtime: {
            params: {
                eventsPerSecond: 10, // Moderate realtime events
            },
        },
    })
    : null

/**
 * Check if Supabase is configured
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
    return supabase !== null
}

/**
 * Get Supabase client
 * @returns {ReturnType<createClient> | null}
 */
export function getSupabaseClient() {
    return supabase
}

/**
 * Test connection to Supabase
 * @returns {Promise<{connected: boolean, error?: string}>}
 */
export async function testConnection() {
    if (!supabase) {
        return { connected: false, error: 'Supabase not configured' }
    }

    try {
        const { data, error } = await supabase
            .from('nichos')
            .select('id', { count: 'exact' })
            .limit(1)

        if (error) {
            return { connected: false, error: error.message }
        }

        return { connected: true }
    } catch (e) {
        return { connected: false, error: e.message }
    }
}

/**
 * Get total count of jobs
 * @returns {Promise<number>}
 */
export async function getJobsCount() {
    if (!supabase) return 0

    try {
        const { count, error } = await supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })

        if (error) throw error
        return count || 0
    } catch (e) {
        console.error('[Supabase] Error getting jobs count:', e.message)
        return 0
    }
}

/**
 * Query jobs with filters
 * @param {Object} options
 * @param {string} options.status - Filter by status
 * @param {number} options.limit - Max results
 * @param {number} options.offset - Pagination offset
 * @returns {Promise<Array>}
 */
export async function queryJobs(options = {}) {
    if (!supabase) return []

    try {
        let query = supabase.from('jobs').select('*')

        if (options.status) {
            query = query.eq('status', options.status)
        }

        query = query.order('created_at', { ascending: false })

        if (options.limit) {
            query = query.limit(options.limit)
        }

        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
    } catch (e) {
        console.error('[Supabase] Error querying jobs:', e.message)
        return []
    }
}

/**
 * Mark stuck jobs as failed (cleanup operation)
 * Runs on server startup as per DEA-05
 *
 * @param {number} timeoutMinutes - Timeout threshold (default: 90)
 * @returns {Promise<number>} Number of jobs marked as failed
 */
export async function cleanupStuckJobs(timeoutMinutes = process.env.STUCK_JOB_TIMEOUT_MIN || 90) {
    if (!supabase) return 0

    try {
        // Find jobs stuck in 'running' state
        const timeAgo = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString()

        const { data: stuckJobs, error: selectError } = await supabase
            .from('jobs')
            .select('id')
            .eq('status', 'running')
            .lt('updated_at', timeAgo)

        if (selectError) throw selectError

        if (!stuckJobs || stuckJobs.length === 0) {
            return 0
        }

        // Mark them as failed
        const { error: updateError } = await supabase
            .from('jobs')
            .update({
                status: 'failed',
                error_message: `Stuck for > ${timeoutMinutes} minutes (cleaned up on startup)`,
            })
            .eq('status', 'running')
            .lt('updated_at', timeAgo)

        if (updateError) throw updateError

        console.log(`[Supabase] Cleaned up ${stuckJobs.length} stuck jobs`)
        return stuckJobs.length
    } catch (e) {
        console.error('[Supabase] Error cleaning up stuck jobs:', e.message)
        return 0
    }
}

export default supabase
