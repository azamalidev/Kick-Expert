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

    // Dummy tax data - replace with actual calculations
    const currentYear = new Date().getFullYear();
    const dummyTaxInfo = {
      yearToDateWinnings: 450,
      taxThreshold: 600,
      needsReporting: false,
      nextReportDue: `${currentYear}-12-31`,
      lastReportFiled: null,
      estimatedTaxOwed: 0,
      breakdown: {
        competitionWins: 400,
        referralBonuses: 50,
        totalWinnings: 450
      },
      alerts: [
        {
          type: 'info',
          message: `You have earned €${450} this year. Tax reporting required when winnings exceed €600.`
        }
      ]
    };

    return NextResponse.json(dummyTaxInfo);

  } catch (error) {
    console.error('Error fetching tax info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}