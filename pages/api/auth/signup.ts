import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { transactionalTemplates } from '@/emails/transactionalTemplates';
import sendGridEmail from '@/lib/sendgrid';
import { sendEmail as brevoSendEmail } from '@/lib/email';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase server env variables');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });

  try {
    // Try using Supabase admin SDK first (some environments support it)
    let userId: string | null = null;
    try {
      // @ts-ignore - use admin SDK if available
      const { data: sdkData, error: sdkError } = await (supabaseAdmin.auth as any).admin.createUser({ email, password, email_confirm: false });
      if (sdkError) throw sdkError;
      if (sdkData && (sdkData.user || sdkData)) {
        userId = (sdkData.user && sdkData.user.id) || (sdkData.id || (sdkData.user_id ?? null));
      }
    } catch (sdkErr: any) {
      console.warn('Supabase admin SDK createUser failed or not available, falling back to REST:', sdkErr?.message || sdkErr);
    }

    if (!userId) {
      // Create user via Supabase Admin REST API so Supabase does not send its own confirmation
      const baseUrl = SUPABASE_URL ? SUPABASE_URL.replace(/\/$/, '') : '';
      const headers = new Headers({ 'Content-Type': 'application/json', Authorization: `Bearer ${String(SERVICE_ROLE_KEY)}`, apikey: String(SERVICE_ROLE_KEY) });
      const resp = await fetch(`${baseUrl}/admin/v1/users`, { method: 'POST', headers, body: JSON.stringify({ email, password, email_confirm: false }) });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        // Log detailed info to server console to help debug 403/401
        console.error('Supabase admin REST create user failed', { status: resp.status, statusText: resp.statusText, body: text });
        // If the email already exists, try to resolve the existing user id and continue
        if (resp.status === 403 || (text || '').toLowerCase().includes('already')) {
          try {
            // Try to find user in users table
            const { data: existing, error: existingErr } = await supabaseAdmin.from('users').select('id').eq('email', email).limit(1).maybeSingle();
            if (existing && (existing as any).id) {
              userId = (existing as any).id;
            } else {
              // Fallback: query auth.users via admin API
              const uresp = await fetch(`${baseUrl}/admin/v1/users?email=eq.${encodeURIComponent(email)}`, { method: 'GET', headers });
              if (uresp.ok) {
                const udata = await uresp.json().catch(() => null);
                if (Array.isArray(udata) && udata[0]?.id) userId = udata[0].id;
              }
            }
          } catch (resolveErr) {
            console.error('Error resolving existing user id:', resolveErr);
          }
        }

        if (!userId) {
          if (resp.status === 403) {
            throw new Error('Create user failed: 403 Forbidden from Supabase admin REST. Check that SUPABASE_SERVICE_ROLE_KEY is the service role key, the key is valid, and there are no project-level restrictions (IP/edge) blocking admin REST. Response body: ' + text);
          }
          throw new Error(`Create user failed: ${resp.status} ${text}`);
        }
      }

      const user = await resp.json().catch(() => null);
      userId = user?.id || null;
    }

    if (!userId) throw new Error('Failed to determine created user id');

    // Insert into users/profiles tables if necessary
    await supabaseAdmin.from('profiles').upsert([{ user_id: userId, username: name || null }], { onConflict: 'user_id' });

    // create verification token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 24h
    await supabaseAdmin.from('email_verifications').insert([{ user_id: userId, token, expires_at: expiresAt }]);

  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.kickexpert.com';
  const verifyLink = `${base.replace(/\/$/, '')}/api/auth/verify?token=${token}`;
    const tpl = transactionalTemplates.signupVerification(verifyLink, name);

    if (process.env.SENDGRID_API_KEY) {
      await sendGridEmail({ to: email, subject: tpl.subject, html: tpl.html });
    } else {
      await brevoSendEmail({ to: email, subject: tpl.subject, html: tpl.html });
    }

    return res.status(200).json({ success: true, userId });
  } catch (error) {
    console.error('signup error', error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
