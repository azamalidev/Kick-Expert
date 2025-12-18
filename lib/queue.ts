import { Queue, Worker, Job } from 'bullmq';
import { sendEmail } from './email';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Clean and validate Redis URL
function getRedisConnection() {
  let redisUrl = process.env.REDIS_URL || '';
  
  // Remove URL-encoded spaces and CLI flags that shouldn't be in the URL
  redisUrl = redisUrl.replace(/%20/g, ' ').trim();
  
  // Remove CLI flags like --tls -u if present
  redisUrl = redisUrl.replace(/^.*?(?=redis[s]?:\/\/)/i, '');
  
  // Check if Redis is configured
  if (!redisUrl || !redisUrl.startsWith('redis')) {
    console.warn('⚠️  REDIS_URL not configured properly. Email queue will not work.');
    console.warn('   Please set REDIS_URL in your .env.local file');
    console.warn('   Example: REDIS_URL=rediss://default:password@your-redis-host:6379');
    return null;
  }

  console.log('✓ Redis connection configured');
  return { url: redisUrl };
}

const redisConnection = getRedisConnection();

export const emailQueue = redisConnection 
  ? new Queue('emailQueue', { connection: redisConnection })
  : null;

export const emailWorker = redisConnection
  ? new Worker(
      'emailQueue',
      async (job: Job) => {
        const { userId, eventType, template, dynamicData } = job.data;

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('email, name, email_opt_in, email_confirmed')
          .eq('id', userId)
          .single();

        if (!user || !user.email_confirmed) {
          console.log('User not found or not confirmed:', userId);
          return;
        }

        if (eventType === 'promotional' && !user.email_opt_in) {
          console.log('User unsubscribed from promotional:', user.email);
          return;
        }

        const tpl = { subject: template.subject, html: template.html };
        if (dynamicData) {
          tpl.html = tpl.html.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => dynamicData[key] || match);
        }

        await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html });
        console.log('Email sent:', eventType, user.email);
      },
      { connection: redisConnection }
    )
  : null;

export async function enqueueEmail(
  userId: string,
  eventType: string,
  template: any,
  dynamicData?: any
) {
  if (!emailQueue) {
    console.warn('⚠️  Email queue not available. Email will be sent directly instead.');
    // Fallback: Send email directly without queue
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email, name, email_opt_in, email_confirmed')
      .eq('id', userId)
      .single();

    if (!user || !user.email_confirmed) {
      console.log('User not found or not confirmed:', userId);
      return;
    }

    if (eventType === 'promotional' && !user.email_opt_in) {
      console.log('User unsubscribed from promotional:', user.email);
      return;
    }

    const tpl = { subject: template.subject, html: template.html };
    if (dynamicData) {
      tpl.html = tpl.html.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => dynamicData[key] || match);
    }

    await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html });
    console.log('Email sent directly (no queue):', eventType, user.email);
    return;
  }
  
  await emailQueue.add('sendEmail', { userId, eventType, template, dynamicData });
}
