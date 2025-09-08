'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          // Update email_confirmed in users table
          const { error: updateError } = await supabase
            .from('users')
            .update({ email_confirmed: true })
            .eq('id', session.user.id);

          if (updateError) console.error(updateError);

          setStatus('success');

          // Redirect after short delay (optional)
          setTimeout(() => {
            router.push('/');
          }, 2500);
        } else {
          throw new Error('No user session found');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
      }
    };

    handleAuth();
  }, [router]);

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
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <Link href="/" className="flex items-center justify-center mb-6">
            <Image
              src="/logo.png"
              alt="KickExpert Logo"
              width={40}
              height={40}
              className="w-10 h-10 md:w-12 md:h-12"
            />
            <span className="ml-2 text-lime-400 font-bold text-xl md:text-2xl">
              Kick<span className="text-black">Expert</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Confirmed!</h1>
          <p className="text-gray-600">Your email has been successfully verified. Redirecting...</p>
        </div>
      </div>
    );
  }

  return null;
}
