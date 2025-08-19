import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-07-30.basil' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const buf = await req.arrayBuffer();
  let event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const competition_id = session.metadata.competition_id;
    const user_id = session.metadata.user_id;
    const paid_amount = session.amount_total;
    await supabase.from('competition_registrations').insert({
      competition_id,
      user_id,
      status: 'confirmed',
      paid_amount,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  }
  return NextResponse.json({ received: true });
}
