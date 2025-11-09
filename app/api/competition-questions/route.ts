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
      .eq('status', true); // Only fetch enabled questions

    if (qsErr) {
      console.error('Error fetching competition_questions table:', qsErr);
      return NextResponse.json({ questions: [] });
    }

    let allQuestions = (qsData || []) as any[];
    console.log(`🔍 competition-questions: found ${allQuestions.length} total rows for competitionId=${competitionId}`);
  
    // Log difficulty distribution from database
    const difficultyCount = allQuestions.reduce((acc: any, q: any) => {
      const diff = q.difficulty || 'unknown';
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Backend total difficulty distribution:', difficultyCount);

    // Select 20 questions with proper distribution: 8 Easy (40%), 8 Medium (40%), 4 Hard (20%)
    const shuffle = <T,>(arr: T[]): T[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const easyQuestions = shuffle(allQuestions.filter(q => q.difficulty === 'Easy'));
    const mediumQuestions = shuffle(allQuestions.filter(q => q.difficulty === 'Medium'));
    const hardQuestions = shuffle(allQuestions.filter(q => q.difficulty === 'Hard'));

    console.log('� Available by difficulty:', {
      Easy: easyQuestions.length,
      Medium: mediumQuestions.length,
      Hard: hardQuestions.length
    });

    // Select the required number from each difficulty
    let finalQs = [
      ...easyQuestions.slice(0, 8),    // 8 Easy (40%)
      ...mediumQuestions.slice(0, 8),  // 8 Medium (40%)
      ...hardQuestions.slice(0, 4),    // 4 Hard (20%)
    ];

    console.log('📦 Before shuffle - distribution:', {
      total: finalQs.length,
      Easy: finalQs.filter(q => q.difficulty === 'Easy').length,
      Medium: finalQs.filter(q => q.difficulty === 'Medium').length,
      Hard: finalQs.filter(q => q.difficulty === 'Hard').length
    });

    // If we don't have enough questions of a particular difficulty, backfill
    if (finalQs.length < 20) {
      const selectedIds = new Set(finalQs.map(q => q.id));
      const remaining = shuffle(allQuestions.filter(q => !selectedIds.has(q.id)));
      finalQs = [...finalQs, ...remaining.slice(0, 20 - finalQs.length)];
    }

    // Shuffle the final selection so difficulties are mixed
    finalQs = shuffle(finalQs);

    console.log('✅ After shuffle - final distribution:', {
      total: finalQs.length,
      Easy: finalQs.filter(q => q.difficulty === 'Easy').length,
      Medium: finalQs.filter(q => q.difficulty === 'Medium').length,
      Hard: finalQs.filter(q => q.difficulty === 'Hard').length
    });

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
