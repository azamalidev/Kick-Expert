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
    console.warn('⚠️  REDIS_URL not configured. Emails will be sent directly (no queue).');
    return null;
  }

  console.log('✓ Redis connection configured');
  return { 
    url: redisUrl,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 3) {
        console.error('❌ Redis connection failed after 3 retries. Disabling queue.');
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000);
    },
    enableReadyCheck: false,
    lazyConnect: true,
  };
}

const redisConnection = getRedisConnection();

let emailQueue: Queue | null = null;
let emailWorker: Worker | null = null;

try {
  if (redisConnection) {
    emailQueue = new Queue('emailQueue', { connection: redisConnection });
    
    emailWorker = new Worker(
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
    );

    // Handle worker errors gracefully
    emailWorker.on('error', (error) => {
      console.error('❌ Email worker error:', error.message);
    });

    emailWorker.on('failed', (job, error) => {
      console.error(`❌ Job ${job?.id} failed:`, error.message);
    });
  }
} catch (error: any) {
  console.error('❌ Failed to initialize Redis queue:', error.message);
  console.warn('⚠️  Falling back to direct email sending');
  emailQueue = null;
  emailWorker = null;
}

export { emailQueue, emailWorker };

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
