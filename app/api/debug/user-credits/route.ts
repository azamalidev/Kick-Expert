import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });

export async function GET(req: Request) {
	// Only allow in non-production for safety
	if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

	try {
		const url = new URL(req.url);
		const userId = url.searchParams.get('userId');
		if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

		const { data, error } = await supabase.from('user_credits').select('*').eq('user_id', userId).single();
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		return NextResponse.json({ ok: true, data });
	} catch (err: any) {
		return NextResponse.json({ error: String(err) }, { status: 500 });
	}
}
