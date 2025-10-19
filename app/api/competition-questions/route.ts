import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This route returns competition-specific questions by merging rows from
// `competition_questions` with canonical `questions` when a numeric
// source_question_id (or question_id) is present. The returned shape is
// safe for the client to use when recording answers: it includes both
// `competition_question_id` (uuid) and `question_id` (integer|null).

export async function POST(req: NextRequest) {
  try {
    const { competitionId } = await req.json();
    if (!competitionId) return NextResponse.json({ questions: [] });

    // Fetch competition row to decide which questions to pull
    const { data: compRow, error: compFetchErr } = await supabase
      .from('competitions')
      .select('name')
      .eq('id', competitionId)
      .maybeSingle();

    if (compFetchErr) {
      console.error('Error fetching competition row:', compFetchErr);
      return NextResponse.json({ questions: [] });
    }

    // Fetch from `competition_questions` table for the specific competition (only active ones).
    // Include global (competition_id IS NULL) questions as a fallback so competitions with no assigned
    // competition-specific rows can still use the shared pool.
    const { data: qsData, error: qsErr } = await supabase
      .from('competition_questions')
      .select('*')
      .or(`competition_id.eq.${competitionId},competition_id.is.null`)
      .eq('status', true) // Only fetch enabled questions
      .order('created_at', { ascending: true });

    if (qsErr) {
      console.error('Error fetching competition_questions table:', qsErr);
      return NextResponse.json({ questions: [] });
    }

  let finalQs = (qsData || []) as any[];
  console.debug(`competition-questions: found ${finalQs.length} rows for competitionId=${competitionId}`);

    // Don't mark questions as used here - they should be marked when actually displayed to user
    // This will be handled in league.tsx when each question is shown

    const normalized = finalQs.map((q: any, idx: number) => ({
      competition_question_id: q.id, // uuid from competition_questions
      competition_id: competitionId,
      question_id: null, // not from questions table
      source_question_id: q.source_question_id,
      question_text: q.question_text,
      choices: q.choices,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      category: q.category,
      question_order: idx + 1,
      created_at: q.created_at ?? null,
    }));

    return NextResponse.json({ questions: normalized });
  } catch (err) {
    console.error('Failed to build merged competition questions:', err);
    return NextResponse.json({ questions: [] });
  }
}
