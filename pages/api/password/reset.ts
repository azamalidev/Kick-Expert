import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase server env variables');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'token and password required' });

  try {
    // lookup token
    const { data: tokenRow, error: tokenErr } = await supabaseAdmin.from('password_resets').select('id,user_id,expires_at,used').eq('token', token).limit(1).maybeSingle();
    if (tokenErr) throw tokenErr;
    if (!tokenRow) return res.status(400).json({ message: 'Invalid token' });
    if ((tokenRow as any).used) return res.status(400).json({ message: 'Token already used' });
    if (new Date((tokenRow as any).expires_at) < new Date()) return res.status(400).json({ message: 'Token expired' });

    const userId = (tokenRow as any).user_id;

    // Get user email from users table
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .limit(1)
      .maybeSingle();
    
    if (userErr || !userRow) {
      console.error('User not found in users table:', userId, userErr);
      return res.status(404).json({ 
        success: false, 
        message: 'User account not found.' 
      });
    }

    const userEmail = (userRow as any).email;
    console.log('Found user email:', userEmail);

    // Get auth user by email
    const { data: authUsers, error: authListErr } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authListErr) {
      console.error('Error listing auth users:', authListErr);
      throw authListErr;
    }

    const authUser = authUsers.users.find(u => u.email === userEmail);
    
    if (!authUser) {
      console.error('Auth user not found for email:', userEmail);
      return res.status(404).json({ 
        success: false, 
        message: 'User account not found in authentication system. The account may have been deleted.' 
      });
    }

    const authUserId = authUser.id;
    console.log('Found auth user ID:', authUserId, 'for email:', userEmail);

    // Use Supabase admin API to update password
    let updated = false;
    try {
      const { data: updatedUser, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(authUserId, { password });
      if (updateErr) {
        console.error('Password update error:', updateErr);
        throw updateErr;
      }
      if (updatedUser) {
        console.log('Password updated successfully via SDK for user:', userEmail);
        updated = true;
      }
    } catch (sdkErr: any) {
      console.warn('Supabase admin SDK update failed, falling back to REST admin endpoint:', sdkErr?.message || sdkErr);
      // Fallback: call Supabase Admin REST API directly using service role key
      try {
        const baseUrl = SUPABASE_URL ? SUPABASE_URL.replace(/\/$/, '') : '';
        const restHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        };
        if (SERVICE_ROLE_KEY) {
          restHeaders['apikey'] = SERVICE_ROLE_KEY;
        }
        const resp = await fetch(`${baseUrl}/auth/v1/admin/users/${authUserId}`, { 
          method: 'PUT', 
          headers: restHeaders, 
          body: JSON.stringify({ password }) 
        });

        if (!resp.ok) {
          const text = await resp.text();
          console.error('REST API update failed:', resp.status, text);
          throw new Error(`Admin REST update failed: ${resp.status} ${text}`);
        }

        console.log('Password updated successfully via REST API for user:', userEmail);
        updated = true;
      } catch (restErr) {
        console.error('Supabase admin REST update failed:', restErr);
        throw restErr;
      }
    }

    // mark token used
    await supabaseAdmin.from('password_resets').update({ used: true }).eq('id', (tokenRow as any).id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('password/reset error', error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
