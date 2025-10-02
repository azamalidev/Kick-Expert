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
        // First, detect any explicit error parameters in query or fragment
        const params = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const error = params.get('error') || hash.get('error');
        const error_code = params.get('error_code') || hash.get('error_code');
        const error_description = params.get('error_description') || hash.get('error_description');
        if (error || error_code || error_description) {
          console.warn('Auth callback received error params:', { error, error_code, error_description });
          setErrorDetails({ error: error || undefined, error_code: error_code || undefined, error_description: error_description || undefined });
          setStatus('error');
          return;
        }

    // Try to parse session directly from the URL (recommended)
        // supabase-js v2 exposes getSessionFromUrl which will parse tokens and store session
        let session: any = null;
        try {
          // @ts-ignore - some supabase versions may not have this helper; fall through to polling
          const { data, error: parseError } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (parseError) {
            console.warn('getSessionFromUrl parse error:', parseError);
          }
          session = data?.session ?? null;
        } catch (e) {
          // ignore and fallback to polling
          console.debug('getSessionFromUrl not available, falling back to polling');
          session = null;
        }

        // Fallback: poll briefly for a session (handles slower clients)
        if (!session) {
          const maxAttempts = 12; // ~2.4s total with 200ms interval
          let attempt = 0;
          while (attempt < maxAttempts) {
            const { data: sdata, error } = await supabase.auth.getSession();
            if (error) {
              console.warn('getSession attempt error:', error);
            }
            if (sdata?.session) {
              session = sdata.session;
              break;
            }
            await new Promise((res) => setTimeout(res, 200));
            attempt += 1;
          }
        }

        // If there's no session but the verify flag is present on the URL, redirect to complete-profile with verified flag
        const verifiedFlag = params.get('verified');
        const prefillEmail = params.get('email');
        if (!session && verifiedFlag === '1') {
          // send user to complete-profile so they can finish setup without signing in
          const completeUrl = `/complete-profile?verified=1${prefillEmail ? `&email=${encodeURIComponent(prefillEmail)}` : ''}`;
          router.replace(completeUrl);
          return;
        }
        if (!session && verifiedFlag !== '1') throw new Error('No user session found after waiting for auth initialization');

        // Best-effort: mark email confirmed in our users table if we have a session
        if (session) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ email_confirmed: true })
            .eq('id', session.user.id);
          if (updateError) console.warn('Unable to update email_confirmed:', updateError);
        }

        // Success: redirect to complete-profile (replace so back button doesn't go back to callback)
        setStatus('success');
        router.replace('/complete-profile');
      } catch (err) {
        console.error('Auth callback error:', err);
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
