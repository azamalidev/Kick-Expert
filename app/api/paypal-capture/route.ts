import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { transactionId } = await request.json();
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Get purchase record by PayPal transaction ID
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('credit_purchases')
      .select('*, profiles:user_id(current_credits)')
      .eq('transaction_id', transactionId)
      .single();

    if (purchaseError || !purchaseData) {
      return NextResponse.json({ error: 'Purchase record not found' }, { status: 404 });
    }

    // Skip if already completed
    if (purchaseData.status === 'completed') {
      return NextResponse.json({ 
        success: true, 
        credits: purchaseData.credits,
        message: 'Payment was already captured and processed'
      });
    }

    // Capture PayPal payment
    const paypalResponse = await fetch(
      `${process.env.PAYPAL_API_URL}/v2/checkout/orders/${transactionId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/json'
        },
      }
    );

    if (!paypalResponse.ok) {
      const errorData = await paypalResponse.json();
      console.error('PayPal capture error:', errorData);
      return NextResponse.json({ error: 'Failed to capture PayPal payment' }, { status: 500 });
    }

    const captureData = await paypalResponse.json();
    
    // Calculate new credit balance
    const currentCredits = purchaseData.profiles?.current_credits || 0;
    const newCredits = currentCredits + purchaseData.credits;

    // Begin transaction to update both purchase record and user credits
    const { error: updateError } = await supabase.rpc('process_successful_payment', {
      p_purchase_id: purchaseData.id,
      p_user_id: purchaseData.user_id,
      p_new_credits: newCredits,
      p_payment_data: captureData
    });

    if (updateError) {
      console.error('Error processing payment:', updateError);
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      credits: purchaseData.credits,
      message: 'Payment captured and credits added successfully'
    });
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to capture payment' },
      { status: 500 }
    );
  }
}
