import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error('Missing Supabase server env variables');

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const handleForm = (req: NextApiRequest) => new Promise<{ fields: any; files: any }>((resolve, reject) => {
  const form = formidable({ multiples: false });
  form.parse(req as any, (err, fields, files) => {
    if (err) return reject(err);
    resolve({ fields, files });
  });
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    const { fields, files } = await handleForm(req);
    const { email, username, nationality } = fields;
    if (!email) return res.status(400).json({ error: 'email required' });

    const { data: userRow } = await supabaseAdmin.from('users').select('id').eq('email', email).limit(1).maybeSingle();
    if (!userRow) return res.status(404).json({ error: 'user not found' });
    const userId = (userRow as any).id;

    let avatar_url = null;
    if (files && files.avatar) {
      // Handle formidable v3 file structure
      const file = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
      if (file && file.filepath) {
        const buffer = fs.readFileSync(file.filepath);
        const ext = (file.originalFilename || file.newFilename || 'png').split('.').pop();
        const filePath = `${userId}.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage.from('profileimages').upload(filePath, buffer, { upsert: true });
        if (upErr) console.error('storage upload error', upErr);
        const { data: urlData } = supabaseAdmin.storage.from('profileimages').getPublicUrl(filePath);
        avatar_url = (urlData as any).publicUrl;
      }
    }

    const profilePayload: any = {
      user_id: userId,
      username: username || null,
      nationality: nationality || null,
      avatar_url: avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabaseAdmin.from('profiles').upsert([profilePayload], { onConflict: 'user_id' });
    if (upsertError) console.error('profile upsert error', upsertError);

    // mark users.email_confirmed true
    await supabaseAdmin.from('users').update({ email_confirmed: true }).eq('id', userId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('complete profile error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
