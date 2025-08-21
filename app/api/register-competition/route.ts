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
      .from("competition_registrations")
      .select("id")
      .eq("user_id", userId)
      .eq("competition_id", competitionId)
      .single();
    if (existing) {
      return NextResponse.json({ success: false, error: "Already registered." }, { status: 409 });
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
