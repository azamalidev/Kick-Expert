-- Migration: Add late joiner fields to competition_sessions table
-- This migration adds support for tracking late joiners in competitions

ALTER TABLE competition_sessions
ADD COLUMN IF NOT EXISTS late_joiner BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS missed_questions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS penalty_seconds INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN competition_sessions.late_joiner IS 'Whether the user joined after competition start';
COMMENT ON COLUMN competition_sessions.missed_questions IS 'Number of questions missed due to late joining';
COMMENT ON COLUMN competition_sessions.penalty_seconds IS 'Timer penalty seconds (currently always 0 for fair play)';

-- Create index for performance on late joiner queries
CREATE INDEX IF NOT EXISTS idx_competition_sessions_late_joiner ON competition_sessions(late_joiner);
CREATE INDEX IF NOT EXISTS idx_competition_sessions_missed_questions ON competition_sessions(missed_questions);