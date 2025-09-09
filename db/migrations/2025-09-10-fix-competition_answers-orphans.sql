-- Migration: Nullify orphan competition_answers references and add FK constraints
-- Idempotent and safe: sets orphan foreign keys to NULL and then adds FK constraints if missing.

BEGIN;

-- Allow relevant columns to be NULL (no-op if already nullable)
ALTER TABLE IF EXISTS public.competition_answers
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN session_id DROP NOT NULL,
  ALTER COLUMN competition_id DROP NOT NULL,
  ALTER COLUMN competition_question_id DROP NOT NULL,
  ALTER COLUMN question_id DROP NOT NULL;

-- Nullify orphan user_id values
UPDATE public.competition_answers
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM auth.users);

-- Nullify orphan session_id values (sessions missing)
UPDATE public.competition_answers
SET session_id = NULL
WHERE session_id IS NOT NULL
  AND session_id NOT IN (SELECT id FROM public.competition_sessions);

-- Nullify orphan competition_id values
UPDATE public.competition_answers
SET competition_id = NULL
WHERE competition_id IS NOT NULL
  AND competition_id NOT IN (SELECT id FROM public.competitions);

-- Nullify orphan competition_question_id values
UPDATE public.competition_answers
SET competition_question_id = NULL
WHERE competition_question_id IS NOT NULL
  AND competition_question_id NOT IN (SELECT id FROM public.competition_questions);

-- Nullify orphan question_id values (canonical questions table may not exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'questions') THEN
    UPDATE public.competition_answers
    SET question_id = NULL
    WHERE question_id IS NOT NULL
      AND question_id NOT IN (SELECT id FROM public.questions);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add FK constraints if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'competition_answers'
      AND c.contype = 'f'
      AND c.conname = 'competition_answers_user_id_fkey'
  ) THEN
    ALTER TABLE public.competition_answers
      ADD CONSTRAINT competition_answers_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'competition_answers'
      AND c.contype = 'f'
      AND c.conname = 'competition_answers_session_id_fkey'
  ) THEN
    ALTER TABLE public.competition_answers
      ADD CONSTRAINT competition_answers_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES public.competition_sessions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'competition_answers'
      AND c.contype = 'f'
      AND c.conname = 'competition_answers_competition_id_fkey'
  ) THEN
    ALTER TABLE public.competition_answers
      ADD CONSTRAINT competition_answers_competition_id_fkey
      FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE SET NULL;
  END IF;

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

  -- Add question_id FK only if canonical questions table exists
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'questions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'competition_answers'
        AND c.contype = 'f'
        AND c.conname = 'competition_answers_question_id_fkey'
    ) THEN
      ALTER TABLE public.competition_answers
        ADD CONSTRAINT competition_answers_question_id_fkey
        FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE SET NULL;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_competition_answers_comp ON public.competition_answers (competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_answers_session ON public.competition_answers (session_id);
CREATE INDEX IF NOT EXISTS idx_competition_answers_user ON public.competition_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_competition_answers_question ON public.competition_answers (question_id);

COMMIT;
