-- Fix: Set default status to TRUE for all existing questions
-- This ensures all existing questions are active by default
-- Run this AFTER the migration files

BEGIN;

-- Update existing NULL status values to TRUE for competition_questions
UPDATE public.competition_questions
SET status = TRUE
WHERE status IS NULL;

-- Update existing NULL status values to TRUE for questions
UPDATE public.questions
SET status = TRUE
WHERE status IS NULL;

-- Verify the updates
SELECT 
  'competition_questions' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = TRUE) as active,
  COUNT(*) FILTER (WHERE status = FALSE) as disabled
FROM public.competition_questions
UNION ALL
SELECT 
  'questions' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = TRUE) as active,
  COUNT(*) FILTER (WHERE status = FALSE) as disabled
FROM public.questions;

COMMIT;
