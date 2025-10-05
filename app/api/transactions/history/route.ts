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

    // Dummy transaction data - replace with actual database queries
    const dummyTransactions = [
      {
        id: '1',
        type: 'purchase',
        amount: 20,
        credits: 20,
        description: 'Purchased 20 credits',
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'completed'
      },
      {
        id: '2',
        type: 'win',
        amount: 50,
        credits: 50,
        description: 'Won Football Competition',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        status: 'completed'
      },
      {
        id: '3',
        type: 'referral',
        amount: 10,
        credits: 10,
        description: 'Referral bonus from user123',
        created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        status: 'completed'
      },
      {
        id: '4',
        type: 'withdrawal',
        amount: -25,
        credits: -25,
        description: 'Withdrawal to PayPal',
        created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        status: 'pending'
      }
    ];

    return NextResponse.json({
      transactions: dummyTransactions,
      total: dummyTransactions.length
    });

  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}