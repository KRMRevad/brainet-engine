-- BRAINET Exploration History Schema
-- Created: 2026-02-24
-- Migration: User exploration tracking for analytics

-- ============================================
-- EXPLORATION_HISTORY (Track dice rolls)
-- ============================================
CREATE TABLE IF NOT EXISTS exploration_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nicho_id TEXT NOT NULL REFERENCES nichos(id) ON DELETE RESTRICT,
    session_id TEXT NOT NULL,
    rolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exploration_history_nicho ON exploration_history(nicho_id);
CREATE INDEX idx_exploration_history_session ON exploration_history(session_id);
CREATE INDEX idx_exploration_history_rolled_at ON exploration_history(rolled_at DESC);
COMMENT ON TABLE exploration_history IS 'User exploration/dice roll history for analytics';
COMMENT ON COLUMN exploration_history.session_id IS 'Browser session ID for aggregating rolls per session';
COMMENT ON COLUMN exploration_history.rolled_at IS 'When the dice was rolled (exploration timestamp)';

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE exploration_history ENABLE ROW LEVEL SECURITY;

-- Public read/write for exploration history (no auth required in MVP)
CREATE POLICY "exploration_history_public_all" ON exploration_history
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- NOTES
-- ============================================
-- AC-7 (TD-1.2): Replaces localStorage-only tracking
-- Allows analytics on which niches are most explored
-- session_id = browser session token (stored in localStorage + sent to API)
-- user_agent/ip_address optional for future analytics
