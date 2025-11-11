import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { transactionalTemplates } from '@/emails/transactionalTemplates';

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@kickexpert.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'KickExpert';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CompetitionReminderRequest {
  competitionId: string;
  userId?: string;
  testMode?: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface CompetitionRegistration {
  user_id: string;
  profiles: UserProfile;
}

interface EmailResult {
  success: boolean;
  userId: string;
  messageId?: string;
  error?: string;
  testMode?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { competitionId, userId, testMode = false }: CompetitionReminderRequest = await request.json();

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Competition ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get competition details
    const { data: competition, error: competitionError } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', competitionId)
      .single();

    if (competitionError || !competition) {
      console.error('Competition lookup error:', competitionError);
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    // Get user details (if userId provided, otherwise get all registered users)
    let usersToNotify: UserProfile[] = [];

    if (userId) {
      // Single user notification (for testing)
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name')
        .eq('user_id', userId)
        .single();

      if (userError || !user) {
        console.error('User lookup error:', userError);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Get email from auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);

      if (authError || !authData.user?.email) {
        console.error('Auth user lookup error:', authError);
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 404 }
        );
      }

      usersToNotify = [{
        id: user.user_id,
        name: user.username || 'KickExpert User',
        email: authData.user.email
      }];
    } else {
      // Get all registered users for this competition
      const { data: registrations, error: registrationsError } = await supabase
        .from('competition_registrations')
        .select('user_id')
        .eq('competition_id', competitionId)
        .eq('status', 'registered');

      if (registrationsError) {
        console.error('Registrations lookup error:', registrationsError);
        return NextResponse.json(
          { error: 'Failed to get registered users' },
          { status: 500 }
        );
      }

      // Get user details for each registration
      const userPromises = registrations.map(async (reg: { user_id: string }) => {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .eq('user_id', reg.user_id)
          .single();

        if (profileError || !profile) return null;

        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(reg.user_id);

        if (authError || !authData.user?.email) return null;

        return {
          id: profile.user_id,
          name: profile.username || 'KickExpert User',
          email: authData.user.email
        };
      });

      const userResults = await Promise.all(userPromises);
      usersToNotify = userResults.filter((user): user is UserProfile => user !== null);
    }

    if (usersToNotify.length === 0) {
      return NextResponse.json(
        { message: 'No users to notify' },
        { status: 200 }
      );
    }

    // Calculate time until start
    const startTime = new Date(competition.start_time);
    const now = new Date();
    const minutesUntilStart = Math.max(0, Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60)));

    // Prepare email data
    const emailData = {
      competitionName: competition.name,
      competitionDate: startTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      competitionTime: startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      entryFee: competition.entry_fee?.toString() || '0',
      prizePool: competition.prize_pool?.toString() || 'TBD',
      competitionId: competition.id,
      minutesUntilStart
    };

    // Send emails to all users
    const emailPromises = usersToNotify.map(async (user) => {
      try {
        const template = transactionalTemplates.competitionReminder({
          ...emailData,
          name: user.name
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

        if (testMode) {
          console.log('Test mode - would send email to:', user.email, 'with subject:', template.subject);
          return { success: true, userId: user.id, testMode: true };
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY!,
            'content-type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Brevo API error for user', user.email, ':', errorData);
          return { success: false, userId: user.id, error: errorData };
        }

        const result = await response.json();
        console.log('Competition reminder email sent successfully to:', user.email, 'Message ID:', result.messageId);

        return { success: true, userId: user.id, messageId: result.messageId };
      } catch (error) {
        console.error('Error sending email to user', user.email, ':', error);
        return { success: false, userId: user.id, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const results: EmailResult[] = await Promise.all(emailPromises);

    const successful = results.filter((r: EmailResult) => r.success).length;
    const failed = results.filter((r: EmailResult) => !r.success).length;

    console.log(`Competition reminder emails sent: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      message: `Competition reminder emails sent to ${successful} users`,
      results: testMode ? results : undefined,
      stats: { total: usersToNotify.length, successful, failed }
    });

  } catch (error) {
    console.error('Competition reminder email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}