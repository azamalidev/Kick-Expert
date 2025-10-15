import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Phase 3: Question Clone API
 * Clone questions with optional modifications
 */

/**
 * POST /api/admin/questions/clone
 * Clone a single question or multiple questions
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      questionId, 
      competitionQuestionId, 
      source,
      modifications,
      bulkClone,
      questionIds,
      competitionQuestionIds
    } = body;

    let result;

    if (bulkClone) {
      // Bulk clone multiple questions
      result = await bulkCloneQuestions(questionIds, competitionQuestionIds);
    } else {
      // Clone single question
      result = await cloneSingleQuestion(
        source,
        questionId,
        competitionQuestionId,
        modifications
      );
    }

    return NextResponse.json(result);

  } catch (err) {
    console.error('Clone API error:', err);
    return NextResponse.json(
      { error: 'Clone operation failed' },
      { status: 500 }
    );
  }
}

/**
 * Clone a single question with optional modifications
 */
async function cloneSingleQuestion(
  source: 'free_quiz' | 'competition',
  questionId?: number,
  competitionQuestionId?: string,
  modifications?: any
) {
  try {
    let originalQuestion;

    // Fetch original question
    if (source === 'free_quiz' && questionId) {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (error) throw error;
      originalQuestion = data;

    } else if (source === 'competition' && competitionQuestionId) {
      const { data, error } = await supabase
        .from('competition_questions')
        .select('*')
        .eq('id', competitionQuestionId)
        .single();

      if (error) throw error;
      originalQuestion = data;
    } else {
      throw new Error('Invalid source or question ID');
    }

    if (!originalQuestion) {
      throw new Error('Question not found');
    }

    // Prepare cloned question data
    const clonedData = {
      ...originalQuestion,
      ...modifications,
      // Remove ID so a new one is generated
      id: undefined,
      // Mark as cloned
      question_text: modifications?.question_text || `${originalQuestion.question_text} (Copy)`,
      // Reset usage stats
      last_used_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert cloned question
    const tableName = source === 'free_quiz' ? 'questions' : 'competition_questions';
    const { data: newQuestion, error: insertError } = await supabase
      .from(tableName)
      .insert(clonedData)
      .select()
      .single();

    if (insertError) throw insertError;

    return {
      success: true,
      clonedQuestion: newQuestion,
      originalId: questionId || competitionQuestionId,
      message: 'Question cloned successfully'
    };

  } catch (error) {
    console.error('Clone error:', error);
    return {
      success: false,
      error: 'Failed to clone question',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Bulk clone multiple questions
 */
async function bulkCloneQuestions(
  questionIds?: number[],
  competitionQuestionIds?: string[]
) {
  try {
    const clonedQuestions: any[] = [];
    const errors: string[] = [];

    // Clone free quiz questions
    if (questionIds && questionIds.length > 0) {
      for (const id of questionIds) {
        const result = await cloneSingleQuestion('free_quiz', id, undefined, {});
        if (result.success) {
          clonedQuestions.push(result.clonedQuestion);
        } else {
          errors.push(`Free quiz question ${id}: ${result.error}`);
        }
      }
    }

    // Clone competition questions
    if (competitionQuestionIds && competitionQuestionIds.length > 0) {
      for (const id of competitionQuestionIds) {
        const result = await cloneSingleQuestion('competition', undefined, id, {});
        if (result.success) {
          clonedQuestions.push(result.clonedQuestion);
        } else {
          errors.push(`Competition question ${id}: ${result.error}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      cloned: clonedQuestions.length,
      clonedQuestions,
      errors,
      message: `Successfully cloned ${clonedQuestions.length} question(s)`
    };

  } catch (error) {
    return {
      success: false,
      error: 'Bulk clone operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
