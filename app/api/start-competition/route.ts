import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const { competitionId } = await req.json();
  // Set competition status to 'live'
  await supabase.from('competitions').update({ status: 'live' }).eq('id', competitionId);

  // Fetch competition_questions
  const { data: compQs, error: compError } = await supabase
    .from('competition_questions')
    .select('*')
    .eq('competition_id', competitionId);

  if (compError) {
    console.error('Error fetching competition_questions:', compError);
    return NextResponse.json({ questions: [] });
  }

  const questions = (compQs || []) as any[];

  // Collect any numeric source_question_id values to fetch canonical questions
  const numericSourceIds = questions
    .map((q) => q.source_question_id)
    .filter((v) => v !== null && v !== undefined && String(v).match(/^\d+$/))
    .map((v) => Number(v));

  let canonicalById: Record<number, any> = {};
  if (numericSourceIds.length > 0) {
    const { data: canonData, error: canonError } = await supabase
      .from('questions')
      .select('*')
      .in('id', numericSourceIds);
    if (!canonError && canonData) {
      canonicalById = (canonData as any[]).reduce((acc, row) => {
        acc[row.id] = row; return acc;
      }, {} as Record<number, any>);
    }
  }

  // Merge competition question row with canonical question when available
  const merged = questions.map((cq) => {
    const out: any = {
      id: cq.id,
      competition_id: cq.competition_id,
      question_text: cq.question_text,
      choices: cq.choices,
      correct_answer: cq.correct_answer,
      explanation: cq.explanation,
      difficulty: cq.difficulty,
      category: cq.category,
      created_at: cq.created_at,
      source_question_id: cq.source_question_id || null,
    };

    if (cq.source_question_id && String(cq.source_question_id).match(/^\d+$/)) {
      const cid = Number(cq.source_question_id);
      const canon = canonicalById[cid];
      if (canon) {
        out.question_id = canon.id;
        // prefer canonical fields where appropriate
        out.question_text = canon.question_text || out.question_text;
        out.choices = canon.choices || out.choices;
        out.correct_answer = canon.correct_answer || out.correct_answer;
        out.explanation = canon.explanation || out.explanation;
        out.difficulty = canon.difficulty || out.difficulty;
        out.category = canon.category || out.category;
      }
    }

    return out;
  });

  return NextResponse.json({ questions: merged });
}
