-- ⚡ QUICK FIX - Run this immediately in Supabase SQL Editor
-- This will resolve the tracking issues you're experiencing

BEGIN;

-- STEP 1: Fix NULL status values (makes all questions active)
UPDATE public.competition_questions 
SET status = TRUE 
WHERE status IS NULL;

UPDATE public.questions 
SET status = TRUE 
WHERE status IS NULL;

-- STEP 2: Verify the fix worked
SELECT 
  'competition_questions' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = TRUE) as active,
  COUNT(*) FILTER (WHERE status = FALSE) as disabled,
  COUNT(*) FILTER (WHERE status IS NULL) as still_null
FROM public.competition_questions
UNION ALL
SELECT 
  'questions' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = TRUE) as active,
  COUNT(*) FILTER (WHERE status = FALSE) as disabled,
  COUNT(*) FILTER (WHERE status IS NULL) as still_null
FROM public.questions;

-- STEP 3: Test the mark_question_as_used function
-- Get a sample question
DO $$
DECLARE
  test_question_id INTEGER;
BEGIN
  -- Get first question ID
  SELECT id INTO test_question_id FROM public.questions LIMIT 1;
  
  IF test_question_id IS NOT NULL THEN
    -- Test the function
    PERFORM mark_question_as_used(p_question_id := test_question_id);
    
    RAISE NOTICE 'Test successful! Question % was marked as used', test_question_id;
  ELSE
    RAISE NOTICE 'No questions found in the database';
  END IF;
END $$;

-- STEP 4: Verify last_used_at was updated
SELECT 
  id, 
  question_text, 
  last_used_at,
  status,
  CASE 
    WHEN last_used_at IS NOT NULL THEN '✅ Working'
    ELSE '❌ Not updated'
  END as tracking_status
FROM public.questions 
ORDER BY last_used_at DESC NULLS LAST
LIMIT 5;

COMMIT;

-- 🎉 If you see "✅ Working" above, tracking is now functional!
-- Now restart your dev server and test the free quiz again.
