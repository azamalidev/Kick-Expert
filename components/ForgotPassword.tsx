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

  const getChangePasswordUrl = () => {
    if (process.env.NEXT_PUBLIC_SITE_URL) return `${process.env.NEXT_PUBLIC_SITE_URL}/change-password`;
    if (typeof window !== 'undefined') return `${window.location.origin}/change-password`;
    return '/change-password';
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Sending password reset email...');

    try {
      // Send password reset request to our server so it sends KickExpert-branded email
      const resp = await fetch('/api/password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        // Handle specific error messages from the server
        if (resp.status === 404) {
          throw new Error('No account found with this email address. Please check your email or sign up.');
        }
        throw new Error(data?.message || 'Failed to send reset email');
      }

      toast.success('Password reset email sent! Check your inbox.', { id: toastId });
      setEmail('');
      setTimeout(() => router.push('/login'), 2000);
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
      <div className="hidden lg:flex w-1/2 relative">
        <div className="fixed top-0 left-0 w-1/2 h-full overflow-hidden">
          <Image
            src="/images/slide1.jpg"
            alt="Password Reset Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
          <div className="absolute bottom-10 left-0 right-0">
            <div className="max-w-md mx-auto text-center text-white px-4">
              <h2 className="text-3xl font-bold mb-2">Reset Your Password</h2>
              <p className="text-lg">Enter your email to receive a reset link</p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Link href="/" className="flex items-center">
                <div className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="KickExpert Logo"
                    width={48}
                    height={48}
                    className="w-12 h-12"
                  />
                  <span className="ml-2 text-lime-500 font-bold text-2xl">
                    Kick<span className="text-gray-800">Expert</span>
                  </span>
                </div>
              </Link>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
              <p className="text-gray-600 mt-2">Enter your email to reset your password</p>
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
            <div className="mt-6 text-center space-y-2">
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