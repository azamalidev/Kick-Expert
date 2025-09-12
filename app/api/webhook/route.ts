import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabaseClient';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil'
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.metadata?.type !== 'credit_purchase') {
      return NextResponse.json({ received: true });
    }

    const userId = session.metadata.userId;
    const credits = parseInt(session.metadata.credits);

    // Start a transaction
    const { data: client } = await supabase.auth.getUser();
    if (!client.user) {
      throw new Error('Unauthorized');
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('credit_transactions')
      .update({ status: 'completed' })
      .eq('payment_id', session.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Update user's credit balance
    const { error: balanceError } = await supabase.rpc('add_purchased_credits', {
      p_user_id: userId,
      p_amount: credits
    });

    if (balanceError) {
      console.error('Error updating credit balance:', balanceError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
