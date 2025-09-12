'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PayPalCancel() {
  const router = useRouter();

  useEffect(() => {
    toast.error('Payment was cancelled.');
    // Redirect after a short delay
    const timer = setTimeout(() => {
      router.push('/credits/manage');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center"
      >
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 mb-4">Your payment was cancelled and no credits were purchased.</p>
        <div className="animate-pulse">
          <p className="text-sm text-gray-500">Redirecting to Credit Management...</p>
        </div>
      </motion.div>
    </div>
  );
}
