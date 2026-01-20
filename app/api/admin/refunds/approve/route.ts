import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Optional auth check - if token provided, verify it
    const authHeader = request.headers.get('authorization');
    let adminUserId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      adminUserId = user.id;
    }
    // If no auth header, proceed anyway (for development/testing)

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

    // Verify KYC status before approval
    const { data: paymentAccount, error: paymentError } = await supabase
      .from('user_payment_accounts')
      .select('*')
      .eq('user_id', refund.user_id)
      .maybeSingle();

    const kycStatus = paymentAccount?.kyc_status || 'unverified';
    if (kycStatus !== 'verified') {
      return NextResponse.json(
        {
          error: 'KYC verification required',
          kyc_status: kycStatus,
          message: 'User must complete KYC verification before refund can be processed.'
        },
        { status: 403 }
      );
    }

    // Update refund status to approved
    const updateData: any = {
      status: 'approved',
      kyc_status: kycStatus,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (adminUserId) {
      updateData.approved_by = adminUserId;
    }

    const { data: updatedRefund, error: updateError } = await supabase
      .from('refund_requests')
      .update(updateData)
      .eq('id', refund_id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update refund:', updateError);
      return NextResponse.json({ error: 'Failed to approve refund' }, { status: 500 });
    }

    // Notify user that refund is approved
    await supabase
      .from('notifications')
      .insert({
        user_id: refund.user_id,
        type: 'refund_approved',
        title: 'Refund Approved',
        message: `Your refund request for ${refund.amount} credits has been approved and is being processed.`,
        created_at: new Date().toISOString()
      });

    // Send refund approved email
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const emailUrl = `${appUrl}/api/email/refund-processed`;
      
      await fetch(emailUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundId: refund_id,
          userId: refund.user_id,
          amount: refund.amount,
          status: 'approved',
          refundMethod: refund.provider || 'stripe',
          requestDate: refund.created_at,
          processedDate: new Date().toISOString(),
        })
      });
    } catch (emailError) {
      console.error('Error sending refund approved email:', emailError);
    }

    // Trigger refund processing
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const processUrl = `${appUrl}/api/admin/refunds/process`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
      
      await fetch(processUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refund_id })
      });
    } catch (processError) {
      console.error('Error calling refund process endpoint:', processError);
    }

    return NextResponse.json({ success: true, refund: updatedRefund });
  } catch (error) {
    console.error('Refund approval API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
