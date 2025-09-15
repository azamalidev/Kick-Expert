'use client'

import React, { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { CreditBalance, CreditPackage } from '@/types/credits';

const creditPackages: CreditPackage[] = [
  { id: 'basic', name: 'Basic Pack', credits: 100, price: 10, currency: 'USD' },
  { id: 'popular', name: 'Popular Pack', credits: 250, price: 20, currency: 'USD' },
  { id: 'premium', name: 'Premium Pack', credits: 700, price: 50, currency: 'USD' }
];

const Credits: React.FC = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCreditBalance();
    }
  }, [user]);

  const fetchCreditBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setBalance(data);
    } catch (error) {
      console.error('Error fetching credit balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (packageId: string) => {
    try {
      const selectedPackage = creditPackages.find(pkg => pkg.id === packageId);
      if (!selectedPackage) return;

      // Create a checkout session
      const response = await fetch('/api/create-credit-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          amount: selectedPackage.price,
          credits: selectedPackage.credits,
        }),
      });

      const session = await response.json();
      
      // Redirect to checkout
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Credit Balance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Purchased Credits</h3>
          <p className="text-2xl font-bold text-blue-600">{balance?.purchased_credits || 0}</p>
          <p className="text-sm text-gray-500">Refundable to original payment method</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Winnings Credits</h3>
          <p className="text-2xl font-bold text-green-600">{balance?.winnings_credits || 0}</p>
          <p className="text-sm text-gray-500">Withdrawable to your account</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Referral Credits</h3>
          <p className="text-2xl font-bold text-purple-600">{balance?.referral_credits || 0}</p>
          <p className="text-sm text-gray-500">For competition entry only</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">Buy Credits</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creditPackages.map((pkg) => (
          <div key={pkg.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
            <p className="text-3xl font-bold text-green-600 mb-4">
              {pkg.credits} Credits
            </p>
            <p className="text-gray-600 mb-4">
              ${pkg.price} {pkg.currency}
            </p>
            <button
              onClick={() => handleBuyCredits(pkg.id)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Credits;