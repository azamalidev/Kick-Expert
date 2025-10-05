'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { CreditCard, Gift, Trophy, RefreshCw, X, DollarSign, Coins, Zap, Plus, Sparkles, HelpCircle } from 'lucide-react';

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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white relative">
              <h2 className="text-xl font-bold text-center">Pay with PayPal</h2>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-blue-200 transition-colors"
                disabled={isProcessing}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-600">Payment for <span className="font-semibold">{credits} Credits</span></p>
                <p className="text-2xl font-bold text-blue-600 mt-1">${amount}</p>
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
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
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

// PayPal Withdraw modal: collect PayPal email and amount, then submit withdrawal
interface PayPalWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number; // not used, amount is entered by user
  credits: number; // available winnings credits
  onSubmit: (amount: number, paypalEmail: string) => Promise<void>;
}

const PayPalWithdrawModal: React.FC<PayPalWithdrawModalProps> = ({ isOpen, onClose, credits, onSubmit }) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MIN_WITHDRAW = 20;
  const MAX_WITHDRAW = 50;

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setPaypalEmail('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const submit = async () => {
    const amt = amount === '' ? 0 : Math.floor(Number(amount));
    if (!amt || amt < MIN_WITHDRAW) {
      toast.error(`Minimum withdrawal is ${MIN_WITHDRAW} credits`);
      return;
    }
    if (amt > MAX_WITHDRAW) {
      toast.error(`Maximum withdrawal per request is ${MAX_WITHDRAW} credits`);
      return;
    }
    if (amt > credits) {
      toast.error('Insufficient winnings credits');
      return;
    }
    const email = paypalEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error('Enter a valid PayPal email');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(amt, email);
      toast.success('Withdrawal requested — pending admin approval');
      onClose();
    } catch (e) {
      console.error('PayPal withdraw submit error', e);
      toast.error(e instanceof Error ? e.message : 'Failed to submit withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-transparent bg-opacity-40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white relative">
              <h2 className="text-lg font-bold text-center">Withdraw via PayPal</h2>
              <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-blue-200"><X size={18} /></button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Enter your PayPal email and the amount of winnings credits to withdraw. Minimum 20 — max 50 per request.</p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">PayPal Email</label>
                <input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} placeholder="you@paypal.com" className="block w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (Credits)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">Cr</span>
                  <input type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))))} placeholder={`Enter amount to withdraw`} className="flex-1 block w-full rounded-r-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Available winnings: <strong>{credits} credits</strong></p>
              </div>

              <div className="flex space-x-3">
                <button onClick={onClose} disabled={isSubmitting} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg transition-colors">Cancel</button>
                <button onClick={submit} disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors">{isSubmitting ? 'Submitting...' : 'Request Withdrawal'}</button>
              </div>
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
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-5 text-white relative">
              <h2 className="text-xl font-bold text-center">Select Payment Method</h2>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-lime-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-600">Payment for <span className="font-semibold">{packageName}</span></p>

              </div>

              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectMethod('stripe')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-lime-400 hover:bg-lime-50 transition-all duration-200 shadow-sm"
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
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 shadow-sm"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
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
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={onClose}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 rounded-lg transition-colors"
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
  const [customAmount, setCustomAmount] = useState<number | ''>('');

  // Preset packages — 1 credit = $1 (platform does not mark up fees)
  const creditPackages = [
    { id: 'starter', credits: 10, price: 10, popular: false, description: 'Small starter pack' },
    { id: 'popular', credits: 20, price: 20, popular: true, description: 'Most popular choice' },
    { id: 'premium', credits: 50, price: 50, popular: false, description: 'Best value pack' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto scrollbar-hide"
            >
              {/* Header Section */}
              <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-6 text-white relative">
                <button
                  onClick={onClose}
                  className="absolute right-5 top-5 text-white hover:text-lime-200 transition-colors"
                >
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-2">Buy Credits</h2>
                <p className="text-lime-100">Select a credit package to get started - 1 Credit = $1</p>
              </div>

              {/* Body Section */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {creditPackages.map((pkg) => (
                    <motion.div
                      key={pkg.id}
                      whileHover={{ y: -5 }}
                      className={`relative bg-white rounded-xl border-2 ${
                        pkg.popular ? 'border-lime-500 shadow-lg' : 'border-gray-200'
                      } p-6 cursor-pointer transition-all duration-200 hover:shadow-md group`}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setShowPaymentMethods(true);
                      }}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-lime-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">MOST POPULAR</span>
                        </div>
                      )}

                      <div className="flex flex-col items-center text-center">
                        <div className="text-4xl font-bold text-lime-600 mb-2">{pkg.credits}</div>
                        <div className="text-gray-600 font-medium mb-2">Credits</div>
                        <div className="text-sm text-gray-500 mb-4">{pkg.description}</div>
                        <div className="text-2xl font-bold text-gray-900 mb-4">${pkg.price}</div>
                        <button
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setShowPaymentMethods(true);
                          }}
                          className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                            pkg.popular 
                              ? 'bg-lime-500 text-white hover:bg-lime-600' 
                              : 'bg-lime-100 text-lime-700 hover:bg-lime-200'
                          } group-hover:shadow-md`}
                        >
                          Purchase Now
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold mb-2 text-gray-600">Or enter a custom amount</label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-3 text-gray-400">$</span>
                      <input
                        type="number"
                        min={1}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value === '' ? '' : Math.max(1, Math.floor(Number(e.target.value))))}
                        placeholder="Enter Credits To Buy"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!customAmount || Number(customAmount) < 1) {
                          toast.error('Enter an amount of at least $1');
                          return;
                        }
                        const pkg = { id: 'custom', credits: Number(customAmount), price: Number(customAmount), description: 'Custom amount' };
                        setSelectedPackage(pkg as any);
                        setShowPaymentMethods(true);
                      }}
                      className="px-4 py-3 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-700 transition-colors flex items-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Buy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Fees are determined by Stripe/PayPal and are not collected by KickExpert. Credits are not deposits, do not accrue interest, and do not constitute stored value or gambling chips.</p>
                </div>

                {/* Info Section */}
                <div className="bg-lime-50 rounded-xl p-5 border border-lime-200">
                  <h3 className="font-semibold text-lime-800 mb-3 flex items-center">
                    <Sparkles size={16} className="mr-2" />
                    Important Information
                  </h3>
                  <ul className="text-sm text-lime-700 space-y-2">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-lime-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Each credit is worth $1 USD
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-lime-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Credits never expire and can be used anytime
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-lime-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Purchased credits can be refunded to original payment method
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-lime-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Fees are determined by Stripe/PayPal and are not collected by KickExpert
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-lime-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Credits are not deposits, do not accrue interest, and do not constitute stored value or gambling chips
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-lime-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Only Purchased Credits are refundable. Winnings Credits can be withdrawn. Referral Credits are non-withdrawable.
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
  
  // Withdraw Modal Component
  interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    maxAmount: number;
    onSubmit: (amount: number, method: 'stripe' | 'paypal', paypalEmail?: string) => Promise<void>;
    minAmount?: number;
    method: 'stripe' | 'paypal';
  }

  const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, maxAmount, onSubmit, minAmount = 20, method }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const MAX_WITHDRAW_PER_REQUEST = 50;
    const [paypalEmail, setPaypalEmail] = useState<string>('');

    useEffect(() => {
      if (!isOpen) {
        setAmount('');
        setIsSubmitting(false);
        setValidationError(null);
        setPaypalEmail('');
      }
    }, [isOpen]);

    const handleSubmit = async () => {
      // amount entered in credits (1 credit = $1)
      if (amount === '' || Number(amount) <= 0) {
        toast.error('Enter a valid number of credits');
        return;
      }

      const credits = Math.floor(Number(amount));
      if (credits < minAmount) {
        const msg = `Minimum withdrawal is ${minAmount} credits`;
        setValidationError(msg);
        toast.error(msg);
        return;
      }

      if (credits > MAX_WITHDRAW_PER_REQUEST) {
        const msg = `Maximum withdrawal per request is ${MAX_WITHDRAW_PER_REQUEST} credits`;
        setValidationError(msg);
        toast.error(msg);
        return;
      }

      if (method === 'paypal' && !paypalEmail.trim()) {
        const msg = 'PayPal email is required';
        setValidationError(msg);
        toast.error(msg);
        return;
      }

      if (credits > maxAmount) {
        toast.error('Insufficient winnings credits for this withdrawal');
        return;
      }

      try {
        setIsSubmitting(true);
        setValidationError(null);
        // convert credits to dollars (1:1) for backend amount
        await onSubmit(credits, method, paypalEmail);
        // Show success message from caller; optimistic UI update is handled by parent
        toast.success('Withdrawal request submitted — pending admin approval');
        onClose();
      } catch (err) {
        console.error('Withdrawal submission error:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to submit withdrawal');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-transparent bg-opacity-40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-5 text-white relative">
                <h2 className="text-lg font-bold text-center">Withdraw Winnings</h2>
                <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-lime-200">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">Withdraw funds from your winnings credits to your connected bank account. Minimum withdrawal: <strong>20 credits</strong>. Maximum per request: <strong>50 credits</strong>. <strong>Withdrawals are available only from Winnings Credits.</strong></p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (Credits)</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">Cr</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))))}
                      placeholder={`Enter amount to withdraw`}
                      className="flex-1 block w-full rounded-r-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-lime-500 outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Available winnings: <strong>{maxAmount} credits</strong></p>
                  {validationError && <p className="text-sm text-red-600 mt-2">{validationError}</p>}
                </div>

                {method === 'paypal' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">PayPal Email</label>
                    <input
                      type="email"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="Enter your PayPal email"
                      className="block w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-lime-500 outline-none"
                    />
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-lime-600 hover:bg-lime-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Request Withdrawal'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };


const CreditManagement: React.FC = () => {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuyModalOpen, setBuyModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawMin] = useState(20);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Zap },
    { id: 'buy', label: 'Buy Credits', icon: CreditCard },
    { id: 'withdraw', label: 'Withdraw', icon: DollarSign },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

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
  const [showPayPalWithdrawModal, setShowPayPalWithdrawModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{ price: number; credits: number } | null>(null);
  const [pendingWithdraw, setPendingWithdraw] = useState<any | null>(null);
  const [isWithdrawMethodOpen, setIsWithdrawMethodOpen] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'stripe' | 'paypal' | null>(null);

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

  // Handle withdrawal request submission (creates DB record, pending admin approval)
  const handleWithdrawSubmit = async (amount: number, method: 'stripe' | 'paypal', paypalEmail?: string) => {
    try {
      // Ensure session
      const { data: { session: userSession } } = await supabase.auth.getSession();
      if (!userSession) {
        throw new Error('Please sign in to request a withdrawal');
      }

      if (method === 'stripe') {
        // Check Stripe payment account / KYC status
        const statusRes = await fetch('/api/payments/stripe/status', { headers: { Authorization: `Bearer ${userSession.access_token}` } });
        if (!statusRes.ok) throw new Error('Failed to check payment account status');
        const statusBody = await statusRes.json();

        if (!statusBody.exists || statusBody.kyc_status !== 'verified') {
          // Trigger onboarding - get a fresh onboarding link
          const onboardRes = await fetch('/api/payments/stripe/onboard', { method: 'POST', headers: { Authorization: `Bearer ${userSession.access_token}` } });
          if (!onboardRes.ok) throw new Error('Failed to create onboarding link');
          const onboardBody = await onboardRes.json();
          if (onboardBody.url) {
            // Redirect user to Stripe onboarding
            window.location.href = onboardBody.url;
            return;
          }
          throw new Error('Could not get onboarding link');
        }
      }

      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.access_token}`
        },
        body: JSON.stringify({ amount, userId: userSession.user.id, method, paypal_email: paypalEmail })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create withdrawal request');
      }

      // Optimistically update UI: deduct winnings credits and notify the user
      setBalance((prev) => {
        if (!prev) return prev;
        const current = prev.winnings_credits || 0;
        return { ...prev, winnings_credits: Math.max(0, current - amount) };
      });
      // Try to parse server response to show details in confirmation modal
      let respJson: any = null;
      try {
        respJson = await response.json().catch(() => null);
      } catch (e) {
        respJson = null;
      }

      // Set pending withdrawal details for modal (fallback to amount if server didn't return details)
      setPendingWithdraw(respJson || { amount, status: 'pending', created_at: new Date().toISOString() });

      toast.success(`Requested ${amount} credits — deducted from your winnings and pending admin approval`);

      // Refresh balance in background to reconcile with server
      fetchBalance();
    } catch (err) {
      console.error('Withdraw submit error:', err);
      throw err;
    }
  };

  // Calculate total credits
  const totalCredits = (balance?.purchased_credits || 0) + 
                      (balance?.winnings_credits || 0) + 
                      (balance?.referral_credits || 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Management</h1>
          <p className="text-gray-600 mt-1">Manage your credits, purchases, and withdrawals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-lime-500 text-lime-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Total Credits Summary */}
            <div className="bg-gradient-to-r from-lime-500 to-lime-600 rounded-2xl p-6 text-white shadow-lg mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lime-100">Total Credits</p>
                  <h2 className="text-4xl font-bold mt-1">{totalCredits}</h2>
                  <p className="text-lime-100 text-sm mt-2">Available across all credit types</p>
                </div>
                <div className="bg-lime-400 bg-opacity-30 p-4 rounded-xl">
                  <Zap size={32} className="text-white" />
                </div>
              </div>
            </div>

            {/* Credit Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
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

              <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-lime-100 rounded-xl">
                    <Coins className="h-6 w-6 text-lime-600" />
                  </div>
                  {/* <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const available = balance?.winnings_credits || 0;
                        if (available < withdrawMin) {
                          toast.error(`Minimum withdrawal is ${withdrawMin} credits ($${withdrawMin})`);
                          return;
                        }
                        setIsWithdrawMethodOpen(true);
                      }}
                      className="ml-auto bg-lime-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-lime-700 transition-colors"
                    >
                      Withdraw
                    </button>
                  </div> */}
                </div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Winnings Credits</h2>
                <p className="text-3xl font-bold text-lime-600">
                  {balance?.winnings_credits || 0}
                </p>
                <p className="text-sm text-gray-500 mt-2">Withdrawable to your account</p>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-lime-100 rounded-xl">
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

            {/* Credit System Guide */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-8 border border-gray-200 transition hover:shadow-xl">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center">
                <Sparkles className="mr-3 text-lime-600 animate-pulse" size={22} />
                Credit System Guide
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-lime-400 transition">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                    <span className="w-2 h-2 rounded-full bg-lime-500 mr-2"></span>
                    Using Your Credits
                  </h3>
                  <ul className="space-y-4 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-lime-600 mr-3">✅</span>
                      Enter competitions using any type of credits
                    </li>
                    <li className="flex items-start">
                      <span className="text-lime-600 mr-3">✅</span>
                      Credits are deducted in order: Referral → Winnings → Purchased
                    </li>
                    <li className="flex items-start">
                      <span className="text-lime-600 mr-3">✅</span>
                      Win competitions to earn more credits
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-lime-400 transition">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                    <span className="w-2 h-2 rounded-full bg-lime-500 mr-2"></span>
                    Credit Types
                  </h3>
                  <ul className="space-y-4 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-lime-600 mr-3">💳</span>
                      <span><strong>Purchased Credits:</strong> Refundable to original payment method</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-lime-600 mr-3">🏆</span>
                      <span><strong>Winnings Credits:</strong> Can be withdrawn to your account</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-lime-600 mr-3">🎁</span>
                      <span><strong>Referral Credits:</strong> Use for competition entry only</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'buy' && (
          <motion.div
            key="buy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <CreditCard size={48} className="mx-auto text-lime-600 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Buy Credits</h3>
                <p className="text-gray-600">Purchase credits to enter competitions and enhance your experience</p>
              </div>

              {/* Quick Purchase Button */}
              <div className="bg-gradient-to-r from-lime-500 to-lime-600 rounded-2xl p-8 text-white text-center shadow-lg mb-8">
                <h4 className="text-xl font-semibold mb-4">Ready to Buy Credits?</h4>
                <p className="text-lime-100 mb-6">Choose from preset packages or enter a custom amount</p>
                <button
                  onClick={() => setBuyModalOpen(true)}
                  className="px-8 py-4 bg-white text-lime-600 rounded-xl font-bold text-lg hover:bg-lime-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Open Purchase Options
                </button>
              </div>

              {/* Credit Packages Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-gray-200 text-center">
                  <div className="text-4xl font-bold text-lime-600 mb-2">10</div>
                  <div className="text-gray-600 font-medium mb-2">Credits</div>
                  <div className="text-sm text-gray-500 mb-4">Perfect for trying out competitions</div>
                  <div className="text-2xl font-bold text-gray-900">$10</div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-lime-500 text-center relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-lime-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">MOST POPULAR</span>
                  </div>
                  <div className="text-4xl font-bold text-lime-600 mb-2">20</div>
                  <div className="text-gray-600 font-medium mb-2">Credits</div>
                  <div className="text-sm text-gray-500 mb-4">Most popular choice for regular players</div>
                  <div className="text-2xl font-bold text-gray-900">$20</div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-gray-200 text-center">
                  <div className="text-4xl font-bold text-lime-600 mb-2">50</div>
                  <div className="text-gray-600 font-medium mb-2">Credits</div>
                  <div className="text-sm text-gray-500 mb-4">Best value for serious competitors</div>
                  <div className="text-2xl font-bold text-gray-900">$50</div>
                </div>
              </div>

              {/* Custom Amount Preview */}
         

              {/* Important Information */}
              <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl p-6 border border-lime-200">
                <h4 className="font-semibold text-lime-900 mb-4 flex items-center text-lg">
                  <Sparkles size={20} className="mr-2" />
                  Important Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-lime-600 mr-3 mt-0.5">💳</span>
                      <div>
                        <p className="font-medium text-gray-900">Purchased Credits</p>
                        <p className="text-sm text-gray-700">Refundable to original payment method</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-lime-600 mr-3 mt-0.5">⚡</span>
                      <div>
                        <p className="font-medium text-gray-900">Instant Access</p>
                        <p className="text-sm text-gray-700">Credits available immediately after purchase</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-lime-600 mr-3 mt-0.5">🔒</span>
                      <div>
                        <p className="font-medium text-gray-900">Secure Payment</p>
                        <p className="text-sm text-gray-700">Protected by Stripe/PayPal security</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-lime-600 mr-3 mt-0.5">🎯</span>
                      <div>
                        <p className="font-medium text-gray-900">Competition Ready</p>
                        <p className="text-sm text-gray-700">Use credits to enter any competition</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <div className="mt-4 text-center">
                  <button
                    onClick={() => setBuyModalOpen(true)}
                    className="px-6 py-3 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-700 transition-colors"
                  >
                    Start Purchasing Credits
                  </button>
                </div> */}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'withdraw' && (
          <motion.div
            key="withdraw"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <DollarSign size={48} className="mx-auto text-lime-600 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Withdraw Winnings</h3>
                <p className="text-gray-600">Cash out your competition winnings securely</p>
              </div>

              {/* Withdrawal Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coins className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Available Balance</h4>
                  <p className="text-2xl font-bold text-green-600">{balance?.winnings_credits || 0}</p>
                  <p className="text-sm text-gray-600">Winnings Credits</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Minimum Withdrawal</h4>
                  <p className="text-2xl font-bold text-blue-600">20</p>
                  <p className="text-sm text-gray-600">Credits</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="h-6 w-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Maximum Per Request</h4>
                  <p className="text-2xl font-bold text-orange-600">50</p>
                  <p className="text-sm text-gray-600">Credits</p>
                </div>
              </div>

              {/* Withdrawal Rules */}
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 mb-8">
                <h4 className="font-semibold text-amber-800 mb-4 flex items-center">
                  <HelpCircle size={20} className="mr-2" />
                  Withdrawal Rules & Requirements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-amber-600 mr-2">•</span>
                      <span className="text-sm text-amber-700">Withdrawals only from Winnings Credits</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-amber-600 mr-2">•</span>
                      <span className="text-sm text-amber-700">Minimum withdrawal: 20 credits</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-amber-600 mr-2">•</span>
                      <span className="text-sm text-amber-700">Maximum per request: 50 credits</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-amber-600 mr-2">•</span>
                      <span className="text-sm text-amber-700">All withdrawals require admin approval</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-amber-600 mr-2">•</span>
                      <span className="text-sm text-amber-700">AML compliance verification required</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Withdrawal Action */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Ready to Withdraw?</h4>
                <p className="text-gray-600 mb-6">
                  {(balance?.winnings_credits || 0) >= 20
                    ? "You have sufficient winnings credits to request a withdrawal."
                    : "You need at least 20 winnings credits to withdraw."
                  }
                </p>
                <button
                  onClick={() => {
                    const available = balance?.winnings_credits || 0;
                    if (available < withdrawMin) {
                      toast.error(`Minimum withdrawal is ${withdrawMin} credits`);
                      return;
                    }
                    setIsWithdrawMethodOpen(true);
                  }}
                  disabled={(balance?.winnings_credits || 0) < 20}
                  className="px-8 py-3 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Request Withdrawal
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'faq' && (
          <motion.div
            key="faq"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <HelpCircle size={48} className="mx-auto text-lime-600 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
                <p className="text-gray-600">Everything you need to know about credits and the platform</p>
              </div>

              <div className="space-y-6">
                {/* Core Principles */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-4 flex items-center text-lg">
                    <Sparkles size={20} className="mr-2" />
                    Core Principles
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h5 className="font-medium text-blue-900 mb-2">What is KickExpert?</h5>
                      <p className="text-blue-800 text-sm">KickExpert is a skill-based competition platform where participants use credits to enter football prediction competitions. Unlike gambling, success depends on knowledge and research, not chance.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h5 className="font-medium text-blue-900 mb-2">Are credits real money?</h5>
                      <p className="text-blue-800 text-sm">No, credits are not deposits, stored money, or e-wallets. They are solely units of value within the KickExpert platform for entering competitions.</p>
                    </div>
                  </div>
                </div>

                {/* Credit System */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-4 flex items-center text-lg">
                    <Coins size={20} className="mr-2" />
                    Credit System
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <h5 className="font-medium text-green-900 mb-2">Purchased Credits</h5>
                      <p className="text-green-800 text-sm">Bought with real money, refundable to original payment method. Used for competition entry.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <h5 className="font-medium text-green-900 mb-2">Winnings Credits</h5>
                      <p className="text-green-800 text-sm">Earned by winning competitions, can be withdrawn (min 20 credits). Subject to admin approval.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <h5 className="font-medium text-green-900 mb-2">Referral Credits</h5>
                      <p className="text-green-800 text-sm">Earned through referrals, used only for competition entry. Non-withdrawable.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <h5 className="font-medium text-green-900 mb-2">How credits are used</h5>
                      <p className="text-green-800 text-sm">Credits are deducted in order: Referral → Winnings → Purchased when entering competitions.</p>
                    </div>
                  </div>
                </div>

                {/* Buying Credits */}
                <div className="bg-gradient-to-r from-lime-50 to-green-50 rounded-xl p-6 border border-lime-200">
                  <h4 className="font-semibold text-lime-900 mb-4 flex items-center text-lg">
                    <CreditCard size={20} className="mr-2" />
                    Buying Credits
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-lime-100">
                      <h5 className="font-medium text-lime-900 mb-2">Payment Methods</h5>
                      <p className="text-lime-800 text-sm">We accept payments through Stripe (credit/debit cards) and PayPal. All transactions are secure and encrypted.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-lime-100">
                      <h5 className="font-medium text-lime-900 mb-2">Custom Amounts</h5>
                      <p className="text-lime-800 text-sm">You can purchase any amount of credits you want. Simply enter your desired amount and proceed with payment.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-lime-100">
                      <h5 className="font-medium text-lime-900 mb-2">Processing Fees</h5>
                      <p className="text-lime-800 text-sm">Fees are determined by Stripe/PayPal and are not collected by KickExpert. We do not mark up or absorb payment processing fees.</p>
                    </div>
                  </div>
                </div>

                {/* Withdrawals */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-4 flex items-center text-lg">
                    <DollarSign size={20} className="mr-2" />
                    Withdrawals
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-orange-100">
                      <h5 className="font-medium text-orange-900 mb-2">Withdrawal Requirements</h5>
                      <p className="text-orange-800 text-sm">Only Winnings Credits can be withdrawn. Minimum withdrawal is 20 credits, maximum 50 credits per request. All withdrawals require admin approval.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-orange-100">
                      <h5 className="font-medium text-orange-900 mb-2">Payment Methods</h5>
                      <p className="text-orange-800 text-sm">Withdrawals can be sent to your connected bank account (Stripe) or PayPal account. AML compliance requires using the same payment method used for purchases.</p>
                    </div>
                  </div>
                </div>

                {/* Refunds & Cancellations */}
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-4 flex items-center text-lg">
                    <RefreshCw size={20} className="mr-2" />
                    Refunds & Competition Cancellations
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-purple-100">
                      <h5 className="font-medium text-purple-900 mb-2">Refund Policy</h5>
                      <p className="text-purple-800 text-sm">Purchased credits are refundable to the original payment method. Refunds cannot be redirected to another card/account for AML compliance.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-purple-100">
                      <h5 className="font-medium text-purple-900 mb-2">Competition Cancellations</h5>
                      <p className="text-purple-800 text-sm">If a competition is cancelled, credits are returned to their original source in this order: Referral → Purchased → Winnings.</p>
                    </div>
                  </div>
                </div>

                {/* Tax & Compliance */}
                <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6 border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-4 flex items-center text-lg">
                    <HelpCircle size={20} className="mr-2" />
                    Tax & Compliance
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-red-100">
                      <h5 className="font-medium text-red-900 mb-2">Tax Reporting</h5>
                      <p className="text-red-800 text-sm">If you win more than $600 in a calendar year, we are required to report this to the IRS (Form 1099-MISC). We track your annual winnings for compliance.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-red-100">
                      <h5 className="font-medium text-red-900 mb-2">AML Compliance</h5>
                      <p className="text-red-800 text-sm">We follow strict Anti-Money Laundering regulations. All large transactions and withdrawals require verification and may be reported to authorities.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <BuyCreditModal
        isOpen={isBuyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        onSelectPurchase={handlePurchaseCredits}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        maxAmount={balance?.winnings_credits || 0}
        onSubmit={handleWithdrawSubmit}
        minAmount={withdrawMin}
        method={withdrawMethod || 'stripe'}
      />

      {/* Payment Method modal for withdraw flow */}
      <PaymentMethodModal
        isOpen={isWithdrawMethodOpen}
        onClose={() => setIsWithdrawMethodOpen(false)}
        onSelectMethod={(method) => {
          // For withdraw flow: if PayPal chosen, open PayPal withdraw modal to collect email + amount
          if (method === 'paypal') {
            setWithdrawMethod('paypal');
            setIsWithdrawMethodOpen(false);
            setShowPayPalWithdrawModal(true);
            return;
          }
          // Set the method and open the Withdraw modal to enter amount (Stripe)
          setWithdrawMethod(method);
          setIsWithdrawMethodOpen(false);
          setIsWithdrawOpen(true);
        }}
        packageName={`Withdraw to bank`}
        amount={0}
      />

      {/* PayPal-specific withdraw modal: collects PayPal email + amount and submits immediately */}
      <PayPalWithdrawModal
        isOpen={showPayPalWithdrawModal}
        onClose={() => setShowPayPalWithdrawModal(false)}
        amount={0}
        credits={balance?.winnings_credits || 0}
        onSubmit={async (amount: number, paypalEmail: string) => {
          // Delegate to the shared handler
          await handleWithdrawSubmit(amount, 'paypal', paypalEmail);
          setShowPayPalWithdrawModal(false);
        }}
      />

      {/* Pending approval modal shown immediately after a withdrawal request */}
      <AnimatePresence>
        {pendingWithdraw && (
          <div className="fixed inset-0 bg-transparent bg-opacity-40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">Withdrawal Requested</h3>
                  <p className="text-sm text-gray-600">Your withdrawal has been submitted and is pending admin approval.</p>
                </div>
                <button onClick={() => setPendingWithdraw(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>

              <div className="mt-4">
                <div className="text-sm text-gray-700">Amount:</div>
                <div className="text-2xl font-bold text-lime-600">{pendingWithdraw.amount || pendingWithdraw.credits || ''} credits</div>
                {pendingWithdraw.id && <div className="mt-2 text-xs text-gray-500">Request ID: {pendingWithdraw.id}</div>}
                <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700">What happens next:</p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-2">
                    <li>• Admin will review your request and either approve or reject it.</li>
                    <li>• If approved, the payout will be sent to your connected account (may take a few business days).</li>
                    <li>• You'll receive a notification when the request status changes.</li>
                  </ul>
                </div>

                <div className="mt-4 flex space-x-2">
                  
                  <button onClick={() => { setPendingWithdraw(null); fetchBalance(); }} className="flex-1 bg-lime-600 text-white py-2 rounded-lg text-sm">Close</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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