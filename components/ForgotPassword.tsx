'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../lib/supabase/provider';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();
  const supabase = useSupabase(); // Correct: useSupabase returns SupabaseClient directly

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Sending password reset email...');

    try {
      // Send password reset email using Supabase auth
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/change-password`,
      });

      if (error) {
        throw new Error(`Failed to send reset email: ${error.message}`);
      }

      toast.success('Password reset email sent! Check your inbox.', { id: toastId });
      setEmail('');
      setTimeout(() => router.push('/change-password'), 2000);
    } catch (error: any) {
      console.error('Error sending reset email:', error.message || error);
      toast.error(error.message || 'Failed to send reset email. Please try again.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#363636', color: '#fff' },
          success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { duration: 4000 },
          loading: { duration: Infinity },
        }}
      />
      <div className="hidden lg:flex w-1/2 relative overflow-hidden h-[80vh] self-center">
        <div className="relative rounded-2xl w-full h-full">
          <Image
            src="/images/slide1.jpg"
            alt="Password Reset Background"
            fill
            className="object-contain"
            priority
          />
          <div className="absolute bottom-10 left-0 right-0">
            <div className="max-w-md mx-auto text-center text-white">
              <h2 className="text-2xl font-bold">Reset Your Password</h2>
              <p className="text-lg mb-4">Enter your email to receive a reset link</p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 mr-4 bg-lime-100 rounded-full">
                <svg
                  className="w-6 h-6 text-lime-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-600 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200"
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Send Reset Link
                <svg
                  className="w-5 h-5 ml-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="text-lime-600 hover:text-lime-800 font-medium">
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}