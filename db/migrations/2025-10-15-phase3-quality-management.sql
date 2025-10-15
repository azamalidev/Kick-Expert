-- Phase 3: Quality Management & Performance History Tables
-- Date: October 15, 2025
-- Purpose: Enable automated quality checks and historical trend analysis

-- =====================================================
-- Table 1: question_quality_flags
-- Stores quality issues detected in questions
-- =====================================================

CREATE TABLE IF NOT EXISTS question_quality_flags (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NULL,
  competition_question_id UUID NULL,
  question_source VARCHAR(20) NOT NULL CHECK (question_source IN ('free_quiz', 'competition')),
  
  -- Flag details
  flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN (
    'critical',      -- < 30% correct rate (50+ uses)
    'warning',       -- < 50% correct rate (20+ uses)
    'too_easy',      -- > 95% correct rate (50+ uses)
    'slow',          -- Avg response time > 60 seconds
    'high_skip',     -- > 40% skip rate
    'unused'         -- Never used in 30+ days (active questions)
  )),
  flag_reason TEXT NOT NULL,
  flag_value DECIMAL(10,2), -- The metric value that triggered the flag
  flag_threshold DECIMAL(10,2), -- The threshold that was exceeded
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  resolved_by VARCHAR(100) NULL,
  resolution_notes TEXT NULL,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_question_ref CHECK (
    (question_id IS NOT NULL AND competition_question_id IS NULL) OR
    (question_id IS NULL AND competition_question_id IS NOT NULL)
  )
);

-- Indexes for quality_flags
CREATE INDEX idx_quality_flags_status ON question_quality_flags(status);
CREATE INDEX idx_quality_flags_type ON question_quality_flags(flag_type);
CREATE INDEX idx_quality_flags_source ON question_quality_flags(question_source);
CREATE INDEX idx_quality_flags_question_id ON question_quality_flags(question_id) WHERE question_id IS NOT NULL;
CREATE INDEX idx_quality_flags_comp_question_id ON question_quality_flags(competition_question_id) WHERE competition_question_id IS NOT NULL;
CREATE INDEX idx_quality_flags_flagged_at ON question_quality_flags(flagged_at DESC);

-- Composite index for finding active flags for a question
CREATE INDEX idx_quality_flags_question_status ON question_quality_flags(question_source, question_id, competition_question_id, status);

COMMENT ON TABLE question_quality_flags IS 'Tracks quality issues in questions for automated management';
COMMENT ON COLUMN question_quality_flags.flag_type IS 'Type of quality issue: critical, warning, too_easy, slow, high_skip, unused';
COMMENT ON COLUMN question_quality_flags.flag_value IS 'The actual metric value that triggered the flag (e.g., 28.5 for correct percentage)';
COMMENT ON COLUMN question_quality_flags.flag_threshold IS 'The threshold value that was exceeded (e.g., 30 for critical threshold)';

-- =====================================================
-- Table 2: question_performance_history
-- Stores daily snapshots of question performance
-- =====================================================

CREATE TABLE IF NOT EXISTS question_performance_history (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NULL,
  competition_question_id UUID NULL,
  question_source VARCHAR(20) NOT NULL CHECK (question_source IN ('free_quiz', 'competition')),
  
  -- Snapshot date
  snapshot_date DATE NOT NULL,
  
  -- Performance metrics (snapshot of that day)
  times_used INTEGER DEFAULT 0,
  times_answered INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_skipped INTEGER DEFAULT 0,
  correct_percentage DECIMAL(5,2) DEFAULT 0,
  skip_rate_percentage DECIMAL(5,2) DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_history_question_ref CHECK (
    (question_id IS NOT NULL AND competition_question_id IS NULL) OR
    (question_id IS NULL AND competition_question_id IS NOT NULL)
  ),
  -- Ensure one snapshot per question per day
  CONSTRAINT uq_history_snapshot UNIQUE(question_source, question_id, competition_question_id, snapshot_date)
);

-- Indexes for performance_history
CREATE INDEX idx_perf_history_date ON question_performance_history(snapshot_date DESC);
CREATE INDEX idx_perf_history_source ON question_performance_history(question_source);
CREATE INDEX idx_perf_history_question_id ON question_performance_history(question_id, snapshot_date) WHERE question_id IS NOT NULL;
CREATE INDEX idx_perf_history_comp_question_id ON question_performance_history(competition_question_id, snapshot_date) WHERE competition_question_id IS NOT NULL;

-- Composite index for time-series queries
CREATE INDEX idx_perf_history_question_date ON question_performance_history(question_source, question_id, competition_question_id, snapshot_date);

COMMENT ON TABLE question_performance_history IS 'Daily snapshots of question performance for trend analysis';
COMMENT ON COLUMN question_performance_history.snapshot_date IS 'Date of this performance snapshot';
COMMENT ON COLUMN question_performance_history.times_used IS 'Cumulative times used as of snapshot date';

-- =====================================================
-- Table 3: saved_filter_views
-- Stores user's saved filter configurations
-- =====================================================

CREATE TABLE IF NOT EXISTS saved_filter_views (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  view_name VARCHAR(100) NOT NULL,
  
  -- Filter configuration stored as JSON
  filters JSONB NOT NULL,
  
  -- Settings
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE, -- For sharing views between admins
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT uq_user_view_name UNIQUE(user_id, view_name)
);

-- Indexes for saved_filter_views
CREATE INDEX idx_saved_views_user ON saved_filter_views(user_id);
CREATE INDEX idx_saved_views_default ON saved_filter_views(user_id, is_default);
CREATE INDEX idx_saved_views_public ON saved_filter_views(is_public) WHERE is_public = true;

COMMENT ON TABLE saved_filter_views IS 'User-saved filter configurations for quick access';
COMMENT ON COLUMN saved_filter_views.filters IS 'JSON object containing filter parameters';

-- =====================================================
-- Function: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_quality_flags_updated_at
  BEFORE UPDATE ON question_quality_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_views_updated_at
  BEFORE UPDATE ON saved_filter_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- View: Active Quality Flags Summary
-- Quick view of all active quality issues
-- =====================================================

CREATE OR REPLACE VIEW active_quality_flags_summary AS
SELECT 
  qf.id,
  qf.question_source,
  qf.question_id,
  qf.competition_question_id,
  qf.flag_type,
  qf.flag_reason,
  qf.flag_value,
  qf.flag_threshold,
  qf.flagged_at,
  
  -- Join with analytics view to get current question data
  qa.question_text,
  qa.category,
  qa.difficulty,
  qa.status AS question_status,
  qa.times_used,
  qa.correct_percentage AS current_correct_percentage,
  qa.skip_rate_percentage AS current_skip_rate,
  qa.avg_response_time_ms AS current_response_time
  
FROM question_quality_flags qf
LEFT JOIN question_analytics_view qa ON (
  qa.question_source = qf.question_source AND
  (
    (qf.question_id IS NOT NULL AND qa.question_id = qf.question_id) OR
    (qf.competition_question_id IS NOT NULL AND qa.competition_question_id = qf.competition_question_id)
  )
)
WHERE qf.status = 'active'
ORDER BY 
  CASE qf.flag_type
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'high_skip' THEN 3
    WHEN 'slow' THEN 4
    WHEN 'too_easy' THEN 5
    WHEN 'unused' THEN 6
    ELSE 7
  END,
  qf.flagged_at DESC;

COMMENT ON VIEW active_quality_flags_summary IS 'Shows all active quality flags with current question data';

-- =====================================================
-- Sample Data for Testing (Optional)
-- =====================================================

-- Uncomment to add sample flags for testing
/*
INSERT INTO question_quality_flags (
  question_id,
  question_source,
  flag_type,
  flag_reason,
  flag_value,
  flag_threshold
) VALUES
  (1, 'free_quiz', 'critical', 'Correct percentage (28.5%) is below critical threshold', 28.5, 30.0),
  (2, 'free_quiz', 'warning', 'Correct percentage (45.2%) is below warning threshold', 45.2, 50.0),
  (3, 'free_quiz', 'too_easy', 'Correct percentage (97.8%) exceeds easy threshold', 97.8, 95.0);
*/

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check tables were created
SELECT 
  'question_quality_flags' AS table_name,
  COUNT(*) AS row_count
FROM question_quality_flags
UNION ALL
SELECT 
  'question_performance_history' AS table_name,
  COUNT(*) AS row_count
FROM question_performance_history
UNION ALL
SELECT 
  'saved_filter_views' AS table_name,
  COUNT(*) AS row_count
FROM saved_filter_views;

-- Check view was created
SELECT COUNT(*) AS active_flags_count
FROM active_quality_flags_summary;

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 3 Migration Complete!';
  RAISE NOTICE '   - question_quality_flags table created';
  RAISE NOTICE '   - question_performance_history table created';
  RAISE NOTICE '   - saved_filter_views table created';
  RAISE NOTICE '   - active_quality_flags_summary view created';
  RAISE NOTICE '   - Triggers and indexes created';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready for Phase 3 features!';
END $$;
