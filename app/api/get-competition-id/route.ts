import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Map keys to actual competition names
const keyToName: Record<string, string> = {
  starter: "Starter League",
  pro: "Pro League",
  elite: "Elite League",
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing competition key or id." }, { status: 400 });
    }

    // If key matches a known name, use name lookup
    if (keyToName[key]) {
      const name = keyToName[key];
      const { data, error } = await supabase
        .from("competitions")
        .select("id, entry_fee")
        .eq("name", name)
        .single();
      if (error || !data) {
        return NextResponse.json({ error: "Competition not found." }, { status: 404 });
      }
      return NextResponse.json({ id: data.id, entry_fee: data.entry_fee });
    }

    // Otherwise, try to fetch by id (UUID)
    const { data, error } = await supabase
      .from("competitions")
      .select("id, entry_fee")
      .eq("id", key)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Competition not found." }, { status: 404 });
    }
    return NextResponse.json({ id: data.id, entry_fee: data.entry_fee });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
