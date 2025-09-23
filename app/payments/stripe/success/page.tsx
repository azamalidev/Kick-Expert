"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function StripeOnboardSuccessPage() {
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function mark() {
      try {
        const params = new URLSearchParams(window.location.search);
        const acct = params.get('acct');
        const providedToken = params.get('token');
        if (!acct) {
          setErrorMsg('Missing acct in return URL');
          return setStatus('error');
        }

        const session = await supabase.auth.getSession();
        let userToken = session?.data?.session?.access_token;

        // Fallback: if Supabase client didn't return a session, try to find access_token in localStorage
        if (!userToken && typeof window !== 'undefined' && window.localStorage) {
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i) || '';
              const raw = localStorage.getItem(k) || '';
              if (!raw) continue;
              // try parse JSON
              try {
                const parsed = JSON.parse(raw);
                if (parsed?.access_token) {
                  userToken = parsed.access_token;
                  break;
                }
                // common supabase storage shape might embed session
                if (parsed?.currentSession?.access_token) {
                  userToken = parsed.currentSession.access_token;
                  break;
                }
                if (parsed?.data?.session?.access_token) {
                  userToken = parsed.data.session.access_token;
                  break;
                }
              } catch (e) {
                // not JSON, scan text for access_token
                if (raw.includes('access_token') && raw.includes('refresh_token')) {
                  try {
                    const p = JSON.parse(raw);
                    if (p?.access_token) {
                      userToken = p.access_token;
                      break;
                    }
                  } catch (e2) {
                    // ignore
                  }
                }
              }
            }
          } catch (e) {
            // ignore localStorage read errors
          }
        }

        const bodyPayload: any = { providerAccountId: acct };
        if (providedToken) bodyPayload.token = providedToken;

        // If there's no session token and no token in URL, attempt to fetch the stored return_token from the debug endpoint (dev-only)
        if (!userToken && !providedToken) {
          try {
            const dbgRes = await fetch(`/api/debug/payment-account?acct=${encodeURIComponent(acct)}`);
            if (dbgRes.ok) {
              const dbgJson = await dbgRes.json().catch(() => null);
              const stored = dbgJson?.data?.metadata?.return_token;
              if (stored) bodyPayload.token = stored;
            }
          } catch (dbgErr) {
            // ignore; we'll proceed without token
          }
        }

        const headers: any = { 'Content-Type': 'application/json' };
        if (userToken) headers.Authorization = `Bearer ${userToken}`;

        const res = await fetch('/api/payments/stripe/mark-verified', {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload)
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setErrorMsg(JSON.stringify(body));
          setStatus('error');
        } else {
          const json = await res.json().catch(() => ({}));
          // if server responded with kyc_status unverified, surface it
          if (json?.kyc_status && json.kyc_status !== 'verified') {
            setErrorMsg(JSON.stringify(json));
            setStatus('error');
          } else {
            setStatus('ok');
          }
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    }
    // run once on mount
    mark();
  }, []);

  return (
    <div className="max-w-xl mx-auto py-16 px-6 text-center">
      {status === 'pending' && <div><h2 className="text-2xl font-semibold">Finishing setup...</h2><p className="mt-2 text-sm text-gray-600">We're finalizing your payout setup. Please wait.</p></div>}
      {status === 'ok' && <div><h2 className="text-2xl font-semibold">All set!</h2><p className="mt-2 text-sm text-gray-600">Your payout setup was completed. You can now request withdrawals.</p><div className="mt-6"><a href="/profile" className="px-4 py-2 bg-blue-600 text-white rounded">Go to Profile</a></div></div>}
      {status === 'error' && <div><h2 className="text-2xl font-semibold">Couldn't verify</h2><p className="mt-2 text-sm text-gray-600">There was a problem verifying your payout setup. Please return to the onboarding link or contact support.</p>
        {errorMsg && <pre className="mt-3 p-3 bg-gray-50 rounded text-xs text-red-700">{errorMsg}</pre>}
        <div className="mt-6"><a href="/profile" className="px-4 py-2 bg-gray-200 text-gray-800 rounded">Back to profile</a></div></div>}
    </div>
  );
}
