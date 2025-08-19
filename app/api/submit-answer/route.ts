import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const { competitionId, sessionId, userId, questionId, selectedAnswer, isCorrect } = await req.json();
  await supabase.from('competition_answers').insert({
    competition_id: competitionId,
    session_id: sessionId,
    user_id: userId,
    question_id: questionId,
    selected_answer: selectedAnswer,
    is_correct: isCorrect,
    submitted_at: new Date().toISOString(),
  });
  return NextResponse.json({ success: true });
}
