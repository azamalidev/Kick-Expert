-- =====================================================
-- Phase 2: Admin Insights & Visualization
-- Migration: Create Analytics View
-- Date: October 15, 2025
-- =====================================================

-- Drop view if exists (for re-running migration)
DROP VIEW IF EXISTS question_analytics_view;

-- Create comprehensive analytics view for admin dashboard
CREATE OR REPLACE VIEW question_analytics_view AS
SELECT 
    -- Question identifiers
    q.id as question_id,
    NULL as competition_question_id,
    'free_quiz' as question_source,
    
    -- Question details
    q.question_text,
    q.category,
    q.difficulty,
    q.status,
    q.created_at,
    q.last_used_at,
    
    -- Statistics (from question_stats)
    COALESCE(qs.times_used, 0) as times_used,
    COALESCE(qs.times_answered, 0) as times_answered,
    COALESCE(qs.times_skipped, 0) as times_skipped,
    COALESCE(qs.times_correct, 0) as times_correct,
    COALESCE(qs.times_incorrect, 0) as times_incorrect,
    COALESCE(qs.correct_percentage, 0) as correct_percentage,
    COALESCE(qs.avg_response_time_ms, 0) as avg_response_time_ms,
    
    -- Calculated metrics
    CASE 
        WHEN COALESCE(qs.times_used, 0) > 0 
        THEN ROUND((COALESCE(qs.times_skipped, 0)::numeric / qs.times_used::numeric) * 100, 2)
        ELSE 0 
    END as skip_rate_percentage,
    
    -- Performance rating (1-5 scale based on correct percentage)
    CASE 
        WHEN COALESCE(qs.correct_percentage, 0) >= 80 THEN 5
        WHEN COALESCE(qs.correct_percentage, 0) >= 60 THEN 4
        WHEN COALESCE(qs.correct_percentage, 0) >= 40 THEN 3
        WHEN COALESCE(qs.correct_percentage, 0) >= 20 THEN 2
        ELSE 1
    END as performance_rating,
    
    -- Days since last use
    CASE 
        WHEN q.last_used_at IS NOT NULL 
        THEN EXTRACT(DAY FROM (NOW() - q.last_used_at))::INTEGER
        ELSE NULL 
    END as days_since_last_used,
    
    qs.last_updated as stats_last_updated

FROM questions q
LEFT JOIN question_stats qs ON qs.question_id = q.id

UNION ALL

SELECT 
    -- Question identifiers
    NULL as question_id,
    cq.id as competition_question_id,
    'competition' as question_source,
    
    -- Question details
    cq.question_text,
    cq.category,
    cq.difficulty,
    cq.status,
    cq.created_at,
    cq.last_used_at,
    
    -- Statistics (from question_stats)
    COALESCE(qs.times_used, 0) as times_used,
    COALESCE(qs.times_answered, 0) as times_answered,
    COALESCE(qs.times_skipped, 0) as times_skipped,
    COALESCE(qs.times_correct, 0) as times_correct,
    COALESCE(qs.times_incorrect, 0) as times_incorrect,
    COALESCE(qs.correct_percentage, 0) as correct_percentage,
    COALESCE(qs.avg_response_time_ms, 0) as avg_response_time_ms,
    
    -- Calculated metrics
    CASE 
        WHEN COALESCE(qs.times_used, 0) > 0 
        THEN ROUND((COALESCE(qs.times_skipped, 0)::numeric / qs.times_used::numeric) * 100, 2)
        ELSE 0 
    END as skip_rate_percentage,
    
    -- Performance rating (1-5 scale based on correct percentage)
    CASE 
        WHEN COALESCE(qs.correct_percentage, 0) >= 80 THEN 5
        WHEN COALESCE(qs.correct_percentage, 0) >= 60 THEN 4
        WHEN COALESCE(qs.correct_percentage, 0) >= 40 THEN 3
        WHEN COALESCE(qs.correct_percentage, 0) >= 20 THEN 2
        ELSE 1
    END as performance_rating,
    
    -- Days since last use
    CASE 
        WHEN cq.last_used_at IS NOT NULL 
        THEN EXTRACT(DAY FROM (NOW() - cq.last_used_at))::INTEGER
        ELSE NULL 
    END as days_since_last_used,
    
    qs.last_updated as stats_last_updated

FROM competition_questions cq
LEFT JOIN question_stats qs ON qs.competition_question_id = cq.id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_stats_performance 
ON question_stats(correct_percentage DESC, times_used DESC);

CREATE INDEX IF NOT EXISTS idx_question_stats_last_updated 
ON question_stats(last_updated DESC);

-- Grant permissions
GRANT SELECT ON question_analytics_view TO authenticated;
GRANT SELECT ON question_analytics_view TO anon;

-- Verification query
COMMENT ON VIEW question_analytics_view IS 'Unified analytics view for both free quiz and competition questions with calculated metrics';
