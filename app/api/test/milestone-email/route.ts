import { NextResponse } from 'next/server';

interface MilestoneTestRequest {
  referrerId: string;
  milestone: number;
  rewardType: string;
  credits: number;
  totalReferrals: number;
  nextMilestone?: number;
  email?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as MilestoneTestRequest;
    console.log('🧪 Testing milestone achievement email with payload:', body);

    const {
      referrerId,
      milestone,
      rewardType,
      credits,
      totalReferrals,
      nextMilestone,
      email = 'test@example.com',
    } = body;

    // Validate required fields
    if (!referrerId || !milestone || !rewardType || credits === undefined || totalReferrals === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call the actual milestone email API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/milestone-achieved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrerId,
        milestone,
        rewardType,
        credits,
        totalReferrals,
        nextMilestone,
        email,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Milestone email test failed:', result);
      return NextResponse.json({
        error: 'Milestone email test failed',
        details: result
      }, { status: response.status });
    }

    console.log('✅ Milestone email test successful:', result);
    return NextResponse.json({
      success: true,
      message: 'Milestone achievement email sent successfully',
      result,
    });

  } catch (error) {
    console.error('❌ Error in milestone email test:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}