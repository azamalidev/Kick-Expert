import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Dummy referral data - replace with actual database queries
    const dummyReferralStats = {
      totalReferrals: 5,
      successfulReferrals: 3,
      totalBonusEarned: 150,
      pendingBonuses: 50,
      referralCode: 'USER123',
      recentReferrals: [
        {
          id: '1',
          referredUser: 'friend1@example.com',
          status: 'completed',
          bonusEarned: 50,
          joinedAt: new Date(Date.now() - 86400000 * 7).toISOString()
        },
        {
          id: '2',
          referredUser: 'friend2@example.com',
          status: 'completed',
          bonusEarned: 50,
          joinedAt: new Date(Date.now() - 86400000 * 14).toISOString()
        },
        {
          id: '3',
          referredUser: 'friend3@example.com',
          status: 'pending',
          bonusEarned: 0,
          joinedAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ]
    };

    return NextResponse.json(dummyReferralStats);

  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}