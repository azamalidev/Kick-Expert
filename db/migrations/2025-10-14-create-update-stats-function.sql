-- Migration: Create function to update question stats
-- Date: 2025-10-14
-- Purpose: Update question statistics when a question is answered or skipped
-- This migration is SAFE and idempotent

BEGIN;

CREATE OR REPLACE FUNCTION public.update_question_stats(
  p_question_id INTEGER DEFAULT NULL,
  p_competition_question_id UUID DEFAULT NULL,
  p_is_correct BOOLEAN DEFAULT FALSE,
  p_was_skipped BOOLEAN DEFAULT FALSE,
  p_response_time_ms INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_question_type TEXT;
  v_existing_record_id UUID;
BEGIN
  -- Determine question type
  IF p_competition_question_id IS NOT NULL THEN
    v_question_type := 'competition';
  ELSIF p_question_id IS NOT NULL THEN
    v_question_type := 'free_quiz';
  ELSE
    RAISE EXCEPTION 'Either question_id or competition_question_id must be provided';
  END IF;

  -- Check if stats record exists
  SELECT id INTO v_existing_record_id
  FROM public.question_stats
  WHERE (question_id = p_question_id OR p_question_id IS NULL)
    AND (competition_question_id = p_competition_question_id OR p_competition_question_id IS NULL)
    AND question_type = v_question_type;

  -- If no record exists, create one
  IF v_existing_record_id IS NULL THEN
    INSERT INTO public.question_stats (
      question_id,
      competition_question_id,
      question_type,
      times_used,
      times_answered,
      times_skipped,
      times_correct,
      times_incorrect,
      total_response_time_ms,
      created_at,
      updated_at
    ) VALUES (
      p_question_id,
      p_competition_question_id,
      v_question_type,
      1, -- times_used
      CASE WHEN NOT p_was_skipped THEN 1 ELSE 0 END, -- times_answered
      CASE WHEN p_was_skipped THEN 1 ELSE 0 END, -- times_skipped
      CASE WHEN p_is_correct AND NOT p_was_skipped THEN 1 ELSE 0 END, -- times_correct
      CASE WHEN NOT p_is_correct AND NOT p_was_skipped THEN 1 ELSE 0 END, -- times_incorrect
      COALESCE(p_response_time_ms, 0), -- total_response_time_ms
      NOW(),
      NOW()
    );
    
    -- Get the ID of the newly created record
    SELECT id INTO v_existing_record_id
    FROM public.question_stats
    WHERE (question_id = p_question_id OR p_question_id IS NULL)
      AND (competition_question_id = p_competition_question_id OR p_competition_question_id IS NULL)
      AND question_type = v_question_type;
  ELSE
    -- Update existing record
    UPDATE public.question_stats
    SET
      times_used = times_used + 1,
      times_answered = times_answered + CASE WHEN NOT p_was_skipped THEN 1 ELSE 0 END,
      times_skipped = times_skipped + CASE WHEN p_was_skipped THEN 1 ELSE 0 END,
      times_correct = times_correct + CASE WHEN p_is_correct AND NOT p_was_skipped THEN 1 ELSE 0 END,
      times_incorrect = times_incorrect + CASE WHEN NOT p_is_correct AND NOT p_was_skipped THEN 1 ELSE 0 END,
      total_response_time_ms = total_response_time_ms + COALESCE(p_response_time_ms, 0),
      updated_at = NOW()
    WHERE id = v_existing_record_id;
  END IF;

  -- Recalculate aggregated metrics
  UPDATE public.question_stats
  SET
    correct_percentage = CASE 
      WHEN times_answered > 0 THEN ROUND((times_correct::DECIMAL / times_answered::DECIMAL) * 100, 2)
      ELSE 0
    END,
    avg_response_time_ms = CASE
      WHEN times_answered > 0 THEN ROUND(total_response_time_ms::DECIMAL / times_answered::DECIMAL)
      ELSE 0
    END
  WHERE id = v_existing_record_id;

END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION public.update_question_stats IS 'Updates question statistics when a question is answered or skipped';

COMMIT;
