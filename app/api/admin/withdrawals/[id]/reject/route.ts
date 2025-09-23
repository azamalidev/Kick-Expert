import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // check admin role
    const { data: dbUser } = await supabaseAdmin.from('users').select('id,role').eq('id', user.id).single();
    if (!dbUser || (dbUser as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Extract withdrawal id from URL path
    let withdrawalId: string | undefined = undefined;
    try {
      const url = new URL(req.url);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length >= 2) withdrawalId = segments[segments.length - 2];
    } catch (e) {
      console.warn('Could not parse request URL for withdrawal id', e);
    }
    if (!withdrawalId) return NextResponse.json({ error: 'Missing withdrawal id' }, { status: 400 });
    const body = await req.json();
    const note = body?.note ?? null;

    // fetch withdrawal
    const { data: w, error: wErr } = await supabaseAdmin.from('withdrawals').select('*').eq('id', withdrawalId).single();
    if (wErr || !w) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    if (w.status !== 'pending') return NextResponse.json({ error: 'Withdrawal not in pending state' }, { status: 400 });

    // refund winnings back to user_credits by reading current value then updating
    const { data: uc, error: ucErr } = await supabaseAdmin.from('user_credits').select('winnings_credits').eq('user_id', w.user_id).single();
    if (ucErr || !uc) {
      // If user credits row missing, create it with refunded amount
      await supabaseAdmin.from('user_credits').insert([{ user_id: w.user_id, winnings_credits: Number(w.amount), purchased_credits: 0, referral_credits: 0 }]);
    } else {
      const newVal = Number(uc.winnings_credits || 0) + Number(w.amount);
      await supabaseAdmin.from('user_credits').update({ winnings_credits: newVal, updated_at: new Date().toISOString() }).eq('user_id', w.user_id);
    }

    // mark withdrawal rejected
    await supabaseAdmin.from('withdrawals').update({ status: 'rejected', admin_id: user.id, updated_at: new Date().toISOString() }).eq('id', withdrawalId);

    // audit log
    await supabaseAdmin.from('withdrawal_audit_logs').insert([{ withdrawal_id: withdrawalId, admin_id: user.id, action: 'rejected', note }]);

    return NextResponse.json({ ok: true, refunded: true });
  } catch (err) {
    console.error('Error rejecting withdrawal', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
