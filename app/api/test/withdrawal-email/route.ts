import { NextResponse } from 'next/server';
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

export async function GET() {
  return NextResponse.json({
    message: 'Withdrawal Email Test Endpoint',
    usage: 'POST with JSON body containing withdrawal details',
    example: {
      withdrawalId: 'test-withdrawal-123',
      userId: 'user-uuid-here',
      amount: 50,
      status: 'pending|approved|rejected|completed',
      reason: 'Optional rejection reason',
      withdrawalMethod: 'stripe|paypal',
      paypalEmail: 'user@paypal.com (optional)',
      requestDate: '2025-01-01T00:00:00Z',
      processedDate: '2025-01-02T00:00:00Z (optional)'
    }
  });
}

export async function POST(req: Request) {
  console.log('🧪 Withdrawal email test API called');

  // Validate Brevo API key
  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is not configured');
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    console.log('📦 Test withdrawal email request payload:', body);

    const {
      withdrawalId = 'test-withdrawal-123',
      userId,
      amount = 50,
      status = 'pending',
      reason,
      withdrawalMethod = 'stripe',
      paypalEmail,
      requestDate = new Date().toISOString(),
      processedDate,
    } = body;

    // If userId is provided, try to get real user data
    let email = 'test@example.com';
    let full_name = 'Test User';

    if (userId) {
      try {
        // Get email from auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);

        if (!authError && authData.user) {
          email = authData.user.email || email;

          // Get username from profiles
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('user_id', userId)
            .maybeSingle();

          full_name = profileData?.full_name || profileData?.username || full_name;
        }
      } catch (userError) {
        console.log('Using test user data:', userError);
      }
    }

    console.log('✅ Using email:', email, 'Name:', full_name);

    // Generate email content using template
    console.log('📝 Generating withdrawal email template...');
    const emailTemplate = transactionalTemplates.withdrawalRequested({
      name: full_name,
      withdrawalId,
      amount,
      status,
      reason,
      withdrawalMethod,
      paypalEmail,
      requestDate,
      processedDate,
    });

    // Send email via Brevo
    console.log('📤 Sending test withdrawal email via Brevo to:', email);
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
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
        to: [
          {
            email: email,
            name: full_name,
          },
        ],
        subject: `[TEST] ${emailTemplate.subject}`,
        htmlContent: emailTemplate.html,
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json();
      console.error('❌ Brevo API error:', errorData);
      return NextResponse.json({
        error: 'Failed to send email via Brevo',
        details: errorData
      }, { status: 500 });
    }

    const responseData = await brevoResponse.json();
    console.log('✅ Test withdrawal email sent successfully! MessageId:', responseData.messageId);

    return NextResponse.json({
      success: true,
      messageId: responseData.messageId,
      message: 'Test withdrawal email sent successfully',
      testData: {
        email,
        full_name,
        withdrawalId,
        amount,
        status,
        withdrawalMethod
      }
    });

  } catch (error) {
    console.error('❌ Error sending test withdrawal email:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}