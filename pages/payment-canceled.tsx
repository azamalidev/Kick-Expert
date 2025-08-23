import { useRouter } from 'next/router';
import { XCircle } from 'lucide-react';

export default function PaymentCanceled() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-yellow-600 mb-2">Payment Canceled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was canceled. No charges have been made to your account.
        </p>
        <button
          onClick={() => router.push('/live-competitions')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Return to Competitions
        </button>
      </div>
    </div>
  );
}