-- Migration: Change competition_question_id from UUID to TEXT to allow numeric IDs
-- This fixes the issue where we're storing question IDs as numbers but the column expects UUIDs

BEGIN;

-- Drop the existing foreign key constraint
ALTER TABLE IF EXISTS public.competition_answers
  DROP CONSTRAINT IF EXISTS competition_answers_competition_question_id_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE IF EXISTS public.competition_answers
  ALTER COLUMN competition_question_id TYPE TEXT;

COMMIT;