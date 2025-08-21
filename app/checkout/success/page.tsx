"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'pending'|'success'|'error'>('pending');
  const [message, setMessage] = useState('Verifying payment...');
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string|null>(null);

  useEffect(() => {
    setReady(true);
    if (typeof window !== 'undefined') {
      try {
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        if (userObj && userObj.id) {
          setUserId(userObj.id);
        }
      } catch {
        setUserId(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!searchParams) return;
    const competitionKey = searchParams.get('competitionId');

    // If userId is not found in localStorage, try to get from session (Supabase)
    async function fetchUserIdIfMissing() {
      if (!userId) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.id) {
            setUserId(user.id);
            return user.id;
          }
        } catch {
          setUserId(null);
        }
      }
      return userId;
    }

    // Fetch competition UUID and entry_fee from backend
    async function fetchCompetitionInfo(key: string) {
      const res = await fetch(`/api/get-competition-id?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      return data; // { id: uuid, entry_fee: number }
    }

    (async () => {
      const uid = await fetchUserIdIfMissing();
      if (!competitionKey || !uid) {
        setStatus('error');
        setMessage('Missing competition or user info.');
        return;
      }

      // Get competition UUID and entry_fee
      const compInfo = await fetchCompetitionInfo(competitionKey);
      if (!compInfo.id || typeof compInfo.entry_fee !== 'number') {
        setStatus('error');
        setMessage('Competition not found or missing entry fee.');
        return;
      }

      // Insert registration
      const regRes = await fetch('/api/register-competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, competitionId: compInfo.id, status: 'confirmed', paid_amount: compInfo.entry_fee }),
      });
      const regData = await regRes.json();
      if (regData.success) {
        setStatus('success');
        setMessage('✅ Payment Successful! You are registered. Redirecting to dashboard...');
        setTimeout(() => router.push('/dashboard'), 2500);
      } else {
        setStatus('error');
        setMessage('Registration failed: ' + (regData.error || 'Unknown error'));
      }
    })();
  }, [searchParams, router, ready, userId]);

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-lime-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Payment Status</h1>
      <div className={`text-lg mb-4 ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>{message}</div>
      {status === 'pending' && <div className="animate-spin h-8 w-8 border-4 border-lime-500 border-t-transparent rounded-full"></div>}
    </div>
  );
}
