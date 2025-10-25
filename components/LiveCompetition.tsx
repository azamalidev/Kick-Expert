'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { Trophy, CheckCircle, Star, Calendar, Clock, Award, Users, X, CreditCard, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Shield, User, Wifi, Clock as ClockIcon, Trophy as PrizeTrophy, LifeBuoy, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Declare PayPal types
declare global {
  interface Window {
    paypal: any;
  }
}

interface PayPalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: {
    id: string;
    name: string;
    entry_fee: number;
    credit_cost: number;
  };
  user: {
    id: string;
    [key: string]: any;
  };
  onPaymentSuccess: () => void;
}

interface Competition {
  end_time: string | number | Date;
  id: string;
  name: string;
  start_time: string;
  credit_cost: number;
  status: string;
  created_at: string;
  prize_pool: number;
}

interface CompetitionRegistration {
  id: string;
  competition_id: string;
  user_id: string;
  status: string;
  paid_amount: number;
  payment_type: 'credits' | 'stripe' | 'paypal';
  created_at: string;
}

interface CompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: {
    id: string;
    name: string;
    credit_cost: number;
    difficulty: string;
    questions: number;
    minPlayers: number;
    prizes: string[];
    isRegistered?: boolean;
  };
  onJoinCompetition: (competitionId: string) => void;
  startTime: Date;
  isRegistering?: boolean;
}

interface AlreadyRegisteredModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionName: string;
  paidAmount: number;
  startTime?: string | Date | null;
}

const PayPalPaymentModal: React.FC<PayPalPaymentModalProps> = ({
  isOpen,
  onClose,
  competition,
  user,
  onPaymentSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayPalPayment = async () => {
    setIsProcessing(true);
    try {
      // Create PayPal order
      const res = await fetch('/api/paypal-create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          amount: competition.entry_fee,
          credits: competition.credit_cost
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create PayPal order');
      }

      const result = await res.json();
      
      // Redirect to PayPal approval URL
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
                <p className="text-gray-600">Payment for <span className="font-semibold">{competition.name}</span></p>
                <p className="text-2xl font-bold text-blue-600">${competition.entry_fee}</p>
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

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'stripe' | 'paypal') => void;
  competitionName: string;
  entryFee: number;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
  competitionName,
  entryFee
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
                <p className="text-gray-600">Payment for <span className="font-semibold">{competitionName}</span></p>
                <p className="text-2xl font-bold text-lime-600">${entryFee}</p>
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

const AlreadyRegisteredModal: React.FC<AlreadyRegisteredModalProps> = ({
  isOpen,
  onClose,
  competitionName,
  paidAmount,
  startTime
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header with Success Icon */}
            <div className="bg-gradient-to-br from-lime-500 via-lime-600 to-green-600 p-6 text-white relative flex-shrink-0">
              <div className="flex items-center justify-center mb-2">
                <div className=" bg-opacity-20 rounded-full p-3">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center mb-1">Already Registered!</h2>
              <p className="text-center text-lime-100 text-sm">You're all set for this competition</p>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-lime-600 hover:text-lime-500 transition-colors bg-white bg-opacity-20 rounded-full p-1.5 hover:bg-opacity-30"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto scrollbar-hide flex-1 bg-gradient-to-b from-gray-50 to-white">
              {/* Competition Name Card */}
              <div className="bg-white rounded-xl border-2 border-lime-200 p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="text-lime-600" size={20} />
                  <span className="font-bold text-gray-800">Competition</span>
                </div>
                <p className="text-center text-lg font-bold text-lime-600">{competitionName}</p>
              </div>

              {/* Payment Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CreditCard className="text-blue-600" size={20} />
                  <span className="font-bold text-blue-900">Payment Confirmed</span>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{paidAmount}</p>
                  <p className="text-sm text-blue-700 font-medium">Credits Paid</p>
                </div>
              </div>

              {/* Start Time Card */}
              {startTime && (
                <div className="bg-white rounded-xl border-2 border-yellow-200 p-4 mb-4 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Calendar className="text-yellow-600" size={20} />
                    <span className="font-bold text-gray-800">Competition Starts</span>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                      <p className="text-sm text-gray-600 font-medium mb-1">
                        {new Date(startTime).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Message */}
              <div className="bg-gradient-to-r from-lime-50 to-green-50 border-2 border-lime-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-lime-200 rounded-full p-2 mt-0.5">
                    <CheckCircle className="h-5 w-5 text-lime-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lime-900 mb-1">Ready to Compete!</p>
                    <p className="text-sm text-lime-800">
                      {startTime 
                        ? "We'll notify you when the competition is about to start. Make sure you're ready!" 
                        : "We'll notify you when it's time to play!"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Enhanced Button */}
            <div className="p-6 border-t-2 border-gray-200 bg-gradient-to-b from-white to-gray-50 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Got It!</span>
              </motion.button>
              <p className="text-center text-xs text-gray-500 mt-3">
                Good luck in the competition! 🏆
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const CompetitionModal: React.FC<CompetitionModalProps> = ({
  isOpen,
  onClose,
  competition,
  onJoinCompetition,
  startTime
  , isRegistering = false
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = startTime.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [isOpen, startTime]);

  const formatTimeUnit = (value: number, unit: string) => {
    return (
      <div className="flex flex-col items-center">
        <div className="bg-lime-100 text-lime-700 font-bold rounded-lg py-2 px-3 min-w-[3rem]">
          {value.toString().padStart(2, '0')}
        </div>
        <span className="text-xs text-gray-500 mt-1">{unit}</span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header with Trophy Icon */}
            <div className="bg-gradient-to-br from-lime-500 via-lime-600 to-green-600 p-6 text-white relative flex-shrink-0">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-8 w-8 text-yellow-300" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-1">Join {competition.name}</h2>
              <p className="text-center text-lime-100 text-sm">Compete for prizes and glory!</p>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-lime-600 hover:text-lime-500 transition-colors bg-white bg-opacity-20 rounded-full p-1.5 hover:bg-opacity-30"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto scrollbar-hide flex-1 bg-gradient-to-b from-gray-50 to-white">
              
              {/* Start Date Card */}
              <div className="bg-white rounded-xl border-2 border-lime-200 p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="text-lime-600" size={20} />
                  <span className="font-bold text-gray-800">Competition Starts</span>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 font-medium">
                    {startTime.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-lg font-bold text-lime-600">
                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-xl border-2 border-lime-300 p-4 mb-4 shadow-sm">
                <h3 className="font-bold text-lime-900 mb-3 text-center flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5" />
                  Countdown to Start
                </h3>
                <div className="flex justify-center space-x-2">
                  {formatTimeUnit(timeLeft.days, 'Days')}
                  {formatTimeUnit(timeLeft.hours, 'Hours')}
                  {formatTimeUnit(timeLeft.minutes, 'Mins')}
                  {formatTimeUnit(timeLeft.seconds, 'Secs')}
                </div>
              </div>

              {/* Competition Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-lg border border-blue-200 p-3 shadow-sm">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-gray-600">Entry Cost</span>
                  </div>
                  <p className="text-center font-bold text-blue-600">{competition.credit_cost} Credits</p>
                </div>
                
                <div className="bg-white rounded-lg border border-lime-200 p-3 shadow-sm">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-lime-600" />
                    <span className="text-xs text-gray-600">Difficulty</span>
                  </div>
                  <p className="text-center font-bold text-lime-600">{competition.difficulty}</p>
                </div>
                
                <div className="bg-white rounded-lg border border-purple-200 p-3 shadow-sm">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="text-xs text-gray-600">Questions</span>
                  </div>
                  <p className="text-center font-bold text-purple-600">{competition.questions}</p>
                </div>
                
                <div className="bg-white rounded-lg border border-orange-200 p-3 shadow-sm">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-gray-600">Min Players</span>
                  </div>
                  <p className="text-center font-bold text-orange-600">{competition.minPlayers}</p>
                </div>
              </div>

              {/* Prize Pool Card */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-4 mb-4 shadow-md">
                <h4 className="font-bold text-yellow-900 mb-3 flex items-center justify-center gap-2 text-lg">
                  <Trophy size={20} className="text-yellow-600" />
                  Prize Pool Distribution
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 shadow-sm border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥇</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">1st Place</p>
                        <p className="text-xs text-gray-500">50% of pool</p>
                      </div>
                    </div>
                    <span className="text-base font-bold text-yellow-700">{competition.prizes[0].split(': ')[1]}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥈</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">2nd Place</p>
                        <p className="text-xs text-gray-500">30% of pool</p>
                      </div>
                    </div>
                    <span className="text-base font-bold text-gray-600">{competition.prizes[1].split(': ')[1]}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 shadow-sm border border-amber-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥉</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">3rd Place</p>
                        <p className="text-xs text-gray-500">20% of pool</p>
                      </div>
                    </div>
                    <span className="text-base font-bold text-amber-600">{competition.prizes[2].split(': ')[1]}</span>
                  </div>
                </div>
                <div className="mt-3 bg-yellow-200 bg-opacity-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-yellow-800 text-center font-medium">
                    💡 Prize pool grows with each player entry!
                  </p>
                </div>
              </div>

              {/* Rules Accordion */}
              <button
                onClick={() => setShowRules(!showRules)}
                className="w-full bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 mb-4 flex items-center justify-between hover:from-blue-100 hover:to-blue-200 transition-all shadow-sm"
              >
                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                  <Shield size={18} />
                  Competition Rules
                </h4>
                {showRules ? (
                  <ChevronUp className="h-5 w-5 text-blue-700" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-blue-700" />
                )}
              </button>

              {showRules && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4"
                >
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="bg-blue-200 rounded-full p-1 mt-0.5">
                        <Clock className="h-3 w-3 text-blue-700" />
                      </div>
                      <span className="text-sm text-blue-800 font-medium">30 seconds per question - answer quickly!</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-blue-200 rounded-full p-1 mt-0.5">
                        <Shield className="h-3 w-3 text-blue-700" />
                      </div>
                      <span className="text-sm text-blue-800 font-medium">No external help allowed - fair play only</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-blue-200 rounded-full p-1 mt-0.5">
                        <Award className="h-3 w-3 text-blue-700" />
                      </div>
                      <span className="text-sm text-blue-800 font-medium">One attempt per player - make it count!</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-blue-200 rounded-full p-1 mt-0.5">
                        <Trophy className="h-3 w-3 text-blue-700" />
                      </div>
                      <span className="text-sm text-blue-800 font-medium">Prizes distributed to top 3 performers</span>
                    </li>
                  </ul>
                </motion.div>
              )}
            </div>

            {/* Footer - Enhanced Action Button */}
            <div className="p-6 border-t-2 border-gray-200 bg-gradient-to-b from-white to-gray-50 flex-shrink-0">
              {competition.isRegistered ? (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 font-semibold py-3 px-6 rounded-xl mb-2">
                    <CheckCircle size={20} />
                    <span>Already Registered</span>
                  </div>
                  <p className="text-xs text-gray-500">You're all set for this competition!</p>
                </div>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onJoinCompetition(competition.id)}
                    disabled={isRegistering}
                    className={`w-full bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${isRegistering ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isRegistering ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        <span>Joining Competition...</span>
                      </>
                    ) : (
                      <>
                        <Trophy className="h-5 w-5" />
                        <span>Join for {competition.credit_cost} Credits</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </motion.button>
                  <p className="text-center text-xs text-gray-500 mt-3">
                    By joining, you agree to the competition rules
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const LiveCompetition = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [paypalModalOpen, setPaypalModalOpen] = useState(false);
  const [alreadyRegisteredModalOpen, setAlreadyRegisteredModalOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [alreadyRegisteredData, setAlreadyRegisteredData] = useState<{
    competitionName: string;
    paidAmount: number;
    startTime: Date | null;
  }>({ competitionName: '', paidAmount: 0, startTime: null });
  const [expandedPrizes, setExpandedPrizes] = useState<{ [key: string]: boolean }>({});
  const [playerCounts, setPlayerCounts] = useState<{ [key: string]: number }>({});

  // Competition configuration

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
        setUser(user);
        return user;
      } catch (error) {
        console.error('Error checking user:', error);
        setIsLoggedIn(false);
        setUser(null);
        return null;
      }
    };

    // Fetch competitions from database
    const fetchCompetitions = async () => {
      try {
        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .neq('status', 'completed')
          .order('start_time', { ascending: true });

        if (error) {
          console.error('Error fetching competitions:', error);
          toast.error('Failed to load competitions');
          return [];
        }

        console.log('Fetched competitions:', data); // Debug log
        return data || [];
      } catch (error) {
        console.error('Error fetching competitions:', error);
        toast.error('Failed to load competitions');
        return [];
      }
    };

    // Fetch user registrations
    const fetchRegistrations = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('competition_registrations')
          .select('*')
          .eq('user_id', userId);

        if (error) {
          console.error('Error fetching registrations:', error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error('Error fetching registrations:', error);
        return [];
      }
    };

    // Fetch player counts for competitions
    const fetchPlayerCounts = async (comps: Competition[]) => {
      try {
        const counts: { [key: string]: number } = {};
        
        for (const comp of comps) {
          const { count, error } = await supabase
            .from('competition_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('competition_id', comp.id)
            .eq('status', 'confirmed');
          
          if (!error && count !== null) {
            counts[comp.id] = count;
          } else {
            counts[comp.id] = 0;
          }
        }
        
        setPlayerCounts(counts);
      } catch (error) {
        console.error('Error fetching player counts:', error);
      }
    };

    const initializeData = async () => {
      const user = await checkUser();
      const competitionsData = await fetchCompetitions();
      
      let registrationsData: CompetitionRegistration[] = [];
      if (user) {
        registrationsData = await fetchRegistrations(user.id);
      }
      
      setCompetitions(competitionsData);
      setRegistrations(registrationsData);
      
      // Fetch player counts for all competitions
      await fetchPlayerCounts(competitionsData);
      
      setIsLoading(false);
    };

    initializeData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setIsLoggedIn(!!currentUser);
      setUser(currentUser);
      
      // If user logs in, fetch their registrations
      if (currentUser) {
        const registrationsData = await fetchRegistrations(currentUser.id);
        setRegistrations(registrationsData);
      } else {
        setRegistrations([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Poll competitions and registrations periodically to update button states
  useEffect(() => {
    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .neq('status', 'completed')
          .order('start_time', { ascending: true });

        if (!error && data) {
          console.log('Polled competitions:', data); // Debug log
          setCompetitions(data);
          
          // Update player counts
          const counts: { [key: string]: number } = {};
          for (const comp of data) {
            const { count } = await supabase
              .from('competition_registrations')
              .select('*', { count: 'exact', head: true })
              .eq('competition_id', comp.id)
              .eq('status', 'confirmed');
            
            counts[comp.id] = count || 0;
          }
          setPlayerCounts(counts);
        }

        if (user) {
          const { data: regs, error: regErr } = await supabase
            .from('competition_registrations')
            .select('*')
            .eq('user_id', user.id);
          if (!regErr && regs) setRegistrations(regs);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleOpenModal = async (competition: any) => {
    // Ensure user is logged in before showing modal
    if (!isLoggedIn || !user) {
      toast.error('Please sign up or log in to join the competition.');
      router.push(`/signup?competition=${competition.name.toLowerCase().replace(' ', '-')}`);
      return;
    }

    // Set the selected competition and open the modal. Registration will occur when
    // the user clicks the "Join Competition" button inside the modal.
    setSelectedCompetition(competition);
    setModalOpen(true);
  };

const handleCompetitionEntry = async (competitionId: string) => {
  if (!user) {
    toast.error('Please sign up or log in to join the competition.');
    router.push(`/signup?competition=${competitionId}`);
    return;
  }

  const competition = competitions.find(c => c.id === competitionId);
  if (!competition) {
    toast.error('Competition not found');
    return;
  }

  // Determine the correct credit cost to charge. `selectedCompetition` (set when
  // opening the modal) carries the display `credit_cost`. The DB row in
  // `competitions` may not include that computed field, so prefer the selected
  // competition's value when available.
  const creditCost = selectedCompetition && selectedCompetition.id === competitionId
    ? selectedCompetition.credit_cost
    : getCreditCost(competition.name);

  // Prevent registration if it's already closed (competition here is raw DB row with start_time)
  if (isRegistrationClosed({ startTime: new Date(competition.start_time) })) {
    toast.error('Registration is closed for this competition');
    return;
  }

  // Check if already registered
  const registration = registrations.find(reg => 
    reg.competition_id === competitionId && reg.status === 'confirmed'
  );

  if (registration) {
    setAlreadyRegisteredData({
      competitionName: competition.name,
      paidAmount: registration.paid_amount,
      startTime: new Date(competition.start_time)
    });
    setModalOpen(false);
    setAlreadyRegisteredModalOpen(true);
    return;
  }

  try {
    console.log('Attempting to register for competition:', competitionId);
    setIsRegistering(true);
    // Optional quick client-side check (helps give immediate feedback)
    const { data: userCredits, error: creditError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (creditError || !userCredits) {
      // proceed to server which will perform authoritative checks
    } else {
      const totalCredits = (userCredits.referral_credits || 0) +
                           (userCredits.winnings_credits || 0) +
                           (userCredits.purchased_credits || 0);
      if (totalCredits < creditCost) {
        toast.error(`Insufficient credits. You need ${creditCost} credits to join.`);
        return;
      }
    }

    // Call server to register and perform credit deduction there
    const payload = {
      userId: user.id,
      competitionId,
      status: 'confirmed',
      paid_amount: creditCost,
      payment_method: 'none',
      payment_type: 'credits'
    };

    console.log('Registering competition with payload:', payload);

    const response = await fetch('/api/register-competition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      if (data.error === 'Insufficient credits') {
        toast.error(`Insufficient credits. You need ${competition.credit_cost} credits to join.`);
        return;
      }
      throw new Error(data.error || 'Failed to join competition');
    }

    // Use server-provided deduction breakdown when available
    if (data.deductedFrom) {
      let message = 'Successfully joined competition! Credits used: ';
      const parts: string[] = [];
      if (data.deductedFrom.referral > 0) parts.push(`${data.deductedFrom.referral} referral`);
      if (data.deductedFrom.winnings > 0) parts.push(`${data.deductedFrom.winnings} winnings`);
      if (data.deductedFrom.purchased > 0) parts.push(`${data.deductedFrom.purchased} purchased`);
      message += parts.join(', ');
      toast.success(message);
    } else {
      toast.success('Successfully joined competition!');
    }

  setModalOpen(false);
  setIsRegistering(false);

    // Refresh registrations
    const { data: regs } = await supabase
      .from('competition_registrations')
      .select('*')
      .eq('user_id', user.id);

    if (regs) setRegistrations(regs);

  } catch (error: any) {
    console.error('Error joining competition:', error);
    if (error.message && error.message.includes('Registration closed')) {
      toast.error('Registration is closed for this competition');
    } else {
      toast.error(error.message || 'Failed to join competition');
    }
    setIsRegistering(false);
  }
};

  const handleStripeRegister = async (priceId: string, competitionId: string) => {
    const toastId = toast.loading('Redirecting to payment...');

    // Ensure user is defined before proceeding
    if (!user) {
      toast.error('Please sign up or log in to proceed with payment.', { id: toastId });
      return;
    }
    
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId, 
          competitionId, 
          userId: user.id 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Stripe API error:', errorData);
        toast.error(errorData.error || 'Unable to start payment. Please try again.', { id: toastId });
        return;
      }

      const result = await res.json();
      if (result.url) {
        toast.success('Redirecting to Stripe...', { id: toastId });
        setTimeout(() => { 
          window.location.href = result.url; 
        }, 1000);
      } else {
        toast.error('Unable to start payment. Please try again.', { id: toastId });
      }
    } catch (err) {
      console.error('Stripe payment error:', err);
      toast.error('Payment error. Please try again.');
    }
  };

  const handlePaypalPaymentSuccess = () => {
    // Refresh registrations after successful payment
    const fetchRegistrations = async () => {
      if (user) {
        const { data } = await supabase
          .from('competition_registrations')
          .select('*')
          .eq('user_id', user.id);
        
        if (data) {
          setRegistrations(data);
        }
      }
    };
    
    fetchRegistrations();
    setPaypalModalOpen(false);
    setModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600"></div>
      </div>
    );
  }

  // Helper function to get entry fee based on competition name
  const getEntryFee = (name: string) => {
    switch (name) {
      case 'Starter League':
        return 10;
      case 'Pro League':
        return 20;
      case 'Elite League':
        return 30;
      default:
        return 10;
    }
  };

  // Helper function to get credit cost based on competition name
  const getCreditCost = (name: string) => {
    switch (name) {
      case 'Starter League':
        return 5;
      case 'Pro League':
        return 10;
      case 'Elite League':
        return 20;
      default:
        return 5;
    }
  };

  // Helper function to get difficulty based on competition name
  const getDifficulty = (name: string) => {
    switch (name) {
      case 'Starter League':
        return 'Easy';
      case 'Pro League':
        return 'Medium';
      case 'Elite League':
        return 'Hard';
      default:
        return 'Easy';
    }
  };

  // Helper function to get questions count based on competition name
  const getQuestionsCount = (name: string) => {
    switch (name) {
      case 'Starter League':
        return 15;
      case 'Pro League':
        return 20;
      case 'Elite League':
        return 30;
      default:
        return 15;
    }
  };

  // Helper function to get min players based on competition name
  const getMinPlayers = (name: string) => {
    switch (name) {
      case 'Starter League':
        return 10;
      case 'Pro League':
        return 25;
      case 'Elite League':
        return 30;
      default:
        return 10;
    }
  };

  // Helper function to get prizes based on competition name and entry fee
  const getPrizes = (name: string, entryFee: number) => {
    switch (name) {
      case 'Starter League':
        return [`1st: $${Math.floor(entryFee * 5)}`, `2nd: $${Math.floor(entryFee * 2.5)}`, `3rd: $${entryFee}`];
      case 'Pro League':
        return [`1st: $${Math.floor(entryFee * 2.5)}`, `2nd: $${Math.floor(entryFee * 1.25)}`, `3rd: $${Math.floor(entryFee * 0.5)}`];
      case 'Elite League':
        return [`1st: $${Math.floor(entryFee * 4)}`, `2nd: $${Math.floor(entryFee * 2)}`, `3rd: $${entryFee}`];
      default:
        return [`1st: $${Math.floor(entryFee * 5)}`, `2nd: $${Math.floor(entryFee * 2.5)}`, `3rd: $${entryFee}`];
    }
  };

  // Check if user is registered for a competition
  const isUserRegistered = (competitionId: string) => {
    return registrations.some(reg => 
      reg.competition_id === competitionId && reg.status === 'confirmed'
    );
  };

  // Check if user has already completed a competition
  const hasCompletedCompetition = async (competitionId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('competition_sessions')
        .select('*')
        .eq('competition_id', competitionId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      return !!data; // Returns true if session exists
    } catch (err) {
      console.error('Error checking competition completion:', err);
      return false;
    }
  };

  // Get trophy color based on league
  const getTrophyColor = (name: string) => {
    switch (name) {
      case 'Starter League':
        return 'text-amber-600'; // Bronze
      case 'Pro League':
        return 'text-gray-400'; // Silver
      case 'Elite League':
        return 'text-yellow-400'; // Gold
      default:
        return 'text-amber-600';
    }
  };

  // Get status badge info
  const getStatusBadge = (comp: any) => {
    const now = new Date();
    const start = comp.startTime;
    const timeToStart = start.getTime() - now.getTime();
    const minutesToStart = Math.floor(timeToStart / 1000 / 60);
    
    if (isCompetitionStarted(comp)) {
      return { text: 'Live', color: 'bg-red-500', pulse: true };
    } else if (isRegistrationClosed(comp)) {
      return { text: 'Closed', color: 'bg-gray-500', pulse: false };
    } else if (minutesToStart <= 60) {
      return { text: `Starting in ${minutesToStart}m`, color: 'bg-orange-500', pulse: true };
    } else {
      return { text: 'Open', color: 'bg-lime-500', pulse: false };
    }
  };

  // Calculate XP reward based on competition
  const getXPReward = (name: string) => {
    switch (name) {
      case 'Starter League':
        return 50;
      case 'Pro League':
        return 100;
      case 'Elite League':
        return 200;
      default:
        return 50;
    }
  };

  // Calculate dynamic prize pool
  const calculateDynamicPrizePool = (competitionId: string, creditCost: number) => {
    const playerCount = playerCounts[competitionId] || 0;
    const totalRevenue = playerCount * creditCost;
    
    // If no players yet, show minimum prize pool based on min players
    const minPlayers = 10; // minimum players needed
    const fallbackRevenue = minPlayers * creditCost;
    const displayRevenue = playerCount > 0 ? totalRevenue : fallbackRevenue;
    
    // Prize pool is 100% of total revenue
    const prizePool = displayRevenue;
    
    return {
      total: totalRevenue,
      totalDisplay: displayRevenue,
      pool: prizePool, // Full prize pool (100% of revenue)
      first: Math.ceil(prizePool * 0.2),
      second: Math.ceil(prizePool * (playerCount < 50 ? 0.12 : playerCount < 100 ? 0.12 : 0.1)),
      third: Math.ceil(prizePool * (playerCount < 50 ? 0.08 : 0.07)),
      isEstimated: playerCount === 0
    };
  };

  // Transform competitions data for display
  const competitionData = competitions
    .map((comp, index) => ({
      id: comp.id,
      name: comp.name,
      credit_cost: getCreditCost(comp.name),
      difficulty: getDifficulty(comp.name),
      questions: getQuestionsCount(comp.name),
      minPlayers: getMinPlayers(comp.name),
      // Compute prize pool safely. If DB value missing/invalid, fallback to a simple
      // heuristic: credit_cost * 10 (so Starter:1*10=10, Pro:20*10=200, Elite:30*10=300).
      prizes: (() => {
        const prizePoolRaw = Number(comp.prize_pool || 0);
        const fallbackRevenue = getCreditCost(comp.name) * 10;
        const totalRevenue = prizePoolRaw > 0 ? prizePoolRaw : fallbackRevenue;
        
        // Calculate pool percentage (default to 40% for <50 players)
        const poolPercentage = 0.4;
        const prizePool = Math.floor(totalRevenue * poolPercentage);
        
        return [
          `1st: ${Math.ceil(prizePool * 0.2)} Credits`,
          `2nd: ${Math.ceil(prizePool * 0.12)} Credits`,
          `3rd: ${Math.ceil(prizePool * 0.08)} Credits`
        ];
      })(),
      startTime: new Date(comp.start_time),
      endTime: comp.end_time ? new Date(comp.end_time) : null,
      isRegistered: isUserRegistered(comp.id)
    }))
    .sort((a, b) => {
      // Sort by league order: Starter (1), Pro (2), Elite (3)
      const order: { [key: string]: number } = {
        'Starter League': 1,
        'Pro League': 2,
        'Elite League': 3
      };
      return (order[a.name] || 999) - (order[b.name] || 999);
    });

  // Time helpers
  const secondsUntil = (date: Date) => Math.max(0, Math.floor((date.getTime() - new Date().getTime()) / 1000));

  const isRegistrationClosed = (comp: any) => {
    if (!comp.startTime) return false;
    // Registration closes 5 minutes (300s) before start - no new registrations allowed
    return secondsUntil(comp.startTime) <= 300;
  };

  const canEnterCompetition = (comp: any) => {
    if (!comp.startTime) return false;
    // Can enter competition within 2 minutes (120s) before start
    const secondsLeft = secondsUntil(comp.startTime);
    return secondsLeft <= 120 && secondsLeft > 0;
  };

  const isCompetitionStarted = (comp: any) => {
    if (!comp.startTime) return false;
    return new Date().getTime() >= comp.startTime.getTime();
  };

  function handlePayment(priceId: string, competitionId: string, method: 'stripe' | 'paypal'): void {
    if (method === 'stripe') {
      handleStripeRegister(priceId, competitionId);
    } else if (method === 'paypal') {
      setModalOpen(false);
      setPaypalModalOpen(true);
    }
  }

  return (
    <div className="bg-gray-50 flex flex-col items-center px-4 py-24 pb-12">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#363636', color: '#fff' },
          success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { duration: 4000 },
          loading: { duration: 2000 },
        }}
      />

      {selectedCompetition && (
        <CompetitionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          competition={selectedCompetition}
          onJoinCompetition={handleCompetitionEntry}
          isRegistering={isRegistering}
          startTime={selectedCompetition ? selectedCompetition.startTime : new Date()}
        />
      )}

      {selectedCompetition && (
        <PayPalPaymentModal
          isOpen={paypalModalOpen}
          onClose={() => setPaypalModalOpen(false)}
          competition={selectedCompetition}
          user={user}
          onPaymentSuccess={handlePaypalPaymentSuccess}
        />
      )}

      <AlreadyRegisteredModal
        isOpen={alreadyRegisteredModalOpen}
        onClose={() => setAlreadyRegisteredModalOpen(false)}
        competitionName={alreadyRegisteredData.competitionName}
        paidAmount={alreadyRegisteredData.paidAmount}
        startTime={alreadyRegisteredData.startTime}
      />

      {/* Header section */}
      <div className="text-center mb-2 w-full max-w-4xl">
        <p className="text-lime-600 font-semibold text-xl mb-3">Football Trivia</p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-5">
          Live Competitions
        </h1>
      </div>

      <div className="flex flex-col  md:flex-row gap-6 mx-auto py-6 px-2  w-full max-w-7xl items-start">
        {competitionData.length === 0 ? (
          <div className="text-center w-full">
            <p className="text-gray-600 text-lg">No upcoming competitions available at the moment.</p>
          </div>
        ) : (
          competitionData.map((comp, index) => {
            const status = getStatusBadge(comp);
            const prizePool = calculateDynamicPrizePool(comp.id, comp.credit_cost);
            const xpReward = getXPReward(comp.name);
            const playerCount = playerCounts[comp.id] || 0;
            
            return (
            <div
              key={comp.id}
              className="relative border-2 border-lime-300 w-full rounded-xl p-6 shadow-lg bg-white transition-all duration-300 ease-in-out transform hover:scale-102 hover:shadow-xl opacity-0 animate-fadeIn flex flex-col"
              style={{ animationDelay: `${0.1 + index * 0.1}s`, borderColor: index === 0 ? '#bef264' : index === 1 ? '#84cc16' : '#65a30d' }}
            >
              {/* Status Badge */}
              <span className={`absolute top-3 left-3 ${status.color} text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow transition-all duration-200 flex items-center gap-1 ${status.pulse ? 'animate-pulse' : ''}`}>
                {status.pulse && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                {status.text}
              </span>
              
              {/* Trophy Icon at Top */}
              <div className="flex flex-col items-center mt-6 mb-4">
                <Trophy className={`h-12 w-12 ${getTrophyColor(comp.name)} mb-3`} />
                <h2 className="text-xl font-extrabold text-gray-800">{comp.name}</h2>
                <p className="text-sm text-gray-600">
                  {comp.name === 'Starter League' ? 'Perfect for beginners' :
                    comp.name === 'Pro League' ? 'For serious fans' : 'Expert level only'}
                </p>
              </div>

              {/* Card Content - Flex grow to push bottom section down */}
              <div className="flex-grow">
                {/* Competition Details */}
                <div className="space-y-2 text-sm font-semibold mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Entry Cost:</span>
                  <span className="font-bold text-blue-600">{comp.credit_cost} Credits</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-bold">{comp.questions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Difficulty:</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-lime-500 mr-1.5" />
                    <span className="font-bold text-lime-500">{comp.difficulty}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    Players Registered:
                  </span>
                  <span className="font-bold text-lime-600">{playerCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Start Time:</span>
                  <span className="font-bold text-sm">{comp.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Dynamic Prize Pool - Expandable */}
              <div>
                <button
                  onClick={() => setExpandedPrizes(prev => ({ ...prev, [comp.id]: !prev[comp.id] }))}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg px-3 py-2 hover:from-yellow-100 hover:to-yellow-200 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-800">
                      Prize Pool: {prizePool.pool} Credits
                      {prizePool.isEstimated && <span className="text-xs font-normal ml-1">(Est.)</span>}
                    </span>
                  </div>
                  {expandedPrizes[comp.id] ? (
                    <ChevronUp className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-yellow-600" />
                  )}
                </button>
                
                {expandedPrizes[comp.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center justify-between bg-white border border-yellow-100 rounded-lg px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🥇</span>
                        <span className="text-sm font-semibold text-gray-700">1st Place</span>
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded font-bold">20%</span>
                      </div>
                      <span className="text-sm font-bold text-yellow-600">{prizePool.first} Credits</span>
                    </div>
                    <div className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🥈</span>
                        <span className="text-sm font-semibold text-gray-700">2nd Place</span>
                        <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-bold">{playerCount < 50 ? '12%' : playerCount < 100 ? '12%' : '10%'}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-500">{prizePool.second} Credits</span>
                    </div>
                    <div className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🥉</span>
                        <span className="text-sm font-semibold text-gray-700">3rd Place</span>
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-bold">{playerCount < 50 ? '8%' : playerCount < 100 ? '7%' : '7%'}</span>
                      </div>
                      <span className="text-sm font-bold text-amber-600">{prizePool.third} Credits</span>
                    </div>
                    {prizePool.isEstimated && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mt-2">
                        <p className="text-xs text-yellow-700 text-center">
                          * Estimated based on minimum {10} players. Prize pool grows with more entries!
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
              </div>

              {/* Bottom Section - Fixed at bottom */}
              <div className="mt-auto pt-4">
              {/* XP & Trophy Rewards */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">+{xpReward} XP</span>
                </div>
                <div className="flex-1 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-700">Trophy Chance</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3">
                {/* Determine button state based on time and registration */}
                {isCompetitionStarted(comp) ? (
                  // Competition has already started
                  comp.isRegistered ? (
                    <button
                      onClick={async () => {
                        // Check if user has already completed this competition
                        const hasCompleted = await hasCompletedCompetition(comp.id);
                        if (hasCompleted) {
                          toast.error('You have already completed this competition!');
                          return;
                        }

                        // Start competition on server and redirect to league page
                        try {
                          const res = await fetch('/api/start-competition', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ competitionId: comp.id }),
                          });
                          const data = await res.json();
                          // Redirect to league with competition id
                          router.push(`/league?competitionId=${comp.id}`);
                        } catch (err) {
                          console.error('Failed to start or join competition', err);
                          toast.error('Unable to join competition. Please try again.');
                        }
                      }}
                      className="w-full mt-2 py-2 text-white rounded-lg font-semibold transition-all duration-200"
                      style={{ backgroundColor: index === 0 ? '#a3e635' : index === 1 ? '#65a30d' : '#3f6212' }}
                    >
                      Join Competition
                    </button>
                  ) : (
                    <button className="w-full mt-2 py-2 bg-gray-500 text-white rounded-lg font-semibold cursor-not-allowed" disabled>
                      Not Registered
                    </button>
                  )
                ) : canEnterCompetition(comp) ? (
                  // Within 2 minutes before start - registered users can enter
                  comp.isRegistered ? (
                    <button
                      onClick={async () => {
                        // Check if user has already completed this competition
                        const hasCompleted = await hasCompletedCompetition(comp.id);
                        if (hasCompleted) {
                          toast.error('You have already completed this competition!');
                          return;
                        }

                        // Redirect to league page
                        router.push(`/league?competitionId=${comp.id}`);
                      }}
                      className="w-full mt-2 py-2 text-white rounded-lg font-semibold transition-all duration-200 animate-pulse"
                      style={{ backgroundColor: index === 0 ? '#a3e635' : index === 1 ? '#65a30d' : '#3f6212' }}
                    >
                      Join Competition
                    </button>
                  ) : (
                    <button className="w-full mt-2 py-2 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed" disabled>
                      Registration Closed
                    </button>
                  )
                ) : isRegistrationClosed(comp) ? (
                  // 5 to 2 minutes before start - registration closed, waiting period
                  comp.isRegistered ? (
                    <button
                      className="w-full mt-2 py-2 bg-orange-500 text-white rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                      disabled
                    >
                      <Clock className="h-4 w-4" />
                      Registration Closed
                    </button>
                  ) : (
                    <button className="w-full mt-2 py-2 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed" disabled>
                      Registration Closed
                    </button>
                  )
                ) : (
                  // More than 5 minutes before start - registration open
                  comp.isRegistered ? (
                    <button
                      onClick={() => {
                        if (!isLoggedIn || !user) {
                          toast.error('Please sign up or log in to view your registration.');
                          router.push(`/signup?competition=${comp.name.toLowerCase().replace(' ', '-')}`);
                          return;
                        }

                        const reg = registrations.find(r => r.competition_id === comp.id && r.status === 'confirmed');
                        setAlreadyRegisteredData({
                          competitionName: comp.name,
                          paidAmount: reg ? reg.paid_amount : 0,
                          startTime: comp.startTime || null
                        });
                        setAlreadyRegisteredModalOpen(true);
                      }}
                      className="w-full mt-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Already Registered
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenModal(comp)}
                      className="w-full mt-2 py-2 text-white rounded-lg font-semibold transition-all duration-200"
                      style={{ backgroundColor: index === 0 ? '#a3e635' : index === 1 ? '#65a30d' : '#3f6212' }}
                    >
                      {isLoggedIn ? `Join for ${comp.credit_cost} Credits` : 'Sign Up to Join'}
                    </button>
                  )
                )}
              </div>
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* Rules Section */}
      <div className="w-full mt-16 p-8 bg-white rounded-xl border-2 border-lime-100 shadow-lg">
        <h2 className="text-4xl font-extrabold mb-8 text-lime-600 text-center">Competition Rules</h2>
        <div className="space-y-5">
          {/* Dynamic Prize Pool System - FEATURED AT TOP */}
          <div className="flex items-start p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl hover:from-yellow-100 hover:to-yellow-200 transition-colors border-2 border-yellow-300 shadow-md">
            <div className="p-3 mr-4 bg-yellow-500/30 rounded-lg">
              <Award className="h-7 w-7 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-extrabold text-yellow-800 mb-3">🎯 Dynamic Prize Pool System</h3>
              <div className="text-gray-700 text-base leading-relaxed space-y-2">
                <p className="font-semibold">Prize pools scale based on player count:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div className="bg-white border border-yellow-200 rounded-lg p-3">
                    <p className="font-bold text-yellow-700">&lt;50 Players</p>
                    <p className="text-sm text-gray-600">Top 3 Winners</p>
                    <p className="text-xs text-yellow-600 font-bold">40% Pool</p>
                  </div>
                  <div className="bg-white border border-yellow-200 rounded-lg p-3">
                    <p className="font-bold text-yellow-700">50-100 Players</p>
                    <p className="text-sm text-gray-600">Top 5 Winners</p>
                    <p className="text-xs text-yellow-600 font-bold">45% Pool</p>
                  </div>
                  <div className="bg-white border border-yellow-200 rounded-lg p-3">
                    <p className="font-bold text-yellow-700">100+ Players</p>
                    <p className="text-sm text-gray-600">Top 10 Winners</p>
                    <p className="text-xs text-yellow-600 font-bold">50% Pool</p>
                  </div>
                </div>
                <p className="text-sm mt-3 bg-yellow-50 p-2 rounded border border-yellow-200"><strong>Distribution:</strong> 1st: 20% | 2nd: 12% | 3rd: 8%</p>
              </div>
            </div>
          </div>

          {/* XP Rewards System - FEATURED AT TOP */}
          <div className="flex items-start p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-colors border-2 border-blue-300 shadow-md">
            <div className="p-3 mr-4 bg-blue-500/30 rounded-lg">
              <Zap className="h-7 w-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-extrabold text-blue-800 mb-3">⚡ XP Rewards & Progression</h3>
              <div className="text-gray-700 text-base leading-relaxed space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white border border-blue-200 rounded-lg p-3">
                    <p className="font-bold text-blue-700">🏆 Winners</p>
                    <p className="text-sm text-gray-600">5 XP per correct answer</p>
                    <p className="text-xs text-blue-600 mt-1">Ranked in prize pool</p>
                  </div>
                  <div className="bg-white border border-blue-200 rounded-lg p-3">
                    <p className="font-bold text-blue-700">👥 Non-Winners</p>
                    <p className="text-sm text-gray-600">Still earn XP:</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li>• Starter: +10 XP</li>
                      <li>• Pro: +20 XP</li>
                      <li>• Elite: +30 XP</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm mt-3 bg-blue-50 p-2 rounded border border-blue-200 italic">✓ All participants earn XP regardless of placement!</p>
              </div>
            </div>
          </div>

          {/* Honest Play */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-lime-500/20 rounded-lg">
              <Shield className="h-6 w-6 text-lime-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Honest Play Guaranteed</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Play fairly and honestly. Any use of bots, scripts, or external assistance is strictly prohibited and will result in disqualification and potential account suspension.
              </p>
            </div>
          </div>

          {/* One Account */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-blue-500/20 rounded-lg">
              <User className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">One Account Per Player</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Each participant is allowed only one KickExpert account. Multiple accounts are not permitted and may lead to forfeiture of winnings and account termination.
              </p>
            </div>
          </div>

          {/* Internet Connection */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-yellow-500/20 rounded-lg">
              <Wifi className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Stable Internet Connection</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Ensure you have a stable internet connection before joining. We are not responsible for disconnections or interruptions on your end that may affect your gameplay.
              </p>
            </div>
          </div>

          {/* Time Limits */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-purple-500/20 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Answer Within Time Limits</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Each question is timed. Submit your answers promptly. Late or unanswered questions will be marked as incorrect.
              </p>
            </div>
          </div>

          {/* Prize Distribution */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-green-500/20 rounded-lg">
              <PrizeTrophy className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Prize Distribution & Verification</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Prizes are awarded based on final rankings as per the specific competition's prize breakdown. Winners may be subject to identity verification before payouts.
              </p>
            </div>
          </div>

          {/* Support */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-teal-500/20 rounded-lg">
              <LifeBuoy className="h-6 w-6 text-teal-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Support & Fair Adjudication</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Encounter an issue? Reach out to our support team. All decisions by KickExpert regarding rule interpretations and disputes are final to ensure fairness.
              </p>
            </div>
          </div>

          {/* Platform Integrity */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-red-500/20 rounded-lg">
              <Lock className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Platform Integrity</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                KickExpert reserves the right to modify rules, cancel competitions, or take action against any participant found violating terms or undermining the platform's integrity.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

export default LiveCompetition;