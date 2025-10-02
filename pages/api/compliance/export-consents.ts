import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405);

  const { userId, email } = req.query;
  if (!userId && !email) return res.status(400).json({ error: 'userId or email required' });

  try {
    let query = supabaseAdmin
      .from('email_consents')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      query = query.eq('email', email as string);
    }

    const { data: consents, error } = await query;
    if (error) throw error;

    // Also get audit logs
    let auditQuery = supabaseAdmin
      .from('email_events_audit')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      // For audit, need to get email from user
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      if (user) {
        auditQuery = auditQuery.eq('email', user.email);
      }
    } else if (email) {
      auditQuery = auditQuery.eq('email', email as string);
    }

    const { data: audits } = await auditQuery;

    // Format for export
    const exportData = {
      consents,
      audits,
      exported_at: new Date().toISOString(),
      purpose: 'GDPR/CCPA compliance export',
    };

    // Return as JSON for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=consent-export-${userId || email}.json`);
    return res.status(200).json(exportData);
  } catch (error) {
    console.error('Export error', error);
    return res.status(500);
  }
}