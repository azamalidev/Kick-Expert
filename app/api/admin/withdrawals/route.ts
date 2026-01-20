import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) console.warn('Supabase admin withdrawals not configured');

const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

export async function GET(req: Request) {
  try {
    // Optional auth check - if token provided, verify it
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
      
      if (userErr || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check admin role in users table
      const { data: dbUser } = await supabaseAdmin.from('users').select('id,role').eq('id', user.id).single();
      if (!dbUser || (dbUser as any).role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    // If no auth header, proceed anyway (for development/testing)

    // List pending withdrawals
    const { data: withdrawals, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })
      .limit(200);

    if (error) throw error;

    const rows = (withdrawals || []) as any[];

    // Gather related ids
    const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
    const withdrawalIds = Array.from(new Set(rows.map(r => r.id).filter(Boolean)));

    // Fetch user payment accounts (provider account / kyc metadata)
    let paymentAccounts: any[] = [];
    if (userIds.length) {
      const { data: payData, error: payErr } = await supabaseAdmin
        .from('user_payment_accounts')
        .select('user_id, provider_account_id, kyc_status, metadata')
        .in('user_id', userIds);
      if (payErr) console.warn('Failed to fetch payment accounts', payErr);
      paymentAccounts = payData || [];
    }

    // Fetch provider payouts keyed by withdrawal
    let providerPayouts: any[] = [];
    if (withdrawalIds.length) {
      const { data: ppData, error: ppErr } = await supabaseAdmin
        .from('provider_payouts')
        .select('withdrawal_id, provider_payout_id, response')
        .in('withdrawal_id', withdrawalIds);
      if (ppErr) console.warn('Failed to fetch provider payouts', ppErr);
      providerPayouts = ppData || [];
    }

    // Merge related data into each withdrawal object for frontend
    const merged = rows.map(r => {
      const pa = paymentAccounts.find(p => p.user_id === r.user_id) || null;
      const provider_response = pa?.metadata || (providerPayouts.find(p => p.withdrawal_id === r.id)?.response ?? null);
      const provider_payout = providerPayouts.find(p => p.withdrawal_id === r.id) || null;

      return {
        ...r,
        provider_account: pa?.provider_account_id ?? null,
        provider_kyc_status: pa?.kyc_status ?? null,
        provider_response,
        provider_payout_id: provider_payout?.provider_payout_id ?? null
      };
    });

    return NextResponse.json({ withdrawals: merged });
  } catch (err) {
    console.error('Error listing admin withdrawals', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
