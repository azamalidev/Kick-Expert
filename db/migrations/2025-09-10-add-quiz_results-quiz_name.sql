-- Migration: add quiz_name column to quiz_results to match client selects
-- Idempotent: safe to run multiple times

BEGIN;

-- Add column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quiz_results' AND column_name = 'quiz_name'
  ) THEN
    ALTER TABLE public.quiz_results
      ADD COLUMN quiz_name text;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Optional index for read queries
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_name ON public.quiz_results (quiz_name);

COMMIT;
