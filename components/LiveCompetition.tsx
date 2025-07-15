'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trophy, CheckCircle, Star } from 'lucide-react';
import { Shield, User, Wifi, Clock, Trophy as PrizeTrophy, LifeBuoy, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LiveCompetition = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check user authentication status on component mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
        setUser(user);
      } catch (error) {
        console.error('Error checking user status:', error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;
      setIsLoggedIn(!!currentUser);
      setUser(currentUser);
    });

    // Cleanup listener on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleRegisterClick = (competition: string) => {
    if (!isLoggedIn || !user) {
      // Redirect to signup page with competition as query parameter
      router.push(`/signup?competition=${competition}`);
    } else {
      // Handle registration for logged in users
      router.push(`/league`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex flex-col items-center px-4 py-24 pb-12">
      {/* Header section */}
      <div className="text-center mb-2 w-full max-w-4xl">
        <p className="text-lime-600 font-semibold text-xl mb-3">Football Trivia</p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-5">
          Live Competitions
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mx-auto p-6 w-full max-w-7xl">
        {/* Starter League */}
        <div className="relative border-2 border-lime-300 w-full max-h-[80vh] rounded-xl p-5 shadow-lg bg-gradient-to-br from-lime-50 to-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl opacity-0 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <span className="absolute top-3 left-3 bg-lime-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow transition-all duration-200 hover:bg-lime-600">Live</span>
          <div className="flex flex-col items-center mt-6">
            <Trophy className="h-10 w-10 text-yellow-400 mb-3" />
            <h2 className="text-xl font-extrabold text-gray-800"># Starter League</h2>
            <p className="text-sm text-gray-600">Perfect for beginners</p>
          </div>
          
          <div className="mt-4 space-y-2 text-sm font-semibold">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Entry Fee:</span>
              <span className="font-bold">$2.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Questions:</span>
              <span className="font-bold">15</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Min Players:</span>
              <span className="font-bold">10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Difficulty:</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-lime-500 mr-1.5" />
                <span className="font-bold text-lime-500">Easy</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-lime-600 mr-1.5" />
              <span className="text-gray-700 font-semibold">Min reached</span>
            </div>
            <div className="flex items-center mt-1.5">
              <span className="text-gray-600 mr-1.5">Prizes:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-lime-600 font-bold">$10</span>
                <span className="mx-1 text-gray-400">▪</span>
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-lime-600 font-bold">$5</span>
                <span className="mx-1 text-gray-400">▪</span>
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-lime-600 font-bold">$2</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-center text-base font-extrabold text-lime-600">Competition is LIVE!</p>
            <button 
              className="w-full mt-2 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold cursor-not-allowed transition-all duration-200 hover:bg-gray-400"
              disabled
            >
              Registration Closed
            </button>
          </div>
        </div>
        
        {/* Pro League */}
        <div className="relative border-2 border-lime-400 w-full max-h-[80vh] rounded-xl p-5 shadow-lg bg-gradient-to-br from-lime-100 to-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl opacity-0 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <span className="absolute top-3 left-3 bg-lime-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow transition-all duration-200 hover:bg-lime-600">Live</span>
          <div className="flex flex-col items-center mt-6">
            <Trophy className="h-10 w-10 text-yellow-500 mb-3" />
            <h2 className="text-xl font-extrabold text-gray-800"># Pro League</h2>
            <p className="text-sm text-gray-600">For serious fans</p>
          </div>
          
          <div className="mt-4 space-y-2 text-sm font-semibold">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Entry Fee:</span>
              <span className="font-bold">$10.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Questions:</span>
              <span className="font-bold">20</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Min Players:</span>
              <span className="font-bold">25</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Difficulty:</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-lime-600 mr-1.5" />
                <span className="font-bold text-lime-600">Medium</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-lime-600 mr-1.5" />
              <span className="text-gray-700 font-semibold">3 more to start</span>
            </div>
            <div className="flex items-center mt-1.5">
              <span className="text-gray-600 mr-1.5">Prizes:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-lime-600 font-bold">$50</span>
                <span className="mx-1 text-gray-400">▪</span>
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-lime-600 font-bold">$25</span>
                <span className="mx-1 text-gray-400">▪</span>
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-lime-600 font-bold">$10</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-center text-base font-extrabold text-lime-600">Competition is LIVE!</p>
            <button 
              onClick={() => handleRegisterClick('pro-league')}
              className="w-full mt-2 py-2 bg-lime-500 text-white rounded-lg font-semibold transition-all duration-200 hover:bg-lime-600"
            >
              {isLoggedIn ? 'Register Now' : 'Sign Up to Join'}
            </button>
          </div>
        </div>
        
        {/* Elite League */}
        <div className="relative border-2 border-lime-500 w-full max-h-[80vh] rounded-xl p-5 shadow-lg bg-gradient-to-br from-lime-200 to-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl opacity-0 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <span className="absolute top-3 left-3 bg-lime-700 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow transition-all duration-200 hover:bg-lime-800">Live</span>
          <div className="flex flex-col items-center mt-6">
            <Trophy className="h-10 w-10 text-yellow-600 mb-3" />
            <h2 className="text-xl font-extrabold text-gray-800"># Elite League</h2>
            <p className="text-sm text-gray-600">Expert level only</p>
          </div>
          
          <div className="mt-4 space-y-2 text-sm font-semibold">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Entry Fee:</span>
              <span className="font-bold">$50.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Questions:</span>
              <span className="font-bold">30</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Min Players:</span>
              <span className="font-bold">30</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Difficulty:</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-lime-700 mr-1.5" />
                <span className="font-bold text-lime-700">Hard</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-lime-600 mr-1.5" />
              <span className="text-gray-700 font-semibold">Min reached</span>
            </div>
            <div className="flex items-center mt-1.5">
              <span className="text-gray-600 mr-1.5">Prizes:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-lime-600 font-bold">$200</span>
                <span className="mx-1 text-gray-400">▪</span>
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-lime-600 font-bold">$100</span>
                <span className="mx-1 text-gray-400">▪</span>
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-lime-600 font-bold">$50</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-center text-base font-extrabold text-lime-600">Competition is LIVE!</p>
            <button 
              className="w-full mt-2 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold cursor-not-allowed transition-all duration-200 hover:bg-gray-400"
              disabled
            >
              Registration Closed
            </button>
          </div>
        </div>
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
              <Clock className="h-6 w-6 text-purple-500" />
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