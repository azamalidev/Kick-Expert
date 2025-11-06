import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import paypal from '@paypal/checkout-server-sdk';
import { headers } from 'next/headers';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}
if (!process.env.PAYPAL_CLIENT_ID) {
  throw new Error('Missing PAYPAL_CLIENT_ID');
}
if (!process.env.PAYPAL_CLIENT_SECRET) {
  throw new Error('Missing PAYPAL_CLIENT_SECRET');
}

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

function environment() {
  return new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID!,
    process.env.PAYPAL_CLIENT_SECRET!
  );
}

const client = new paypal.core.PayPalHttpClient(environment());

export async function POST(req: Request) {
  try {
    // Parse request body first to get the data
    const { amount, credits, userId } = await req.json();
    console.log('Received request:', { amount, credits, userId });

    if (!userId) {
      console.error('Missing userId in request');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate other required fields
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid amount:', amount);
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (!credits || typeof credits !== 'number' || credits <= 0) {
      console.error('Invalid credits:', credits);
      return NextResponse.json({ error: 'Valid credits amount is required' }, { status: 400 });
    }

    console.log('Starting database operations for user:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!amount || !credits) {
      return NextResponse.json({ error: 'Amount and credits are required' }, { status: 400 });
    }

    // Verify that the user exists in profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // If profile doesn't exist, create it
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert([{ user_id: userId }])
        .select()
        .single();

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
        return NextResponse.json({ 
          error: 'Failed to create user profile',
          details: createProfileError.message
        }, { status: 500 });
      }
    }

    // Create credit purchase record
    console.log('Creating credit purchase record...');
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('credit_purchases')
      .insert([
        {
          user_id: userId,
          amount: amount,
          credits: credits,
          payment_provider: 'paypal',
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (purchaseError) {
      console.error('Database error creating purchase:', purchaseError);
      return NextResponse.json({ 
        error: 'Failed to create purchase record',
        details: purchaseError.message
      }, { status: 500 });
    }

    if (!purchaseData || !purchaseData.id) {
      console.error('No purchase data returned from insert');
      return NextResponse.json({ error: 'Failed to create purchase record' }, { status: 500 });
    }

    console.log('Created purchase record:', purchaseData.id);

    // Use NEXT_PUBLIC_SITE_URL or fallback to localhost
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Create PayPal order using SDK
    const paypalRequest = new paypal.orders.OrdersCreateRequest();
    paypalRequest.prefer('return=representation');
    paypalRequest.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: purchaseData.id,
          description: `${credits} Credits Purchase`,
          amount: {
            currency_code: 'EUR',
            value: Number(amount).toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'KickExpert',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        return_url: `${siteUrl}/credits/success?transactionId=${purchaseData.id}`,
        cancel_url: `${siteUrl}/credits/cancel`,
      },
    });

    let order;
    try {
      order = await client.execute(paypalRequest);
    } catch (paypalError: any) {
      console.error('PayPal SDK error:', paypalError);
      return NextResponse.json({ 
        error: paypalError?.message ?? JSON.stringify(paypalError) 
      }, { status: 500 });
    }

    const paypalData = order.result;
    console.log('PayPal order created:', paypalData);

    const approvalLink = paypalData.links?.find((link: any) => link.rel === 'approve');
    if (!approvalLink) {
      console.error('PayPal approval link not found:', paypalData);
      return NextResponse.json({ 
        error: 'PayPal approval link not found.' 
      }, { status: 500 });
    }

    // Update the purchase record with the PayPal order ID
    await supabase
      .from('credit_purchases')
      .update({ 
        payment_id: paypalData.id,
        payment_data: paypalData 
      })
      .eq('id', purchaseData.id);

    return NextResponse.json({
      approvalUrl: approvalLink.href,
      orderId: paypalData.id
    });

  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}
