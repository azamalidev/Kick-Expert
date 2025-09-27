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
		const method = body.method || 'stripe'; // 'stripe' or 'paypal'
		const paypalEmail = body.paypal_email || null;

		if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
		if (amount < minAmount) return NextResponse.json({ error: `Minimum withdrawal is $${minAmount}` }, { status: 400 });
		if (method === 'paypal' && !paypalEmail) return NextResponse.json({ error: 'PayPal email is required for PayPal withdrawals' }, { status: 400 });

		const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		const token = authHeader.split(' ')[1];

		// Verify user with service role client
		const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
		if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

				// For PayPal: prefer server-side saved paypal_email. If client supplied paypal_email, validate and upsert it.
				let providerAccount: string | null = null;
				if (method === 'paypal') {
					const emailFromClient = (paypalEmail || '').toString().trim() || null;

					// basic email regex (server-side validation)
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

					if (emailFromClient && !emailRegex.test(emailFromClient)) {
						return NextResponse.json({ error: 'Invalid PayPal email format' }, { status: 400 });
					}

					try {
									if (emailFromClient) {
										// If user already has a payment account row, update only PayPal fields so we don't overwrite provider/provider_account_id
										const { data: existing, error: existingErr } = await supabaseAdmin.from('user_payment_accounts').select('*').eq('user_id', user.id).maybeSingle();
										if (existingErr) {
											console.error('Failed to read existing user_payment_accounts', existingErr);
											return NextResponse.json({ error: 'Failed to save PayPal email' }, { status: 500 });
										}

										if (existing) {
											// Update only paypal_email and metadata; do not change provider or provider_account_id
											const newMetadata = Object.assign({}, existing.metadata || {}, { paypal_email: emailFromClient });
											const { error: updErr } = await supabaseAdmin.from('user_payment_accounts').update({ paypal_email: emailFromClient, metadata: newMetadata, updated_at: new Date().toISOString() }).eq('id', (existing as any).id);
											if (updErr) {
												console.error('Failed to update user_payment_accounts paypal_email', updErr);
												return NextResponse.json({ error: 'Failed to save PayPal email' }, { status: 500 });
											}
										} else {
											// Insert a new payment account row for PayPal only
											const { error: insErr } = await supabaseAdmin.from('user_payment_accounts').insert([{ user_id: user.id, provider: 'paypal', paypal_email: emailFromClient, metadata: { paypal_email: emailFromClient }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
											if (insErr) {
												console.error('Failed to insert user_payment_accounts for paypal_email', insErr);
												return NextResponse.json({ error: 'Failed to save PayPal email' }, { status: 500 });
											}
										}
										providerAccount = emailFromClient;
									} else {
							// read existing paypal_email for the user
							const { data: acct } = await supabaseAdmin.from('user_payment_accounts').select('paypal_email, provider_account_id, metadata').eq('user_id', user.id).maybeSingle();
							const foundEmail = acct?.paypal_email || acct?.provider_account_id || acct?.metadata?.paypal_email || acct?.metadata?.email || null;
							if (!foundEmail) return NextResponse.json({ error: 'PayPal email not found. Please provide your PayPal email.' }, { status: 400 });
							providerAccount = foundEmail;
						}
					} catch (e) {
						console.error('Error handling PayPal email upsert/read', e);
						return NextResponse.json({ error: 'Failed to process PayPal email' }, { status: 500 });
					}
				}

		// Start transactional safe creation: lock user_credits row, verify winnings, deduct and insert withdrawal + transaction
		// Supabase JS doesn't expose explicit BEGIN/COMMIT easily; use Postgres function if available, otherwise emulate with single rpc

		// Try calling a DB function 'create_withdrawal_request' if it exists
		try {
			const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('create_withdrawal_request', { p_user_id: user.id, p_amount: amount, p_min_amount: minAmount, p_provider: method, p_provider_account: providerAccount }).limit(1).maybeSingle();
			if (rpcErr) throw rpcErr;

			const rpcAny = rpcData as any;
			return NextResponse.json({ ok: true, withdrawal_id: rpcAny?.withdrawal_id ?? null });
		} catch (rpcErr) {
			// Fallback: perform conditional update then insert using the JS client.
			try {
				// Attempt to decrement winnings_credits only if sufficient balance exists
				// Perform a safe compare-and-swap update to avoid race conditions.
				let attempts = 0;
				let updatedRow: any = null;
				while (attempts < 3) {
					attempts += 1;
					const { data: creditRow, error: selErr } = await supabaseAdmin
						.from('user_credits')
						.select('winnings_credits')
						.eq('user_id', user.id)
						.maybeSingle();

					if (selErr) {
						console.error('Error selecting user_credits', selErr);
						return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 });
					}

					if (!creditRow || typeof creditRow.winnings_credits !== 'number' || creditRow.winnings_credits < amount) {
						return NextResponse.json({ error: 'Insufficient winnings credits' }, { status: 400 });
					}

					const newVal = creditRow.winnings_credits - amount;

					const { data: updData, error: updErr } = await supabaseAdmin
						.from('user_credits')
						.update({ winnings_credits: newVal, updated_at: new Date().toISOString() })
						.eq('user_id', user.id)
						.eq('winnings_credits', creditRow.winnings_credits)
						.select()
						.maybeSingle();

					if (updErr) {
						console.error('Error updating user_credits', updErr);
						return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 });
					}

					if (updData) {
						updatedRow = updData;
						break; // success
					}

					// if no rows updated, another concurrent request changed the balance; retry
				}

				if (!updatedRow) {
					return NextResponse.json({ error: 'Could not reserve credits, please try again' }, { status: 409 });
				}

				// Insert withdrawal record
				const { data: insData, error: insErr } = await supabaseAdmin.from('withdrawals').insert([{ user_id: user.id, amount, currency: 'USD', status: 'pending', provider: method, provider_account: providerAccount, requested_at: new Date().toISOString(), updated_at: new Date().toISOString() }]).select('id').maybeSingle();
				if (insErr || !insData) {
					console.error('Failed inserting withdrawal', insErr);
					return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 });
				}

				return NextResponse.json({ ok: true, withdrawal_id: insData.id });
			} catch (e) {
				console.error('Fallback JS path failed', e);
				return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 });
			}
		}
	} catch (err: any) {
		console.error('Error in POST /api/withdrawals', err);
		const message = err?.message || 'Internal server error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

