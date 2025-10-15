import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Phase 3: Quality Flags API
 * Automated quality management for questions
 */

// Quality check thresholds
const QUALITY_THRESHOLDS = {
  CRITICAL_CORRECT_PERCENTAGE: 30, // < 30% correct with 50+ uses
  CRITICAL_MIN_USES: 50,
  WARNING_CORRECT_PERCENTAGE: 50, // < 50% correct with 20+ uses
  WARNING_MIN_USES: 20,
  TOO_EASY_PERCENTAGE: 95, // > 95% correct with 50+ uses
  TOO_EASY_MIN_USES: 50,
  SLOW_RESPONSE_TIME_MS: 60000, // > 60 seconds
  HIGH_SKIP_RATE: 40, // > 40% skip rate
  UNUSED_DAYS: 30 // Not used in 30+ days
};

/**
 * GET /api/admin/quality-flags
 * Fetch existing quality flags with optional filters
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active'; // active, resolved, dismissed, all
    const flagType = searchParams.get('type'); // critical, warning, etc.
    const source = searchParams.get('source'); // free_quiz, competition, all

    // Build query
    let query = supabase
      .from('active_quality_flags_summary')
      .select('*');

    // Apply filters
    if (status && status !== 'all') {
      // Note: view already filters to active, need to query table directly for other statuses
      if (status !== 'active') {
        query = supabase
          .from('question_quality_flags')
          .select(`
            *,
            question:questions(question_text, category, difficulty, status),
            competition_question:competition_questions(question_text, category, difficulty, status)
          `)
          .eq('status', status);
      }
    }

    if (flagType) {
      query = query.eq('flag_type', flagType);
    }

    if (source && source !== 'all') {
      query = query.eq('question_source', source);
    }

    const { data: flags, error } = await query;

    if (error) {
      console.error('Quality flags fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get summary stats
    const summary = calculateFlagsSummary(flags || []);

    return NextResponse.json({
      success: true,
      flags: flags || [],
      summary,
      total: (flags || []).length
    });

  } catch (err) {
    console.error('Quality flags API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/quality-flags
 * Operations: run-check, resolve, dismiss, bulk-resolve
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operation, flagIds, resolvedBy, notes } = body;

    let result;

    switch (operation) {
      case 'run-check':
        result = await runQualityCheck();
        break;

      case 'resolve':
        result = await resolveFlags(flagIds, resolvedBy, notes);
        break;

      case 'dismiss':
        result = await dismissFlags(flagIds, resolvedBy, notes);
        break;

      case 'bulk-resolve':
        result = await resolveFlags(flagIds, resolvedBy, notes);
        break;

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (err) {
    console.error('Quality flags operation error:', err);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}

/**
 * Run quality check on all questions
 * Creates flags for questions that fail quality thresholds
 */
async function runQualityCheck() {
  try {
    // Fetch all questions from analytics view
    const { data: questions, error: fetchError } = await supabase
      .from('question_analytics_view')
      .select('*');

    if (fetchError) throw fetchError;

    const newFlags: any[] = [];
    const now = new Date();

    for (const q of questions || []) {
      const flags = detectQualityIssues(q);
      
      for (const flag of flags) {
        // Check if flag already exists and is active
        const { data: existingFlags } = await supabase
          .from('question_quality_flags')
          .select('id')
          .eq('question_source', q.question_source)
          .eq(q.question_source === 'free_quiz' ? 'question_id' : 'competition_question_id', 
              q.question_source === 'free_quiz' ? q.question_id : q.competition_question_id)
          .eq('flag_type', flag.flag_type)
          .eq('status', 'active');

        // Only create new flag if one doesn't exist
        if (!existingFlags || existingFlags.length === 0) {
          newFlags.push({
            question_id: q.question_source === 'free_quiz' ? q.question_id : null,
            competition_question_id: q.question_source === 'competition' ? q.competition_question_id : null,
            question_source: q.question_source,
            ...flag,
            flagged_at: now
          });
        }
      }
    }

    // Insert new flags
    if (newFlags.length > 0) {
      const { error: insertError } = await supabase
        .from('question_quality_flags')
        .insert(newFlags);

      if (insertError) throw insertError;
    }

    // Get updated flag counts by type
    const { data: flagCounts } = await supabase
      .from('question_quality_flags')
      .select('flag_type, status')
      .eq('status', 'active');

    const counts = (flagCounts || []).reduce((acc: any, f) => {
      acc[f.flag_type] = (acc[f.flag_type] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      newFlagsCreated: newFlags.length,
      totalActiveFlags: flagCounts?.length || 0,
      flagsByType: counts,
      message: `Quality check complete. Found ${newFlags.length} new issues.`
    };

  } catch (error) {
    console.error('Quality check error:', error);
    return {
      success: false,
      error: 'Quality check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Detect quality issues for a single question
 */
function detectQualityIssues(question: any): any[] {
  const flags: any[] = [];
  const timesUsed = question.times_used || 0;
  const correctPercentage = question.correct_percentage || 0;
  const skipRate = question.skip_rate_percentage || 0;
  const avgResponseTime = question.avg_response_time_ms || 0;
  const daysSinceLastUsed = question.days_since_last_used;
  const isActive = question.status;

  // Critical: Low correct percentage with significant usage
  if (timesUsed >= QUALITY_THRESHOLDS.CRITICAL_MIN_USES && 
      correctPercentage < QUALITY_THRESHOLDS.CRITICAL_CORRECT_PERCENTAGE) {
    flags.push({
      flag_type: 'critical',
      flag_reason: `Correct percentage (${correctPercentage.toFixed(1)}%) is critically low with ${timesUsed} uses. Question may be poorly worded or have incorrect answer.`,
      flag_value: correctPercentage,
      flag_threshold: QUALITY_THRESHOLDS.CRITICAL_CORRECT_PERCENTAGE
    });
  }

  // Warning: Moderate correct percentage issues
  if (timesUsed >= QUALITY_THRESHOLDS.WARNING_MIN_USES && 
      correctPercentage < QUALITY_THRESHOLDS.WARNING_CORRECT_PERCENTAGE &&
      correctPercentage >= QUALITY_THRESHOLDS.CRITICAL_CORRECT_PERCENTAGE) {
    flags.push({
      flag_type: 'warning',
      flag_reason: `Correct percentage (${correctPercentage.toFixed(1)}%) is below target with ${timesUsed} uses. Question may need review.`,
      flag_value: correctPercentage,
      flag_threshold: QUALITY_THRESHOLDS.WARNING_CORRECT_PERCENTAGE
    });
  }

  // Too Easy: Very high correct percentage
  if (timesUsed >= QUALITY_THRESHOLDS.TOO_EASY_MIN_USES && 
      correctPercentage > QUALITY_THRESHOLDS.TOO_EASY_PERCENTAGE) {
    flags.push({
      flag_type: 'too_easy',
      flag_reason: `Correct percentage (${correctPercentage.toFixed(1)}%) is very high with ${timesUsed} uses. Question may be too easy or answer too obvious.`,
      flag_value: correctPercentage,
      flag_threshold: QUALITY_THRESHOLDS.TOO_EASY_PERCENTAGE
    });
  }

  // Slow: High response time
  if (timesUsed > 0 && avgResponseTime > QUALITY_THRESHOLDS.SLOW_RESPONSE_TIME_MS) {
    flags.push({
      flag_type: 'slow',
      flag_reason: `Average response time (${(avgResponseTime / 1000).toFixed(1)}s) exceeds 60 seconds. Question may be too complex or confusing.`,
      flag_value: avgResponseTime / 1000,
      flag_threshold: QUALITY_THRESHOLDS.SLOW_RESPONSE_TIME_MS / 1000
    });
  }

  // High Skip Rate: Users frequently skip this question
  if (timesUsed > 10 && skipRate > QUALITY_THRESHOLDS.HIGH_SKIP_RATE) {
    flags.push({
      flag_type: 'high_skip',
      flag_reason: `Skip rate (${skipRate.toFixed(1)}%) is high with ${timesUsed} uses. Question may be unclear or intimidating.`,
      flag_value: skipRate,
      flag_threshold: QUALITY_THRESHOLDS.HIGH_SKIP_RATE
    });
  }

  // Unused: Active question not used in 30+ days
  if (isActive && daysSinceLastUsed !== null && daysSinceLastUsed > QUALITY_THRESHOLDS.UNUSED_DAYS) {
    flags.push({
      flag_type: 'unused',
      flag_reason: `Question has not been used in ${daysSinceLastUsed} days despite being active. Consider reviewing or disabling.`,
      flag_value: daysSinceLastUsed,
      flag_threshold: QUALITY_THRESHOLDS.UNUSED_DAYS
    });
  }

  return flags;
}

/**
 * Resolve quality flags
 */
async function resolveFlags(flagIds: number[], resolvedBy: string, notes: string) {
  try {
    const { error } = await supabase
      .from('question_quality_flags')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_notes: notes
      })
      .in('id', flagIds);

    if (error) throw error;

    return {
      success: true,
      resolved: flagIds.length,
      message: `Successfully resolved ${flagIds.length} flag(s)`
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to resolve flags',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Dismiss quality flags
 */
async function dismissFlags(flagIds: number[], dismissedBy: string, notes: string) {
  try {
    const { error } = await supabase
      .from('question_quality_flags')
      .update({
        status: 'dismissed',
        resolved_at: new Date().toISOString(),
        resolved_by: dismissedBy,
        resolution_notes: notes
      })
      .in('id', flagIds);

    if (error) throw error;

    return {
      success: true,
      dismissed: flagIds.length,
      message: `Successfully dismissed ${flagIds.length} flag(s)`
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to dismiss flags',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Calculate summary statistics for flags
 */
function calculateFlagsSummary(flags: any[]) {
  const summary = {
    total: flags.length,
    byType: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    critical: 0,
    warning: 0,
    info: 0
  };

  flags.forEach(flag => {
    // Count by type
    summary.byType[flag.flag_type] = (summary.byType[flag.flag_type] || 0) + 1;

    // Count by source
    summary.bySource[flag.question_source] = (summary.bySource[flag.question_source] || 0) + 1;

    // Severity categories
    if (flag.flag_type === 'critical') {
      summary.critical++;
    } else if (flag.flag_type === 'warning' || flag.flag_type === 'high_skip') {
      summary.warning++;
    } else {
      summary.info++;
    }
  });

  return summary;
}
