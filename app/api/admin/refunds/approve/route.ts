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

    // ===== NEW: VERIFY KYC STATUS BEFORE APPROVAL =====
    const { data: paymentAccount, error: paymentError } = await supabase
      .from('user_payment_accounts')
      .select('*')
      .eq('user_id', refund.user_id)
      .maybeSingle();

    // Check KYC status
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
    // ===== END: KYC VERIFICATION CHECK =====

    // Update refund status to approved
    const { data: updatedRefund, error: updateError } = await supabase
      .from('refund_requests')
      .update({
        status: 'approved',
        kyc_status: kycStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', refund_id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update refund:', updateError);
      return NextResponse.json({ error: 'Failed to approve refund' }, { status: 500 });
    }

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
      console.log('Sending refund approved email to user:', refund.user_id);
      
      const emailResponse = await fetch(emailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!emailResponse.ok) {
        const emailError = await emailResponse.json();
        console.error('Failed to send refund approved email:', emailError);
      } else {
        console.log('Refund approved email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending refund approved email:', emailError);
      // Don't fail the approval if email fails
    }

    // ===== NEW: TRIGGER REFUND PROCESSING =====
    // Call the refund processing endpoint to actually send money back
    console.log('Triggering refund processing for refund_id:', refund_id);
    
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const processUrl = `${appUrl}/api/admin/refunds/process`;
      console.log('Calling process endpoint:', processUrl);
      
      const processResponse = await fetch(processUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ refund_id })
      });

      const processData = await processResponse.json();
      console.log('Process endpoint response:', processData);

      if (!processResponse.ok) {
        console.error('Failed to process refund - Status:', processResponse.status, 'Data:', processData);
        // Still return success for approval, but log the processing failure
        await supabase
          .from('audit_logs')
          .insert({
            action: 'refund_processing_failed',
            user_id: user.id,
            details: {
              refund_id,
              error: 'Failed to initiate refund processing',
              status: processResponse.status,
              response: processData
            },
            created_at: new Date().toISOString()
          });
      } else {
        console.log('Refund processing initiated successfully');
        // Log successful processing initiation
        await supabase
          .from('audit_logs')
          .insert({
            action: 'refund_processing_initiated',
            user_id: user.id,
            details: {
              refund_id,
              process_response: processData
            },
            created_at: new Date().toISOString()
          });
      }
    } catch (processError) {
      console.error('Error calling refund process endpoint:', processError);
      // Log but don't fail the approval
      await supabase
        .from('audit_logs')
        .insert({
          action: 'refund_processing_error',
          user_id: user.id,
          details: {
            refund_id,
            error: processError instanceof Error ? processError.message : 'Unknown error'
          },
          created_at: new Date().toISOString()
        });
    }
    // ===== END: TRIGGER REFUND PROCESSING =====

    return NextResponse.json({ success: true, refund: updatedRefund });
  } catch (error) {
    console.error('Refund approval API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
