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

    const { amount, reason, userId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Check user's purchased credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('purchased_credits')
      .eq('user_id', userId)
      .single();

    if (creditsError || !credits) {
      return NextResponse.json({ error: 'User credits not found' }, { status: 404 });
    }

    if (credits.purchased_credits < amount) {
      return NextResponse.json({ error: 'Insufficient purchased credits' }, { status: 400 });
    }

    // Create refund request
    const { data: refund, error: refundError } = await supabase
      .from('refund_requests')
      .insert({
        user_id: userId,
        amount,
        reason,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (refundError) {
      console.error('Refund creation error:', refundError);
      return NextResponse.json({ error: 'Failed to create refund request' }, { status: 500 });
    }

    // Deduct purchased credits from user's account
    const newPurchasedCredits = credits.purchased_credits - amount;
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ purchased_credits: newPurchasedCredits })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Credit deduction error:', updateError);
      // Delete the refund request if credit deduction fails
      await supabase.from('refund_requests').delete().eq('id', refund.id);
      return NextResponse.json({ error: 'Failed to process refund request' }, { status: 500 });
    }

    // Log the refund request for audit
    await supabase
      .from('audit_logs')
      .insert({
        action: 'refund_requested',
        user_id: userId,
        details: { refund_id: refund.id, amount, reason, previous_credits: credits.purchased_credits, new_credits: newPurchasedCredits },
        created_at: new Date().toISOString()
      });

    return NextResponse.json(refund, { status: 201 });
  } catch (error) {
    console.error('Refund API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
