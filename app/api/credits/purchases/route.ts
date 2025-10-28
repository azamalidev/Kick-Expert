import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch completed credit purchases from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log('Fetching purchases for user:', user.id);
    console.log('Date filter (7 days ago):', sevenDaysAgo.toISOString());

    const { data: purchases, error } = await supabase
      .from('credit_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      return NextResponse.json({ error: 'Failed to fetch purchases', details: error.message }, { status: 500 });
    }

    console.log(`Found ${purchases?.length || 0} completed purchases`);

    // If no purchases found, check if there are any purchases at all for debugging
    if (!purchases || purchases.length === 0) {
      const { data: allPurchases } = await supabase
        .from('credit_purchases')
        .select('id, status, created_at, payment_provider')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('All purchases for user (for debugging):', allPurchases);
      console.log('Note: Only completed purchases within 7 days are eligible for refund');
    }

    // For each purchase, calculate refundable credits
    const purchasesWithRefundInfo = await Promise.all(
      (purchases || []).map(async (purchase) => {
        // Check if there's already a refund for this purchase
        // Since we don't have purchase_id column, we query by metadata
        const { data: refunds } = await supabase
          .from('refund_requests')
          .select('amount, status, metadata')
          .eq('user_id', purchase.user_id);

        console.log(`Purchase ${purchase.id}: Found ${refunds?.length || 0} total refunds`);

        // Filter refunds that match this purchase via metadata AND are not rejected
        const purchaseRefunds = refunds?.filter(refund => {
          try {
            const metadata = typeof refund.metadata === 'string' 
              ? JSON.parse(refund.metadata) 
              : refund.metadata;
            const matchesPurchase = metadata?.purchase_id === purchase.id;
            // Treat these statuses as "active": they either block new refund
            // requests (pending/processing/approved) or represent completed refunds
            // that should reduce refundable credits.
            const activeStatuses = ['pending', 'approved', 'processing', 'completed'];
            const isActiveRefund = activeStatuses.includes(refund.status);
            
            if (matchesPurchase) {
              console.log(`  - Refund amount: ${refund.amount}, status: ${refund.status}, active: ${isActiveRefund}`);
            }
            
            return matchesPurchase && isActiveRefund;
          } catch (err) {
            console.error('Error parsing metadata:', err);
            return false;
          }
        }) || [];

        const refundedAmount = purchaseRefunds.reduce((sum, refund) => sum + refund.amount, 0);
        const refundableCredits = purchase.credits - refundedAmount;

        console.log(`Purchase ${purchase.id}: Credits=${purchase.credits}, Refunded=${refundedAmount}, Refundable=${refundableCredits}`);

        // Determine a single active refund status to surface to the UI. Prefer
        // processing -> approved -> pending order so the UI can show a more
        // specific message (e.g. "Refund processing").
        const activeRefund = purchaseRefunds.find(r => ['processing', 'approved', 'pending'].includes(r.status));
        const pending_refund_status = activeRefund ? activeRefund.status : null;

        return {
          ...purchase,
          refunded_credits: refundedAmount,
          refundable_credits: Math.max(0, refundableCredits),
          has_pending_refund: Boolean(pending_refund_status),
          pending_refund_status,
          pending_refund_id: (activeRefund as any)?.id || null,
          pending_refund_amount: (activeRefund as any)?.amount || null
        };
      })
    );

    return NextResponse.json(purchasesWithRefundInfo);
  } catch (error) {
    console.error('Purchases API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
