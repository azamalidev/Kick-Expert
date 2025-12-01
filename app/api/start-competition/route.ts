import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const { competitionId, userId } = await req.json();
  // Set competition status to 'running' so triggers and checks treat it as active
  await supabase.from('competitions').update({ status: 'running' }).eq('id', competitionId);

  // Mark confirmed registrations as entered so participation tracking begins
  try {
    // 1. Bulk update for all eligible users
    const { data: updateResult, error: updateError } = await supabase
      .from('competition_registrations')
      .update({
        participation_status: 'entered',
        status: 'confirmed', // ✅ Fixed: 'active' is invalid, must be 'confirmed'
        entered_at: new Date().toISOString()
      })
      .eq('competition_id', competitionId)
      .or('status.eq.confirmed,status.eq.registered'); // Accept both confirmed and registered statuses

    if (updateError) {
      console.error('Failed to mark registrations as entered:', updateError);
    } else {
      console.log(`✅ Updated registrations to confirmed status`);
    }

    // 2. Force update for specific user if provided (Critical fallback)
    if (userId) {
      console.log(`👤 Forcing activation for user: ${userId}`);
      const { error: userUpdateError } = await supabase
        .from('competition_registrations')
        .update({
          participation_status: 'entered',
          status: 'confirmed', // ✅ Fixed: 'active' is invalid, must be 'confirmed'
          entered_at: new Date().toISOString()
        })
        .eq('competition_id', competitionId)
        .eq('user_id', userId);

      if (userUpdateError) {
        console.error('Failed to force activate user:', userUpdateError);
      } else {
        console.log(`✅ User ${userId} forced to active status`);
      }
    }
  } catch (err) {
    console.error('Failed to mark registrations as entered:', err);
  }

  // Fetch competition_questions (only active ones with status = true)
  const { data: compQs, error: compError } = await supabase
    .from('competition_questions')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('status', true); // Only fetch enabled questions

  if (compError) {
    console.error('Error fetching competition_questions:', compError);
    return NextResponse.json({ questions: [] });
  }

  const questions = (compQs || []) as any[];

  // Mark questions as used (update last_used_at timestamp)
  for (const q of questions) {
    try {
      await supabase.rpc('mark_question_as_used', {
        p_competition_question_id: q.id
      });
    } catch (err) {
      console.error('Failed to mark question as used:', err);
    }
  }

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
