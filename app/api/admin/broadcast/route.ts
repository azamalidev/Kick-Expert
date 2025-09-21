import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This API route expects a JSON body: { type, priority, title, message, cta_url?, expiry_date? }
// It expects an Authorization: Bearer <access_token> header (admin session token).

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(req: Request) {
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // Expect a bearer token from the admin's session
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  // Parse body
  let data: any;
  try {
    data = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, priority, title, message, cta_url, expiry_date, is_banner } = data;
  if (!type || !priority || !title || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // Validate token and get user
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token as string);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const user = userData.user;

    // Check user role in `users` table (the app queries `users` for role elsewhere)
    const { data: dbUser, error: dbUserError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (dbUserError || !dbUser) {
      return NextResponse.json({ error: 'Unauthorized: user not found' }, { status: 401 });
    }

    if (dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    // Call the JSON wrapper RPC to avoid parameter ordering/schema issues
    const payload = { type, priority, title, message, is_banner: Boolean(is_banner) ?? false, cta_url: cta_url ?? null, expiry_date: expiry_date ?? null };
    const { error } = await supabaseAdmin.rpc('broadcast_notification_from_json', { p_payload: payload });

    if (error) {
      console.error('broadcast error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error('unexpected', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
