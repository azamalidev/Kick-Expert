import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load env vars from .env.local
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil',
});

async function main() {
  // Starter League (€2.00)
  const starterProduct = await stripe.products.create({
    name: 'Starter League',
    description: 'Perfect for beginners',
  });
  const starterPrice = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 200, // €2.00
    currency: 'eur',
  });
  console.log('Starter League Price ID:', starterPrice.id);

  // Pro League (€10.00)
  const proProduct = await stripe.products.create({
    name: 'Pro League',
    description: 'For serious fans',
  });
  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 1000, // €10.00
    currency: 'eur',
  });
  console.log('Pro League Price ID:', proPrice.id);

  // Elite League (€30.00)
  const eliteProduct = await stripe.products.create({
    name: 'Elite League',
    description: 'Expert level only',
  });
  const elitePrice = await stripe.prices.create({
    product: eliteProduct.id,
    unit_amount: 3000, // €30.00
    currency: 'eur',
  });
  console.log('Elite League Price ID:', elitePrice.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
