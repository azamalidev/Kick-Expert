import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const { testEmail } = body;

  if (!testEmail) {
    return NextResponse.json({ error: 'testEmail is required' }, { status: 400 });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.SENDER_EMAIL || 'noreply@kickexpert.com';
  const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || process.env.SENDER_NAME || 'KickExpert';

  if (!BREVO_API_KEY) {
    return NextResponse.json({
      error: 'BREVO_API_KEY not configured',
      solution: 'Add BREVO_API_KEY to your .env.local file'
    }, { status: 500 });
  }

  try {
    // Calculate next Saturday
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay()) % 7;
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
    nextSaturday.setHours(0, 0, 0, 0);

    // Import the weekly schedule template
    const { transactionalTemplates } = await import('@/emails/transactionalTemplates');

    // Get competitions for next Saturday
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    if (competitionsError || !competitions || competitions.length === 0) {
      return NextResponse.json({
        error: 'No competitions found for next Saturday',
        details: competitionsError?.message || 'No upcoming competitions'
      }, { status: 404 });
    }

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

    // Use the weekly schedule template
    const template = transactionalTemplates.weeklySchedule({
      name: 'Test User',
      weekDate: weekDisplayDate,
      competitions: competitionData
    });

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          email: BREVO_SENDER_EMAIL,
          name: BREVO_SENDER_NAME,
        },
        to: [{ email: testEmail }],
        subject: template.subject,
        htmlContent: template.html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        error: 'Brevo API error',
        details: result
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly schedule test email sent successfully!',
      messageId: result.messageId,
      competitionsFound: competitions.length,
      template: 'weeklySchedule'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
