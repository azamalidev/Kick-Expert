import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    // First, get refund requests
    let query = supabase
      .from('refund_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data: refunds, error } = await query;

    if (error) throw error;

    // Then, enrich with user data
    const enrichedRefunds = await Promise.all(
      (refunds || []).map(async (refund: any) => {
        // Get user email from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', refund.user_id)
          .single();

        // Get payment account info
        const { data: paymentAccount } = await supabase
          .from('user_payment_accounts')
          .select('provider, kyc_status, provider_account_id')
          .eq('user_id', refund.user_id)
          .maybeSingle();

        return {
          ...refund,
          user_email: profile?.email || 'N/A',
          provider: paymentAccount?.provider || 'unknown',
          kyc_status: paymentAccount?.kyc_status || 'unverified',
          provider_account_id: paymentAccount?.provider_account_id,
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      refunds: enrichedRefunds 
    });
  } catch (error: any) {
    console.error('Admin refunds list error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
