import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { enqueueEmail } from '@/lib/queue';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Mock templates - replace with actual
const weeklyTemplate = { subject: 'Weekly Football Schedule', html: 'Hi {{name}}, here is your weekly schedule...' };
const reminderTemplate = { subject: 'Daily Reminder', html: 'Hi {{name}}, don\'t forget to check your matches...' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405);

  try {
    // Get all confirmed users with email_opt_in
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('email_confirmed', true)
      .eq('email_opt_in', true);

    if (!users) return res.status(200).json({ enqueued: 0 });

    for (const user of users) {
      await enqueueEmail(user.id, 'promotional', weeklyTemplate, { name: user.name });
    }

    console.log('Enqueued weekly emails for', users.length, 'users');
    return res.status(200).json({ enqueued: users.length });
  } catch (error) {
    console.error('Weekly cron error', error);
    return res.status(500);
  }
}