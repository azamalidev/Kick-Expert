"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Award, RotateCcw, ArrowLeft } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  score: number;
  score_percentage: number;
  correct_answers: number;
  questions_played: number;
  username: string;
  avatar_url: string | null;
  prizeAmount: number;
  isUser: boolean;
}

interface Question {
  id: string;
  question_text: string;
  choices: string[];
  correct_answer: string;
  difficulty: string;
  category: string;
  explanation: string;
}

interface Answer {
  id: string;
  competition_question_id: string;
  selected_answer: string;
  is_correct: boolean;
  submitted_at: string;
}

interface CompetitionResultsProps {
  sessionId: string;
}

export default function CompetitionResults({ sessionId }: CompetitionResultsProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'results'>('leaderboard');
  const [competitionDetails, setCompetitionDetails] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompetitionData();
  }, [sessionId]);

  const fetchCompetitionData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Please log in to view results");
        return;
      }
      setCurrentUserId(user.id);

      // Fetch session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('competition_sessions')
        .select('*, competitions(*)')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        toast.error("Competition session not found");
        return;
      }

      setSession(sessionData);
      setCompetitionDetails(sessionData.competitions);

      // Fetch all results from competition_results table (publicly readable, has finalized data)
      const { data: competitionResults, error: resultsError } = await supabase
        .from('competition_results')
        .select('id, user_id, score, rank, prize_amount, xp_awarded')
        .eq('competition_id', sessionData.competition_id)
        .order('rank', { ascending: true });

      if (resultsError) {
        console.error("Error fetching competition results:", resultsError);
      } else if (competitionResults && competitionResults.length > 0) {
        // Fetch profiles for usernames
        const userIds = competitionResults.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', userIds);

        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const leaderboardData: LeaderboardEntry[] = competitionResults.map((result) => {
          const profile = profilesMap.get(result.user_id);

          return {
            id: result.id,
            user_id: result.user_id,
            score: result.score || 0,
            score_percentage: sessionData.questions_played > 0
              ? (result.score / (sessionData.competitions?.question_count || 15)) * 100
              : 0,
            correct_answers: result.score || 0,
            questions_played: sessionData.competitions?.question_count || 15,
            username: profile?.username || 'Anonymous',
            avatar_url: profile?.avatar_url || null,
            prizeAmount: result.prize_amount || 0,
            isUser: result.user_id === user.id
          };
        });

        setLeaderboard(leaderboardData);
        console.log('📊 Leaderboard loaded from competition_results:', leaderboardData.length, 'players');

        // Find user rank
        const userEntry = leaderboardData.find(entry => entry.user_id === user.id);
        if (userEntry) {
          const userIndex = leaderboardData.indexOf(userEntry);
          setUserRank(userIndex + 1);
        }
      }

      // Fetch user's answers
      const { data: answersData, error: answersError } = await supabase
        .from('competition_answers')
        .select('*')
        .eq('session_id', sessionId)
        .order('submitted_at', { ascending: true });

      if (answersError) {
        console.error("Error fetching answers:", answersError);
      } else if (answersData) {
        setAnswers(answersData);

        // Fetch questions
        const questionIds = answersData.map(a => a.competition_question_id).filter(Boolean);
        if (questionIds.length > 0) {
          const { data: questionsData, error: questionsError } = await supabase
            .from('competition_questions')
            .select('*')
            .in('id', questionIds);

          if (questionsError) {
            console.error("Error fetching questions:", questionsError);
          } else if (questionsData) {
            setQuestions(questionsData);
          }
        }
      }

    } catch (error: any) {
      console.error("Error loading competition data:", error);
      toast.error("Failed to load competition results");
    } finally {
      setLoading(false);
    }
  };

  const getPrizePoolConfig = (playerCount: number) => {
    if (playerCount < 50) {
      // <50 Players → Top 3 rewarded (40% of total revenue)
      // Distribution: 20%, 12%, 8% of TOTAL REVENUE
      return {
        percentage: 0.4,
        winnerCount: 3,
        distribution: [0.2, 0.12, 0.08] // 20%, 12%, 8% of TOTAL REVENUE
      };
    } else if (playerCount < 100) {
      // 50–100 Players → Top 5 rewarded (45% of total revenue)
      // Distribution: 20%, 12%, 7%, 3%, 3% of TOTAL REVENUE
      return {
        percentage: 0.45,
        winnerCount: 5,
        distribution: [0.2, 0.12, 0.07, 0.03, 0.03] // 20%, 12%, 7%, 3%, 3% of TOTAL REVENUE
      };
    } else {
      // 100+ Players → Top 10 rewarded (50% of total revenue)
      // Distribution: 20%, 10%, 7%, 4%, 3%, 2%, 1%, 1%, 1%, 1% of TOTAL REVENUE
      return {
        percentage: 0.5,
        winnerCount: 10,
        distribution: [0.2, 0.1, 0.07, 0.04, 0.03, 0.02, 0.01, 0.01, 0.01, 0.01] // 20%, 10%, 7%, 4%, 3%, 2%, 1%, 1%, 1%, 1% of TOTAL REVENUE
      };
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">Loading competition results...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Header */}
              <div className="mb-4 sm:mb-6">
                <Link href="/dashboard">
                  <button className="mb-3 sm:mb-4 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to Dashboard</span>
                    <span className="sm:hidden">Back</span>
                  </button>
                </Link>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2 flex-wrap">
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
                  <span className="break-words">{competitionDetails?.name || 'Competition'} Results</span>
                </h1>

                {/* Competition Info */}
                {session && (
                  <div className="bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <span>Your Score: <strong className="text-gray-800">{session.correct_answers}/{session.questions_played}</strong></span>
                      <span className="hidden sm:inline">•</span>
                      <span>Accuracy: <strong className="text-gray-800">{Math.round(session.score_percentage)}%</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-sm sm:text-base ${activeTab === 'leaderboard'
                      ? 'border-lime-500 text-lime-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span>🏆</span>
                    <span className="hidden sm:inline">Leaderboard</span>
                    <span className="sm:hidden">Board</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-sm sm:text-base ${activeTab === 'results'
                      ? 'border-lime-500 text-lime-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span>📊</span>
                    <span>Results</span>
                  </span>
                </button>
              </div>

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div>
                  {/* Prize Pool Summary */}
                  {leaderboard.length > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-md">
                      <h2 className="text-lg sm:text-xl font-bold text-yellow-800 mb-3 sm:mb-4 flex items-center justify-center gap-2">
                        <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                        Prize Distribution
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border border-yellow-200">
                          <div className="text-2xl sm:text-3xl mb-2">🥇</div>
                          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">1st Place</p>
                          <p className="text-lg sm:text-xl font-bold text-yellow-600">
                            {leaderboard[0]?.prizeAmount || 0} Credits
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border border-gray-200">
                          <div className="text-2xl sm:text-3xl mb-2">🥈</div>
                          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">2nd Place</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-600">
                            {leaderboard[1]?.prizeAmount || 0} Credits
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border border-amber-200">
                          <div className="text-2xl sm:text-3xl mb-2">🥉</div>
                          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">3rd Place</p>
                          <p className="text-lg sm:text-xl font-bold text-amber-600">
                            {leaderboard[2]?.prizeAmount || 0} Credits
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User Rank Highlight */}
                  {userRank && (
                    <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-3 sm:p-4 rounded-lg text-white text-center mb-4 sm:mb-6 shadow-md">
                      <h3 className="text-base sm:text-lg font-semibold mb-2">Your Final Ranking</h3>
                      <div className="flex items-center justify-center gap-3 sm:gap-4">
                        <div className="text-3xl sm:text-4xl font-bold"># {userRank}</div>
                        <div className="text-left">
                          <p className="text-xs sm:text-sm opacity-90">out of {leaderboard.length} players</p>
                          {userRank <= 3 && (
                            <p className="text-xs sm:text-sm font-semibold mt-1 flex items-center gap-1">
                              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                              Prize Winner!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Leaderboard Table */}
                  <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-lime-500 to-lime-600">
                        <tr>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">
                            Player
                          </th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">
                            Prize
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <AnimatePresence>
                          {leaderboard.map((entry, index) => (
                            <motion.tr
                              key={entry.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className={`hover:bg-gray-50 ${entry.isUser ? 'bg-lime-50 font-semibold' : ''} ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                                }`}
                            >
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="font-bold">{index + 1}</span>
                                  {index === 0 && <span className="text-base sm:text-xl">🥇</span>}
                                  {index === 1 && <span className="text-base sm:text-xl">🥈</span>}
                                  {index === 2 && <span className="text-base sm:text-xl">🥉</span>}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                                <div className="max-w-[120px] sm:max-w-none truncate">
                                  {entry.username}
                                  {entry.isUser && <span className="ml-1 sm:ml-2 text-lime-600 font-semibold">(You)</span>}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                <span className="font-semibold">{entry.score}/{entry.questions_played}</span>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                {entry.prizeAmount > 0 ? (
                                  <span className="font-bold text-lime-600">{entry.prizeAmount} Credits</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>


                </div>
              )}

              {/* Detailed Results Tab */}
              {activeTab === 'results' && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Your Answers</h3>

                  {/* Summary */}
                  {session && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                      <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                        <div>
                          <p className="text-xl sm:text-2xl font-bold text-green-600">{session.correct_answers}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Correct</p>
                        </div>
                        <div>
                          <p className="text-xl sm:text-2xl font-bold text-red-600">{session.questions_played - session.correct_answers}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Wrong</p>
                        </div>
                        <div>
                          <p className="text-xl sm:text-2xl font-bold text-blue-600">{session.questions_played}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Total</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {questions.length > 0 ? (
                    questions.map((question, index) => {
                      const answer = answers.find(a => a.competition_question_id === question.id);
                      const isCorrect = answer?.is_correct || false;

                      return (
                        <div
                          key={question.id}
                          className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 ${isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-2 sm:mb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                              <span className="font-bold text-gray-700 text-sm sm:text-base">Q{index + 1}.</span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${question.difficulty === 'Easy'
                                    ? 'bg-green-100 text-green-800'
                                    : question.difficulty === 'Medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                              >
                                {question.difficulty}
                              </span>
                              {isCorrect ? (
                                <span className="text-green-600 font-bold text-sm sm:text-base">✓ Correct</span>
                              ) : (
                                <span className="text-red-600 font-bold text-sm sm:text-base">✗ Wrong</span>
                              )}
                            </div>
                          </div>

                          <p className="font-medium text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">{question.question_text}</p>

                          <div className="space-y-2 mb-2 sm:mb-3">
                            {question.choices?.map((choice: string, i: number) => (
                              <div
                                key={i}
                                className={`p-2 rounded-lg ${choice === question.correct_answer
                                    ? 'bg-green-100 border-2 border-green-400'
                                    : choice === answer?.selected_answer
                                      ? 'bg-red-100 border-2 border-red-400'
                                      : 'bg-gray-50'
                                  }`}
                              >
                                <span className="text-xs sm:text-sm break-words">
                                  {choice === question.correct_answer && '✓ '}
                                  {choice === answer?.selected_answer && !isCorrect && '✗ '}
                                  {choice}
                                </span>
                              </div>
                            ))}
                          </div>

                          {question.explanation && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                              <p className="text-xs sm:text-sm text-blue-800">
                                <strong>Explanation:</strong> {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-500 py-8 text-sm sm:text-base">No detailed results available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
