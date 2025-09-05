'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          // Update email_confirmed in users table
          const { error: updateError } = await supabase
            .from('users')
            .update({ email_confirmed: true })
            .eq('id', session.user.id);

          if (updateError) console.error(updateError);

          setStatus('success');
        } else {
          throw new Error('No user session found');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
      }
    };

    handleAuth();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirming your email...</h1>
          <p className="text-gray-600">Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-100">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Confirmation Failed</h1>
          <p className="text-gray-600 mb-6">Something went wrong. Please try logging in again.</p>
          <Link
            href="/login"
            className="px-6 py-3 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Success Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 to-gray-100">
      <div className="max-w-md w-full text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="KickExpert Logo" width={60} height={60} />
            <span className="ml-2 text-lime-500 font-bold text-2xl">
              Kick<span className="text-gray-800">Expert</span>
            </span>
          </Link>
        </div>

        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-lime-100">
            <svg
              className="w-10 h-10 text-lime-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Welcome to <span className="font-semibold text-lime-500">KickExpert</span> 🎉  
          Your account is ready to use.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col space-y-3">
          <Link
            href="/complete-profile"
            className="px-6 py-3 bg-lime-500 text-white rounded-lg shadow hover:bg-lime-600 transition"
          >
            Complete Profile
          </Link>
          <Link
            href="/competitions"
            className="px-6 py-3 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-900 transition"
          >
            Join Competitions
          </Link>
        </div>
      </div>
    </div>
  );
}
