import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
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

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminError || adminUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { refund_id } = await request.json();

    if (!refund_id) {
      return NextResponse.json({ error: 'Refund ID is required' }, { status: 400 });
    }

    // Get refund details
    const { data: refund, error: refundError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', refund_id)
      .single();

    if (refundError || !refund) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    if (refund.status !== 'pending') {
      return NextResponse.json({ error: 'Refund is not pending' }, { status: 400 });
    }

    // Update refund status to approved
    const { error: updateError } = await supabase
      .from('refund_requests')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', refund_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to approve refund' }, { status: 500 });
    }

    // Get user's payment account for refund processing
    const { data: paymentAccount } = await supabase
      .from('payment_accounts')
      .select('provider, account_id')
      .eq('user_id', refund.user_id)
      .single();

    // TODO: Integrate with Stripe/PayPal API to process actual refund
    // For now, we'll just mark it as approved and log it

    // Log the approval
    await supabase
      .from('audit_logs')
      .insert({
        action: 'refund_approved',
        user_id: user.id,
        details: {
          refund_id,
          amount: refund.amount,
          user_id: refund.user_id,
          payment_provider: paymentAccount?.provider
        },
        created_at: new Date().toISOString()
      });

    // Notify user
    await supabase
      .from('notifications')
      .insert({
        user_id: refund.user_id,
        type: 'refund_approved',
        title: 'Refund Approved',
        message: `Your refund request for ${refund.amount} credits has been approved and is being processed.`,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({ success: true, refund });
  } catch (error) {
    console.error('Refund approval API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
