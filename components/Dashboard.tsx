'use client';

import { useState, useEffect } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { TrophyService } from '../utils/trophyService';
import { getRankFromXP, getNextRank, getProgressToNextRank } from '../utils/rankSystem';
import { Trophy, TrophyStats } from '../types/trophy';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProfileData {
  username: string;
  email: string;
  xp: number;
  total_games: number;
  total_wins: number;
  rank_label: string;
  avatar_url?: string;
}

interface WalletData {
  balance: number;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string;
  xp: number;
  rank_label: string;
  total_games: number;
  total_wins: number;
  win_rate: number;
  rank_position: number;
}

interface TransactionEntry {
  id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  source: string;
  created_at: string;
}

export default function Dashboard() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [userTrophies, setUserTrophies] = useState<Trophy[]>([]);
  const [trophyStats, setTrophyStats] = useState<TrophyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [trophiesLoading, setTrophiesLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Fallback states for when data is loading
  const [username, setUsername] = useState<string>("Loading...");
  const [userEmail, setUserEmail] = useState<string>("Loading...");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [entryCredits, setEntryCredits] = useState<number>(2);
  const [competitionsPlayed, setCompetitionsPlayed] = useState<number>(0);
  const [winPercentage, setWinPercentage] = useState<number>(0);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'wallet' | 'history' | 'notifications' | 'support'>('wallet');
  const [supportMessage, setSupportMessage] = useState<string>("");
  const [supportSubject, setSupportSubject] = useState<string>("");

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user data on component mount
  useEffect(() => {
    if (mounted) {
      fetchUserData();
      fetchLeaderboardData();
      fetchTransactions();
      fetchUserTrophies();
    }
  }, [mounted]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        setLoading(false);
        return;
      }

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, xp, total_games, total_wins, rank_label, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profile) {
        setProfileData({
          username: profile.username || 'User',
          email: user.email || '',
          xp: profile.xp || 0,
          total_games: profile.total_games || 0,
          total_wins: profile.total_wins || 0,
          rank_label: profile.rank_label || 'Beginner',
          avatar_url: profile.avatar_url
        });
        
        // Update state variables
        setUsername(profile.username || 'User');
        setUserEmail(user.email || '');
        setCompetitionsPlayed(profile.total_games || 0);
        
        // Calculate win percentage
        const winPercent = profile.total_games > 0 
          ? Math.round((profile.total_wins / profile.total_games) * 100) 
          : 0;
        setWinPercentage(winPercent);
      }

      // Fetch wallet data
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError) {
        console.error('Error fetching wallet:', walletError);
        // Create wallet if it doesn't exist
        if (walletError.code === 'PGRST116') {
          const { error: createWalletError } = await supabase
            .from('wallets')
            .insert({
              user_id: user.id,
              balance: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (!createWalletError) {
            setWalletBalance(0);
          }
        }
      } else if (wallet) {
        setWalletData(wallet);
        setWalletBalance(Number(wallet.balance) || 0);
      }

      // Fetch total earnings from transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'reward')
        .eq('status', 'completed');

      if (!transactionsError && transactions) {
        const totalEarned = transactions.reduce((sum, transaction) => 
          sum + (Number(transaction.amount) || 0), 0);
        setTotalEarnings(totalEarned);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      setLeaderboardLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_top_users_leaderboard');

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      if (data) {
        setLeaderboardData(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      const { data, error } = await supabase
        .rpc('get_user_transaction_history', { target_user_id: user.id });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast.error("Failed to load transactions");
        return;
      }

      if (data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error("Failed to load transactions");
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchUserTrophies = async () => {
    try {
      setTrophiesLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      // Fetch user trophies
      const trophies = await TrophyService.getUserTrophies(user.id);
      setUserTrophies(trophies);

      // Fetch trophy stats
      const stats = await TrophyService.getTrophyStats(user.id);
      setTrophyStats(stats);

    } catch (error) {
      console.error('Error fetching user trophies:', error);
    } finally {
      setTrophiesLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount)) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount < 5) {
      toast.error("Minimum withdrawal amount is $5.00");
      return;
    }
    if (amount > walletBalance) {
      toast.error("Insufficient funds");
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      // Update wallet balance in database
      const newBalance = walletBalance - amount;
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        toast.error("Failed to process withdrawal");
        console.error('Withdrawal error:', updateError);
        return;
      }

      // Log the withdrawal transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: -amount, // Negative for withdrawal
          type: 'withdrawal',
          status: 'completed',
          description: `Withdrawal of $${amount.toFixed(2)}`,
          source: 'manual_withdrawal',
          created_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error('Transaction logging error:', transactionError);
        // Don't fail the withdrawal if transaction logging fails
      }

      // Update local state
      setWalletBalance(newBalance);
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      toast.success(`Successfully withdrew $${amount.toFixed(2)}`);
      // Refresh transactions
      fetchTransactions();
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error("Failed to process withdrawal");
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage) {
      toast.error("Please fill in all fields");
      return;
    }
    // In a real app, you would send this to your backend
    toast.success("Support ticket submitted successfully!");
    setSupportMessage("");
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'reward':
        return <span className="text-green-500">📈</span>;
      case 'withdrawal':
        return <span className="text-red-500">💸</span>;
      case 'bonus':
        return <span className="text-blue-500">🎁</span>;
      default:
        return <span className="text-gray-500">💰</span>;
    }
  };

  return (
    <div className="min-h-fit mt-15 bg-gray-50 text-gray-800 flex items-center justify-center p-6">
      <Toaster position="top-right" />
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">Loading your dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Withdraw Modal */}
          {showWithdrawModal && (
            <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-lg">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Withdraw Funds</h3>
                <p className="text-gray-600 mb-6">
                  Enter the amount you wish to withdraw. Current balance: ${walletBalance.toFixed(2)}. Min $5.00.
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2 text-gray-600">Amount</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 text-gray-700 placeholder-gray-400"
                    placeholder="e.g., 20.00"
                    step="0.01"
                    min="5"
                    max={walletBalance}
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdraw}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Confirm Withdraw
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border-gray-100 w-full">
            {/* Enhanced Profile Section with Rank Progression */}
            <div className="bg-gradient-to-r from-lime-50 to-green-50 border-2 border-lime-200 p-6 rounded-2xl mb-8 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                {/* Profile Info */}
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="w-20 h-20 bg-lime-100 rounded-full mr-6 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {profileData?.avatar_url ? (
                      <img 
                        src={profileData.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-10 h-10 text-lime-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-1">{username}</h2>
                    <p className="text-gray-600 mb-2">{userEmail}</p>
                    
                    {/* Current Rank Display */}
                    {mounted && profileData?.xp !== undefined && (
                      <div className="flex items-center space-x-3">
                        {(() => {
                          const currentRank = getRankFromXP(profileData.xp);
                          return (
                            <div className={`flex items-center px-3 py-1 rounded-full ${currentRank.bgColor} ${currentRank.color} font-semibold`}>
                              <span className="text-lg mr-2">{currentRank.icon}</span>
                              <span className="text-sm font-bold">{currentRank.label}</span>
                            </div>
                          );
                        })()}
                        <div className="text-sm text-gray-600">
                          <span className="font-bold">{profileData.xp.toLocaleString()}</span> XP
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rank Progress Section */}
                {mounted && profileData?.xp !== undefined && (
                  <div className="bg-white rounded-xl p-4 shadow-md border border-lime-100 min-w-0 md:w-80">
                    {(() => {
                      const nextRankInfo = getNextRank(profileData.xp);
                      const progress = getProgressToNextRank(profileData.xp);
                      
                      if (!nextRankInfo) {
                        return (
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-2xl mr-2">👑</span>
                              <span className="text-lg font-bold text-yellow-600">Max Rank Achieved!</span>
                            </div>
                            <p className="text-sm text-gray-600">You've reached the highest rank!</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-600">Next Rank</span>
                            <div className="flex items-center">
                              <span className="text-lg mr-1">{nextRankInfo.nextRank.icon}</span>
                              <span className="text-sm font-bold text-gray-700">{nextRankInfo.nextRank.label}</span>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-lime-400 to-lime-500 h-3 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{progress.toFixed(1)}% Complete</span>
                            <span>{nextRankInfo.xpNeeded.toLocaleString()} XP needed</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {/* Wallet Balance */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 py-8 rounded-xl border-2 border-green-200 hover:border-green-400 transition duration-200 shadow-md hover:shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Wallet Balance</p>
                    <p className="text-xl font-bold text-green-700">${walletBalance.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* XP Points */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-5 py-8 rounded-xl border-2 border-yellow-200 hover:border-yellow-400 transition duration-200 shadow-md hover:shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">XP Points</p>
                    <p className="text-xl font-bold text-yellow-700">{profileData?.xp || 0}</p>
                  </div>
                </div>
              </div>

              {/* Competitions Played */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 py-8 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition duration-200 shadow-md hover:shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Competitions</p>
                    <p className="text-xl font-bold text-blue-700">{competitionsPlayed}</p>
                  </div>
                </div>
              </div>

              {/* Win Percentage */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 py-8 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition duration-200 shadow-md hover:shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Win Rate</p>
                    <p className="text-xl font-bold text-emerald-700">{winPercentage}%</p>
                  </div>
                </div>
              </div>

              {/* Total Earnings */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-5 py-8 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition duration-200 shadow-md hover:shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Earnings</p>
                    <p className="text-xl font-bold text-purple-700">${totalEarnings.toFixed(2)}</p>
                  </div>
                </div>
              </div>

            
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="w-full py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Withdraw Funds
              </button>   
            </div>

            {/* Leaderboard Section */}
            <div className="bg-white rounded-2xl p-6 my-8 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  Top Players Leaderboard
                </h3>
                <button
                  onClick={fetchLeaderboardData}
                  disabled={leaderboardLoading}
                  className="px-4 py-2 bg-lime-100 hover:bg-lime-200 text-lime-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {leaderboardLoading ? (
                    <div className="w-4 h-4 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Refresh'
                  )}
                </button>
              </div>

              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-gray-600">Loading leaderboard...</span>
                </div>
              ) : leaderboardData.length > 0 ? (
                <div className="space-y-3">
                  {leaderboardData.map((user, index) => (
                    <div 
                      key={user.user_id}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' :
                        index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200' :
                        index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200' :
                        'bg-gray-50 border-gray-200 hover:border-lime-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {/* Rank Badge */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-lime-500 text-white'
                          }`}>
                            {user.rank_position}
                          </div>

                          {/* Avatar */}
                          <div className="w-12 h-12 bg-lime-100 rounded-full mr-4 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img 
                                src={user.avatar_url} 
                                alt={user.username} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg
                                className="w-6 h-6 text-lime-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            )}
                          </div>

                          {/* User Info */}
                          <div>
                            <h4 className="font-bold text-gray-800">{user.username}</h4>
                            <div className="flex items-center space-x-2">
                              <span className="inline-block px-2 py-1 bg-lime-100 text-lime-800 text-xs font-semibold rounded-full">
                                {user.rank_label}
                              </span>
                              <span className="text-sm text-gray-600">
                                {user.total_games} games • {user.win_rate}% win rate
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* XP Points */}
                        <div className="text-right">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            <span className="text-xl font-bold text-gray-800">
                              {user.xp.toLocaleString()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">XP</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No leaderboard data available</p>
                </div>
              )}
            </div>

            {/* Recent Transactions Section */}
            <div className="bg-white rounded-2xl p-6 mt-8 shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div className="w-full grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2 md:justify-center">
                  {/* Wallet Button */}
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors ${activeTab === 'wallet'
                      ? 'bg-lime-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Wallet
                  </button>

                  {/* History Button */}
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors ${activeTab === 'history'
                      ? 'bg-lime-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </button>

                  {/* Notifications Button */}
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors relative ${activeTab === 'notifications'
                      ? 'bg-lime-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">2</span>
                    Notifications
                  </button>

                  {/* Support Button */}
                  <button
                    onClick={() => setActiveTab('support')}
                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors ${activeTab === 'support'
                      ? 'bg-lime-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c-.549-1.165-2.03-2-3.728-2 1.682-2.2 4.694-3.5 7.5-3.5 4.142 0 7.5 3.358 7.5 7.5s-3.358 7.5-7.5 7.5c-1.887 0-3.624-.63-5-1.69v-2.86c.958.284 2.038.444 3.128.444 3.484 0 6.322-2.838 6.322-6.322s-2.838-6.322-6.322-6.322c-1.768 0-3.357.695-4.5 1.822V9z" />
                    </svg>
                    Support
                  </button>
                </div>
              </div>

              {/* Wallet Tab Content */}
              {activeTab === 'wallet' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Wallet Overview</h3>
                    <button
                      onClick={fetchTransactions}
                      disabled={transactionsLoading}
                      className="px-4 py-2 bg-lime-100 hover:bg-lime-200 text-lime-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {transactionsLoading ? (
                        <div className="w-4 h-4 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Refresh'
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-500 uppercase">Current Balance</p>
                        <p className="text-xl font-bold text-lime-600">${walletBalance.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => setShowWithdrawModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span className="text-gray-600">Loading transactions...</span>
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.slice(0, 10).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex justify-between items-start p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{getTransactionIcon(transaction.type)}</div>
                            <div>
                              <p className="font-medium text-gray-800">{transaction.description}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {transaction.source} • {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                                  transaction.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : transaction.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {transaction.status ? 
                                  transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1) 
                                  : 'Unknown'
                                }
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">{transaction.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>No transactions found. Complete competitions to start earning rewards!</p>
                    </div>
                  )}
                </div>
              )}

              {/* History Tab Content */}
              {activeTab === 'history' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
                    <button
                      onClick={fetchTransactions}
                      disabled={transactionsLoading}
                      className="px-4 py-2 bg-lime-100 hover:bg-lime-200 text-lime-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {transactionsLoading ? (
                        <div className="w-4 h-4 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Refresh'
                      )}
                    </button>
                  </div>
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span className="text-gray-600">Loading transactions...</span>
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex justify-between items-start p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{getTransactionIcon(transaction.type)}</div>
                            <div>
                              <p className="font-medium text-gray-800">{transaction.description}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {transaction.source} • {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                                  transaction.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : transaction.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {transaction.status ? 
                                  transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1) 
                                  : 'Unknown'
                                }
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">{transaction.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>No transactions found. Complete competitions to start earning rewards!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab Content */}
              {activeTab === 'notifications' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start">
                        <div className="p-2 bg-lime-100 rounded-full mr-3">
                          <svg className="w-5 h-5 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">New competition available</p>
                          <p className="text-sm text-gray-500">Premier League predictions now open</p>
                          <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start">
                        <div className="p-2 bg-blue-100 rounded-full mr-3">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Withdrawal processed</p>
                          <p className="text-sm text-gray-500">$20.00 has been sent to your account</p>
                          <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Support Tab Content */}
              {activeTab === 'support' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Support Center</h3>
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-bold mb-3">Contact Support</h4>
                      <form onSubmit={handleSupportSubmit}>
                        <div className="mb-4">
                          <label className="block text-sm font-bold text-gray-700 mb-1">Your Message</label>
                          <textarea
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                            placeholder="Describe your issue or question......"
                            rows={4}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full max-w-sm py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          Submit Support Request
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}