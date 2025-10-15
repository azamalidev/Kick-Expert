import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Phase 2: Admin Analytics API
 * Provides comprehensive question analytics and insights
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const questionSource = searchParams.get('source') || 'all'; // 'all', 'free_quiz', 'competition'
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const minCorrectPercentage = searchParams.get('minCorrect');
    const maxCorrectPercentage = searchParams.get('maxCorrect');
    const minUsage = searchParams.get('minUsage');
    const status = searchParams.get('status');

    // Build query for analytics view
    let query = supabase
      .from('question_analytics_view')
      .select('*');

    // Apply filters
    if (questionSource !== 'all') {
      query = query.eq('question_source', questionSource);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (status) {
      query = query.eq('status', status === 'active');
    }

    if (minCorrectPercentage) {
      query = query.gte('correct_percentage', parseFloat(minCorrectPercentage));
    }

    if (maxCorrectPercentage) {
      query = query.lte('correct_percentage', parseFloat(maxCorrectPercentage));
    }

    if (minUsage) {
      query = query.gte('times_used', parseInt(minUsage));
    }

    const { data: analytics, error } = await query;

    if (error) {
      console.error('Analytics fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate aggregated insights
    const insights = calculateInsights(analytics || []);

    return NextResponse.json({
      success: true,
      analytics: analytics || [],
      insights,
      total: (analytics || []).length
    });

  } catch (err) {
    console.error('Analytics API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate aggregated insights from analytics data
 */
function calculateInsights(data: any[]) {
  if (data.length === 0) {
    return {
      totalQuestions: 0,
      activeQuestions: 0,
      totalUsage: 0,
      avgCorrectPercentage: 0,
      avgResponseTime: 0,
      difficultyDistribution: {},
      categoryDistribution: {},
      performanceDistribution: {},
      topPerformers: [],
      worstPerformers: [],
      mostUsed: [],
      leastUsed: [],
      neverUsed: []
    };
  }

  const totalQuestions = data.length;
  const activeQuestions = data.filter(q => q.status).length;
  const totalUsage = data.reduce((sum, q) => sum + (q.times_used || 0), 0);
  
  // Questions with usage
  const usedQuestions = data.filter(q => (q.times_used || 0) > 0);
  const avgCorrectPercentage = usedQuestions.length > 0
    ? usedQuestions.reduce((sum, q) => sum + (q.correct_percentage || 0), 0) / usedQuestions.length
    : 0;
  
  // Only include questions with actual response times (not 0 or null)
  const questionsWithResponses = usedQuestions.filter(q => (q.avg_response_time_ms || 0) > 0);
  const avgResponseTime = questionsWithResponses.length > 0
    ? questionsWithResponses.reduce((sum, q) => sum + (q.avg_response_time_ms || 0), 0) / questionsWithResponses.length
    : 0;

  // Difficulty distribution
  const difficultyDistribution = data.reduce((acc: any, q) => {
    const diff = q.difficulty || 'Unknown';
    acc[diff] = (acc[diff] || 0) + 1;
    return acc;
  }, {});

  // Category distribution
  const categoryDistribution = data.reduce((acc: any, q) => {
    const cat = q.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // Performance distribution
  const performanceDistribution = data.reduce((acc: any, q) => {
    const rating = q.performance_rating || 0;
    const label = rating >= 4 ? 'Excellent' : rating >= 3 ? 'Good' : rating >= 2 ? 'Fair' : 'Poor';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  // Top performers (highest correct percentage with minimum usage)
  const topPerformers = usedQuestions
    .filter(q => q.times_answered >= 3) // Minimum 3 answers for reliable stats
    .sort((a, b) => (b.correct_percentage || 0) - (a.correct_percentage || 0))
    .slice(0, 10)
    .map(q => ({
      id: q.question_id || q.competition_question_id,
      source: q.question_source,
      question_text: q.question_text?.substring(0, 100) + '...',
      correct_percentage: q.correct_percentage,
      times_used: q.times_used
    }));

  // Worst performers (lowest correct percentage with minimum usage)
  const worstPerformers = usedQuestions
    .filter(q => q.times_answered >= 3)
    .sort((a, b) => (a.correct_percentage || 0) - (b.correct_percentage || 0))
    .slice(0, 10)
    .map(q => ({
      id: q.question_id || q.competition_question_id,
      source: q.question_source,
      question_text: q.question_text?.substring(0, 100) + '...',
      correct_percentage: q.correct_percentage,
      times_used: q.times_used
    }));

  // Most used questions
  const mostUsed = data
    .filter(q => q.times_used > 0)
    .sort((a, b) => (b.times_used || 0) - (a.times_used || 0))
    .slice(0, 10)
    .map(q => ({
      id: q.question_id || q.competition_question_id,
      source: q.question_source,
      question_text: q.question_text?.substring(0, 100) + '...',
      times_used: q.times_used,
      correct_percentage: q.correct_percentage
    }));

  // Least used questions (excluding never used)
  const leastUsed = data
    .filter(q => q.times_used > 0)
    .sort((a, b) => (a.times_used || 0) - (b.times_used || 0))
    .slice(0, 10)
    .map(q => ({
      id: q.question_id || q.competition_question_id,
      source: q.question_source,
      question_text: q.question_text?.substring(0, 100) + '...',
      times_used: q.times_used,
      days_since_last_used: q.days_since_last_used
    }));

  // Never used questions
  const neverUsed = data
    .filter(q => q.times_used === 0 && q.status === true)
    .map(q => ({
      id: q.question_id || q.competition_question_id,
      source: q.question_source,
      question_text: q.question_text?.substring(0, 100) + '...',
      category: q.category,
      difficulty: q.difficulty
    }));

  return {
    totalQuestions,
    activeQuestions,
    totalUsage,
    avgCorrectPercentage: Math.round(avgCorrectPercentage * 100) / 100,
    avgResponseTime: Math.round(avgResponseTime),
    difficultyDistribution,
    categoryDistribution,
    performanceDistribution,
    topPerformers,
    worstPerformers,
    mostUsed,
    leastUsed,
    neverUsed: neverUsed.slice(0, 10)
  };
}

/**
 * POST endpoint for bulk operations
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operation, questionIds, competitionQuestionIds, updates } = body;

    if (!operation) {
      return NextResponse.json({ error: 'Operation is required' }, { status: 400 });
    }

    let result;

    switch (operation) {
      case 'bulk_enable':
        result = await bulkUpdateStatus(questionIds, competitionQuestionIds, true);
        break;

      case 'bulk_disable':
        result = await bulkUpdateStatus(questionIds, competitionQuestionIds, false);
        break;

      case 'bulk_delete':
        result = await bulkDelete(questionIds, competitionQuestionIds);
        break;

      case 'bulk_update':
        result = await bulkUpdate(questionIds, competitionQuestionIds, updates);
        break;

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (err) {
    console.error('Bulk operation error:', err);
    return NextResponse.json(
      { error: 'Bulk operation failed' },
      { status: 500 }
    );
  }
}

async function bulkUpdateStatus(
  questionIds: number[],
  competitionQuestionIds: string[],
  status: boolean
) {
  const results = { updated: 0, errors: [] as string[] };

  // Update free quiz questions
  if (questionIds && questionIds.length > 0) {
    const { error } = await supabase
      .from('questions')
      .update({ status })
      .in('id', questionIds);

    if (error) {
      results.errors.push(`Free quiz: ${error.message}`);
    } else {
      results.updated += questionIds.length;
    }
  }

  // Update competition questions
  if (competitionQuestionIds && competitionQuestionIds.length > 0) {
    const { error } = await supabase
      .from('competition_questions')
      .update({ status })
      .in('id', competitionQuestionIds);

    if (error) {
      results.errors.push(`Competition: ${error.message}`);
    } else {
      results.updated += competitionQuestionIds.length;
    }
  }

  return {
    success: results.errors.length === 0,
    ...results
  };
}

async function bulkDelete(
  questionIds: number[],
  competitionQuestionIds: string[]
) {
  const results = { deleted: 0, errors: [] as string[] };

  // Delete free quiz questions
  if (questionIds && questionIds.length > 0) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .in('id', questionIds);

    if (error) {
      results.errors.push(`Free quiz: ${error.message}`);
    } else {
      results.deleted += questionIds.length;
    }
  }

  // Delete competition questions
  if (competitionQuestionIds && competitionQuestionIds.length > 0) {
    const { error } = await supabase
      .from('competition_questions')
      .delete()
      .in('id', competitionQuestionIds);

    if (error) {
      results.errors.push(`Competition: ${error.message}`);
    } else {
      results.deleted += competitionQuestionIds.length;
    }
  }

  return {
    success: results.errors.length === 0,
    ...results
  };
}

async function bulkUpdate(
  questionIds: number[],
  competitionQuestionIds: string[],
  updates: any
) {
  const results = { updated: 0, errors: [] as string[] };

  // Update free quiz questions
  if (questionIds && questionIds.length > 0) {
    const { error } = await supabase
      .from('questions')
      .update(updates)
      .in('id', questionIds);

    if (error) {
      results.errors.push(`Free quiz: ${error.message}`);
    } else {
      results.updated += questionIds.length;
    }
  }

  // Update competition questions
  if (competitionQuestionIds && competitionQuestionIds.length > 0) {
    const { error } = await supabase
      .from('competition_questions')
      .update(updates)
      .in('id', competitionQuestionIds);

    if (error) {
      results.errors.push(`Competition: ${error.message}`);
    } else {
      results.updated += competitionQuestionIds.length;
    }
  }

  return {
    success: results.errors.length === 0,
    ...results
  };
}
