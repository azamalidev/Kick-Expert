import { supabase } from '@/lib/supabaseClient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: { method: string; body: { orderID: any; registrationId: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message?: string; error?: any; success?: boolean; data?: any; }): void; new(): any; }; }; }) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orderID, registrationId } = req.body;

  try {
    const auth = Buffer.from(
      process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET
    ).toString('base64');

    const response = await fetch(
      `${process.env.PAYPAL_API_BASE_URL}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.error) {
      console.error('PayPal capture error:', data);
      return res.status(500).json({ error: data.error.message });
    }

    if (data.status === 'COMPLETED') {
      // Update registration status in database
      const { error: dbError } = await supabase
        .from('competition_registrations')
        .update({
          status: 'confirmed',
          payment_data: data,
        })
        .eq('id', registrationId);

      if (dbError) {
        console.error('Database update error:', dbError);
        return res.status(500).json({ error: 'Failed to update registration' });
      }

      return res.status(200).json({ success: true, data });
    } else {
      return res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ error: 'Failed to capture PayPal order' });
  }
}