import { Queue, Worker, Job } from 'bullmq';
import { sendEmail } from './email';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export const emailQueue = new Queue('emailQueue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export const emailWorker = new Worker('emailQueue', async (job: Job) => {
  const { userId, eventType, template, dynamicData } = job.data;

  // Resolve user
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email, name, email_opt_in, email_confirmed')
    .eq('id', userId)
    .single();

  if (!user || !user.email_confirmed) {
    console.log('User not found or not confirmed:', userId);
    return;
  }

  // Check unsubscribed for promotional
  if (eventType === 'promotional' && !user.email_opt_in) {
    console.log('User unsubscribed from promotional:', user.email);
    return;
  }

  // Send email
  const tpl = { subject: template.subject, html: template.html };
  if (dynamicData) {
    // Apply dynamic data
    tpl.html = tpl.html.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => dynamicData[key] || match);
  }

  await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html });
  console.log('Email sent:', eventType, user.email);
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export async function enqueueEmail(userId: string, eventType: string, template: any, dynamicData?: any) {
  await emailQueue.add('sendEmail', { userId, eventType, template, dynamicData });
}