'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { Trophy, CheckCircle, Star, Calendar, Clock, Award, Users, X, CreditCard } from 'lucide-react';
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

interface Competition {
  end_time: string | number | Date;
  id: string;
  name: string;
  start_time: string;
  entry_fee: number;
  status: string;
  created_at: string;
}

interface CompetitionRegistration {
  id: string;
  competition_id: string;
  user_id: string;
  status: string;
  paid_amount: number;
  created_at: string;
}

interface CompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: {
    id: string;
    name: string;
    price: string;
    difficulty: string;
    questions: number;
    minPlayers: number;
    prizes: string[];
    priceId: string;
    entry_fee: number;
    isRegistered?: boolean;
  };
  onProceedToPayment: (priceId: string, competitionId: string, method: 'stripe' | 'paypal') => void;
  startTime: Date;
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'stripe' | 'paypal') => void;
  competitionName: string;
  entryFee: number;
}

interface PayPalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: any;
  user: any;
  onPaymentSuccess: () => void;
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
          competitionId: competition.id, 
          userId: user.id,
          entryFee: competition.entry_fee
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
        <div className="fixed inset-0 bg-transparent backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-4 text-white relative flex-shrink-0">
              <h2 className="text-xl font-bold text-center">Already Registered</h2>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-white hover:text-lime-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto scrollbar-hide flex-1 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="text-lime-600" size={48} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                You've already registered for {competitionName}
              </h3>
              <p className="text-gray-600 mb-2">
                You have already paid ${paidAmount} for this competition.
              </p>
              {startTime && (
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1 flex items-center justify-center">
                    <Calendar className="mr-2 text-lime-600" size={16} />
                    <span className="font-semibold">Starts on</span>
                  </div>
                  <div className="text-gray-800 font-semibold text-base text-center">
                    {new Date(startTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-gray-600 text-sm text-center">
                    {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
              {!startTime && (
                <p className="text-gray-600 mb-4">We'll notify you when it's time to play!</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-300 bg-white flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Close
              </button>
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
  onProceedToPayment,
  startTime
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowPaymentMethods(false);
      return;
    }

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

  const handleProceedToPayment = () => {
    setShowPaymentMethods(true);
  };

  const handlePaymentMethodSelect = (method: 'stripe' | 'paypal') => {
    onProceedToPayment(competition.priceId, competition.id, method);
    setShowPaymentMethods(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showPaymentMethods && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] "
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-4 text-white relative flex-shrink-0">
                <h2 className="text-xl font-bold text-center">Join {competition.name}</h2>
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 text-white hover:text-lime-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto scrollbar-hide flex-1">
                <div className="flex items-center justify-center mb-4">
                  <Calendar className="text-lime-600 mr-2" size={18} />
                  <span className="font-semibold">
                    {startTime.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="bg-lime-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-lime-800 mb-2">Countdown to Start</h3>
                  <div className="flex justify-center space-x-2">
                    {formatTimeUnit(timeLeft.days, 'Days')}
                    {formatTimeUnit(timeLeft.hours, 'Hours')}
                    {formatTimeUnit(timeLeft.minutes, 'Mins')}
                    {formatTimeUnit(timeLeft.seconds, 'Secs')}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entry Fee:</span>
                    <span className="font-semibold">{competition.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-semibold text-lime-600">{competition.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-semibold">{competition.questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Players:</span>
                    <span className="font-semibold">{competition.minPlayers}</span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                    <Award size={16} className="mr-1" /> Prize Pool
                  </h4>
                  <ul className="text-sm text-yellow-700">
                    {competition.prizes.map((prize, index) => (
                      <li key={index} className="flex items-center">
                        <Trophy size={14} className="mr-2 text-yellow-600" />
                        {prize}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <h4 className="font-semibold text-blue-800 mb-1">Rules</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 30 seconds per question</li>
                    <li>• No external help allowed</li>
                    <li>• One attempt per player</li>
                    <li>• Prizes distributed to top 3</li>
                  </ul>
                </div>
              </div>

              {/* Footer - Sticky Payment Button */}
              <div className="p-4 border-t border-gray-300 bg-white flex-shrink-0">
                {competition.isRegistered ? (
                  <button
                    className="w-full bg-gray-400 text-white font-semibold py-3 rounded-lg cursor-not-allowed"
                    disabled
                  >
                    Already Registered
                  </button>
                ) : (
                  <button
                    onClick={handleProceedToPayment}
                    className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <span>Proceed to Payment</span>
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PaymentMethodModal
        isOpen={showPaymentMethods}
        onClose={() => setShowPaymentMethods(false)}
        onSelectMethod={handlePaymentMethodSelect}
        competitionName={competition.name}
        entryFee={competition.entry_fee}
      />
    </>
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
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [alreadyRegisteredData, setAlreadyRegisteredData] = useState<{
    competitionName: string;
    paidAmount: number;
    startTime: Date | null;
  }>({ competitionName: '', paidAmount: 0, startTime: null });

  // Stripe price IDs from .env.local
  const STARTER_LEAGUE_PRICE_ID = process.env.NEXT_PUBLIC_STARTER_PRICE_ID || "price_1RybzcRkV53d3IKfXrOebfrd";
  const PRO_LEAGUE_PRICE_ID = process.env.NEXT_PUBLIC_PRO_PRICE_ID || "price_1RybzdRkV53d3IKfGO5XLYZi";
  const ELITE_LEAGUE_PRICE_ID = process.env.NEXT_PUBLIC_ELITE_PRICE_ID || "price_1RybzeRkV53d3IKf4w0ccE7j";

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
          .eq('status', 'upcoming')
          .order('start_time', { ascending: true });

        if (error) {
          console.error('Error fetching competitions:', error);
          toast.error('Failed to load competitions');
          return [];
        }

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

    const initializeData = async () => {
      const user = await checkUser();
      const competitionsData = await fetchCompetitions();
      
      let registrationsData: CompetitionRegistration[] = [];
      if (user) {
        registrationsData = await fetchRegistrations(user.id);
      }
      
      setCompetitions(competitionsData);
      setRegistrations(registrationsData);
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
          .eq('status', 'upcoming')
          .order('start_time', { ascending: true });

        if (!error && data) setCompetitions(data);

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
    if (!isLoggedIn || !user) {
      toast.error('Please sign up or log in to join the competition.');
      router.push(`/signup?competition=${competition.name.toLowerCase().replace(' ', '-')}`);
      return;
    }

    // Check if user is already registered for this competition
    const registration = registrations.find(reg => 
      reg.competition_id === competition.id && reg.status === 'confirmed'
    );

    if (registration) {
      // Show modal instead of toast
      setAlreadyRegisteredData({
        competitionName: competition.name,
        paidAmount: registration.paid_amount
  ,
  startTime: competition.startTime || null
      });
      setAlreadyRegisteredModalOpen(true);
      return;
    }

    // Check if user has a pending registration
    const pendingRegistration = registrations.find(reg => 
      reg.competition_id === competition.id && reg.status === 'pending'
    );

    if (pendingRegistration) {
      // Allow to proceed with payment if status is pending
      setSelectedCompetition(competition);
      setModalOpen(true);
      return;
    }

    // User is not registered, allow registration
    setSelectedCompetition(competition);
    setModalOpen(true);
  };

  const handlePayment = async (priceId: string, competitionId: string, method: 'stripe' | 'paypal') => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    // Double-check registration status before proceeding to payment
    const registration = registrations.find(reg => 
      reg.competition_id === competitionId && reg.status === 'confirmed'
    );

    if (registration) {
      // Show modal instead of toast
      setAlreadyRegisteredData({
        competitionName: selectedCompetition.name,
        paidAmount: registration.paid_amount,
        startTime: selectedCompetition.startTime || null
      });
      setModalOpen(false);
      setAlreadyRegisteredModalOpen(true);
      return;
    }

    try {
      // create a pending registration to reserve spot
      await fetch('/api/register-competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, competitionId, status: 'pending', paid_amount: 0 }),
      });
    } catch (err) {
      console.error('Failed to create pending registration', err);
    }

    if (method === 'stripe') {
      await handleStripeRegister(priceId, competitionId);
    } else {
      setPaypalModalOpen(true);
    }
  };

  const handleStripeRegister = async (priceId: string, competitionId: string) => {
    const toastId = toast.loading('Redirecting to payment...');
    
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

  // Helper function to get price ID based on competition name
  const getPriceId = (name: string) => {
    switch (name) {
      case 'Starter League':
        return STARTER_LEAGUE_PRICE_ID;
      case 'Pro League':
        return PRO_LEAGUE_PRICE_ID;
      case 'Elite League':
        return ELITE_LEAGUE_PRICE_ID;
      default:
        return STARTER_LEAGUE_PRICE_ID;
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

  // Transform competitions data for display
  const competitionData = competitions.map((comp, index) => ({
    id: comp.id,
    name: comp.name,
    price: `$${comp.entry_fee}.00`,
    difficulty: getDifficulty(comp.name),
    questions: getQuestionsCount(comp.name),
    minPlayers: getMinPlayers(comp.name),
    prizes: getPrizes(comp.name, comp.entry_fee),
    priceId: getPriceId(comp.name),
    status: 'Min reached', // You can calculate this based on registrations if needed
    startTime: new Date(comp.start_time),
    endTime: comp.end_time ? new Date(comp.end_time) : null,
    entry_fee: comp.entry_fee,
    isRegistered: isUserRegistered(comp.id)
  }));

  // Time helpers
  const secondsUntil = (date: Date) => Math.max(0, Math.floor((date.getTime() - new Date().getTime()) / 1000));

  const isRegistrationClosed = (comp: any) => {
    if (!comp.startTime) return false;
    // registration closes 5 minutes (300s) before start
    return secondsUntil(comp.startTime) <= 300;
  };

  const isCompetitionStarted = (comp: any) => {
    if (!comp.startTime) return false;
    return new Date().getTime() >= comp.startTime.getTime();
  };

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
          onProceedToPayment={handlePayment}
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

      <div className="flex flex-col md:flex-row gap-6 mx-auto p-6 w-full max-w-7xl">
        {competitionData.length === 0 ? (
          <div className="text-center w-full">
            <p className="text-gray-600 text-lg">No upcoming competitions available at the moment.</p>
          </div>
        ) : (
          competitionData.map((comp, index) => (
            <div
              key={comp.id}
              className="relative border-2 border-lime-300 w-full max-h-[80vh] rounded-xl p-5 shadow-lg bg-gradient-to-br from-lime-50 to-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl opacity-0 animate-fadeIn"
              style={{ animationDelay: `${0.1 + index * 0.1}s`, borderColor: index === 0 ? '#bef264' : index === 1 ? '#84cc16' : '#65a30d' }}
            >
              <span className="absolute top-3 left-3 bg-lime-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow transition-all duration-200 hover:bg-lime-600">Live</span>
              <div className="flex flex-col items-center mt-6">
                <Trophy className="h-10 w-10 text-yellow-400 mb-3" />
                <h2 className="text-xl font-extrabold text-gray-800"># {comp.name}</h2>
                <p className="text-sm text-gray-600">
                  {comp.name === 'Starter League' ? 'Perfect for beginners' :
                    comp.name === 'Pro League' ? 'For serious fans' : 'Expert level only'}
                </p>
              </div>

              <div className="mt-4 space-y-2 text-sm font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Entry Fee:</span>
                  <span className="font-bold">{comp.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-bold">{comp.questions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Min Players:</span>
                  <span className="font-bold">{comp.minPlayers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Difficulty:</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-lime-500 mr-1.5" />
                    <span className="font-bold text-lime-500">{comp.difficulty}</span>
                  </div>
                </div>
                
              </div>

              <div className="mt-4">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-lime-600 mr-1.5" />
                  <span className="text-gray-700 font-semibold">{comp.status}</span>
                </div>
                <div className="flex items-center mt-1.5">
                  <span className="text-gray-600 mr-1.5">Prizes:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {comp.prizes.map((prize, i) => (
                      <React.Fragment key={i}>
                        <Trophy className="h-4 w-4 text-yellow-400" />
                        <span className="text-lime-600 font-bold">{prize.split(': ')[1]}</span>
                        {i < comp.prizes.length - 1 && <span className="mx-1 text-gray-400">▪</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {/* Determine button state based on time and registration */}
                {!isCompetitionStarted(comp) && isRegistrationClosed(comp) ? (
                  // If registration is closed but the current user is registered, allow opening the Already Registered modal
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
                      }
                      }
                      className="w-full mt-2 py-2 bg-gray-400 text-white rounded-lg font-semibold"
                    >
                      Registration Closed
                    </button>
                  ) : (
                    <button className="w-full mt-2 py-2 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed" disabled>
                      Registration Closed
                    </button>
                  )
                ) : isCompetitionStarted(comp) ? (
                  // Competition started
                  comp.isRegistered ? (
                    <button
                      onClick={async () => {
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
                    <button className="w-full mt-2 py-2 bg-gray-500 text-white rounded-lg font-semibold cursor-not-allowed">
                      Not Registered
                    </button>
                  )
                ) : (
                  // Before start and registration open
                  comp.isRegistered ? (
                    <button
                      onClick={() => handleOpenModal(comp)}
                      className="w-full mt-2 py-2 bg-gray-400 text-white rounded-lg font-semibold"
                    >
                      Already Registered
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenModal(comp)}
                      className="w-full mt-2 py-2 text-white rounded-lg font-semibold transition-all duration-200"
                      style={{ backgroundColor: index === 0 ? '#a3e635' : index === 1 ? '#65a30d' : '#3f6212' }}
                    >
                      {isLoggedIn ? 'Register & Pay' : 'Sign Up to Join'}
                    </button>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rules Section */}
      <div className="w-full mt-16 p-8 bg-white rounded-xl border-2 border-lime-100 shadow-lg">
        <h2 className="text-4xl font-extrabold mb-8 text-lime-600 text-center">Competition Rules</h2>
        <div className="space-y-5">
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