-- Migration: Add last_used_at and status fields to competition_questions
-- Date: 2025-10-14
-- Purpose: Enable rotation tracking and question enable/disable functionality
-- This migration is SAFE and idempotent

BEGIN;

-- Add last_used_at column if it doesn't exist
ALTER TABLE IF EXISTS public.competition_questions
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add status column if it doesn't exist (default TRUE = enabled)
ALTER TABLE IF EXISTS public.competition_questions
  ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_competition_questions_last_used 
  ON public.competition_questions(last_used_at);
  
CREATE INDEX IF NOT EXISTS idx_competition_questions_status 
  ON public.competition_questions(status);

-- Add comment to document the fields
COMMENT ON COLUMN public.competition_questions.last_used_at IS 'Timestamp when this question was last served to a user';
COMMENT ON COLUMN public.competition_questions.status IS 'TRUE = active/enabled, FALSE = disabled/archived';

COMMIT;
