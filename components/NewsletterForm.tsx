"use client";

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true;
    async function loadName() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;

        const metaName = (user.user_metadata as any)?.full_name || (user.user_metadata as any)?.name || null;
        if (metaName && mounted) {
          setName(metaName);
          return;
        }

        // fallback to profiles.username
        const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', user.id).limit(1).single();
        if (profile?.username && mounted) setName(profile.username);
      } catch (err) {
        // ignore
      }
    }
    loadName();
    return () => { mounted = false; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setMessage('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('sent');
        setMessage('Confirmation email sent — check your inbox.');
        setEmail('');
        setName('');
      } else {
        setStatus('error');
        setMessage(data?.message || 'Error subscribing');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-4 rounded-md shadow">
      <h3 className="text-lg font-semibold mb-2"><span className="text-lime-400">Kick</span>Expert Newsletter</h3>
      <p className="text-sm text-gray-600 mb-4">Weekly tips, match previews and exclusive offers.</p>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">Name (optional)</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border-gray-200 rounded-md" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" className="mt-1 block w-full border-gray-200 rounded-md" />
      </div>
  <button disabled={status === 'sending'} type="submit" className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-md">{status === 'sending' ? 'Sending...' : 'Subscribe'}</button>
      {message && <p className={`mt-3 text-sm ${status === 'error' ? 'text-red-600' : 'text-green-700'}`}>{message}</p>}
    </form>
  );
}
