import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { transactionalTemplates } from '@/emails/transactionalTemplates';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@kickexpert.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'KickExpert';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405);

  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET || 'local-dev';

  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting weekly schedule cron job...');

    // Calculate next Saturday (competitions are scheduled for Saturdays)
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay()) % 7; // 6 = Saturday
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday)); // Next Saturday
    nextSaturday.setHours(0, 0, 0, 0); // Start of day

    const weekStartDate = nextSaturday.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('📅 Checking competitions for next Saturday:', weekStartDate);

    // Check if we've already sent notifications for this week
    const { data: existingNotification, error: notificationCheckError } = await supabaseAdmin
      .from('weekly_schedule_notifications')
      .select('id')
      .eq('week_start_date', weekStartDate)
      .single();

    if (notificationCheckError && notificationCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing notifications:', notificationCheckError);
      return res.status(500).json({ error: 'Failed to check existing notifications' });
    }

    if (existingNotification) {
      console.log('✅ Weekly schedule already sent for this week');
      return res.status(200).json({
        message: 'Weekly schedule already sent for this week',
        weekDate: weekStartDate,
        alreadySent: true
      });
    }

    // Find all competitions scheduled for next Saturday
    const startOfSaturday = new Date(nextSaturday);
    const endOfSaturday = new Date(nextSaturday);
    endOfSaturday.setHours(23, 59, 59, 999);

    const { data: competitions, error: competitionsError } = await supabaseAdmin
      .from('competitions')
      .select('id, name, start_time, entry_fee, prize_pool')
      .gte('start_time', startOfSaturday.toISOString())
      .lte('start_time', endOfSaturday.toISOString())
      .eq('status', 'upcoming')
      .order('start_time', { ascending: true });

    if (competitionsError) {
      console.error('Error fetching competitions:', competitionsError);
      return res.status(500).json({ error: 'Failed to fetch competitions' });
    }

    if (!competitions || competitions.length === 0) {
      console.log('⚠️ No competitions scheduled for next Saturday');
      return res.status(200).json({
        message: 'No competitions scheduled for next Saturday',
        weekDate: weekStartDate,
        competitionsFound: 0
      });
    }

    console.log(`📋 Found ${competitions.length} competition(s) for next Saturday`);

    // Check if we have all 3 competition types: Starter League, Pro League, Elite League
    const competitionNames = competitions.map(c => c.name);
    const hasStarter = competitionNames.some(name => name.includes('Starter League'));
    const hasPro = competitionNames.some(name => name.includes('Pro League'));
    const hasElite = competitionNames.some(name => name.includes('Elite League'));

    if (!hasStarter || !hasPro || !hasElite) {
      console.log('⏳ Not all competition types scheduled yet. Waiting for complete schedule...');
      console.log(`   - Starter League: ${hasStarter ? '✅' : '❌'}`);
      console.log(`   - Pro League: ${hasPro ? '✅' : '❌'}`);
      console.log(`   - Elite League: ${hasElite ? '✅' : '❌'}`);

      return res.status(200).json({
        message: 'Not all competition types scheduled yet',
        weekDate: weekStartDate,
        competitionsFound: competitions.length,
        waitingForComplete: true,
        starter: hasStarter,
        pro: hasPro,
        elite: hasElite
      });
    }

    console.log('🎉 All 3 competition types scheduled! Sending weekly schedule emails...');

    // Get all confirmed users with email_opt_in
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('email_confirmed', true)
      .eq('email_opt_in', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    if (!users || users.length === 0) {
      console.log('⚠️ No users to notify');
      return res.status(200).json({
        message: 'No users to notify',
        weekDate: weekStartDate,
        competitionsFound: competitions.length,
        usersFound: 0
      });
    }

    console.log(`👥 Found ${users.length} user(s) to notify`);

    // Prepare competition data for email template
    const competitionData = competitions.map(comp => ({
      name: comp.name,
      startTime: new Date(comp.start_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      entryFee: comp.entry_fee?.toString() || '0',
      prizePool: comp.prize_pool?.toString() || 'TBD',
      competitionId: comp.id
    }));

    // Format week date for display
    const weekDisplayDate = nextSaturday.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send emails to all users
    let successfulSends = 0;
    const emailPromises = users.map(async (user) => {
      try {
        const template = transactionalTemplates.weeklySchedule({
          name: user.name || 'Football Fan',
          weekDate: weekDisplayDate,
          competitions: competitionData
        });

        const emailPayload = {
          to: [{ email: user.email }],
          subject: template.subject,
          htmlContent: template.html,
          sender: {
            name: BREVO_SENDER_NAME,
            email: BREVO_SENDER_EMAIL
          }
        };

        if (!BREVO_API_KEY) {
          console.log('⚠️ BREVO_API_KEY not configured, skipping email send');
          return { success: false, userId: user.id, error: 'API key not configured' };
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error(`❌ Failed to send weekly schedule to ${user.email}:`, errorData);
          return { success: false, userId: user.id, error: errorData };
        }

        const result = await response.json();
        console.log(`✅ Weekly schedule sent to ${user.email}, Message ID: ${result.messageId}`);
        successfulSends++;
        return { success: true, userId: user.id, messageId: result.messageId };
      } catch (error) {
        console.error(`❌ Error sending weekly schedule to ${user.email}:`, error);
        return { success: false, userId: user.id, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const emailResults = await Promise.all(emailPromises);

    // Log the weekly schedule notification
    const { error: logError } = await supabaseAdmin
      .from('weekly_schedule_notifications')
      .insert({
        week_start_date: weekStartDate,
        sent_at: now.toISOString(),
        total_recipients: users.length,
        successful_sends: successfulSends,
        competitions_count: competitions.length,
        created_at: now.toISOString(),
      });

    if (logError) {
      console.error('Error logging weekly schedule notification:', logError);
    }

    console.log(`🎉 Weekly schedule cron job completed: ${successfulSends}/${users.length} emails sent for ${competitions.length} competitions`);

    return res.status(200).json({
      message: 'Weekly schedule emails sent successfully',
      weekDate: weekStartDate,
      weekDisplayDate: weekDisplayDate,
      competitionsFound: competitions.length,
      usersNotified: users.length,
      successfulSends: successfulSends,
      competitions: competitionData.map(c => ({ name: c.name, startTime: c.startTime }))
    });

  } catch (error) {
    console.error('Weekly schedule cron job error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}