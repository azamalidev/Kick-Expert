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

interface MilestoneEmailRequest {
  referrerId: string;
  milestone: number;
  rewardType: string;
  credits: number;
  totalReferrals: number;
  nextMilestone?: number;
  email?: string; // Optional for testing
}

export async function POST(req: Request) {
  console.log('📧 Milestone achievement email API called');

  // Validate Brevo API key
  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is not configured');
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  try {
    const body = await req.json() as MilestoneEmailRequest;
    console.log('📦 Milestone email request payload:', {
      referrerId: body.referrerId,
      milestone: body.milestone,
      rewardType: body.rewardType,
      credits: body.credits,
      totalReferrals: body.totalReferrals
    });

    const {
      referrerId,
      milestone,
      rewardType,
      credits,
      totalReferrals,
      nextMilestone,
      email: providedEmail,
    } = body;

    // Validate required fields
    if (!referrerId || !milestone || !rewardType || credits === undefined || totalReferrals === undefined) {
      console.error('❌ Missing required fields:', { referrerId, milestone, rewardType, credits, totalReferrals });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let email: string;
    let full_name: string;

    if (providedEmail) {
      // Test mode: use provided email and default name
      email = providedEmail;
      full_name = 'Test User';
      console.log('🧪 Test mode: Using provided email:', email);
    } else {
      // Production mode: fetch from database
      console.log('🔍 Fetching referrer details for referrerId:', referrerId);

      // Get email from auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(referrerId);

      if (authError || !authData.user) {
        console.error('❌ Error fetching auth user:', authError);
        return NextResponse.json({ error: 'Referrer not found' }, { status: 404 });
      }

      email = authData.user.email!;
      console.log('✅ Email found:', email);

      if (!email) {
        console.error('❌ Referrer email not found');
        return NextResponse.json({ error: 'Referrer email not found' }, { status: 400 });
      }

      // Get username from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('user_id', referrerId)
        .maybeSingle();

      full_name = profileData?.full_name || profileData?.username || 'KickExpert User';
      console.log('✅ Profile name:', full_name);
    }

    // Generate email content using template
    console.log('📝 Generating milestone achievement email template...');
    const emailTemplate = transactionalTemplates.milestoneAchieved({
      name: full_name,
      milestone,
      rewardType,
      credits,
      totalReferrals,
      nextMilestone,
    });

    // Send email via Brevo
    console.log('📤 Sending milestone achievement email via Brevo to:', email);
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
            name: full_name || 'KickExpert User',
          },
        ],
        subject: emailTemplate.subject,
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
    console.log('✅ Milestone achievement email sent successfully! MessageId:', responseData.messageId);

    return NextResponse.json({
      success: true,
      messageId: responseData.messageId,
      message: 'Milestone achievement email sent successfully',
    });

  } catch (error) {
    console.error('❌ Error sending milestone achievement email:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}