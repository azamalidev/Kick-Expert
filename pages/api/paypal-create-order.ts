
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function environment() {
  let clientId = process.env.PAYPAL_CLIENT_ID!;
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

const client = new paypal.core.PayPalHttpClient(environment());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Extract required parameters from request body or query
    const { competitionId, userId, entryFee } = req.body ?? req.query;

    // Check for existing confirmed registration
    const { data: existing, error: checkError } = await supabase
      .from('competition_registrations')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Supabase check error:', checkError);
      return res.status(500).json({ error: 'Database error: ' + (checkError.message ?? JSON.stringify(checkError)) });
    }

    if (existing) {
      return res.status(400).json({ error: 'User already registered for this competition.' });
    }

    // Use NEXT_PUBLIC_SITE_URL or fallback to NEXT_PUBLIC_BASE_URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    // Create PayPal order using SDK
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `${competitionId}-${userId}`,
          description: 'Entry fee for competition',
          amount: {
            currency_code: 'USD',
            value: Number(entryFee).toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'KickExpert',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        return_url: `${siteUrl}/payment-success?competitionId=${competitionId}&userId=${userId}&entryFee=${entryFee}`,
        cancel_url: `${siteUrl}/payment-canceled`,
      },
    });

    let order;
    try {
      order = await client.execute(request);
    } catch (paypalError: any) {
      console.error('PayPal SDK error:', paypalError);
      return res.status(500).json({ error: paypalError?.message ?? JSON.stringify(paypalError) });
    }

    const paypalData = order.result;
    console.log('Full PayPal SDK response:', paypalData);

    const approvalLink = paypalData.links?.find((link: any) => link.rel === 'approve');
    if (!approvalLink) {
      console.error('PayPal approval link not found. Full response:', paypalData);
      return res.status(500).json({ error: 'PayPal approval link not found.', paypalResponse: paypalData });
    }

    res.status(200).json({
      id: paypalData.id,
      approvalUrl: approvalLink.href
    });
  } catch (error: any) {
    console.error('PayPal create order error:', error);
    res.status(500).json({ error: error?.message ?? JSON.stringify(error) ?? 'Failed to create PayPal order' });
  }
}