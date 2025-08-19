import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competitionId = searchParams.get('competitionId');
  const { data: leaderboard } = await supabase.from('competition_results').select('*').eq('competition_id', competitionId).order('rank', { ascending: true });
  return NextResponse.json({ leaderboard });
}
