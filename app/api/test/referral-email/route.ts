import { NextResponse } from 'next/server';

// Test endpoint for referral confirmation email system
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      referrerId = 'test-referrer-123',
      referredUserId = 'test-referred-456',
      xpAwarded = 50,
      totalReferrals = 3,
      nextMilestone = 5,
      referralCredits = 100,
      email = 'test@example.com'
    } = body;

    // Call the referral confirmation email API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const emailUrl = `${appUrl}/api/email/referral-confirmed`;

    console.log('Testing referral confirmation email with XP:', xpAwarded);

    const emailResponse = await fetch(emailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referrerId,
        referredUserId,
        xpAwarded,
        totalReferrals,
        nextMilestone,
        referralCredits,
        email,
      })
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Email test failed:', emailResult);
      return NextResponse.json({
        success: false,
        error: 'Email sending failed',
        details: emailResult
      }, { status: 500 });
    }

    console.log('Email test successful:', emailResult);

    return NextResponse.json({
      success: true,
      message: `Test referral confirmation email sent successfully with +${xpAwarded} XP`,
      emailResult
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to show available test options
export async function GET() {
  return NextResponse.json({
    message: 'Referral Confirmation Email Test Endpoint',
    usage: 'POST with JSON body containing referral confirmation email parameters',
    examplePayloads: {
      basic: {
        referrerId: 'test-referrer-123',
        referredUserId: 'test-referred-456',
        xpAwarded: 50,
        totalReferrals: 1,
        email: 'test@example.com'
      },
      milestone: {
        referrerId: 'test-referrer-789',
        referredUserId: 'test-referred-101',
        xpAwarded: 50,
        totalReferrals: 3,
        nextMilestone: 5,
        referralCredits: 100,
        email: 'milestone@example.com'
      },
      completed: {
        referrerId: 'test-referrer-999',
        referredUserId: 'test-referred-888',
        xpAwarded: 50,
        totalReferrals: 10,
        referralCredits: 500,
        email: 'completed@example.com'
      }
    }
  });
}