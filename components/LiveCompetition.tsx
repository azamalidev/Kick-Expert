'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { Trophy, CheckCircle, Star, Calendar, Clock, Award, Users, X, CreditCard, Wallet, History, BarChart3, Target, Timer, Crown, TrendingUp, Share, Instagram, Twitter, MessageCircle } from 'lucide-react';
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

// Interfaces for performance tracking
interface QuestionPerformance {
  question_id: string;
  time_taken: number; // in seconds
  is_correct: boolean;
  answered_at: string;
}

interface CompetitionPerformance {
  id: string;
  user_id: string;
  competition_id: string;
  total_score: number;
  correct_answers: number;
  total_questions: number;
  total_time: number;
  average_time: number;
  final_rank: number;
  xp_earned: number;
  completed_at: string;
  question_performance: QuestionPerformance[];
}

interface CompetitionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface Competition {
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

interface UserWallet {
  id: string;
  user_id: string;
  cash_balance: number;
  reward_balance: number;
  total_balance: number;
  updated_at: string;
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
  onProceedToPayment: (priceId: string, competitionId: string, method: 'stripe' | 'paypal' | 'wallet') => void;
  startTime: Date;
  userWallet: UserWallet | null;
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'stripe' | 'paypal' | 'wallet') => void;
  competitionName: string;
  entryFee: number;
  userWallet: UserWallet | null;
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
}

interface WalletPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: any;
  userWallet: UserWallet | null;
  onPaymentSuccess: () => void;
}

interface TrophyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionName: string;
  rank: number;
  xpEarned: number;
  totalScore: number;
  accuracy: number;
}

interface XPRankSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// XP Rank System Modal
const XPRankSystemModal: React.FC<XPRankSystemModalProps> = ({
  isOpen,
  onClose
}) => {
  const rankLevels = [
    { level: 1, name: 'Rookie', xpRequired: 0, color: 'text-gray-500' },
    { level: 2, name: 'Prospect', xpRequired: 100, color: 'text-blue-500' },
    { level: 3, name: 'Starter', xpRequired: 300, color: 'text-green-500' },
    { level: 4, name: 'All-Star', xpRequired: 600, color: 'text-purple-500' },
    { level: 5, name: 'MVP', xpRequired: 1000, color: 'text-yellow-500' },
    { level: 6, name: 'Legend', xpRequired: 1500, color: 'text-orange-500' },
    { level: 7, name: 'Hall of Famer', xpRequired: 2100, color: 'text-red-500' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white relative flex-shrink-0">
              <h2 className="text-xl font-bold text-center">XP & Rank System</h2>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-white hover:text-blue-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">How XP Works</h3>
                <p className="text-gray-600 mb-4">
                  Earn XP by participating in competitions. Your performance directly impacts how much XP you earn:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Base XP</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Easy Competition: 100 XP</li>
                      <li>• Medium Competition: 150 XP</li>
                      <li>• Hard Competition: 200 XP</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Performance Bonuses</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Accuracy: Up to 50% bonus</li>
                      <li>• Speed: Up to 30% bonus</li>
                      <li>• Ranking: Up to 50% bonus</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Example Calculation</h4>
                  <p className="text-sm text-gray-600">
                    In a Hard competition (200 base XP) with 80% accuracy (+80 XP), fast answers (+60 XP), 
                    and 1st place finish (+100 XP) = 440 total XP earned!
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Rank Progression</h3>
                <div className="space-y-4">
                  {rankLevels.map((rank, index) => (
                    <div key={rank.level} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-bold text-lg ${rank.color}`}>
                          Level {rank.level}: {rank.name}
                        </span>
                        <span className="text-gray-500">{rank.xpRequired} XP Required</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, (rank.xpRequired / 2100) * 100)}%` }}
                        ></div>
                      </div>
                      {index < rankLevels.length - 1 && (
                        <p className="text-sm text-gray-500 mt-2">
                          Next: {rankLevels[index + 1].name} at {rankLevels[index + 1].xpRequired} XP
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-300 bg-white flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
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

// Trophy Share Modal
const TrophyShareModal: React.FC<TrophyShareModalProps> = ({
  isOpen,
  onClose,
  competitionName,
  rank,
  xpEarned,
  totalScore,
  accuracy
}) => {
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareText = `I ranked #${rank} in the ${competitionName} on KickExpert! Scored ${totalScore} points with ${accuracy}% accuracy and earned ${xpEarned} XP. Join me in the next competition!`;
  
  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };
  
  const shareToInstagram = () => {
    // For Instagram, we can only open the app as direct sharing isn't possible via web
    toast.success('Screenshot this trophy to share on Instagram!');
  };
  
  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Share Your Achievement</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-center text-white mb-6">
                <Trophy className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{competitionName}</h3>
                <p className="text-3xl font-extrabold mb-2">Rank #{rank}</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm">Score</p>
                    <p className="text-lg font-bold">{totalScore}</p>
                  </div>
                  <div>
                    <p className="text-sm">Accuracy</p>
                    <p className="text-lg font-bold">{accuracy}%</p>
                  </div>
                  <div>
                    <p className="text-sm">XP Earned</p>
                    <p className="text-lg font-bold">+{xpEarned}</p>
                  </div>
                  <div>
                    <p className="text-sm">Date</p>
                    <p className="text-lg font-bold">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-center text-gray-600 mb-4">Share your achievement with friends</p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={shareToTwitter}
                    className="bg-blue-400 hover:bg-blue-500 text-white p-3 rounded-full transition-colors"
                  >
                    <Twitter size={24} />
                  </button>
                  
                  <button
                    onClick={shareToInstagram}
                    className="bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-full transition-colors"
                  >
                    <Instagram size={24} />
                  </button>
                  
                  <button
                    onClick={shareToWhatsApp}
                    className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-colors"
                  >
                    <MessageCircle size={24} />
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                    toast.success('Copied to clipboard!');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
                >
                  <Share size={18} />
                  Copy Link
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Enhanced Competition History Component
const CompetitionHistory: React.FC<CompetitionHistoryProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const [performanceData, setPerformanceData] = useState<CompetitionPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerformance, setSelectedPerformance] = useState<CompetitionPerformance | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [trophyModalOpen, setTrophyModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchCompetitionHistory();
    }
  }, [isOpen, userId]);

  const fetchCompetitionHistory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('competition_performance')
        .select(`
          *,
          competitions (name, entry_fee, start_time)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching competition history:', error);
        toast.error('Failed to load competition history');
        return;
      }

      setPerformanceData(data || []);
    } catch (error) {
      console.error('Error fetching competition history:', error);
      toast.error('Failed to load competition history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const openDetailModal = (performance: CompetitionPerformance) => {
    setSelectedPerformance(performance);
    setDetailModalOpen(true);
  };

  const openTrophyModal = (performance: CompetitionPerformance) => {
    setSelectedPerformance(performance);
    setTrophyModalOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white relative flex-shrink-0">
                <h2 className="text-xl font-bold text-center">Competition History</h2>
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 text-white hover:text-blue-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : performanceData.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No competition history yet</h3>
                    <p className="text-gray-600">Participate in competitions to see your performance data here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {performanceData.map((performance) => (
                      <div 
                        key={performance.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">
                              {(performance as any).competitions?.name || 'Unknown Competition'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(performance.completed_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            <Crown size={16} className="mr-1" />
                            <span className="font-semibold">Rank: #{performance.final_rank}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="text-center">
                            <div className="bg-green-100 p-3 rounded-lg">
                              <Target className="h-6 w-6 text-green-600 mx-auto mb-1" />
                              <p className="text-sm text-gray-600">Score</p>
                              <p className="font-bold text-lg text-green-600">{performance.total_score}</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                              <p className="text-sm text-gray-600">Correct</p>
                              <p className="font-bold text-lg text-blue-600">
                                {performance.correct_answers}/{performance.total_questions}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="bg-purple-100 p-3 rounded-lg">
                              <Timer className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                              <p className="text-sm text-gray-600">Avg Time</p>
                              <p className="font-bold text-lg text-purple-600">
                                {formatTime(performance.average_time)}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="bg-orange-100 p-3 rounded-lg">
                              <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                              <p className="text-sm text-gray-600">XP Earned</p>
                              <p className="font-bold text-lg text-orange-600">+{performance.xp_earned}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                            <BarChart3 size={16} className="mr-2" />
                            Performance Breakdown
                          </h4>
                          <div className="space-y-2">
                            {performance.question_performance.slice(0, 5).map((q, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span>Q{index + 1}</span>
                                <span className={q.is_correct ? 'text-green-600' : 'text-red-600'}>
                                  {q.is_correct ? 'Correct' : 'Incorrect'}
                                </span>
                                <span>{formatTime(q.time_taken)}</span>
                              </div>
                            ))}
                            {performance.question_performance.length > 5 && (
                              <p className="text-xs text-gray-500 text-center mt-2">
                                +{performance.question_performance.length - 5} more questions
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between mt-4">
                          <button
                            onClick={() => openDetailModal(performance)}
                            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => openTrophyModal(performance)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center"
                          >
                            <Trophy size={16} className="mr-2" />
                            Share Trophy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-300 bg-white flex-shrink-0">
                <button
                  onClick={onClose}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Performance Modal */}
      <AnimatePresence>
        {detailModalOpen && selectedPerformance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white relative flex-shrink-0">
                <h2 className="text-xl font-bold text-center">Performance Details</h2>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="absolute top-3 right-3 text-white hover:text-purple-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-6">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {(selectedPerformance as any).competitions?.name || 'Unknown Competition'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Completed on {new Date(selectedPerformance.completed_at).toLocaleDateString()} at{' '}
                    {new Date(selectedPerformance.completed_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Target className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Total Score</p>
                      <p className="font-bold text-lg text-green-600">{selectedPerformance.total_score}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Accuracy</p>
                      <p className="font-bold text-lg text-blue-600">
                        {Math.round((selectedPerformance.correct_answers / selectedPerformance.total_questions) * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Timer className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Total Time</p>
                      <p className="font-bold text-lg text-purple-600">
                        {formatTime(selectedPerformance.total_time)}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Crown className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Final Rank</p>
                      <p className="font-bold text-lg text-orange-600">#{selectedPerformance.final_rank}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <BarChart3 size={18} className="mr-2" />
                    Question-by-Question Performance
                  </h4>
                  <div className="space-y-3">
                    {selectedPerformance.question_performance.map((q, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">Question {index + 1}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            q.is_correct 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {q.is_correct ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Time taken: {formatTime(q.time_taken)}</span>
                          <span>Answered at: {new Date(q.answered_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <TrendingUp size={18} className="mr-2" />
                    XP Breakdown
                  </h4>
                  <p className="text-gray-600">
                    You earned <span className="font-bold text-orange-600">{selectedPerformance.xp_earned} XP</span> in this competition
                    based on your accuracy, speed, and final ranking.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-300 bg-white flex-shrink-0">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trophy Share Modal */}
      {selectedPerformance && (
        <TrophyShareModal
          isOpen={trophyModalOpen}
          onClose={() => setTrophyModalOpen(false)}
          competitionName={(selectedPerformance as any).competitions?.name || 'Unknown Competition'}
          rank={selectedPerformance.final_rank}
          xpEarned={selectedPerformance.xp_earned}
          totalScore={selectedPerformance.total_score}
          accuracy={Math.round((selectedPerformance.correct_answers / selectedPerformance.total_questions) * 100)}
        />
      )}
    </>
  );
};

// Wallet Payment Modal
const WalletPaymentModal: React.FC<WalletPaymentModalProps> = ({
  isOpen,
  onClose,
  competition,
  userWallet,
  onPaymentSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!userWallet) {
      toast.error('Wallet not found');
      return;
    }

    if (userWallet.cash_balance < competition.entry_fee) {
      toast.error('Insufficient balance in your wallet');
      return;
    }

    setIsProcessing(true);

    try {
      // Process wallet payment
      const { error } = await supabase.rpc('process_wallet_payment', {
        user_id: userWallet.user_id,
        amount: competition.entry_fee,
        competition_id: competition.id
      });

      if (error) {
        console.error('Wallet payment error:', error);
        toast.error('Payment failed. Please try again.');
        return;
      }

      toast.success('Payment successful!');
      onPaymentSuccess();
    } catch (error) {
      console.error('Wallet payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
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
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Pay with Wallet</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isProcessing}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Competition:</span>
                    <span className="font-semibold">{competition.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Entry Fee:</span>
                    <span className="font-bold text-lime-600">${competition.entry_fee}</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Your Balance:</span>
                    <span className="font-bold text-blue-600">${userWallet?.cash_balance || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">After Payment:</span>
                    <span className="font-bold text-blue-600">
                      ${userWallet ? (userWallet.cash_balance - competition.entry_fee).toFixed(2) : 0}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isProcessing || !userWallet || userWallet.cash_balance < competition.entry_fee}
                  className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    `Pay $${competition.entry_fee}`
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

// PayPal Payment Modal
const PayPalPaymentModal: React.FC<PayPalPaymentModalProps> = ({
  isOpen,
  onClose,
  competition,
  user,
  onPaymentSuccess
}) => {
  const paypalButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && window.paypal) {
      window.paypal.Buttons({
        createOrder: function(data: any, actions: any) {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: competition.entry_fee
              }
            }]
          });
        },
        onApprove: function(data: any, actions: any) {
          return actions.order.capture().then(async function(details: any) {
            try {
              // Process PayPal payment
              const response = await fetch('/api/paypal-success', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderID: data.orderID,
                  competitionId: competition.id,
                  userId: user.id,
                  amount: competition.entry_fee
                })
              });

              if (response.ok) {
                toast.success('Payment successful!');
                onPaymentSuccess();
              } else {
                toast.error('Payment processing failed');
              }
            } catch (error) {
              console.error('PayPal payment error:', error);
              toast.error('Payment processing failed');
            }
          });
        },
        onError: function(err: any) {
          console.error('PayPal error:', err);
          toast.error('Payment failed. Please try again.');
        }
      }).render(paypalButtonRef.current);
    }
  }, [isOpen, competition, user, onPaymentSuccess]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Pay with PayPal</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Competition:</span>
                    <span className="font-semibold">{competition.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Entry Fee:</span>
                    <span className="font-bold text-lime-600">${competition.entry_fee}</span>
                  </div>
                </div>

                <div ref={paypalButtonRef} className="paypal-button-container"></div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Payment Method Modal
const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
  competitionName,
  entryFee,
  userWallet
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Select Payment Method</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Competition:</span>
                    <span className="font-semibold">{competitionName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Entry Fee:</span>
                    <span className="font-bold text-lime-600">${entryFee}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => onSelectMethod('stripe')}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <CreditCard className="h-6 w-6 text-blue-500 mr-3" />
                      <span className="font-semibold">Credit/Debit Card</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>

                  <button
                    onClick={() => onSelectMethod('paypal')}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="h-6 w-6 bg-blue-700 rounded mr-3 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">PP</span>
                      </div>
                      <span className="font-semibold">PayPal</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>

                  <button
                    onClick={() => onSelectMethod('wallet')}
                    disabled={!userWallet || userWallet.cash_balance < entryFee}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center">
                      <Wallet className="h-6 w-6 text-green-500 mr-3" />
                      <div>
                        <span className="font-semibold block">Wallet Balance</span>
                        <span className="text-sm text-gray-500">
                          ${userWallet?.cash_balance.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Already Registered Modal
const AlreadyRegisteredModal: React.FC<AlreadyRegisteredModalProps> = ({
  isOpen,
  onClose,
  competitionName,
  paidAmount
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="text-center mb-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Already Registered</h2>
                <p className="text-gray-600">
                  You've already registered for <span className="font-semibold">{competitionName}</span>
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-bold text-green-600">${paidAmount}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Continue to Competition
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Competition Modal
const CompetitionModal: React.FC<CompetitionModalProps> = ({
  isOpen,
  onClose,
  competition,
  onProceedToPayment,
  startTime,
  userWallet
}) => {
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);

  const handleProceedToPayment = (method: 'stripe' | 'paypal' | 'wallet') => {
    setPaymentMethodModalOpen(false);
    onProceedToPayment(competition.priceId, competition.id, method);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Join Competition</h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">{competition.name}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Entry Fee:</span>
                        <span className="font-bold text-lime-600">{competition.price}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Starts:</span>
                        <span className="font-semibold">{startTime.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Questions:</span>
                        <span className="font-semibold">{competition.questions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Difficulty:</span>
                        <span className="font-semibold text-lime-600">{competition.difficulty}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Prizes</h4>
                    <ul className="space-y-1">
                      {competition.prizes.map((prize, index) => (
                        <li key={index} className="flex items-center">
                          <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                          <span className="text-blue-700">{prize}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => setPaymentMethodModalOpen(true)}
                    className="w-full bg-lime-600 hover:bg-lime-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PaymentMethodModal
        isOpen={paymentMethodModalOpen}
        onClose={() => setPaymentMethodModalOpen(false)}
        onSelectMethod={handleProceedToPayment}
        competitionName={competition.name}
        entryFee={competition.entry_fee}
        userWallet={userWallet}
      />
    </>
  );
};

// Main Live Competition Component
const LiveCompetition = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [paypalModalOpen, setPaypalModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [xpRankModalOpen, setXpRankModalOpen] = useState(false);
  const [alreadyRegisteredModalOpen, setAlreadyRegisteredModalOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [alreadyRegisteredData, setAlreadyRegisteredData] = useState<{
    competitionName: string;
    paidAmount: number;
  }>({ competitionName: '', paidAmount: 0 });

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

    // Fetch user wallet
    const fetchUserWallet = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error fetching wallet:', error);
          return null;
        }

        return data;
      } catch (error) {
        console.error('Error fetching wallet:', error);
        return null;
      }
    };

    const initializeData = async () => {
      const user = await checkUser();
      const competitionsData = await fetchCompetitions();
      
      let registrationsData: CompetitionRegistration[] = [];
      let walletData: UserWallet | null = null;
      
      if (user) {
        registrationsData = await fetchRegistrations(user.id);
        walletData = await fetchUserWallet(user.id);
      }
      
      setCompetitions(competitionsData);
      setRegistrations(registrationsData);
      setUserWallet(walletData);
      setIsLoading(false);
    };

    initializeData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setIsLoggedIn(!!currentUser);
      setUser(currentUser);
      
      // If user logs in, fetch their registrations and wallet
      if (currentUser) {
        const registrationsData = await fetchRegistrations(currentUser.id);
        const walletData = await fetchUserWallet(currentUser.id);
        setRegistrations(registrationsData);
        setUserWallet(walletData);
      } else {
        setRegistrations([]);
        setUserWallet(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Function to record competition performance (to be called after a competition ends)
  const recordCompetitionPerformance = async (
    competitionId: string,
    performanceData: Omit<CompetitionPerformance, 'id' | 'user_id' | 'competition_id' | 'completed_at'>
  ) => {
    if (!user) return;

    try {
      // Calculate XP based on performance
      const competition = competitions.find(c => c.id === competitionId);
      const difficulty = competition ? getDifficulty(competition.name) : 'Easy';
      const xp_earned = calculateXPEarned(
        performanceData.correct_answers,
        performanceData.total_questions,
        performanceData.average_time,
        performanceData.final_rank,
        difficulty
      );

      const { error } = await supabase
        .from('competition_performance')
        .insert([
          {
            user_id: user.id,
            competition_id: competitionId,
            ...performanceData,
            xp_earned,
            completed_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error recording competition performance:', error);
        return;
      }

      // Also update user's total XP
      const { error: xpError } = await supabase.rpc('increment_user_xp', {
        user_id: user.id,
        xp_amount: xp_earned
      });

      if (xpError) {
        console.error('Error updating user XP:', xpError);
      }

      toast.success('Competition performance recorded!');
    } catch (error) {
      console.error('Error recording competition performance:', error);
      toast.error('Failed to record competition performance');
    }
  };

  // Function to calculate XP based on performance
  const calculateXPEarned = (
    correctAnswers: number,
    totalQuestions: number,
    averageTime: number,
    finalRank: number,
    competitionDifficulty: string
  ) => {
    const accuracy = correctAnswers / totalQuestions;
    
    // Base XP based on difficulty
    let baseXP = 100;
    if (competitionDifficulty === 'Medium') baseXP = 150;
    if (competitionDifficulty === 'Hard') baseXP = 200;
    
    // Accuracy bonus (up to 50% of base XP)
    const accuracyBonus = accuracy * baseXP * 0.5;
    
    // Speed bonus (faster answers get more bonus)
    const timeBonus = Math.max(0, (30 - averageTime) / 30) * baseXP * 0.3;
    
    // Ranking bonus (top ranks get more bonus)
    let rankBonus = 0;
    if (finalRank === 1) rankBonus = baseXP * 0.5;
    else if (finalRank <= 3) rankBonus = baseXP * 0.3;
    else if (finalRank <= 10) rankBonus = baseXP * 0.2;
    else if (finalRank <= 25) rankBonus = baseXP * 0.1;
    
    return Math.round(baseXP + accuracyBonus + timeBonus + rankBonus);
  };

  // Function to be called when a competition ends
  const handleCompetitionCompletion = async (
    competitionId: string,
    userAnswers: Array<{
      question_id: string;
      time_taken: number;
      is_correct: boolean;
      answered_at: string;
    }>,
    finalScore: number,
    finalRank: number
  ) => {
    const correctAnswers = userAnswers.filter(answer => answer.is_correct).length;
    const totalQuestions = userAnswers.length;
    const totalTime = userAnswers.reduce((sum, answer) => sum + answer.time_taken, 0);
    const averageTime = totalTime / totalQuestions;

    await recordCompetitionPerformance(competitionId, {
      total_score: finalScore,
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      total_time: totalTime,
      average_time: averageTime,
      final_rank: finalRank,
      question_performance: userAnswers
    });
  };

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

  const handlePayment = async (priceId: string, competitionId: string, method: 'stripe' | 'paypal' | 'wallet') => {
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
        paidAmount: registration.paid_amount
      });
      setModalOpen(false);
      setAlreadyRegisteredModalOpen(true);
      return;
    }

    if (method === 'stripe') {
      await handleStripeRegister(priceId, competitionId);
    } else if (method === 'paypal') {
      setPaypalModalOpen(true);
    } else if (method === 'wallet') {
      setWalletModalOpen(true);
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

  const handleWalletPaymentSuccess = () => {
    // Refresh registrations and wallet after successful payment
    const fetchData = async () => {
      if (user) {
        const { data: regData } = await supabase
          .from('competition_registrations')
          .select('*')
          .eq('user_id', user.id);
        
        const { data: walletData } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (regData) setRegistrations(regData);
        if (walletData) setUserWallet(walletData);
      }
    };
    
    fetchData();
    setWalletModalOpen(false);
    setModalOpen(false);
    toast.success('Payment successful! You are now registered for the competition.');
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
    entry_fee: comp.entry_fee,
    isRegistered: isUserRegistered(comp.id)
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600"></div>
      </div>
    );
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
          onProceedToPayment={handlePayment}
          startTime={selectedCompetition ? selectedCompetition.startTime : new Date()}
          userWallet={userWallet}
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

      {selectedCompetition && (
        <WalletPaymentModal
          isOpen={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          competition={selectedCompetition}
          userWallet={userWallet}
          onPaymentSuccess={handleWalletPaymentSuccess}
        />
      )}

      <AlreadyRegisteredModal
        isOpen={alreadyRegisteredModalOpen}
        onClose={() => setAlreadyRegisteredModalOpen(false)}
        competitionName={alreadyRegisteredData.competitionName}
        paidAmount={alreadyRegisteredData.paidAmount}
      />

      <CompetitionHistory
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        userId={user?.id || ''}
      />

      <XPRankSystemModal
        isOpen={xpRankModalOpen}
        onClose={() => setXpRankModalOpen(false)}
      />

      {/* Header section */}
      <div className="text-center mb-2 w-full max-w-4xl">
        <p className="text-lime-600 font-semibold text-xl mb-3">Football Trivia</p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-5">
          Live Competitions
        </h1>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          {isLoggedIn && (
            <button
              onClick={() => setHistoryModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <History size={18} className="mr-2" />
              View My Competition History
            </button>
          )}
          
          <button
            onClick={() => setXpRankModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            <TrendingUp size={18} className="mr-2" />
            XP & Rank System
          </button>
        </div>
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
                <p className="text-center text-base font-extrabold text-lime-600">Competition is LIVE!</p>
                <button
                  onClick={() => handleOpenModal(comp)}
                  className="w-full mt-2 py-2 text-white rounded-lg font-semibold transition-all duration-200"
                  style={{ 
                    backgroundColor: index === 0 ? '#a3e635' : index === 1 ? '#65a30d' : '#3f6212',
                    cursor: 'pointer'
                  }}
                >
                  {comp.isRegistered ? 'Already Registered' : (isLoggedIn ? 'Register & Pay' : 'Sign Up to Join')}
                </button>
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