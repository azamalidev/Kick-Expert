'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { CreditCard, Gift, Trophy, RefreshCw, X, DollarSign, Coins } from 'lucide-react';

interface CreditBalance {
  purchased_credits: number;
  winnings_credits: number;
  referral_credits: number;
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'stripe' | 'paypal') => void;
  packageName: string;
  amount: number;
}

interface PayPalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  credits: number;
  onPaymentSuccess: () => void;
}

interface BuyCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPurchase: (price: number, credits: number, method: 'stripe' | 'paypal') => void;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PayPalPaymentModal: React.FC<PayPalPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  credits,
  onPaymentSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayPalPayment = async () => {
    setIsProcessing(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to purchase credits');
        return;
      }

      // Get the user ID from session
      const userId = session.user?.id;
      if (!userId) {
        toast.error('User session is invalid');
        return;
      }

      const response = await fetch('/api/paypal-create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          amount: amount,
          credits: credits,
          userId: userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PayPal order');
      }

      const result = await response.json();
      
      if (result.approvalUrl) {
        window.location.href = result.approvalUrl;
      } else {
        throw new Error('No approval URL received from PayPal');
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      toast.error('Failed to process PayPal payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white relative">
              <h2 className="text-xl font-bold text-center">Pay with PayPal</h2>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-white hover:text-blue-200 transition-colors"
                disabled={isProcessing}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-600">Payment for <span className="font-semibold">{credits} Credits</span></p>
                <p className="text-2xl font-bold text-blue-600">${amount}</p>
              </div>

              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Redirecting to PayPal...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-blue-800 text-sm">
                      You will be redirected to PayPal to complete your payment securely.
                    </p>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={onClose}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePayPalPayment}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <span>Continue to PayPal</span>
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
  packageName,
  amount
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-4 text-white relative">
              <h2 className="text-xl font-bold text-center">Select Payment Method</h2>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-white hover:text-lime-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-600">Payment for <span className="font-semibold">{packageName}</span></p>
                <p className="text-2xl font-bold text-lime-600">${amount}</p>
              </div>

              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectMethod('stripe')}
                  className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-lime-500 hover:bg-lime-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <CreditCard className="text-white" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Credit/Debit Card</p>
                      <p className="text-sm text-gray-500">Pay with Stripe</p>
                    </div>
                  </div>
                  <div className="text-blue-600 font-semibold">Stripe</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectMethod('paypal')}
                  className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M7.2 18c-.3 0-.6-.1-.8-.4L3 14.5c-.3-.3-.3-.8 0-1.1.3-.3.8-.3 1.1 0l2.9 2.9L18.7 5.3c.3-.3.8-.3 1.1 0 .3.3.3.8 0 1.1L8 17.6c-.2.2-.5.4-.8.4z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">PayPal</p>
                      <p className="text-sm text-gray-500">Pay with your PayPal account</p>
                    </div>
                  </div>
                  <div className="text-blue-600 font-semibold">PayPal</div>
                </motion.button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-300">
              <button
                onClick={onClose}
                className="w-full text-gray-600 hover:text-gray-800 font-semibold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const BuyCreditModal: React.FC<BuyCreditModalProps> = ({
  isOpen,
  onClose,
  onSelectPurchase
}) => {
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{
    id: string;
    credits: number;
    price: number;
    description: string;
  } | null>(null);
  
  const creditPackages = [
    { id: 'starter', credits: 50, price: 50, popular: false, description: 'Perfect for beginners' },
    { id: 'popular', credits: 100, price: 100, popular: true, description: 'Most popular choice' },
    { id: 'premium', credits: 200, price: 200, popular: false, description: 'Best value for pros' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto scrollbar-hide"
            >
              {/* Header Section */}
              <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-6 text-white relative">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-white hover:text-lime-200 transition-colors"
                >
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-2">Buy Credits</h2>
                <p className="text-lime-50">
                  Select a credit package to get started - 1 Credit = $1
                </p>
              </div>

              {/* Body Section */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {creditPackages.map((pkg) => (
                    <motion.div
                      key={pkg.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative bg-white rounded-xl border-2 ${
                        pkg.popular ? 'border-lime-500' : 'border-gray-200'
                      } p-6 shadow-lg cursor-pointer transition-all duration-200 hover:border-lime-500`}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setShowPaymentMethods(true);
                      }}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-lime-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                            MOST POPULAR
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col items-center text-center">
                        <div className="text-5xl font-bold text-lime-600 mb-2">
                          {pkg.credits}
                        </div>
                        <div className="text-gray-600 font-medium mb-2">Credits</div>
                        <div className="text-sm text-gray-500 mb-4">{pkg.description}</div>
                        <div className="text-3xl font-bold text-gray-900 mb-4">
                          ${pkg.price}
                        </div>
                        <button
                          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                            pkg.popular
                              ? 'bg-lime-500 text-white hover:bg-lime-600'
                              : 'bg-lime-100 text-lime-700 hover:bg-lime-200'
                          }`}
                        >
                          Purchase Now
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Info Section */}
                <div className="mt-8 bg-lime-50 rounded-lg p-6 border border-lime-200">
                  <h3 className="font-semibold text-lime-800 mb-3">Important Information</h3>
                  <ul className="text-sm text-lime-700 space-y-2">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-lime-500 rounded-full mr-2"></span>
                      Each credit is worth $1 USD
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-lime-500 rounded-full mr-2"></span>
                      Credits never expire and can be used anytime
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-lime-500 rounded-full mr-2"></span>
                      Purchased credits can be refunded to original payment method
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-lime-500 rounded-full mr-2"></span>
                      All prices include payment processing fees
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-lime-500 rounded-full mr-2"></span>
                      Credits are non-transferable between accounts
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedPackage && (
        <PaymentMethodModal
          isOpen={showPaymentMethods}
          onClose={() => setShowPaymentMethods(false)}
          onSelectMethod={(method) => {
            setShowPaymentMethods(false);
            onSelectPurchase(selectedPackage.price, selectedPackage.credits, method);
          }}
          packageName={`${selectedPackage.credits} Credits Package`}
          amount={selectedPackage.price}
        />
      )}
    </>
  );
};

const CreditManagement: React.FC = () => {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuyModalOpen, setBuyModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setIsRefreshing(true);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to view credits');
        return;
      }
      
      const response = await fetch('/api/credits', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      setBalance(data);
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to fetch credit balance');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{ price: number; credits: number } | null>(null);

  const handlePurchaseCredits = async (price: number, credits: number, method: 'stripe' | 'paypal') => {
    try {
      // Get the current session
      const { data: { session: userSession } } = await supabase.auth.getSession();
      
      if (!userSession) {
        toast.error('Please sign in to purchase credits');
        return;
      }

      if (method === 'paypal') {
        setSelectedPayment({ price, credits });
        setShowPayPalModal(true);
        return;
      }

      // Stripe payment
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.access_token}`
        },
        body: JSON.stringify({
          amount: price,
          credits: credits,
          userId: userSession.user.id, // Include the user ID
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error starting purchase:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start purchase process');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Credit Balance</h1>
        <button
          onClick={() => setBuyModalOpen(true)}
          className="bg-lime-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-lime-700 transition-colors flex items-center"
        >
          <CreditCard className="mr-2" size={20} />
          Buy Credits
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <button
              onClick={fetchBalance}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Purchased Credits</h2>
          <p className="text-3xl font-bold text-green-600">
            {balance?.purchased_credits || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Refundable to payment method</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-lime-100 rounded-lg">
              <Coins className="h-6 w-6 text-lime-600" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Winnings Credits</h2>
          <p className="text-3xl font-bold text-lime-600">
            {balance?.winnings_credits || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Withdrawable to your account</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-lime-100 rounded-lg">
              <Gift className="h-6 w-6 text-lime-600" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Referral Credits</h2>
          <p className="text-3xl font-bold text-lime-600">
            {balance?.referral_credits || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">For competition entry only</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Credit System Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Using Your Credits</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-lime-500 mr-2">•</span>
                Enter competitions using any type of credits
              </li>
              <li className="flex items-start">
                <span className="text-lime-500 mr-2">•</span>
                Credits are deducted in order: Referral → Purchased → Winnings
              </li>
              <li className="flex items-start">
                <span className="text-lime-500 mr-2">•</span>
                Win competitions to earn more credits
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Credit Types</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-lime-500 mr-2">•</span>
                Purchased Credits: Refundable to original payment method
              </li>
              <li className="flex items-start">
                <span className="text-lime-500 mr-2">•</span>
                Winnings Credits: Can be withdrawn to your account
              </li>
              <li className="flex items-start">
                <span className="text-lime-500 mr-2">•</span>
                Referral Credits: Use for competition entry only
              </li>
            </ul>
          </div>
        </div>
      </div>

      <BuyCreditModal
        isOpen={isBuyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        onSelectPurchase={handlePurchaseCredits}
      />

      {selectedPayment && (
        <PayPalPaymentModal
          isOpen={showPayPalModal}
          onClose={() => setShowPayPalModal(false)}
          amount={selectedPayment.price}
          credits={selectedPayment.credits}
          onPaymentSuccess={() => {
            setShowPayPalModal(false);
            fetchBalance();
          }}
        />
      )}
    </div>
  );
};

export default CreditManagement;