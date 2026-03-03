/**
 * Council Repository
 * Handles all Supabase interactions for council_jobs table
 * Focus: State machine updates + Phase 2 media tracking
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

/**
 * Phase 1: Create new council job
 */
export async function createJob(input) {
  const { tema, contexto, objetivo, profundidade, fontes, restricoes, metadados } = input

  const { data, error } = await supabase
    .from('council_jobs')
    .insert({
      tema,
      contexto,
      objetivo,
      profundidade: profundidade || 'padrao',
      fontes: fontes || [],
      restricoes: restricoes || {},
      metadados: metadados || {},
      status: 'queued',
      fase2_status: 'pending'
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create job: ${error.message}`)
  return data
}

/**
 * Get job by ID (polling)
 */
export async function getJob(jobId) {
  const { data, error } = await supabase
    .from('council_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) throw new Error(`Failed to fetch job: ${error.message}`)
  return data
}

/**
 * Phase 1: Update council agent responses
 */
export async function updateAgentResponse(jobId, agentRole, response) {
  const columnMap = {
    pesquisador: 'resultado_pesquisador',
    visionario: 'resultado_visionario',
    desafiador: 'resultado_desafiador',
    capitao: 'resultado_capitao'
  }

  const column = columnMap[agentRole]
  if (!column) throw new Error(`Invalid agentRole: ${agentRole}`)

  const { data, error } = await supabase
    .from('council_jobs')
    .update({ [column]: response })
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update ${agentRole}: ${error.message}`)
  return data
}

/**
 * Phase 1: Update job status (state machine transitions)
 */
export async function updateStatus(jobId, newStatus) {
  const validStatuses = ['queued', 'routing', 'processing', 'synthesizing', 'complete', 'error', 'timeout']

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`)
  }

  const { data, error } = await supabase
    .from('council_jobs')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update status: ${error.message}`)
  return data
}

/**
 * Phase 2: Set audio URL (after ElevenLabs TTS)
 * Updates audio_url + sets fase2_status=audio_complete
 */
export async function setAudioUrl(jobId, audioUrl) {
  if (!audioUrl || typeof audioUrl !== 'string') {
    throw new Error('Invalid audioUrl')
  }

  const { data, error } = await supabase
    .from('council_jobs')
    .update({
      audio_url: audioUrl,
      fase2_status: 'audio_complete',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw new Error(`Failed to set audio URL: ${error.message}`)
  return data
}

/**
 * Phase 2: Set image URLs (after Google Whisk)
 * Updates images_urls[] + sets fase2_status=image_complete
 */
export async function setImageUrls(jobId, imageUrls) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error('imageUrls must be a non-empty array')
  }

  const { data, error } = await supabase
    .from('council_jobs')
    .update({
      images_urls: imageUrls,
      fase2_status: 'image_complete',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw new Error(`Failed to set image URLs: ${error.message}`)
  return data
}

/**
 * Phase 2: Set video URL (after Google Flow)
 * Updates video_url + sets fase2_status=complete
 * This marks the entire job as complete
 */
export async function setVideoUrl(jobId, videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') {
    throw new Error('Invalid videoUrl')
  }

  const { data, error } = await supabase
    .from('council_jobs')
    .update({
      video_url: videoUrl,
      fase2_status: 'complete',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw new Error(`Failed to set video URL: ${error.message}`)
  return data
}

/**
 * Phase 2: Update fase2_status (intermediate state tracking)
 * Called between audio → image → video processing
 */
export async function updatePhase2Status(jobId, newStatus) {
  const validStatuses = [
    'pending',
    'audio_processing',
    'audio_complete',
    'image_processing',
    'image_complete',
    'video_processing',
    'complete',
    'error'
  ]

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid fase2_status: ${newStatus}`)
  }

  const { data, error } = await supabase
    .from('council_jobs')
    .update({
      fase2_status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update fase2_status: ${error.message}`)
  return data
}

/**
 * Get all jobs with optional filtering
 */
export async function listJobs(filters = {}) {
  let query = supabase.from('council_jobs').select('*')

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.fase2_status) {
    query = query.eq('fase2_status', filters.fase2_status)
  }

  if (filters.usuario_id) {
    query = query.eq("metadados->>'usuario_id'", filters.usuario_id)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to list jobs: ${error.message}`)
  return data
}

/**
 * Mark job as error (if something fails)
 */
export async function setError(jobId, errorMessage) {
  const { data, error } = await supabase
    .from('council_jobs')
    .update({
      status: 'error',
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw new Error(`Failed to set error: ${error.message}`)
  return data
}

export default {
  createJob,
  getJob,
  updateStatus,
  updateAgentResponse,
  setError,
  listJobs,
  setAudioUrl,
  setImageUrls,
  setVideoUrl,
  updatePhase2Status
}
