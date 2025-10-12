import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
  // don't throw at import time in Next.js edge; just warn
  console.warn('Supabase service role or URL not configured for /api/admin/broadcasts');
}

export async function POST(req: Request) {
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = authHeader.split(' ')[1];

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Validate user and admin role
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token as string);
  if (userError || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: dbUser } = await supabaseAdmin.from('users').select('id,role').eq('id', userData.user.id).single();
  if (!dbUser || (dbUser as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { title, message, type = 'informational', priority = 'medium', cta_url = null, is_banner = false, expiry_date = null, target = {}, schedule_at = null, send_now = true } = body;
  if (!title || !message) return NextResponse.json({ error: 'Missing title or message' }, { status: 400 });

  try {
    // Normalize incoming type to match DB check constraint (same logic as RPC)
    function normalizeType(t: any) {
      const v = String(t || '').toLowerCase();
      switch (v) {
        case 'informational':
        case 'info':
          return 'Info';
        case 'promotional':
        case 'marketing':
          return 'Marketing';
        case 'support':
          return 'Support';
        case 'wallet':
          return 'Wallet';
        case 'game':
          return 'Game';
        case 'alert':
          return 'Alert';
        case 'referral':
          return 'Referral';
        case 'transactional':
        case 'system':
          return 'System';
        default:
          return (String(t || '') || 'Info').toString().replace(/^./, s => s.toUpperCase());
      }
    }

    const normalizedType = normalizeType(type);

    // Insert broadcast record (if broadcasts table exists)
    let broadcast: any = null;
    if (await tableExists(supabaseAdmin, 'broadcasts')) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('broadcasts')
        .insert([{ created_by: userData.user.id, title, message, type: normalizedType, priority, cta_url, is_banner: !!is_banner, expiry_date: expiry_date ?? null, target, schedule_at }])
        .select()
        .maybeSingle();
      if (insertError) throw insertError;
      broadcast = inserted;

      // Log creation if logs table exists
      if (await tableExists(supabaseAdmin, 'broadcast_logs')) {
        await supabaseAdmin.from('broadcast_logs').insert([{ broadcast_id: (inserted as any)?.id ?? null, action: 'created', actor_id: userData.user.id, meta: { send_now } }]);
      }
    }

    if (send_now) {
      // Try the JSON wrapper RPC first (preferred). If it doesn't exist or errors,
      // fall back to a safe server-side implementation that inserts into
      // `public.notifications` in chunks. This allows the admin UI to work
      // immediately without requiring DB migrations.
  const payload = { type: normalizedType, priority, title, message, is_banner: Boolean(is_banner), cta_url: cta_url ?? null, expiry_date: expiry_date ?? null };

      let rpcCalled = false;
      try {
        if (await functionExists(supabaseAdmin, 'broadcast_notification_from_json')) {
          const rpcRes = await supabaseAdmin.rpc('broadcast_notification_from_json', { p_payload: payload });
          if (rpcRes.error) throw rpcRes.error;
          rpcCalled = true;
        }
      } catch (rpcErr: any) {
        console.warn('broadcast RPC failed or missing, falling back to server-side inserts', rpcErr?.message || rpcErr);
      }

      if (!rpcCalled) {
        // Fallback: select recipients and insert notifications in chunks.
        try {
          const isPromotional = String(type || '').toLowerCase().includes('marketing') || String(type || '').toLowerCase().includes('promo');

          // Build base query: if promotional, only users with marketing_opt_in = true
          let profilesQuery = supabaseAdmin.from('profiles').select('user_id');
          if (isPromotional) profilesQuery = supabaseAdmin.from('profiles').select('user_id').eq('marketing_opt_in', true);

          const { data: profileRows, error: profileErr } = await profilesQuery;
          if (profileErr) throw profileErr;

          const userIds: string[] = (profileRows || []).map((r: any) => r.user_id).filter(Boolean);

          const chunkSize = 500; // safe chunk to avoid very large single inserts
          for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk = userIds.slice(i, i + chunkSize);
              const rows = chunk.map(uid => ({
                user_id: uid,
                type: normalizedType,
                priority: priority || 'medium',
                title,
                message,
                is_banner: !!is_banner,
                cta_url: cta_url ?? null,
                expiry_date: expiry_date ?? null,
                created_at: new Date().toISOString()
              }));

            const { error: insertErr } = await supabaseAdmin.from('notifications').insert(rows);
            if (insertErr) {
              console.error('Failed inserting notification chunk', insertErr);
              // continue with next chunk rather than aborting all
            }
          }
        } catch (fallbackErr: any) {
          console.error('Fallback broadcast error', fallbackErr);
          return NextResponse.json({ error: fallbackErr.message || 'Broadcast failed' }, { status: 500 });
        }
      }

      // mark broadcast as sent when either path succeeded
      if (broadcast && await tableExists(supabaseAdmin, 'broadcasts')) {
        await supabaseAdmin.from('broadcasts').update({ status: 'sent' }).eq('id', (broadcast as any).id);
        if (await tableExists(supabaseAdmin, 'broadcast_logs')) {
          await supabaseAdmin.from('broadcast_logs').insert([{ broadcast_id: (broadcast as any).id, action: 'sent', actor_id: userData.user.id }]);
        }
      }
    }

    return NextResponse.json({ ok: true, broadcast: broadcast ?? null }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = authHeader.split(' ')[1];

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token as string);
  if (userError || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: dbUser } = await supabaseAdmin.from('users').select('id,role').eq('id', userData.user.id).single();
  if (!dbUser || (dbUser as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // If RPC exists, call it; otherwise try to list broadcasts
  try {
    if (await functionExists(supabaseAdmin, 'get_broadcasts_with_metrics')) {
      const { data } = await supabaseAdmin.rpc('get_broadcasts_with_metrics');
      return NextResponse.json({ broadcasts: data || [] }, { status: 200 });
    }

    if (await tableExists(supabaseAdmin, 'broadcasts')) {
      const { data } = await supabaseAdmin.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(100);
      return NextResponse.json({ broadcasts: data || [] }, { status: 200 });
    }

    return NextResponse.json({ broadcasts: [] }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

async function tableExists(supabaseAdmin: any, tableName: string) {
  try {
    const { data } = await supabaseAdmin.rpc('pg_table_exists', { p_table_name: tableName }).limit(1).maybeSingle();
    return !!data;
  } catch (_) {
    // Fallback: try selecting 0 rows
    try {
      const { error } = await supabaseAdmin.from(tableName).select('1').limit(1);
      return !error;
    } catch (_) {
      return false;
    }
  }
}

async function functionExists(supabaseAdmin: any, fnName: string) {
  try {
    const { data } = await supabaseAdmin.rpc('pg_function_exists', { p_function_name: fnName }).limit(1).maybeSingle();
    return !!data;
  } catch (_) {
    return false;
  }
}

