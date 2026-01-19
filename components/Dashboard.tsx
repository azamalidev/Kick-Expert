"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { TrophyService } from "../utils/trophyService";
import {
  getRankFromXP,
  getNextRank,
  getProgressToNextRank,
} from "../utils/rankSystem";
import { Trophy, TrophyStats } from "../types/trophy";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Utility function for consistent date formatting (prevents hydration mismatch)
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Rank definitions
const ranks = [
  { label: 'Rookie', minXP: 0, maxXP: 199, color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '🌱' },
  { label: 'Starter', minXP: 200, maxXP: 499, color: 'text-green-600', bgColor: 'bg-green-100', icon: '📗' },
  { label: 'Pro', minXP: 500, maxXP: 999, color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '🛠️' },
  { label: 'Expert', minXP: 1000, maxXP: 1999, color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '⭐' },
  { label: 'Champion', minXP: 2000, maxXP: Infinity, color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '🏆' },
];

// Utility functions moved outside component to prevent recreation
const getTransactionIcon = (type: string) => {
  switch (type) {
    case "reward":
      return <span className="text-green-500">🏆</span>;
    case "referral_reward":
      return <span className="text-blue-500">👥</span>;
    case "topup":
      return <span className="text-green-500">💰</span>;
    case "entry_fee":
      return <span className="text-red-500">🎯</span>;
    case "withdrawal":
      return <span className="text-red-500">💸</span>;
    default:
      return <span className="text-gray-500">💰</span>;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-yellow-100 text-yellow-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "closed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

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
  competition_id?: string;
  session_id?: string;
  reference_id?: string;
}

interface SupportTicket {
  id: string;
  user_id: string;
  topic: string;
  description: string;
  status: string;
  created_at: string;
}

interface DashboardProps {
  initialProfileData: ProfileData | null;
  initialCredits: {
    purchased: number;
    winnings: number;
    referral: number;
  };
  initialTransactions: TransactionEntry[];
  initialLeaderboard: LeaderboardEntry[];
  initialUserTrophies: Trophy[];
  initialTrophyStats: TrophyStats | null;
  initialSupportTickets: SupportTicket[];
  userEmail: string;
}

export default React.memo(function Dashboard({
  initialProfileData,
  initialCredits,
  initialTransactions,
  initialLeaderboard,
  initialUserTrophies,
  initialTrophyStats,
  initialSupportTickets,
  userEmail
}: DashboardProps) {
  // Supabase client is imported from lib/supabaseClient (has session access)

  const [profileData, setProfileData] = useState<ProfileData | null>(initialProfileData);
  const [purchasedCredits, setPurchasedCredits] = useState<number>(initialCredits.purchased);
  const [winningsCredits, setWinningsCredits] = useState<number>(initialCredits.winnings);
  const [referralCredits, setReferralCredits] = useState<number>(initialCredits.referral);
  const totalCredits = useMemo(() => purchasedCredits + winningsCredits, [purchasedCredits, winningsCredits]);
  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [transactions, setTransactions] = useState<TransactionEntry[]>(initialTransactions);
  const [userTrophies, setUserTrophies] = useState<Trophy[]>(initialUserTrophies);
  const [trophyStats, setTrophyStats] = useState<TrophyStats | null>(initialTrophyStats);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(initialSupportTickets);
  const [loading, setLoading] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [trophiesLoading, setTrophiesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const handleRefresh = useCallback(() => {
    setLoading(true);
    router.refresh();
    setTimeout(() => setLoading(false), 1000); // Simple timeout to simulate loading state for UX
  }, [router]);

  // Fallback states for when data is loading
  const [username, setUsername] = useState<string>(initialProfileData?.username || "User");
  const [rankLabel, setRankLabel] = useState<string>(initialProfileData?.rank_label || "Rookie");
  const [entryCredits, setEntryCredits] = useState<number>(2);
  const [competitionsPlayed, setCompetitionsPlayed] = useState<number>(initialProfileData?.total_games || 0);
  const winPercentage = useMemo(() => 
    profileData && profileData.total_games > 0
      ? Math.round((profileData.total_wins / profileData.total_games) * 100)
      : 0
  , [profileData]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  // default to history tab
  const [activeTab, setActiveTab] = useState<
    "wallet" | "history" | "notifications" | "support"
  >("history");
  const [supportTopic, setSupportTopic] = useState<string>("");
  const [supportDescription, setSupportDescription] = useState<string>("");
  // Pagination for history
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5; // items per page (show 5 results per page)

  // Response modal states
  const [showResponseModal, setShowResponseModal] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketResponses, setTicketResponses] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch functions removed as data is now passed via props

  const fetchSupportTickets = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      const { data, error } = await supabase
        .from("support")
        .select("id, user_id, topic, description, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching support tickets:", error);
        toast.error(`Failed to load support tickets: ${error.message}`);
        return;
      }

      if (data) {
        setSupportTickets(data);
      }
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      toast.error("Failed to load support tickets due to an unexpected error");
    }
  };

  const fetchTicketResponses = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id, message, sender, created_at")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching ticket responses:", error);
        toast.error("Failed to load responses");
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching ticket responses:", error);
      toast.error("Failed to load responses");
      return [];
    }
  };

  // Withdraw functionality removed - credits management handled via user_credits

  const handleSupportSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportTopic.trim() || !supportDescription.trim()) {
      toast.error("Please fill in all required fields with valid input");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("User not authenticated. Please log in.");
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from("support").insert({
        user_id: user.id,
        topic: supportTopic.trim(),
        description: supportDescription.trim(),
        status: "open",
      });

      if (error) {
        console.error("Supabase error details:", error);
        toast.error(`Failed to submit support ticket: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      toast.success("Support ticket submitted successfully!");
      setSupportTopic("");
      setSupportDescription("");
      // fetchSupportTickets(); // Removed fetch, we can manually update state if needed or just let user refresh
      // Manually update state to show new ticket immediately
      const newTicket: SupportTicket = {
        id: "temp-" + Date.now(), // Temporary ID until refresh
        user_id: user.id,
        topic: supportTopic.trim(),
        description: supportDescription.trim(),
        status: "open",
        created_at: new Date().toISOString()
      };
      setSupportTickets([newTicket, ...supportTickets]);
    } catch (error: any) {
      console.error("Unexpected error submitting support ticket:", error);
      toast.error(
        `Failed to submit support ticket: ${error.message || "Unexpected error"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [supportTopic, supportDescription, supportTickets]);

  const handleViewResponse = useCallback(async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    const responses = await fetchTicketResponses(ticket.id);
    setTicketResponses(responses);
    setShowResponseModal(true);
  }, []);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) {
      toast.error("Please enter a message");
      return;
    }

    setSendingMessage(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("User not authenticated. Please log in.");
        setSendingMessage(false);
        return;
      }

      const { error } = await supabase.from("support_messages").insert({
        ticket_id: selectedTicket.id,
        sender: "user",
        message: newMessage.trim(),
      });

      if (error) {
        console.error("Error sending message:", error);
        toast.error(`Failed to send message: ${error.message}`);
        setSendingMessage(false);
        return;
      }


      setNewMessage("");

      // Refresh the conversation
      const responses = await fetchTicketResponses(selectedTicket.id);
      setTicketResponses(responses);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(`Failed to send message: ${error.message || "Unexpected error"}`);
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedTicket]);

  // Handle viewing competition results - navigate to new page
  const handleViewCompetitionResults = (transaction: TransactionEntry) => {
    if (!transaction.session_id) {
      toast.error("No competition data available for this transaction");
      return;
    }
    
    // Navigate to competition results page
    router.push(`/competition-results/${transaction.session_id}`);
  };

  return (
    <div className="min-h-fit mt-15 bg-gray-50 text-gray-800 flex items-center justify-center p-3 sm:p-4 md:p-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-base sm:text-lg text-gray-700">Loading your dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Credits Modal (placeholder) */}
          {showCreditsModal && (
            <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-lg">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Manage Credits
                </h3>
                <p className="text-gray-600 mb-4">This area will allow users to purchase or manage their credits. Implement your payment/purchase flow here.</p>
                <div className="flex justify-end">
                  <button onClick={() => setShowCreditsModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Close</button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border-gray-100 w-full">
            {/* Enhanced Profile Section with Rank Progression */}
            <div className="bg-gradient-to-r from-lime-50 to-green-50 border-2 border-lime-200 p-4 sm:p-5 md:p-6 rounded-2xl mb-6 sm:mb-8 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                {/* Profile Info */}
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-lime-100 rounded-full mr-4 sm:mr-6 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                    {profileData?.avatar_url ? (
                      <img
                        src={profileData.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-8 h-8 sm:w-10 sm:h-10 text-lime-600"
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
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 truncate">
                      {username}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 mb-2 truncate">{userEmail}</p>

                    {/* Current Rank Display */}
                    {mounted && profileData?.xp !== undefined && (
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        {(() => {
                          const currentRank = getRankFromXP(profileData.xp);
                          return (
                            <div
                              className={`flex items-center px-2 sm:px-3 py-1 rounded-full ${currentRank.bgColor} ${currentRank.color} font-semibold`}
                            >
                              <span className="text-base sm:text-lg mr-1 sm:mr-2">
                                {currentRank.icon}
                              </span>
                              <span className="text-xs sm:text-sm font-bold">
                                {currentRank.label}
                              </span>
                            </div>
                          );
                        })()}
                        <div className="text-xs sm:text-sm text-gray-600">
                          <span className="font-bold">
                            {profileData.xp.toLocaleString()}
                          </span>{" "}
                          XP
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rank Progress Section */}
                {mounted && profileData?.xp !== undefined && (
                  <div className="bg-white rounded-xl p-3 sm:p-4 shadow-md border border-lime-100 min-w-0 w-full md:w-80">
                    {(() => {
                      const nextRankInfo = getNextRank(profileData.xp);
                      const progress = getProgressToNextRank(profileData.xp);

                      if (!nextRankInfo) {
                        return (
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-xl sm:text-2xl mr-2">👑</span>
                              <span className="text-base sm:text-lg font-bold text-yellow-600">
                                Max Rank Achieved!
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                              You've reached the highest rank!
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs sm:text-sm font-semibold text-gray-600">
                              Next Rank
                            </span>
                            <div className="flex items-center">
                              <span className="text-base sm:text-lg mr-1">
                                {nextRankInfo.nextRank.icon}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-gray-700">
                                {nextRankInfo.nextRank.label}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-lime-400 to-lime-500 h-2 sm:h-3 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{progress.toFixed(1)}% Complete</span>
                            <span>
                              {nextRankInfo.xpNeeded.toLocaleString()} XP needed
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
              {/* Credits card (replacing Wallet Balance) - kept above */}

              {/* Total Credits card (excludes referral) */}
              <div className="bg-gradient-to-br from-lime-50 to-lime-100 p-4 sm:p-5 py-6 sm:py-8 rounded-xl border-2 border-lime-200 hover:border-lime-400 transition duration-200 shadow-md hover:shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-lime-100 rounded-lg mr-3 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-lime-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Total Credits
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-lime-700 truncate">
                      {totalCredits % 1 === 0 ? totalCredits : totalCredits.toFixed(2)}
                    </p>
                  </div>
                </div>

              </div>

              {/* Winnings-only card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-5 py-6 sm:py-8 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition duration-200 shadow-md hover:shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Winnings Credits
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-700 truncate">
                      {winningsCredits % 1 === 0 ? winningsCredits : winningsCredits.toFixed(2)}
                    </p>
                  </div>
                </div>

              </div>

              {/* XP Points */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 sm:p-5 py-6 sm:py-8 rounded-xl border-2 border-yellow-200 hover:border-yellow-400 transition duration-200 shadow-md hover:shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg mr-3 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      XP Points
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-yellow-700 truncate">
                      {profileData?.xp || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Competitions Played */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-5 py-6 sm:py-8 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition duration-200 shadow-md hover:shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Competitions
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-blue-700 truncate">
                      {competitionsPlayed}
                    </p>
                  </div>
                </div>
              </div>

              {/* Win Percentage */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-5 py-6 sm:py-8 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition duration-200 shadow-md hover:shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Win Rate
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-700 truncate">
                      {winPercentage}%
                    </p>
                  </div>
                </div>
              </div>

              {/* (Removed Total Earnings card as per request) */}
            </div>

            {/* Trophy Achievements Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center">
                  <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <span className="truncate">Trophy Achievements</span>
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                    {userTrophies.length}
                  </span>
                </h3>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 bg-lime-100 hover:bg-lime-200 text-lime-700 rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm flex-shrink-0"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Refresh"
                  )}
                </button>
              </div>

              {trophiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-gray-600">Loading trophies...</span>
                </div>
              ) : userTrophies.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-4">🏆</div>
                  <p className="text-gray-500 text-xs sm:text-sm">No trophies earned yet.</p>
                  <p className="text-gray-400 text-xs mt-1">Complete competitions to earn your first trophy!</p>
                </div>
              ) : (
                <>
                  {/* Trophy Statistics Summary */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-2 sm:p-3 rounded-lg text-center">
                      <div className="text-xl sm:text-2xl font-bold text-amber-700">
                        {userTrophies.filter(t => t.trophy_type === 'bronze').length}
                      </div>
                      <div className="text-xs text-amber-600 font-medium flex items-center justify-center">
                        🥉 Starter
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-3 rounded-lg text-center">
                      <div className="text-xl sm:text-2xl font-bold text-gray-700">
                        {userTrophies.filter(t => t.trophy_type === 'silver').length}
                      </div>
                      <div className="text-xs text-gray-600 font-medium flex items-center justify-center">
                        🥈 Pro
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-2 sm:p-3 rounded-lg text-center">
                      <div className="text-xl sm:text-2xl font-bold text-yellow-700">
                        {userTrophies.filter(t => t.trophy_type === 'gold').length}
                      </div>
                      <div className="text-xs text-yellow-600 font-medium flex items-center justify-center">
                        🥇 Elite
                      </div>
                    </div>
                  </div>

                  {/* Recent Trophies */}
                  <div className="space-y-3">
                    {userTrophies.slice(0, 3).map((trophy, index) => {
                      const colors = TrophyService.getTrophyColors(trophy.trophy_type);
                      return (
                        <div
                          key={trophy.id}
                          className={`${colors.bg} ${colors.border} border rounded-lg p-3 sm:p-4 transition-all hover:shadow-md`}
                        >
                          <div className="flex items-start space-x-2 sm:space-x-3">
                            <div className="text-2xl sm:text-3xl flex-shrink-0">
                              {TrophyService.getTrophyIcon(trophy.trophy_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <h4 className={`font-semibold ${colors.text} text-base sm:text-lg leading-tight truncate`}>
                                    {trophy.title}
                                  </h4>
                                  <p className={`${colors.text} opacity-80 text-xs sm:text-sm mt-1 line-clamp-2`}>
                                    {trophy.description}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.accent} text-white whitespace-nowrap`}>
                                    {trophy.trophy_type === 'bronze' ? 'Starter' : trophy.trophy_type === 'silver' ? 'Pro' : trophy.trophy_type === 'gold' ? 'Elite' : trophy.trophy_type.charAt(0).toUpperCase() + trophy.trophy_type.slice(1)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2 sm:mt-3">
                                <div className="flex items-center text-xs text-gray-500">
                                  <svg
                                    className="w-3 h-3 mr-1 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span className="truncate">Earned {TrophyService.formatTrophyDate(trophy.earned_at)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>


                </>
              )}
            </div>

            {/* Rank Ladder & XP Progression Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center">
                  <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <span className="truncate">Rank Ladder & XP Progression</span>
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Progress through ranks by earning XP from games, wins, and referrals. Each rank requires a specific XP threshold.
              </p>
              <div className="space-y-2 sm:space-y-3">
                {ranks.map((rank, index) => (
                  <div
                    key={rank.label}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border ${rankLabel === rank.label ? 'border-lime-500 bg-lime-50' : 'border-gray-200 bg-white'}`}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <div className={`p-1.5 sm:p-2 ${rank.bgColor} rounded-full mr-2 sm:mr-3 flex-shrink-0`}>
                        <span className="text-base sm:text-xl">{rank.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold ${rank.color} text-sm sm:text-base truncate`}>{rank.label}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {rank.minXP} - {rank.maxXP === Infinity ? '∞' : rank.maxXP} XP
                        </p>
                      </div>
                    </div>
                    {rankLabel === rank.label && (
                      <span className="text-xs font-medium text-lime-600 bg-lime-100 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {/* <Link href="/credits/manage">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                
                className="w-full py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Withdraw Credits
              </button>
            </div></Link> */}

            {/* Leaderboard Section */}
            {/* <div className="bg-white rounded-2xl p-6 my-8 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  Top Players Leaderboard
                </h3>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-4 py-2 bg-lime-100 hover:bg-lime-200 text-lime-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Refresh"
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
                        index === 0
                          ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200"
                          : index === 1
                            ? "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                            : index === 2
                              ? "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"
                              : "bg-gray-50 border-gray-200 hover:border-lime-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                         
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                              index === 0
                                ? "bg-yellow-500 text-white"
                                : index === 1
                                  ? "bg-gray-400 text-white"
                                  : index === 2
                                    ? "bg-orange-500 text-white"
                                    : "bg-lime-500 text-white"
                            }`}
                          >
                            {user.rank_position}
                          </div>

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

                          <div>
                            <h4 className="font-bold text-gray-800">
                              {user.username}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="inline-block px-2 py-1 bg-lime-100 text-lime-800 text-xs font-semibold rounded-full">
                                {user.rank_label}
                              </span>
                              <span className="text-sm text-gray-600">
                                {user.total_games} games • {user.win_rate}% win
                                rate
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex justify-end items-center">
                            <span className="font-semibold">
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
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500">No leaderboard data available</p>
                </div>
              )}
            </div> */}

            {/* Recent Transactions Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 mt-6 sm:mt-8 shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div className="w-full grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2 md:justify-center">
                  {/* Wallet Button */}
                  {/* <button
                    onClick={() => setActiveTab("wallet")}
                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors ${
                      activeTab === "wallet"
                        ? "bg-lime-400 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Wallet
                  </button> */}

                  {/* History Button */}
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors ${activeTab === "history"
                      ? "bg-lime-400 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    History
                  </button>

                  {/* Notifications Button */}
                  {/* <button
                    onClick={() => setActiveTab("notifications")}
                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors relative ${
                      activeTab === "notifications"
                        ? "bg-lime-400 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      2
                    </span>
                    Notifications
                  </button> */}

                  {/* Support Button */}
                  <button
                    onClick={() => setActiveTab("support")}
                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors ${activeTab === "support"
                      ? "bg-lime-400 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c-.549-1.165-2.03-2-3.728-2 1.682-2.2 4.694-3.5 7.5-3.5 4.142 0 7.5 3.358 7.5 7.5s-3.358 7.5-7.5 7.5c-1.887 0-3.624-.63-5-1.69v-2.86c.958.284 2.038.444 3.128.444 3.484 0 6.322-2.838 6.322-6.322s-2.838-6.322-6.322-6.322c-1.768 0-3.357.695-4.5 1.822V9z"
                      />
                    </svg>
                    Support
                  </button>
                </div>
              </div>

              {/* Wallet Tab Content */}
              {/* {activeTab === "wallet" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Wallet Overview
                    </h3>
                    <button
                      onClick={fetchTransactions}
                      disabled={transactionsLoading}
                      className="px-4 py-2 bg-lime-100 hover:bg-lime-200 text-lime-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {transactionsLoading ? (
                        <div className="w-4 h-4 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Refresh"
                      )}
                    </button>
                  </div>
               
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Recent Transactions
                  </h3>
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span className="text-gray-600">
                        Loading transactions...
                      </span>
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.slice(0, 10).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex justify-between items-start p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {transaction.source} •{" "}
                                {formatDate(transaction.created_at)}
                              </p>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                                  transaction.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {transaction.status
                                  ? transaction.status.charAt(0).toUpperCase() +
                                    transaction.status.slice(1)
                                  : "Unknown"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                transaction.amount >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.amount >= 0 ? "+" : ""}$
                              {Math.abs(transaction.amount) % 1 === 0 ? Math.abs(transaction.amount) : Math.abs(transaction.amount).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {transaction.type}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>
                        No transactions found. Complete competitions to start
                        earning rewards!
                      </p>
                    </div>
                  )}
                </div>
              )} */}

              {/* History Tab Content */}
              {activeTab === "history" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                      History
                    </h3>
                    <button
                      onClick={handleRefresh}
                      disabled={loading}
                      className="px-3 sm:px-4 py-2 bg-lime-100 hover:bg-lime-200 text-lime-700 rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm flex-shrink-0"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Refresh"
                      )}
                    </button>
                  </div>
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span className="text-gray-600">
                        Loading transactions...
                      </span>
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-4">
                      {(() => {
                        const start = (currentPage - 1) * pageSize;
                        const end = start + pageSize;
                        const paginated = transactions.slice(start, end);
                        return (
                          <>
                            {paginated.map((transaction) => {
                              const isCompetitionTransaction = transaction.type === 'reward' || transaction.type === 'entry_fee';
                              const hasSessionId = !!transaction.session_id;
                              
                              return (
                              <div
                                key={transaction.id}
                                onClick={() => {
                                  if (isCompetitionTransaction && hasSessionId) {
                                    handleViewCompetitionResults(transaction);
                                  } else if (isCompetitionTransaction && !hasSessionId) {
                                    toast.error("This transaction doesn't have competition data linked");
                                  }
                                }}
                                className={`p-3 sm:p-4 bg-white border border-gray-100 rounded-lg shadow-sm transition-all ${
                                  isCompetitionTransaction && hasSessionId 
                                    ? 'hover:shadow-lg hover:border-lime-300 cursor-pointer' 
                                    : 'hover:shadow-md'
                                }`}
                              >
                                {/* Mobile Layout */}
                                <div className="block sm:hidden">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                      <div className="text-xl flex-shrink-0 mt-0.5">
                                        {getTransactionIcon(transaction.type)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm leading-tight break-words">
                                          {transaction.description}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right ml-2 flex-shrink-0">
                                      <p className={`text-base font-bold whitespace-nowrap ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {transaction.amount >= 0 ? "+" : ""}{Math.abs(transaction.amount) % 1 === 0 ? Math.abs(transaction.amount) : Math.abs(transaction.amount).toFixed(2)}
                                      </p>
                                      <p className="text-xs text-gray-500">Credits</p>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    {transaction.source} • {formatDate(transaction.created_at)}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${transaction.status === "completed" ? "bg-green-100 text-green-800" : transaction.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                                      {transaction.status ? transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1) : "Unknown"}
                                    </span>
                                    <span className="text-xs text-gray-400 capitalize">
                                      {transaction.type.replace('_', ' ')}
                                    </span>
                                    {isCompetitionTransaction && hasSessionId && (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                        📊 Click to view
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Desktop Layout */}
                                <div className="hidden sm:flex items-center justify-between">
                                  <div className="flex items-start space-x-4">
                                    <div className="text-2xl mt-1">
                                      {getTransactionIcon(transaction.type)}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-800">
                                        {transaction.description}
                                      </p>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {transaction.source} • {formatDate(transaction.created_at)}
                                      </p>
                                      <div className="mt-2 flex items-center gap-2">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${transaction.status === "completed" ? "bg-green-100 text-green-800" : transaction.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                                          {transaction.status ? transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1) : "Unknown"}
                                        </span>
                                        {isCompetitionTransaction && hasSessionId && (
                                          <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                            📊 Click to view results
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-lg font-bold ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                                      {transaction.amount >= 0 ? "+" : ""}{Math.abs(transaction.amount) % 1 === 0 ? Math.abs(transaction.amount) : Math.abs(transaction.amount).toFixed(2)} Credits
                                    </p>
                                    <p className="text-sm text-gray-500 capitalize">{transaction.type.replace('_', ' ')}</p>
                                  </div>
                                </div>
                              </div>
                            )})}


                            {/* Modern Pagination controls */}
                            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
                              <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                                Showing {(start + 1)}-{Math.min(end, transactions.length)} of {transactions.length}
                              </div>

                              <div className="flex items-center space-x-1 order-1 sm:order-2 overflow-x-auto max-w-full pb-2 sm:pb-0">
                                <button
                                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                  disabled={currentPage === 1}
                                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium flex-shrink-0"
                                >
                                  ‹
                                </button>

                                {/* Smart page numbers with ellipsis */}
                                {(() => {
                                  const totalPages = Math.ceil(transactions.length / pageSize);
                                  const pages: (number | string)[] = [];
                                  
                                  if (totalPages <= 5) {
                                    // Show all pages if 5 or fewer (mobile friendly)
                                    for (let i = 1; i <= totalPages; i++) {
                                      pages.push(i);
                                    }
                                  } else {
                                    // Always show first page
                                    pages.push(1);
                                    
                                    if (currentPage > 3) {
                                      pages.push('...');
                                    }
                                    
                                    // Show pages around current page
                                    const start = Math.max(2, currentPage - 1);
                                    const end = Math.min(totalPages - 1, currentPage + 1);
                                    
                                    for (let i = start; i <= end; i++) {
                                      pages.push(i);
                                    }
                                    
                                    if (currentPage < totalPages - 2) {
                                      pages.push('...');
                                    }
                                    
                                    // Always show last page
                                    pages.push(totalPages);
                                  }
                                  
                                  return pages.map((page, index) => {
                                    if (page === '...') {
                                      return (
                                        <span key={`ellipsis-${index}`} className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-400 text-xs sm:text-sm">
                                          ...
                                        </span>
                                      );
                                    }
                                    
                                    return (
                                      <button
                                        key={page}
                                        onClick={() => setCurrentPage(page as number)}
                                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors text-xs sm:text-sm font-medium flex-shrink-0 ${
                                          page === currentPage
                                            ? 'bg-lime-500 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                      >
                                        {page}
                                      </button>
                                    );
                                  });
                                })()}

                                <button
                                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(transactions.length / pageSize), p + 1))}
                                  disabled={currentPage >= Math.ceil(transactions.length / pageSize)}
                                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium flex-shrink-0"
                                >
                                  ›
                                </button>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>
                        No transactions found. Complete competitions to start
                        earning rewards!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab Content */}
              {/* {activeTab === "notifications" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start">
                        <div className="p-2 bg-lime-100 rounded-full mr-3">
                          <svg
                            className="w-5 h-5 text-lime-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">
                            New competition available
                          </p>
                          <p className="text-sm text-gray-500">
                            Premier League predictions now open
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            2 hours ago
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start">
                        <div className="p-2 bg-blue-100 rounded-full mr-3">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Withdrawal processed</p>
                          <p className="text-sm text-gray-500">
                            €20.00 has been sent to your account
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            1 day ago
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )} */}

              {/* Support Tab Content */}
              {activeTab === "support" && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                    Support Center
                  </h3>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-bold mb-3 text-sm sm:text-base">Open a Support Ticket</h4>
                      <form onSubmit={handleSupportSubmit}>
                        <div className="mb-4">
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
                            Topic
                          </label>
                          <select
                            value={supportTopic}
                            onChange={(e) => setSupportTopic(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent text-sm sm:text-base"
                          >
                            <option value="">Select a topic</option>
                            <option value="Account Issue">Account Issue</option>
                            <option value="Payment Issue">Payment Issue</option>
                            <option value="Game Issue">Game Issue</option>
                            <option value="Technical Issue">
                              Technical Issue
                            </option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={supportDescription}
                            onChange={(e) =>
                              setSupportDescription(e.target.value)
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent text-sm sm:text-base"
                            placeholder="Describe your issue or question..."
                            rows={4}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isSubmitting
                            ? "Submitting..."
                            : "Submit Support Ticket"}
                        </button>
                      </form>
                    </div>
                    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-bold mb-3 text-sm sm:text-base">Your Support Tickets</h4>
                      {supportTickets.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {supportTickets.map((ticket) => (
                            <div
                              key={ticket.id}
                              className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                                    {ticket.topic}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                                    {ticket.description}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Submitted:{" "}
                                    {formatDate(ticket.created_at)}
                                  </p>
                                </div>
                                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                                  <span
                                    className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)} flex-shrink-0`}
                                  >
                                    {ticket.status.charAt(0).toUpperCase() +
                                      ticket.status.slice(1)}
                                  </span>
                                  <button
                                    onClick={() => handleViewResponse(ticket)}
                                    className="px-2 sm:px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold rounded-full transition-colors whitespace-nowrap"
                                  >
                                    View Response
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs sm:text-sm">
                          No support tickets found.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedTicket && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white border border-gray-300 rounded-lg p-4 sm:p-6 w-full max-w-2xl h-[85vh] sm:h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-3 sm:mb-4 flex-shrink-0">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 truncate pr-2">
                Support Conversation - "{selectedTicket.topic}"
              </h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-2 flex-shrink-0">

              <p className="text-xs text-gray-400">
                Submitted: {formatDate(selectedTicket.created_at)}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto mb-3 sm:mb-4">
              {ticketResponses.length > 0 ? (
                <div className="flex flex-col space-y-3 sm:space-y-4">
                  {ticketResponses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-2.5 sm:p-3 rounded-lg max-w-[85%] sm:max-w-[80%] ${response.sender === 'user'
                        ? 'bg-gray-100 border border-gray-200 self-start'
                        : 'bg-indigo-500 text-white self-end ml-auto'
                        }`}
                    >
                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{response.message}</p>
                      <span className="block text-xs mt-1 opacity-70">
                        {formatDateTime(response.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-3xl sm:text-4xl mb-4">📝</div>
                  <p className="text-gray-500 text-sm sm:text-base">No messages yet.</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Start the conversation by sending a message below.</p>
                </div>
              )}
            </div>
            {selectedTicket.status !== 'closed' && (
              <div className="flex-shrink-0 border-t pt-3 sm:pt-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent text-sm sm:text-base"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="px-4 sm:px-6 py-2 bg-lime-500 hover:bg-lime-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm sm:text-base flex-shrink-0"
                  >
                    {sendingMessage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Send"
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Ticket Closed Message */}
            {selectedTicket.status === 'closed' && (
              <div className="flex-shrink-0 border-t pt-3 sm:pt-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="text-green-600 mr-2" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-800 font-semibold text-sm sm:text-base">Ticket Closed</span>
                  </div>
                  <p className="text-xs sm:text-sm text-green-700">This support ticket has been resolved. No further messages can be sent.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});