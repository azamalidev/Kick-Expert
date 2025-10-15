import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API endpoint to track question statistics when users answer questions
 * This updates the question_stats table with usage and performance metrics
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      question_id, 
      competition_question_id, 
      is_correct, 
      was_skipped, 
      response_time_ms 
    } = await req.json();

    // Validate input
    if (!question_id && !competition_question_id) {
      return NextResponse.json(
        { error: 'Either question_id or competition_question_id is required' },
        { status: 400 }
      );
    }

    // Call the database function to update stats
    const { error } = await supabase.rpc('update_question_stats', {
      p_question_id: question_id || null,
      p_competition_question_id: competition_question_id || null,
      p_is_correct: is_correct || false,
      p_was_skipped: was_skipped || false,
      p_response_time_ms: response_time_ms || null
    });

    if (error) {
      console.error('Error updating question stats:', error);
      return NextResponse.json(
        { error: 'Failed to update question stats', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Question stats updated successfully' 
    });

  } catch (err) {
    console.error('Unexpected error in track-answer-stats:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
