import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with environment checks in the handler
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  try {
    // Check environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
    }
    
    // Use default URL if NEXT_PUBLIC_SITE_URL is not set
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { amount, credits } = await req.json();
    console.log('Received request:', { amount, credits });

    // Validate request body
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!credits || typeof credits !== 'number' || credits <= 0) {
      return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
    }

    // Get the user from the auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First verify the user exists in profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ 
        error: 'Error verifying user profile',
        details: profileError.message
      }, { status: 500 });
    }

    if (!profileData) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert([{ user_id: user.id }])
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
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('credit_purchases')
      .insert([
        {
          user_id: user.id,
          amount: amount,
          credits: credits,
          payment_provider: 'stripe',
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${credits} Credits`,
              description: `Purchase ${credits} credits for KickExpert`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}&purchaseId=${purchaseData.id}`,
      cancel_url: `${siteUrl}/credits/cancel`,
      metadata: {
        purchaseId: purchaseData.id,
        userId: user.id,
        credits: credits.toString()
      }
    });

    // Update purchase record with Stripe session ID
    await supabase
      .from('credit_purchases')
      .update({ 
        payment_id: session.id,
        payment_data: session
      })
      .eq('id', purchaseData.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create Stripe session' },
      { status: 500 }
    );
  }
}
