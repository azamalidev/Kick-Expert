import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: { method: string; body: { orderID: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message?: string; error?: any; success?: boolean; data?: any; }): void; new(): any; }; }; }) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orderID } = req.body;

  try {
    const auth = Buffer.from(
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET
    ).toString('base64');

    // Capture the PayPal payment
    const captureResponse = await fetch(
      `${process.env.PAYPAL_API_BASE_URL || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    const captureData = await captureResponse.json();
    
    if (captureData.error) {
      console.error('PayPal capture error:', captureData);
      return res.status(500).json({ error: captureData.error.message });
    }

    if (captureData.status === 'COMPLETED') {
      // Find the registration by PayPal order ID and update it
      const { data: registration, error: findError } = await supabase
        .from('competition_registrations')
        .select('*')
        .eq('payment_id', orderID)
        .single();

      if (findError) {
        console.error('Database find error:', findError);
        return res.status(500).json({ error: 'Failed to find registration' });
      }

      // Update registration status
      const { error: updateError } = await supabase
        .from('competition_registrations')
        .update({
          status: 'confirmed',
          payment_data: captureData,
        })
        .eq('id', registration.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        return res.status(500).json({ error: 'Failed to update registration' });
      }

      res.status(200).json({ success: true, data: captureData });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ error: 'Failed to capture PayPal payment' });
  }
}