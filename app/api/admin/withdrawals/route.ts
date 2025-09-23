import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) console.warn('Supabase admin withdrawals not configured');

const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // check admin role in users table
    const { data: dbUser } = await supabaseAdmin.from('users').select('id,role').eq('id', user.id).single();
    if (!dbUser || (dbUser as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // list pending withdrawals
    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })
      .limit(200);

    if (error) throw error;
    return NextResponse.json({ withdrawals: data || [] });
  } catch (err) {
    console.error('Error listing admin withdrawals', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
