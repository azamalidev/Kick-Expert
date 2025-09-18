'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorDetails, setErrorDetails] = useState<{ error?: string; error_code?: string; error_description?: string } | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Parse potential error parameters from querystring or hash fragment so
        // we can surface Supabase / OAuth errors that were returned to the redirect URL.
        const params = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const error = params.get('error') || hash.get('error');
        const error_code = params.get('error_code') || hash.get('error_code');
        const error_description = params.get('error_description') || hash.get('error_description');
        if (error || error_code || error_description) {
          console.warn('Auth callback received error params:', { error, error_code, error_description });
          setErrorDetails({ error: error || undefined, error_code: error_code || undefined, error_description: error_description || undefined });
          // If Supabase returned an error, surface it immediately instead of waiting for session.
          setStatus('error');
          return;
        }

        // supabase may still be initializing and parsing the URL fragment/code.
        // Poll briefly for a session before redirecting so downstream pages
        // (like /complete-profile) don't immediately redirect to /login.
        const maxAttempts = 12; // ~2.4s total with 200ms interval
        let attempt = 0;
        let foundSession: any = null;

        while (attempt < maxAttempts) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('getSession attempt error:', error);
          }

          if (session?.user) {
            foundSession = session;
            break;
          }

          // wait a short bit and try again
          await new Promise((res) => setTimeout(res, 200));
          attempt += 1;
        }

        if (!foundSession) {
        throw new Error('No user session found after waiting for auth initialization');
        }

        // Mark email confirmed server-side (best-effort)
        const { error: updateError } = await supabase
          .from('users')
          .update({ email_confirmed: true })
          .eq('id', foundSession.user.id);

        if (updateError) console.warn('Unable to update email_confirmed:', updateError);

        // After email confirmation, always send the user to complete-profile so they
        // can finish onboarding. The CompleteProfile component will redirect to
        // '/' if the profile already exists.
        setStatus('success');
        router.replace('/complete-profile');
      } catch (err) {
          console.error('Auth callback error:', err);
          // If we already parsed error details above, keep them, otherwise set a generic message
          if (!errorDetails) setErrorDetails({ error: 'server_error', error_description: (err as any)?.message || String(err) });
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
