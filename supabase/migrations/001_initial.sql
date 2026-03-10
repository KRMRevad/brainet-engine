-- BRAINET Initial Schema
-- Created: 2026-02-24
-- Migration: Core data structure for BRAINET MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- NICHOS (Main content categories)
-- ============================================
CREATE TABLE IF NOT EXISTS nichos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    emoji TEXT,
    cor TEXT,
    cor_secundaria TEXT,
    arquetipo TEXT,
    vicio_curado TEXT,
    virtude_promovida TEXT,
    canal_existente TEXT,
    peso INTEGER DEFAULT 1,
    exploracoes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE nichos IS 'Main content niches for BRAINET ecosystem';
COMMENT ON COLUMN nichos.id IS 'Unique identifier (slug format: espiritualidade, filosofia-e-psicologia, etc)';
COMMENT ON COLUMN nichos.peso IS 'Priority weight for exploration';
COMMENT ON COLUMN nichos.exploracoes IS 'Total number of explorations/rolls in this niche';

-- ============================================
-- SUBTEMAS (Sub-categories under nichos)
-- ============================================
CREATE TABLE IF NOT EXISTS subtemas (
    id TEXT PRIMARY KEY,
    nicho_id TEXT NOT NULL REFERENCES nichos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nicho_id, id)
);

CREATE INDEX idx_subtemas_nicho_id ON subtemas(nicho_id);
COMMENT ON TABLE subtemas IS 'Sub-categories within each niche';

-- ============================================
-- FORMATOS (Content formats: video, shorts, newsletter, etc)
-- ============================================
CREATE TABLE IF NOT EXISTS formatos (
    id TEXT PRIMARY KEY,
    subtema_id TEXT NOT NULL REFERENCES subtemas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    icone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subtema_id, id)
);

CREATE INDEX idx_formatos_subtema_id ON formatos(subtema_id);
COMMENT ON TABLE formatos IS 'Content formats (longform-video, shorts, carrossel, thread, newsletter, etc)';

-- ============================================
-- ANGULOS (Content angles/topics under formatos)
-- ============================================
CREATE TABLE IF NOT EXISTS angulos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formato_id TEXT NOT NULL REFERENCES formatos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(formato_id, titulo)
);

CREATE INDEX idx_angulos_formato_id ON angulos(formato_id);
COMMENT ON TABLE angulos IS 'Content angles/topics for each format';
COMMENT ON COLUMN angulos.titulo IS 'The actual content topic/title (e.g., "Os 7 Arcanjos e suas funções cósmicas")';

-- ============================================
-- JOBS (Pipeline execution jobs)
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nicho_id TEXT NOT NULL REFERENCES nichos(id) ON DELETE RESTRICT,
    subtema_id TEXT REFERENCES subtemas(id) ON DELETE SET NULL,
    formato_id TEXT REFERENCES formatos(id) ON DELETE SET NULL,
    angulo TEXT NOT NULL,
    mode TEXT DEFAULT 'solo' CHECK (mode IN ('solo', 'council', 'cascade')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'complete', 'failed', 'error')),
    current_agent INTEGER DEFAULT 0,
    error_message TEXT,
    duration_seconds FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_jobs_nicho_id ON jobs(nicho_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_updated_at ON jobs(updated_at DESC);
COMMENT ON TABLE jobs IS 'Pipeline execution jobs tracking';
COMMENT ON COLUMN jobs.mode IS 'Execution mode: solo (1 AI), council (3 in parallel), cascade (3 in sequence)';
COMMENT ON COLUMN jobs.current_agent IS 'Current executing agent ID (1-6)';

-- ============================================
-- JOB_AGENTS (Agent execution status within a job)
-- ============================================
CREATE TABLE IF NOT EXISTS job_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    agent_number INTEGER NOT NULL CHECK (agent_number IN (1, 2, 3, 5, 6)),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'complete', 'error')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    output_length INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, agent_number)
);

CREATE INDEX idx_job_agents_job_id ON job_agents(job_id);
CREATE INDEX idx_job_agents_agent ON job_agents(agent_number);
COMMENT ON TABLE job_agents IS 'Individual agent execution status for each job';
COMMENT ON COLUMN job_agents.agent_number IS 'Agent number (1=Research, 2=Extraction, 3=Synthesis, 5=Strategy, 6=Script)';
COMMENT ON COLUMN job_agents.output_length IS 'Length of agent output in characters';

-- ============================================
-- JOB_OUTPUTS (Agent output storage)
-- ============================================
CREATE TABLE IF NOT EXISTS job_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    agent_number INTEGER NOT NULL CHECK (agent_number IN (1, 2, 3, 5, 6)),
    content TEXT NOT NULL,
    output_length INTEGER GENERATED ALWAYS AS (LENGTH(content)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, agent_number)
);

CREATE INDEX idx_job_outputs_job_id ON job_outputs(job_id);
CREATE INDEX idx_job_outputs_agent ON job_outputs(agent_number);
COMMENT ON TABLE job_outputs IS 'Output content from each agent execution';
COMMENT ON COLUMN job_outputs.output_length IS 'Length of output (auto-calculated)';

-- ============================================
-- UPDATE TRIGGERS (auto-update updated_at)
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nichos_updated_at
    BEFORE UPDATE ON nichos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_subtemas_updated_at
    BEFORE UPDATE ON subtemas
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_formatos_updated_at
    BEFORE UPDATE ON formatos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ============================================
-- POLICIES (Supabase RLS - Explore layer only)
-- ============================================
ALTER TABLE nichos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE formatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE angulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_outputs ENABLE ROW LEVEL SECURITY;

-- Public read access for nicho data (exploration layer)
CREATE POLICY "nichos_public_read" ON nichos
    FOR SELECT
    USING (true);

CREATE POLICY "subtemas_public_read" ON subtemas
    FOR SELECT
    USING (true);

CREATE POLICY "formatos_public_read" ON formatos
    FOR SELECT
    USING (true);

CREATE POLICY "angulos_public_read" ON angulos
    FOR SELECT
    USING (true);

-- Public read/write for jobs (no auth in MVP)
CREATE POLICY "jobs_public_all" ON jobs
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "job_agents_public_all" ON job_agents
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "job_outputs_public_all" ON job_outputs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- NOTES
-- ============================================
-- DEA-02: Single-user MVP (no user authentication required yet)
-- All tables have public read/write access via RLS
-- Design allows for future auth layer (sprint 2) without schema changes
-- Foreign keys use ON DELETE CASCADE for job cleanup, RESTRICT for nichos
-- Indexes optimize for common queries:
--   - Jobs by status/date (pipeline monitoring)
--   - Subtemas/Formatos/Angulos by parent ID (data loading)
--   - Job agents by job (execution tracking)
