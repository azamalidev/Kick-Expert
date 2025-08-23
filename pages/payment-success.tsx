import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PaymentSuccess() {
  const router = useRouter();
  const { registrationId, token, PayerID } = router.query;
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get the registration to find the PayPal order ID
        const { data: registration, error } = await supabase
          .from('competition_registrations')
          .select('*')
          .eq('id', registrationId)
          .single();

        if (error) {
          throw new Error('Registration not found');
        }

        // Capture the payment
        const response = await fetch('/api/paypal-capture-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderID: registration.payment_id }),
        });

        const result = await response.json();

        if (result.success) {
          setStatus('success');
          setMessage('Payment successful! You are now registered for the competition.');
          
          // Redirect to competitions page after 3 seconds
          setTimeout(() => {
            router.push('/live-competitions');
          }, 3000);
        } else {
          throw new Error(result.error || 'Payment failed');
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        setStatus('error');
        setMessage('Payment failed. Please try again or contact support.');
      }
    };

    if (registrationId) {
      processPayment();
    }
  }, [registrationId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h1>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h1>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h1>
          </>
        )}
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        {status !== 'processing' && (
          <button
            onClick={() => router.push('/live-competitions')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Return to Competitions
          </button>
        )}
      </div>
    </div>
  );
}