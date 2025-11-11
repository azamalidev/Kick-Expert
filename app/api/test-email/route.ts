import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    brevoApiKey: process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing',
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@kickexpert.com (default)',
    brevoSenderName: process.env.BREVO_SENDER_NAME || 'KickExpert (default)',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000 (default)',
  };

  return NextResponse.json({
    message: 'Email Configuration Check',
    config,
    note: 'Make sure BREVO_API_KEY, BREVO_SENDER_EMAIL, and BREVO_SENDER_NAME are set in .env.local'
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { testEmail } = body;

  if (!testEmail) {
    return NextResponse.json({ error: 'testEmail is required' }, { status: 400 });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@kickexpert.com';
  const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'KickExpert';

  if (!BREVO_API_KEY) {
    return NextResponse.json({ 
      error: 'BREVO_API_KEY not configured',
      solution: 'Add BREVO_API_KEY to your .env.local file'
    }, { status: 500 });
  }

  try {
    console.log('🧪 Testing Brevo email to:', testEmail);

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
        subject: 'Test Email from KickExpert',
        htmlContent: '<h1>Test Email</h1><p>If you receive this, the email system is working!</p>',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Brevo test failed:', result);
      return NextResponse.json({ 
        error: 'Brevo API error',
        details: result 
      }, { status: response.status });
    }

    console.log('✅ Test email sent:', result);
    return NextResponse.json({ 
      success: true,
      message: 'Test email sent successfully!',
      messageId: result.messageId 
    });

  } catch (error) {
    console.error('❌ Test email error:', error);
    return NextResponse.json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
