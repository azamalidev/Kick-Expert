import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Phase 3: Question Detail API
 * Get comprehensive details for a single question
 */

/**
 * GET /api/admin/questions/[id]/detail
 * Fetch detailed information about a question
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source') || 'free_quiz'; // 'free_quiz' or 'competition'
    const { id } = await params;
    const questionId = id;

    let questionData;
    let stats;
    let flags;

    // Fetch question from appropriate table
    if (source === 'free_quiz') {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', parseInt(questionId))
        .single();

      if (error) throw error;
      questionData = data;

      // Fetch stats
      const { data: statsData } = await supabase
        .from('question_stats')
        .select('*')
        .eq('question_id', parseInt(questionId))
        .single();

      stats = statsData;

      // Fetch quality flags
      const { data: flagsData } = await supabase
        .from('question_quality_flags')
        .select('*')
        .eq('question_id', parseInt(questionId))
        .eq('status', 'active');

      flags = flagsData || [];

    } else {
      const { data, error } = await supabase
        .from('competition_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (error) throw error;
      questionData = data;

      // Fetch stats
      const { data: statsData } = await supabase
        .from('question_stats')
        .select('*')
        .eq('competition_question_id', questionId)
        .single();

      stats = statsData;

      // Fetch quality flags
      const { data: flagsData } = await supabase
        .from('question_quality_flags')
        .select('*')
        .eq('competition_question_id', questionId)
        .eq('status', 'active');

      flags = flagsData || [];
    }

    if (!questionData) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Calculate performance metrics
    const performance = calculatePerformanceMetrics(stats);

    // Find related questions (same category, similar difficulty)
    const relatedQuestions = await findRelatedQuestions(
      source,
      questionData.category,
      questionData.difficulty,
      questionId
    );

    // Get performance history (if available)
    const history = await getPerformanceHistory(source, questionId);

    return NextResponse.json({
      success: true,
      question: questionData,
      stats: stats || {},
      performance,
      flags,
      relatedQuestions,
      history
    });

  } catch (err) {
    console.error('Question detail API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch question details' },
      { status: 500 }
    );
  }
}

/**
 * Calculate performance metrics from stats
 */
function calculatePerformanceMetrics(stats: any) {
  if (!stats) {
    return {
      correctPercentage: 0,
      skipRate: 0,
      avgResponseTime: 0,
      performanceRating: 0,
      totalInteractions: 0
    };
  }

  const timesAnswered = stats.times_answered || 0;
  const timesCorrect = stats.times_correct || 0;
  const timesSkipped = stats.times_skipped || 0;
  const timesUsed = stats.times_used || 0;
  const totalResponseTime = stats.total_response_time_ms || 0;

  const correctPercentage = timesAnswered > 0 
    ? (timesCorrect / timesAnswered) * 100 
    : 0;

  const skipRate = timesUsed > 0 
    ? (timesSkipped / timesUsed) * 100 
    : 0;

  const avgResponseTime = timesAnswered > 0 
    ? totalResponseTime / timesAnswered 
    : 0;

  // Performance rating (1-5 scale)
  let performanceRating = 3; // Default neutral
  if (timesAnswered >= 10) {
    if (correctPercentage >= 80) performanceRating = 5;
    else if (correctPercentage >= 65) performanceRating = 4;
    else if (correctPercentage >= 45) performanceRating = 3;
    else if (correctPercentage >= 30) performanceRating = 2;
    else performanceRating = 1;
  }

  return {
    correctPercentage: Math.round(correctPercentage * 10) / 10,
    skipRate: Math.round(skipRate * 10) / 10,
    avgResponseTime: Math.round(avgResponseTime),
    performanceRating,
    totalInteractions: timesUsed
  };
}

/**
 * Find related questions
 */
async function findRelatedQuestions(
  source: string,
  category: string,
  difficulty: string,
  excludeId: string
) {
  try {
    const tableName = source === 'free_quiz' ? 'questions' : 'competition_questions';
    let query = supabase
      .from(tableName)
      .select('id, question_text, category, difficulty, status')
      .eq('category', category)
      .eq('difficulty', difficulty)
      .eq('status', true)
      .limit(5);

    if (source === 'free_quiz') {
      query = query.neq('id', parseInt(excludeId));
    } else {
      query = query.neq('id', excludeId);
    }

    const { data } = await query;
    return data || [];
  } catch (error) {
    console.error('Error fetching related questions:', error);
    return [];
  }
}

/**
 * Get performance history for a question
 */
async function getPerformanceHistory(source: string, questionId: string) {
  try {
    let query = supabase
      .from('question_performance_history')
      .select('*')
      .eq('question_source', source)
      .order('snapshot_date', { ascending: true })
      .limit(30); // Last 30 days

    if (source === 'free_quiz') {
      query = query.eq('question_id', parseInt(questionId));
    } else {
      query = query.eq('competition_question_id', questionId);
    }

    const { data } = await query;
    return data || [];
  } catch (error) {
    console.error('Error fetching performance history:', error);
    return [];
  }
}
