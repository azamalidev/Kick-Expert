import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error('Missing Supabase server env variables');

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query;
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email required' });

  try {
    const { data } = await supabaseAdmin.from('users').select('id, name, email').eq('email', email).limit(1).maybeSingle();
    if (!data) return res.status(404).json({ error: 'not found' });
    return res.status(200).json({ name: (data as any).name || null, email: (data as any).email || null });
  } catch (err) {
    console.error('prefill error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
