-- Migration: add competition_question_id column to competition_answers if missing
-- Idempotent

BEGIN;

ALTER TABLE IF EXISTS public.competition_answers
  ADD COLUMN IF NOT EXISTS competition_question_id uuid;

-- Create FK constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'competition_answers'
      AND c.contype = 'f'
      AND c.conname = 'competition_answers_competition_question_id_fkey'
  ) THEN
    ALTER TABLE public.competition_answers
      ADD CONSTRAINT competition_answers_competition_question_id_fkey
      FOREIGN KEY (competition_question_id) REFERENCES public.competition_questions(id) ON DELETE SET NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;
