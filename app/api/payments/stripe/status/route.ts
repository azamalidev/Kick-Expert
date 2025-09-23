import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: acct } = await supabaseAdmin.from('user_payment_accounts').select('*').eq('user_id', user.id).maybeSingle();
    if (!acct) return NextResponse.json({ exists: false, kyc_status: 'unverified' });
    return NextResponse.json({ exists: true, kyc_status: acct.kyc_status, provider_account_id: acct.provider_account_id, onboarding_url: acct.onboarding_url });
  } catch (err) {
    console.error('Payment status error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
