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

    const { refund_id, reason } = await request.json();

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

    // Update refund status to rejected
    const { error: updateError } = await supabase
      .from('refund_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', refund_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to reject refund' }, { status: 500 });
    }

    // Restore the deducted credits to user's account
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('purchased_credits')
      .eq('user_id', refund.user_id)
      .single();

    if (!creditsError && credits) {
      const restoredCredits = credits.purchased_credits + refund.amount;
      await supabase
        .from('user_credits')
        .update({ purchased_credits: restoredCredits })
        .eq('user_id', refund.user_id);
    }

    // Log the rejection
    await supabase
      .from('audit_logs')
      .insert({
        action: 'refund_rejected',
        user_id: user.id,
        details: {
          refund_id,
          amount: refund.amount,
          user_id: refund.user_id,
          rejection_reason: reason
        },
        created_at: new Date().toISOString()
      });

    // Notify user
    await supabase
      .from('notifications')
      .insert({
        user_id: refund.user_id,
        type: 'refund_rejected',
        title: 'Refund Request Rejected',
        message: `Your refund request for ${refund.amount} credits has been rejected. Reason: ${reason}`,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({ success: true, refund });
  } catch (error) {
    console.error('Refund rejection API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
