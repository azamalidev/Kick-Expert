import { routes } from "@/constants/routes"; // ✅ use your constants
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(req: Request) {
  try {
      const { priceId, competitionId, userId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment", // "subscription" if recurring
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?competitionId=${competitionId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}${routes.checkoutCancel}`,
        metadata: {
          competition_id: competitionId,
          user_id: userId,
        },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
