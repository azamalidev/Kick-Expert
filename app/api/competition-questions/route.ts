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

    const compName: string = (compRow && compRow.name) || '';

    // Map competition name to difficulty — adjust these rules if your naming differs
    const mapNameToDifficulty = (name: string) => {
      const n = (name || '').toLowerCase();
      if (n.includes('starter')) return 'Easy';
      if (n.includes('pro')) return 'Medium';
      if (n.includes('elite')) return 'Hard';
      // fallback: medium
      return 'Medium';
    };

    const difficulty = mapNameToDifficulty(compName);

    // Default number of questions to return — change as needed or accept from client
    const limit = 20;

    // Fetch from `questions` table directly (as requested)
    const { data: qsData, error: qsErr } = await supabase
      .from('questions')
      .select('*')
      .eq('difficulty', difficulty)
      .limit(limit)
      .order('id', { ascending: true });

    if (qsErr) {
      console.error('Error fetching questions table:', qsErr);
      return NextResponse.json({ questions: [] });
    }

    let finalQs = (qsData || []) as any[];

    // If not enough questions found for that difficulty, fetch more without difficulty filter
    if (finalQs.length < limit) {
      const { data: more, error: moreErr } = await supabase
        .from('questions')
        .select('*')
        .limit(limit)
        .order('id', { ascending: true });
      if (!moreErr && more) finalQs = more;
    }

    const normalized = finalQs.map((q: any, idx: number) => ({
      competition_question_id: null,
      competition_id: competitionId,
      question_id: q.id,
      source_question_id: null,
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
