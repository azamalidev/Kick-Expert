import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
	console.warn('Supabase not configured for withdrawals route');
}

const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

// GET: list current user's withdrawals
export async function GET(req: NextRequest) {
	try {
		const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		const token = authHeader.split(' ')[1];

		const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
		if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { data, error } = await supabaseAdmin
			.from('withdrawals')
			.select('*')
			.eq('user_id', user.id)
			.order('requested_at', { ascending: false })
			.limit(100);

		if (error) throw error;
		return NextResponse.json({ withdrawals: data || [] });
	} catch (err) {
		console.error('Error in GET /api/withdrawals', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// POST: create a withdrawal request (atomic)
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const amount = Number(body.amount || 0);
		const minAmount = Number(body.minAmount || 20);

		if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
		if (amount < minAmount) return NextResponse.json({ error: `Minimum withdrawal is $${minAmount}` }, { status: 400 });

		const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		const token = authHeader.split(' ')[1];

		// Verify user with service role client
		const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
		if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		// Start transactional safe creation: lock user_credits row, verify winnings, deduct and insert withdrawal + transaction
		// Supabase JS doesn't expose explicit BEGIN/COMMIT easily; use Postgres function if available, otherwise emulate with single rpc

		// Try calling a DB function 'create_withdrawal_request' if it exists
		try {
			const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('create_withdrawal_request', { p_user_id: user.id, p_amount: amount, p_min_amount: minAmount }).limit(1).maybeSingle();
			if (rpcErr) throw rpcErr;

			const rpcAny = rpcData as any;
			return NextResponse.json({ ok: true, withdrawal_id: rpcAny?.withdrawal_id ?? null });
		} catch (rpcErr) {
			// Fallback: perform safe update with locking using a single update returning clause
			// 1) select current winnings_credits FOR UPDATE via a direct SQL RPC if available
			const rawSql = `
				with u as (
					select winnings_credits from public.user_credits where user_id = $1 for update
				), upd as (
					update public.user_credits set winnings_credits = winnings_credits - $2, updated_at = now()
					where user_id = $1 and (select winnings_credits from u) >= $2
					returning *
				), ins_withdraw as (
					insert into public.withdrawals (user_id, amount, currency, status, requested_at, updated_at)
					select $1, $2, 'USD', 'pending', now(), now()
					where exists (select 1 from upd)
					returning id
				) select (select id from ins_withdraw) as withdrawal_id;
			`;

			const { data: sqlData, error: sqlErr } = await supabaseAdmin.rpc('pg_exec', { p_sql: rawSql, p_params: [user.id, amount] }).maybeSingle();
			if (sqlErr) {
				console.error('Fallback SQL exec failed', sqlErr);
				return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 });
			}

			// Note: depending on your Supabase DB helpers, rpc('pg_exec') may not exist — in that case the preferred path is to add the 'create_withdrawal_request' function in DB.
			return NextResponse.json({ ok: true, withdrawal: sqlData || null });
		}
	} catch (err: any) {
		console.error('Error in POST /api/withdrawals', err);
		const message = err?.message || 'Internal server error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

