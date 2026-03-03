-- ============================================
-- MIGRATION 003 & 004: Council Jobs + Storage
-- For Supabase Dashboard SQL Editor
-- Steps: Copy all SQL below → paste into Dashboard → Execute
-- ============================================

-- ============================================
-- 003: Council Jobs Table
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

-- ============================================
-- 004: Storage Buckets for Phase 2 Content
-- ============================================

-- Bucket 1: Audio files (ElevenLabs TTS output)
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at)
VALUES (
  'council-audio',
  'council-audio',
  false,
  536870912, -- 500MB
  now()
) ON CONFLICT (id) DO NOTHING;

-- Bucket 2: Images (Google Whisk/Imagen output)
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at)
VALUES (
  'council-images',
  'council-images',
  false,
  536870912, -- 500MB
  now()
) ON CONFLICT (id) DO NOTHING;

-- Bucket 3: Videos (Google Flow/Veo output)
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at)
VALUES (
  'council-videos',
  'council-videos',
  false,
  5368709120, -- 5GB
  now()
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Audio Bucket
DROP POLICY IF EXISTS "Audio: Allow public read via signed URL" ON storage.objects;
CREATE POLICY "Audio: Allow public read via signed URL"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'council-audio');

DROP POLICY IF EXISTS "Audio: Allow authenticated upload" ON storage.objects;
CREATE POLICY "Audio: Allow authenticated upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'council-audio'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Audio: Allow authenticated delete" ON storage.objects;
CREATE POLICY "Audio: Allow authenticated delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'council-audio'
    AND auth.role() = 'authenticated'
  );

-- RLS Policies for Images Bucket
DROP POLICY IF EXISTS "Images: Allow public read via signed URL" ON storage.objects;
CREATE POLICY "Images: Allow public read via signed URL"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'council-images');

DROP POLICY IF EXISTS "Images: Allow authenticated upload" ON storage.objects;
CREATE POLICY "Images: Allow authenticated upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'council-images'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Images: Allow authenticated delete" ON storage.objects;
CREATE POLICY "Images: Allow authenticated delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'council-images'
    AND auth.role() = 'authenticated'
  );

-- RLS Policies for Videos Bucket
DROP POLICY IF EXISTS "Videos: Allow public read via signed URL" ON storage.objects;
CREATE POLICY "Videos: Allow public read via signed URL"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'council-videos');

DROP POLICY IF EXISTS "Videos: Allow authenticated upload" ON storage.objects;
CREATE POLICY "Videos: Allow authenticated upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'council-videos'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Videos: Allow authenticated delete" ON storage.objects;
CREATE POLICY "Videos: Allow authenticated delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'council-videos'
    AND auth.role() = 'authenticated'
  );

-- Grant permissions to service_role (for backend automation)
GRANT ALL ON storage.buckets TO service_role;
GRANT ALL ON storage.objects TO service_role;

-- ============================================
-- Verification queries (after running migrations)
-- ============================================
-- SELECT id FROM storage.buckets WHERE id IN ('council-audio','council-images','council-videos');
-- SELECT COUNT(*) FROM council_jobs;
