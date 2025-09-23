import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

export async function GET(req: NextRequest) {
  try {
    // Only allow in non-production for safety
    if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });

    const url = new URL(req.url);
    const acct = url.searchParams.get('acct');
    if (!acct) return NextResponse.json({ error: 'acct query required' }, { status: 400 });

    const { data } = await supabaseAdmin.from('user_payment_accounts').select('*').eq('provider_account_id', acct).maybeSingle();
    if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });

    // Try to parse metadata if it's a string
    let metadata = data.metadata;
    try {
      if (typeof metadata === 'string') metadata = JSON.parse(metadata || '{}');
    } catch (e) {
      // ignore parse errors
    }

    return NextResponse.json({ data: { ...data, metadata } });
  } catch (err: any) {
    console.error('debug payment-account error', err);
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 });
  }
}
