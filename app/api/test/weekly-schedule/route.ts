import { NextRequest, NextResponse } from 'next/server';

// Test endpoint for weekly schedule functionality
export async function GET(request: NextRequest) {
  try {
    console.log('Testing weekly schedule functionality...');

    // Call the actual weekly schedule cron endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET || 'local-dev';

    const response = await fetch(`${baseUrl}/api/crons/weekly-schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Weekly schedule test failed:', result);
      return NextResponse.json(
        { error: 'Weekly schedule test failed', details: result },
        { status: response.status }
      );
    }

    console.log('Weekly schedule test completed:', result);
    return NextResponse.json({
      message: 'Weekly schedule test completed',
      result: result
    });

  } catch (error) {
    console.error('Weekly schedule test error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Test endpoint for sending weekly schedule to a specific user
export async function POST(request: NextRequest) {
  try {
        const body = await request.json();
    const { userId, userEmail, force = false } = body;

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: 'Either userId or userEmail is required' },
        { status: 400 }
      );
    }

    console.log('Testing weekly schedule for specific user:', userId || userEmail, force ? '(forced)' : '');

    // Import required modules
    const { createClient } = await import('@supabase/supabase-js');
    const { transactionalTemplates } = await import('@/emails/transactionalTemplates');

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we've already sent notifications for this week (unless forced)
    if (!force) {
      const now = new Date();
      const daysUntilSaturday = (6 - now.getDay()) % 7; // 6 = Saturday
      const nextSaturday = new Date(now);
      nextSaturday.setDate(now.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
      nextSaturday.setHours(0, 0, 0, 0);

      const weekStartDate = nextSaturday.toISOString().split('T')[0]; // YYYY-MM-DD format

      const { data: existingNotification, error: notificationCheckError } = await supabase
        .from('weekly_schedule_notifications')
        .select('id')
        .eq('week_start_date', weekStartDate)
        .single();

      if (!notificationCheckError && existingNotification) {
        return NextResponse.json(
          { message: 'Weekly schedule already sent for this week. Use force=true to override.', weekDate: weekStartDate, alreadySent: true },
          { status: 200 }
        );
      }
    }

    // Get user details
    let user;
    if (userId) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'User not found', details: error },
          { status: 404 }
        );
      }
      user = data;
    } else if (userEmail) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', userEmail)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'User not found', details: error },
          { status: 404 }
        );
      }
      user = data;
    }

    // Ensure user is defined
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has email confirmed and opted in
    if (!user.email) {
      return NextResponse.json(
        { error: 'User has no email address' },
        { status: 400 }
      );
    }

    // Get competitions for next Saturday
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay()) % 7; // 6 = Saturday
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
    nextSaturday.setHours(0, 0, 0, 0);

    const startOfSaturday = new Date(nextSaturday);
    const endOfSaturday = new Date(nextSaturday);
    endOfSaturday.setHours(23, 59, 59, 999);

    const { data: competitions, error: competitionsError } = await supabase
      .from('competitions')
      .select('id, name, start_time, entry_fee, prize_pool')
      .gte('start_time', startOfSaturday.toISOString())
      .lte('start_time', endOfSaturday.toISOString())
      .eq('status', 'upcoming')
      .order('start_time', { ascending: true });

    if (competitionsError) {
      console.error('Error fetching competitions:', competitionsError);
      return NextResponse.json(
        { error: 'Failed to fetch competitions', details: competitionsError },
        { status: 500 }
      );
    }

    if (!competitions || competitions.length === 0) {
      return NextResponse.json(
        { message: 'No competitions scheduled for next Saturday', competitionsFound: 0 },
        { status: 200 }
      );
    }

    console.log(`Found ${competitions.length} competitions for next Saturday`);

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

    // Send email to specific user
    const template = transactionalTemplates.weeklySchedule({
      name: user.name || 'Football Fan',
      weekDate: weekDisplayDate,
      competitions: competitionData
    });

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@kickexpert.com';
    const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'KickExpert';

    if (!BREVO_API_KEY) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY not configured' },
        { status: 500 }
      );
    }

    const emailPayload = {
      to: [{ email: user.email }],
      subject: template.subject,
      htmlContent: template.html,
      sender: {
        name: BREVO_SENDER_NAME,
        email: BREVO_SENDER_EMAIL
      }
    };

    console.log('Sending weekly schedule email to:', user.email);

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
      console.error('Failed to send email:', errorData);
      return NextResponse.json(
        { error: 'Failed to send email', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Weekly schedule email sent successfully:', result);

    return NextResponse.json({
      message: 'Weekly schedule email sent successfully to specific user',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      weekDate: weekDisplayDate,
      competitionsFound: competitions.length,
      messageId: result.messageId,
      competitions: competitionData
    });

  } catch (error) {
    console.error('Weekly schedule specific user test error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}