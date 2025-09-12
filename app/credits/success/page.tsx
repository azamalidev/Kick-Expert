'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

// Static success display component
function SuccessDisplay() {
  return (
    <div className="flex items-center justify-center px-4 py-24">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-lime-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          We&apos;re processing your credit purchase. Your credits will be added to your account shortly.
        </p>
        <div className="animate-pulse flex justify-center">
          <div className="h-2 w-24 bg-lime-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function CreditsSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const transactionId = searchParams?.get('transactionId');

  useEffect(() => {
    if (!sessionId && !transactionId) {
      router.replace('/credits/manage');
      return;
    }

    let mounted = true;

    const confirmPurchase = async () => {
      try {
        let response;
        if (sessionId) {
          // Stripe payment confirmation
          response = await fetch(`/api/credits/success?session_id=${sessionId}`);
        } else if (transactionId) {
          // PayPal payment confirmation
          response = await fetch(`/api/paypal-capture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transactionId }),
          });
        }

        if (!response?.ok) {
          throw new Error('Failed to confirm purchase');
        }
        const data = await response.json();
        
        if (mounted) {
          toast.success(`Successfully added ${data.credits} credits to your account!`);
          // Redirect to credits page after 3 seconds
          setTimeout(() => {
            if (mounted) {
              router.replace('/credits/manage');
            }
          }, 3000);
        }
      } catch (error) {
        console.error('Error confirming purchase:', error);
        if (mounted) {
          toast.error('There was an error confirming your purchase');
          // Redirect to credits page after error
          setTimeout(() => {
            if (mounted) {
              router.replace('/credits/manage');
            }
          }, 3000);
        }
      }
    };

    confirmPurchase();

    return () => {
      mounted = false;
    };
  }, [sessionId, transactionId, router]);

  return <SuccessDisplay />;
}
