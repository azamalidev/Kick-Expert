-- Migration: Create function to mark questions as used
-- Date: 2025-10-14
-- Purpose: Update last_used_at timestamp when a question is served to a user
-- This migration is SAFE and idempotent

BEGIN;

CREATE OR REPLACE FUNCTION public.mark_question_as_used(
  p_question_id INTEGER DEFAULT NULL,
  p_competition_question_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Update competition_questions table
  IF p_competition_question_id IS NOT NULL THEN
    UPDATE public.competition_questions
    SET last_used_at = NOW()
    WHERE id = p_competition_question_id;
  END IF;

  -- Update questions table (free quiz)
  IF p_question_id IS NOT NULL THEN
    UPDATE public.questions
    SET last_used_at = NOW()
    WHERE id = p_question_id;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION public.mark_question_as_used IS 'Updates last_used_at timestamp when a question is served';

COMMIT;
