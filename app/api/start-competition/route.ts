import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const { competitionId } = await req.json();
  // Set competition status to 'live'
  await supabase.from('competitions').update({ status: 'live' }).eq('id', competitionId);
  // Fetch competition_questions
  const { data: questions } = await supabase.from('competition_questions').select('*').eq('competition_id', competitionId);
  return NextResponse.json({ questions });
}
