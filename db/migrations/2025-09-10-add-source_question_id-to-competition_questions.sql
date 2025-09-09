-- Migration: add source_question_id to competition_questions (nullable text)
-- Idempotent and safe: adds column if missing and backfills from question_id when present

BEGIN;

ALTER TABLE IF EXISTS public.competition_questions
  ADD COLUMN IF NOT EXISTS source_question_id text;

-- Backfill from existing integer question_id column if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'competition_questions' AND column_name = 'question_id'
  ) THEN
    EXECUTE 'UPDATE public.competition_questions SET source_question_id = question_id::text WHERE source_question_id IS NULL AND question_id IS NOT NULL';
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;
