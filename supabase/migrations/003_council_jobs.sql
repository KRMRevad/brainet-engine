-- ============================================
-- 003: Council Jobs Table
-- BRAINET Council Architecture — Job persistence
-- ============================================

CREATE TABLE IF NOT EXISTS council_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input (schema JSON do usuário)
  tema TEXT NOT NULL,
  contexto TEXT,
  objetivo TEXT NOT NULL CHECK (objetivo IN (
    'pesquisa', 'sintese', 'estrategia', 'analise',
    'comparacao', 'criacao', 'revisao'
  )),
  profundidade TEXT DEFAULT 'padrao' CHECK (profundidade IN ('rapida', 'padrao', 'profunda')),
  fontes JSONB DEFAULT '[]'::jsonb,
  restricoes JSONB DEFAULT '{}'::jsonb,
  metadados JSONB DEFAULT '{}'::jsonb,
  council_config JSONB DEFAULT '{"modo": "completo", "desafiar": true}'::jsonb,

  -- State machine
  status TEXT DEFAULT 'queued' CHECK (status IN (
    'queued', 'routing', 'processing', 'synthesizing',
    'complete', 'error', 'timeout'
  )),

  -- Individual agent results
  resultado_pesquisador JSONB,
  resultado_visionario JSONB,
  resultado_desafiador JSONB,
  resultado_capitao JSONB,

  -- Final synthesized output
  resultado_final TEXT,

  -- Phase 2: Content Transform
  fase2_status TEXT DEFAULT 'pending' CHECK (fase2_status IN (
    'pending', 'audio_processing', 'audio_complete',
    'image_processing', 'image_complete', 'video_processing', 'complete', 'error'
  )),
  audio_url TEXT,
  images_urls JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,

  -- Metrics
  duration_ms INTEGER,
  tokens_used JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- User tracking
  usuario_id TEXT,
  sessao_id TEXT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_council_jobs_status ON council_jobs(status);
CREATE INDEX IF NOT EXISTS idx_council_jobs_usuario ON council_jobs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_council_jobs_created ON council_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_council_jobs_fase2 ON council_jobs(fase2_status);

-- Enable Row Level Security
ALTER TABLE council_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to see their own jobs
CREATE POLICY "Users can view own jobs"
  ON council_jobs FOR SELECT
  USING (true);  -- For now, open read (tighten later with auth)

-- Policy: Allow inserts
CREATE POLICY "Allow job creation"
  ON council_jobs FOR INSERT
  WITH CHECK (true);

-- Policy: Allow updates
CREATE POLICY "Allow job updates"
  ON council_jobs FOR UPDATE
  USING (true);
