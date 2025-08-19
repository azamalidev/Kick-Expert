import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const { competitionId, userId, sessionId } = await req.json();
  // Aggregate answers for session
  const { data: answers } = await supabase.from('competition_answers').select('*').eq('session_id', sessionId);
  const correctAnswers = (answers ?? []).filter((a: any) => a.is_correct).length;
  const totalQuestions = (answers ?? []).length;
  const scorePercentage = totalQuestions ? (correctAnswers / totalQuestions) * 100 : 0;
  // Insert into competition_sessions
  await supabase.from('competition_sessions').insert({
    competition_id: competitionId,
    user_id: userId,
    questions_played: totalQuestions,
    correct_answers: correctAnswers,
    score_percentage: scorePercentage,
    start_time: (answers && answers.length > 0) ? answers[0]?.submitted_at : null,
    end_time: (answers && answers.length > 0) ? answers[answers.length-1]?.submitted_at : null,
    created_at: new Date().toISOString(),
  });
  // Calculate rank, XP, prize, trophy
  // For demo, just insert into competition_results
  await supabase.from('competition_results').insert({
    competition_id: competitionId,
    user_id: userId,
    rank: 1, // Should be calculated
    score: correctAnswers,
    xp_awarded: 100, // Should be calculated
    trophy_awarded: true,
    prize_amount: 1000, // Should be calculated
    created_at: new Date().toISOString(),
  });
  return NextResponse.json({ success: true });
}
