import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'local-dev';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting competition reminder cron job...');

    // Get current time and time 10 minutes from now
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    console.log('⏰ Checking for competitions starting between:', now.toISOString(), 'and', tenMinutesFromNow.toISOString());

    // Find competitions that start within the next 10 minutes
    // and haven't had reminders sent yet
    const { data: competitions, error: competitionsError } = await supabase
      .from('competitions')
      .select('id, name, start_time, entry_fee, prize_pool')
      .gte('start_time', now.toISOString())
      .lte('start_time', tenMinutesFromNow.toISOString())
      .eq('status', 'scheduled'); // Only send reminders for scheduled competitions

    if (competitionsError) {
      console.error('Error fetching competitions:', competitionsError);
      return NextResponse.json(
        { error: 'Failed to fetch competitions' },
        { status: 500 }
      );
    }

    if (!competitions || competitions.length === 0) {
      console.log('✅ No competitions starting in the next 10 minutes');
      return NextResponse.json({
        message: 'No competitions require reminders',
        checked: 0,
        processed: 0
      });
    }

    console.log(`📋 Found ${competitions.length} competition(s) starting soon`);

    let totalRemindersSent = 0;
    let competitionsProcessed = 0;

    // Process each competition
    for (const competition of competitions) {
      try {
        console.log(`🏆 Processing competition: ${competition.name} (ID: ${competition.id})`);

        // Check if reminders have already been sent for this competition
        // We'll use a simple approach: check if there are any competition_reminder_logs
        // If not, we'll assume reminders haven't been sent yet
        const { data: existingLogs, error: logsError } = await supabase
          .from('competition_reminder_logs')
          .select('id')
          .eq('competition_id', competition.id)
          .limit(1);

        if (logsError) {
          console.error('Error checking reminder logs:', logsError);
          continue;
        }

        if (existingLogs && existingLogs.length > 0) {
          console.log(`⏭️  Reminders already sent for competition ${competition.id}`);
          continue;
        }

        // Get all registered users for this competition
        const { data: registrations, error: registrationsError } = await supabase
          .from('competition_registrations')
          .select('user_id')
          .eq('competition_id', competition.id)
          .eq('status', 'registered');

        if (registrationsError) {
          console.error('Error fetching registrations:', registrationsError);
          continue;
        }

        if (!registrations || registrations.length === 0) {
          console.log(`⚠️  No registered users for competition ${competition.id}`);
          continue;
        }

        console.log(`👥 Found ${registrations.length} registered user(s) for ${competition.name}`);

        // Send reminder emails to all registered users
        const reminderPromises = registrations.map(async (reg) => {
          try {
            // Call the competition reminder API for each user
            const reminderResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/competition-reminder`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${cronSecret}`,
                },
                body: JSON.stringify({
                  competitionId: competition.id,
                  userId: reg.user_id,
                }),
              }
            );

            if (!reminderResponse.ok) {
              const errorText = await reminderResponse.text();
              console.error(`❌ Failed to send reminder to user ${reg.user_id}:`, errorText);
              return { success: false, userId: reg.user_id, error: errorText };
            }

            const reminderResult = await reminderResponse.json();
            console.log(`✅ Reminder sent to user ${reg.user_id} for competition ${competition.name}`);
            return { success: true, userId: reg.user_id, result: reminderResult };
          } catch (error) {
            console.error(`❌ Error sending reminder to user ${reg.user_id}:`, error);
            return { success: false, userId: reg.user_id, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        });

        const reminderResults = await Promise.all(reminderPromises);
        const successfulReminders = reminderResults.filter(r => r.success).length;

        // Log that reminders have been sent for this competition
        const { error: logError } = await supabase
          .from('competition_reminder_logs')
          .insert({
            competition_id: competition.id,
            sent_at: now.toISOString(),
            total_recipients: registrations.length,
            successful_sends: successfulReminders,
            created_at: now.toISOString(),
          });

        if (logError) {
          console.error('Error logging reminder send:', logError);
        }

        totalRemindersSent += successfulReminders;
        competitionsProcessed++;

        console.log(`📊 Competition ${competition.name}: ${successfulReminders}/${registrations.length} reminders sent`);

      } catch (error) {
        console.error(`❌ Error processing competition ${competition.id}:`, error);
        continue;
      }
    }

    console.log(`🎉 Competition reminder cron job completed: ${competitionsProcessed} competitions processed, ${totalRemindersSent} reminders sent`);

    return NextResponse.json({
      message: 'Competition reminder cron job completed',
      checked: competitions.length,
      processed: competitionsProcessed,
      remindersSent: totalRemindersSent,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('Competition reminder cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}