-- Migration: Create question_stats table for analytics tracking
-- Date: 2025-10-14
-- Purpose: Track usage, correctness, response time, and skip rate per question
-- This migration is SAFE and idempotent

BEGIN;

-- Create the question_stats table
CREATE TABLE IF NOT EXISTS public.question_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id INTEGER NULL, -- FK to questions table (free quiz)
  competition_question_id UUID NULL, -- FK to competition_questions table
  question_type TEXT NOT NULL CHECK (question_type IN ('free_quiz', 'competition')),
  
  -- Usage metrics
  times_used INTEGER DEFAULT 0,
  times_answered INTEGER DEFAULT 0,
  times_skipped INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  
  -- Performance metrics
  correct_percentage DECIMAL(5,2) DEFAULT 0.00, -- e.g., 75.50%
  avg_response_time_ms INTEGER DEFAULT 0, -- average time in milliseconds
  total_response_time_ms BIGINT DEFAULT 0, -- sum of all response times
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT question_stats_question_id_fkey 
    FOREIGN KEY (question_id) 
    REFERENCES public.questions(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT question_stats_competition_question_id_fkey 
    FOREIGN KEY (competition_question_id) 
    REFERENCES public.competition_questions(id) 
    ON DELETE CASCADE,
    
  -- Ensure either question_id OR competition_question_id is set, not both
  CONSTRAINT question_stats_one_fk_check 
    CHECK (
      (question_id IS NOT NULL AND competition_question_id IS NULL) OR
      (question_id IS NULL AND competition_question_id IS NOT NULL)
    )
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_question_stats_question_id 
  ON public.question_stats(question_id);
  
CREATE INDEX IF NOT EXISTS idx_question_stats_competition_question_id 
  ON public.question_stats(competition_question_id);
  
CREATE INDEX IF NOT EXISTS idx_question_stats_type 
  ON public.question_stats(question_type);

-- Add comments
COMMENT ON TABLE public.question_stats IS 'Tracks analytics and performance metrics for questions';
COMMENT ON COLUMN public.question_stats.correct_percentage IS 'Percentage of times this question was answered correctly';
COMMENT ON COLUMN public.question_stats.avg_response_time_ms IS 'Average response time in milliseconds';

COMMIT;
