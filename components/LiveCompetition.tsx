'use client';

import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { Trophy, CheckCircle, Star, Calendar, Clock, Award, Users, X } from 'lucide-react';
import { Shield, User, Wifi, Clock as ClockIcon, Trophy as PrizeTrophy, LifeBuoy, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: {
    name: string;
    price: string;
    difficulty: string;
    questions: number;
    minPlayers: number;
    prizes: string[];
    priceId: string;
    id: string;
  };
  onProceedToPayment: (priceId: string, competitionId: string) => void;
  startTime: Date;
}

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
              <button
                onClick={() => onProceedToPayment(competition.priceId, competition.id)}
                className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <span>Proceed to Payment</span>
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
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
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [competitions, setCompetitions] = useState<any[]>([]);

  // Stripe price IDs from .env.local
  const STARTER_LEAGUE_PRICE_ID = process.env.NEXT_PUBLIC_STARTER_PRICE_ID || "price_1Rxr2pRkV53d3IKfQvSZXDDH";
  const PRO_LEAGUE_PRICE_ID = process.env.NEXT_PUBLIC_PRO_PRICE_ID || "price_1Rxr2qRkV53d3IKfZ77ovihb";
  const ELITE_LEAGUE_PRICE_ID = process.env.NEXT_PUBLIC_ELITE_PRICE_ID || "price_1Rxr2rRkV53d3IKfnMXFhcqM";

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
        setUser(user);
      } catch (error) {
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch next Saturday's competition for each league
    const fetchCompetitions = async () => {
      try {
        const today = new Date();
        const nextSaturday = new Date(today);
        nextSaturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
        nextSaturday.setUTCHours(0, 0, 0, 0);

        // Fetch all competitions for next Saturday
        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .gte('start_time', nextSaturday.toISOString())
          .lt('start_time', new Date(nextSaturday.getTime() + 24 * 60 * 60 * 1000).toISOString());

        if (!error && data) {
          setCompetitions(data);
        }
      } catch (error) {
        console.error('Error fetching competitions:', error);
      }
    };

    checkUser();
    fetchCompetitions();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;
      setIsLoggedIn(!!currentUser);
      setUser(currentUser);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Get next Saturday for a given league
  const getNextSaturday = (league: string) => {
    const today = new Date();
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
    // Set correct hour for each league
    if (league === 'Starter League') nextSaturday.setUTCHours(15, 0, 0, 0); // 3:00 PM UTC
    else if (league === 'Pro League') nextSaturday.setUTCHours(16, 0, 0, 0); // 4:00 PM UTC
    else if (league === 'Elite League') nextSaturday.setUTCHours(17, 0, 0, 0); // 5:00 PM UTC
    return nextSaturday;
  };

  const handleOpenModal = (competition: any) => {
    if (!isLoggedIn || !user) {
      toast.error('Please sign up or log in to join the competition.');
      router.push(`/signup?competition=${competition.name.toLowerCase().replace(' ', '-')}`);
      return;
    }

    // Check if user is already registered
    const checkRegistration = async () => {
      const { data, error } = await supabase
        .from('competition_registrations')
        .select('id')
        .eq('competition_id', competition.id)
        .eq('user_id', user.id)
        .single();

      if (data) {
        toast.error('You are already registered for this competition!');
        return;
      }

      setSelectedCompetition(competition);
      setModalOpen(true);
    };

    checkRegistration();
  };

  const handleStripeRegister = async (priceId: string, competitionId: string) => {
    const toastId = toast.loading('Redirecting to payment...');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, competitionId, userId: user.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Stripe API error:', errorData);
        toast.error(errorData.error || 'Unable to start payment. Please try again.', { id: toastId });
        return;
      }

      const data = await res.json();
      if (data.url) {
        toast.success('Redirecting to Stripe...', { id: toastId });
        setTimeout(() => { window.location.href = data.url; }, 1000);
      } else {
        toast.error('Unable to start payment. Please try again.', { id: toastId });
      }
    } catch (err) {
      console.error('Stripe payment error:', err);
      toast.error('Payment error. Please try again.', { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600"></div>
      </div>
    );
  }

  const competitionData = [
    {
      id: competitions.find(c => c.name === 'Starter League')?.id || 'starter',
      name: 'Starter League',
      price: competitions.find(c => c.name === 'Starter League') ? `$${competitions.find(c => c.name === 'Starter League').entry_fee}.00` : '$2.00',
      difficulty: 'Easy',
      questions: 15,
      minPlayers: 10,
      prizes: ['1st: $10', '2nd: $5', '3rd: $2'],
      priceId: STARTER_LEAGUE_PRICE_ID,
      status: 'Min reached',
  startTime: competitions.find(c => c.name === 'Starter League') ? new Date(competitions.find(c => c.name === 'Starter League').start_time) : null,
    },
    {
      id: competitions.find(c => c.name === 'Pro League')?.id || 'pro',
      name: 'Pro League',
      price: competitions.find(c => c.name === 'Pro League') ? `$${competitions.find(c => c.name === 'Pro League').entry_fee}.00` : '$10.00',
      difficulty: 'Medium',
      questions: 20,
      minPlayers: 25,
      prizes: ['1st: $50', '2nd: $25', '3rd: $10'],
      priceId: PRO_LEAGUE_PRICE_ID,
      status: '3 more to start',
  startTime: competitions.find(c => c.name === 'Pro League') ? new Date(competitions.find(c => c.name === 'Pro League').start_time) : null,
    },
    {
      id: competitions.find(c => c.name === 'Elite League')?.id || 'elite',
      name: 'Elite League',
      price: competitions.find(c => c.name === 'Elite League') ? `$${competitions.find(c => c.name === 'Elite League').entry_fee}.00` : '$50.00',
      difficulty: 'Hard',
      questions: 30,
      minPlayers: 30,
      prizes: ['1st: $200', '2nd: $100', '3rd: $50'],
      priceId: ELITE_LEAGUE_PRICE_ID,
      status: 'Min reached',
  startTime: competitions.find(c => c.name === 'Elite League') ? new Date(competitions.find(c => c.name === 'Elite League').start_time) : null,
    }
  ];

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

      <CompetitionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        competition={selectedCompetition}
        onProceedToPayment={handleStripeRegister}
        startTime={selectedCompetition ? getNextSaturday(selectedCompetition.name) : new Date()}
      />

      {/* Header section */}
      <div className="text-center mb-2 w-full max-w-4xl">
        <p className="text-lime-600 font-semibold text-xl mb-3">Football Trivia</p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-5">
          Live Competitions
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mx-auto p-6 w-full max-w-7xl">
        {competitionData.map((comp, index) => (
          <div
            key={index}
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
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Start Time:</span>
                <span className="font-bold">
                  {comp.startTime
                    ? comp.startTime.toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZone: 'UTC',
                      }) + ' UTC'
                    : 'N/A'}
                </span>
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
              <p className="text-center text-base font-extrabold text-lime-600">Competition is LIVE!</p>
              <button
                onClick={() => handleOpenModal(comp)}
                className="w-full mt-2 py-2 bg-lime-400 text-white rounded-lg font-semibold transition-all duration-200 hover:bg-lime-500"
                style={{ backgroundColor: index === 0 ? '#a3e635' : index === 1 ? '#65a30d' : '#3f6212' }}
              >
                {isLoggedIn ? 'Register & Pay' : 'Sign Up to Join'}
              </button>
            </div>
          </div>
        ))}
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
};

export default LiveCompetition;