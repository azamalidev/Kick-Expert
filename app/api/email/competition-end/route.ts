import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { transactionalTemplates } from '@/emails/transactionalTemplates';

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@kickexpert.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'KickExpert';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CompetitionEndEmailRequest {
  userId: string;
  competitionId: string;
  competitionName: string;
  rank: number;
  totalPlayers: number;
  score: number;
  totalQuestions: number;
  accuracy: number;
  xpAwarded: number;
  prizeAmount: number;
  trophyAwarded: boolean;
}

export async function POST(req: Request) {
  console.log('📧 Competition End email API called');

  // Validate Brevo API key
  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is not configured');
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  try {
    const body = await req.json() as CompetitionEndEmailRequest;
    console.log('📦 Email request payload:', { 
      userId: body.userId, 
      competitionId: body.competitionId,
      rank: body.rank 
    });

    const {
      userId,
      competitionId,
      competitionName,
      rank,
      totalPlayers,
      score,
      totalQuestions,
      accuracy,
      xpAwarded,
      prizeAmount,
      trophyAwarded,
    } = body;

    // Validate required fields
    if (!userId || !competitionId || !competitionName) {
      console.error('❌ Missing required fields:', { userId, competitionId, competitionName });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get email from auth.users
    console.log('🔍 Fetching user email for userId:', userId);
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authData.user) {
      console.error('❌ Error fetching auth user:', authError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const email = authData.user.email;
    console.log('✅ Email found:', email);

    if (!email) {
      console.error('❌ User email not found');
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Get username from profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('user_id', userId)
      .maybeSingle();

    const full_name = profileData?.full_name || profileData?.username || 'KickExpert User';
    console.log('✅ Profile name:', full_name);

    // Generate email content using template
    console.log('📝 Generating competition end email template...');
    const emailTemplate = transactionalTemplates.competitionEnd({
      name: full_name,
      competitionName,
      rank,
      totalPlayers,
      score,
      totalQuestions,
      accuracy,
      xpAwarded,
      prizeAmount,
      trophyAwarded,
      competitionId,
    });

    // Send email via Brevo
    console.log('📤 Sending competition results email via Brevo to:', email);
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
    console.log('✅ Competition results email sent successfully! MessageId:', responseData.messageId);

    return NextResponse.json({
      success: true,
      messageId: responseData.messageId,
      message: 'Competition results email sent successfully',
    });

  } catch (error) {
    console.error('❌ Error sending competition end email:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
