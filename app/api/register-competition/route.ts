import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, competitionId, status, paid_amount } = await req.json();
    if (!userId || !competitionId || !status || typeof paid_amount !== 'number') {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    // Generate a UUID for id
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();

    // Check if already registered
    const { data: existing, error: checkError } = await supabase
      .from('competition_registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('competition_id', competitionId)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 });
    }

    if (existing) {
      // If status differs, update the existing registration (e.g., pending -> confirmed)
      if (existing.status !== status) {
        const { data: updated, error: updateErr } = await supabase
          .from('competition_registrations')
          .update({ status, paid_amount, paid_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .maybeSingle();

        if (updateErr) {
          return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: updated });
      }

      // Same status — return existing registration instead of error to avoid duplicate failures
      return NextResponse.json({ success: true, data: existing });
    }

    // No existing registration — check competition start time and prevent late registrations (<=5 minutes)
    const { data: competition, error: compErr } = await supabase
      .from('competitions')
      .select('start_time')
      .eq('id', competitionId)
      .maybeSingle();

    if (compErr || !competition) {
      return NextResponse.json({ success: false, error: 'Competition not found.' }, { status: 404 });
    }

    const start = new Date(competition.start_time).getTime();
    const now = Date.now();
    const secondsUntilStart = Math.floor((start - now) / 1000);
    if (secondsUntilStart <= 300) {
      return NextResponse.json({ success: false, error: 'Registration closed for this competition.' }, { status: 400 });
    }

    // Insert registration
    const { data, error } = await supabase
      .from("competition_registrations")
      .insert([
        {
          id,
          user_id: userId,
          competition_id: competitionId,
          status,
          paid_amount,
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
