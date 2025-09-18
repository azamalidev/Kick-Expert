'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Award, Star, Clock, Users, ChevronRight, Home, RotateCcw } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Question {
  id: number;
  sourceQuestionId?: number | string;
  question_text: string;
  category: string;
  difficulty: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
}

interface AnswerRecord {
  question_id: number;
  is_correct: boolean;
  difficulty: string;
}

interface Player {
  id: number;
  name: string;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  isUser: boolean;
  rank: number;
}

interface CompetitionDetails {
  id: string;
  name: string;
  entry_fee: number;
  prize_structure: any;
  status: string;
  start_time?: string; // Added to match usage in code
}

export default function LeaguePage() {
  const [countdown, setCountdown] = useState(10);
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<'waiting' | 'quiz' | 'results' | 'leaderboard'>('waiting');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [timer, setTimer] = useState(10);
  const [timerKey, setTimerKey] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [competitionDetails, setCompetitionDetails] = useState<CompetitionDetails | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [suspiciousActivity, setSuspiciousActivity] = useState(false);
  const nextCalled = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const competitionId = searchParams ? searchParams.get('competitionId') || '' : '';

  // Fetch competition details
  useEffect(() => {
    const fetchCompetitionDetails = async () => {
      if (!competitionId) return;
      
      try {
        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .eq('id', competitionId)
          .single();
        
        if (!error && data) {
          setCompetitionDetails(data);
          // initialize countdown based on start_time if available
          if (data.start_time) {
            const start = new Date(data.start_time).getTime();
            const seconds = Math.max(0, Math.floor((start - new Date().getTime()) / 1000));
            setCountdown(seconds > 0 ? Math.min(seconds, 600) : 0);
            if (seconds <= 0) {
              // if competition already started, move to quiz phase
              setPhase('quiz');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching competition details:', err);
      }
    };
    
    fetchCompetitionDetails();
  }, [competitionId]);

  // Fetch actual registered players for this competition
  useEffect(() => {
    if (phase === 'waiting' && competitionId) {
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
            if (prev <= 1) {
            clearInterval(countdownInterval);
            setPhase('quiz');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Fetch registered players from Supabase (two-step to avoid relying on DB foreign key relationship)
      const fetchPlayers = async () => {
        try {
          const { data: regs, error: regsErr } = await supabase
            .from('competition_registrations')
            .select('user_id')
            .eq('competition_id', competitionId)
            .eq('status', 'confirmed');

          if (regsErr || !regs) return;

          const userIds = Array.from(new Set(regs.map((r: any) => r.user_id).filter(Boolean)));

          let profilesMap: Record<string, any> = {};
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('user_id, username')
              .in('user_id', userIds as any[]);

            (profilesData || []).forEach((p: any) => {
              profilesMap[p.user_id] = p;
            });
          }

          setPlayers(regs.map((p: any, idx: number) => ({
            id: idx + 1,
            name: (profilesMap[p.user_id] && profilesMap[p.user_id].username) || `User ${p.user_id.substring(0, 8)}`
          })));
        } catch (err) {
          console.error('Error fetching players or profiles:', err);
        }
      };
      
      fetchPlayers();
      return () => clearInterval(countdownInterval);
    }
  }, [phase, competitionId]);

  // Fetch questions and initialize quiz session when entering quiz phase
  useEffect(() => {
    if (phase !== 'quiz' || !competitionId) return;
    
    const initializeQuiz = async () => {
      try {
        setLoading(true);
        
        // Get the authenticated user
        const authResponse = await supabase.auth.getUser();
        if (!authResponse.data.user) {
          throw new Error('User not authenticated');
        }

        // Call the local route which merges competition_questions with questions
        const routeRes = await fetch('/competition-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitionId }),
        });

        const routeJson = await routeRes.json();
        const questionsData = routeJson?.questions ?? [];

        if (!questionsData || questionsData.length === 0) {
          setError('No questions are configured for this competition.');
          setLoading(false);
          return;
        }

        // Normalize returned rows to client's Question shape. Keep competition_question_id
        // and question_id where present.
        const normalized = questionsData.map((q: any) => ({
          id: q.question_id ?? null, // canonical integer id when available
          sourceQuestionId: q.source_question_id ?? q.question_id ?? null,
          competition_question_id: q.competition_question_id ?? null,
          question_text: q.question_text,
          category: q.category,
          difficulty: q.difficulty,
          choices: q.choices || [],
          correct_answer: q.correct_answer,
          explanation: q.explanation,
        }));

        setQuestions(normalized);


        
        // Check registration
        const { data: reg, error: regErr } = await supabase
          .from('competition_registrations')
          .select('*')
          .eq('competition_id', competitionId)
          .eq('user_id', authResponse.data.user.id)
          .eq('status', 'confirmed')
          .maybeSingle();

        if (regErr || !reg) {
          // user is not registered or registration not confirmed
          setError('You are not registered for this competition or your registration is not confirmed.');
          setLoading(false);
          return;
        }
        // Save registration id locally so we can link answers to it
        const registrationId = reg.id;

        const { data: session, error: sessionError } = await supabase
          .from('competition_sessions')
          .insert({
            competition_id: competitionId,
            user_id: authResponse.data.user.id,
            questions_played: questionsData.length,
            correct_answers: 0,
            score_percentage: 0,
            start_time: new Date().toISOString(),
            // quiz_type is required by DB (NOT NULL). Use 'competition' for league sessions.
            quiz_type: 'competition',
            // compute difficulty breakdown from the questions
            difficulty_breakdown: questionsData.reduce((acc: any, q: any) => {
              const d = (q.difficulty || '').toString().toLowerCase();
              if (d.includes('easy')) acc.easy = (acc.easy || 0) + 1;
              else if (d.includes('medium')) acc.medium = (acc.medium || 0) + 1;
              else if (d.includes('hard')) acc.hard = (acc.hard || 0) + 1;
              return acc;
            }, {}),
          })
          .select()
          .single();
        
        if (sessionError) throw sessionError;
        
  setSessionId(session.id);
  // persist registration id for use when saving answers
  // @ts-ignore
  (window as any).__currentCompetitionRegistrationId = registrationId;
        setLoading(false);
      } catch (err) {
        setError('Failed to load quiz');
        setLoading(false);
      }
    };
    
    
    initializeQuiz();
  }, [phase, competitionId]);

  // Timer for each question
  useEffect(() => {
    if (phase !== 'quiz' || quizCompleted || showResult || questions.length === 0) return;

    const timerInterval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(timerInterval);

          // Case 1: user did NOT select an answer → skip to next
          if (!selectedChoice) {
            handleNextQuestion();
          }

          // Case 2: user selected something → show result, wait for button
          else if (!showResult) {
            setShowResult(true);
          }

          return 10;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(timerInterval);
  }, [
    phase,
    quizCompleted,
    showResult,
    questions.length,
    currentQuestionIndex,
    timerKey,
    selectedChoice
  ]);

  // Confetti effect on quiz completion
  useEffect(() => {
    if (quizCompleted && score >= 1) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#84cc16', '#22c55e', '#15803d'],
      });
    }
  }, [quizCompleted, score]);

  // Generate leaderboard when entering results phase
  useEffect(() => {
    if (phase === 'leaderboard' && competitionId) {
      // Fetch leaderboard from Supabase
      const fetchLeaderboard = async () => {
        const authData = await supabase.auth.getUser();
        const userId = authData.data.user?.id;
        
        try {
          // Get the latest leaderboard using stored procedure
          const { data: results, error: leaderboardError } = await supabase
            .rpc('get_competition_leaderboard', {
              p_competition_id: competitionId
            });

          if (leaderboardError) throw leaderboardError;
          if (!results || !Array.isArray(results)) {
            setLeaderboard([]);
            return;
          }

          const userIds = Array.from(new Set(results.map((r: any) => r.user_id).filter(Boolean)));

          // Get usernames for the leaderboard entries
          let profilesMap: Record<string, any> = {};
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('user_id, username')
              .in('user_id', userIds as any[]);

            (profilesData || []).forEach((p: any) => {
              profilesMap[p.user_id] = p;
            });
          }

          const leaderboardData = results.map((entry: any) => ({
            id: entry.user_id,
            name: (profilesMap[entry.user_id] && profilesMap[entry.user_id].username) || `User ${entry.user_id.substring(0, 8)}`,
            score: entry.score,
            isUser: userId === entry.user_id,
            rank: entry.rank
          }));

          setLeaderboard(leaderboardData);

          // Find user's rank
          if (userId) {
            const userEntry = leaderboardData.find((entry: any) => entry.id === userId);
            if (userEntry) setUserRank(userEntry.rank);
          }
        } catch (err) {
          console.error('Error fetching leaderboard:', err);
          setLeaderboard([]);
        }
      };
      fetchLeaderboard();
    }
  }, [phase, competitionId]);

  const handleChoiceSelect = (choice: string) => {
  // store selection for the currently visible question index
  setSelectedChoice(choice);
  };

  const handleNextQuestion = async () => {
    // Prevent multiple calls
    if (nextCalled.current) {
      return;
    }
    nextCalled.current = true;

    if (questions.length === 0) {
      return;
    }
    
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedChoice === currentQuestion?.correct_answer;
    
    
    // Update score
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    
    
    // Save answer record
  if (currentQuestion) {
      const answerRecord = {
        question_id: currentQuestion.id,
        is_correct: isCorrect,
        difficulty: currentQuestion.difficulty
      };
      
      setAnswers((prev) => [...prev, answerRecord]);
      
      
      // Submit answer to Supabase
      const authData = await supabase.auth.getUser();
      const userId = authData.data.user?.id;

      // Determine FK fields
      let fkQuestionId: number | null = null;
      if (typeof currentQuestion.id === 'number' && Number.isInteger(currentQuestion.id)) {
        fkQuestionId = currentQuestion.id;
      }

      // competition_question_id comes from the merged object if available
      const competitionQuestionId = (currentQuestion as any).competition_question_id ?? null;

      // registration id saved earlier when session was created (fall back to reading global)
      const registrationId = (window as any).__currentCompetitionRegistrationId ?? null;

      // Build payload with both FK columns; DB will accept nulls where appropriate
      const payload: any = {
        competition_id: competitionId,
        session_id: sessionId,
        user_id: userId,
        question_id: fkQuestionId,
        competition_question_id: competitionQuestionId,
        registration_id: registrationId,
        selected_answer: selectedChoice,
        is_correct: isCorrect,
        submitted_at: new Date().toISOString(),
      };

      await supabase.from('competition_answers').insert(payload);
    }
    
    // Move to next question or complete the quiz
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setShowResult(false);
      setTimer(30);
      setTimerKey((prev) => prev + 1);
    } else {
      setTimeout(async () => {
        await completeQuiz();
        setQuizCompleted(true);
        setShowResult(false);
        setPhase('results');
      }, 100);
    }
    
    
    setTimeout(() => {
      nextCalled.current = false;
    }, 300);
  };

  const completeQuiz = async () => {
    if (!sessionId) {
      console.error("No session ID found");
      return;
    }
    
    
    // Aggregate answers, update session, calculate results
    try {
      const authData = await supabase.auth.getUser();
      const userId = authData.data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      // Update session summary
      const correctAnswers = answers.filter(a => a.is_correct).length;
      const scorePercentage = (correctAnswers / questions.length) * 100;
      
      await supabase.from('competition_sessions').update({
        correct_answers: correctAnswers,
        score_percentage: scorePercentage,
        end_time: new Date().toISOString(),
      }).eq('id', sessionId);
      
      // Calculate rank based on score and time (this should be handled by a database function in production)
      const { data: allScores } = await supabase
        .from('competition_sessions')
        .select('user_id, correct_answers, end_time')
        .eq('competition_id', competitionId)
        .not('end_time', 'is', null);
      
      if (allScores) {
        // Sort by correct answers (desc) and end time (asc - faster completion is better)
        const sortedScores = allScores
          .map(session => ({
            user_id: session.user_id,
            score: session.correct_answers,
            end_time: new Date(session.end_time).getTime()
          }))
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.end_time - b.end_time;
          });
        
        const userRank = sortedScores.findIndex(score => score.user_id === userId) + 1;
        
        // Insert into competition_results
        await supabase.from('competition_results').insert({
          competition_id: competitionId,
          user_id: userId,
          rank: userRank,
          score: correctAnswers,
          xp_awarded: correctAnswers * 5,
          trophy_awarded: userRank <= 3,
          prize_amount: calculatePrizeAmount(userRank),
          created_at: new Date().toISOString(),
        });
        
        // Award trophies for top 3
        if (userRank <= 3) {
          const trophyType = userRank === 1 ? 'gold' : userRank === 2 ? 'silver' : 'bronze';
          const title = userRank === 1 ? 'Champion' : userRank === 2 ? 'Runner-up' : 'Third Place';
          const description = `Finished ${userRank}${userRank === 1 ? 'st' : userRank === 2 ? 'nd' : 'rd'} in ${competitionDetails?.name}`;
          
          try {
            // The DB table `competition_trophies` uses columns: trophy_title, trophy_rank, earned_at
            // Use upsert on (competition_id, user_id) to avoid unique constraint errors
            const { error: trophyErr } = await supabase
              .from('competition_trophies')
              .upsert([
                {
                  competition_id: competitionId,
                  user_id: userId,
                  trophy_title: title,
                  trophy_rank: userRank,
                  earned_at: new Date().toISOString(),
                }
              ], { onConflict: 'competition_id,user_id' });

            if (trophyErr) {
              console.error('Failed to insert/upsert competition_trophy:', trophyErr);
            }
          } catch (tErr) {
            console.error('Unexpected error inserting competition_trophy:', tErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to finish competition:', err);
    }
  };

  const calculatePrizeAmount = (rank: number): number => {
    if (!competitionDetails?.prize_structure) return 0;
    
    try {
      const prizeStructure = typeof competitionDetails.prize_structure === 'string' 
        ? JSON.parse(competitionDetails.prize_structure)
        : competitionDetails.prize_structure;
      
      return prizeStructure[rank] || 0;
    } catch (e) {
      console.error('Error parsing prize structure:', e);
      return 0;
    }
  };

  const handleRestartQuiz = () => {
    setPhase('waiting');
    setCountdown(10);
    setPlayers([]);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedChoice(null);
    setScore(0);
    setQuizCompleted(false);
    setAnswers([]);
    setLoading(true);
    setError(null);
    setSessionId(null);
  setTimer(30);
    setTimerKey(0);
    setLeaderboard([]);
    setUserRank(null);
  };

  const getRecommendation = () => {
    if (score >= 16) {
      return {
        message: "Elite League Champion!",
        description: "Your skills are top-tier! Keep dominating in the Elite League!",
        leagueLink: "/competitions",
        leagueText: "Join Another Competition",
        emoji: "🏆",
        bgColor: "from-emerald-100 to-emerald-200"
      };
    } else if (score >= 13) {
      return {
        message: "Pro League Star!",
        description: "Great performance! Try the Pro League again or aim for Elite!",
        leagueLink: "/competitions",
        leagueText: "Join Another Competition",
        emoji: "⭐",
        bgColor: "from-blue-100 to-blue-200"
      };
    } else if (score >= 10) {
      return {
        message: "Solid Starter League Performance!",
        description: "Well done! Keep practicing in the Starter League or step up to Pro!",
        leagueLink: "/competitions",
        leagueText: "Join Another Competition",
        emoji: "👍",
        bgColor: "from-lime-100 to-lime-200"
      };
    } else {
      return {
        message: "Keep Practicing!",
        description: "You're getting there! Try again to improve your score!",
        leagueLink: "/livecompetition",
        leagueText: "Try Again",
        emoji: "💪",
        bgColor: "from-yellow-100 to-yellow-200"
      };
    }
  };

  if (loading && phase === 'quiz') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Preparing your League match...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error Loading Quiz</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            onClick={handleRestartQuiz}
            className="px-6 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (suspiciousActivity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Suspicious Activity Detected</h2>
          <p className="mb-6 text-gray-600">
            We've detected unusual activity from your account. Please contact support if you believe this is an error.
          </p>
          <Link href="/">
            <button className="px-6 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition font-medium">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-14 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg sm:shadow-xl overflow-hidden">
        {phase === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 sm:p-8 text-center"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {competitionDetails?.name || 'League Competition'}
            </h1>
            <p className="text-gray-600 mb-6">Get ready to compete against other players!</p>
            
            <div className="relative w-32 h-32 mx-auto mb-8">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#countdown-gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(countdown / 300) * 283} 283`}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#22c55e"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-800">{countdown}</span>
              </div>
            </div>
            
            <p className="text-lg text-gray-600 mb-6">
              {players.length} players have joined
            </p>
            
            <div className="max-h-64 overflow-y-auto px-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {players.map((player) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-lime-50 p-3 rounded-lg flex items-center justify-between border border-lime-100"
                    >
                      <span className="text-gray-700 font-medium">{player.name}</span>
                      <span className="text-lime-500 font-semibold text-sm">Joined</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'quiz' && !quizCompleted && (
          <div className="p-4 sm:p-6">
            <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-4 sm:p-6 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">
                  {competitionDetails?.name || 'League Competition'}
                </h1>
                <div className="flex items-center justify-center sm:justify-end space-x-3 sm:space-x-4">
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full flex items-center">
                    <span className="font-bold text-gray-800">{score}</span>
                    <span className="text-gray-800 opacity-90">/{questions.length}</span>
                  </div>
                  <div className="w-24 sm:w-32 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime-800 transition-all duration-500"
                      style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Improved timer */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-white" />
                  <span className="text-white font-medium text-sm">
                    {Math.ceil(timer)}s
                  </span>
                </div>
                <div className="w-full ml-3 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lime-800 transition-all duration-100"
                    style={{ width: `${(timer / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Speed metrics display (debug) */}
            {/* 
            {speedMetrics && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Latency: {speedMetrics.latency}ms</span>
                  <span>Download: {speedMetrics.downloadSpeed} Mbps</span>
                  <span>Upload: {speedMetrics.uploadSpeed} Mbps</span>
                </div>
                {fingerprint && (
                  <div className="mt-2">
                    Fingerprint: {fingerprint.substring(0, 8)}...
                  </div>
                )}
              </div>
            )}
            */}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-4 sm:p-6"
              >
                <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-600">
                      {questions[currentQuestionIndex]?.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                      questions[currentQuestionIndex]?.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      questions[currentQuestionIndex]?.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {questions[currentQuestionIndex]?.difficulty}
                    </span>
                  </div>
                  <span className="text-gray-500 text-sm">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-semibold mb-6 text-gray-800">
                  {questions[currentQuestionIndex]?.question_text}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {questions[currentQuestionIndex]?.choices.map((choice, index) => (
                    <motion.button
                      key={index}
                      whileHover={!showResult ? { scale: 1.02 } : {}}
                      whileTap={!showResult ? { scale: 0.98 } : {}}
                      onClick={() => handleChoiceSelect(choice)}
                      className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-all ${
                        showResult && choice === questions[currentQuestionIndex]?.correct_answer
                          ? 'border-green-500 bg-green-50'
                          : showResult && selectedChoice === choice
                            ? 'border-red-500 bg-red-50'
                            : selectedChoice === choice
                              ? 'border-lime-400 bg-lime-50'
                              : 'border-gray-200 hover:border-lime-300 bg-white'
                      }`}
                      disabled={showResult || quizCompleted}
                    >
                      <div className="flex items-center">
                        <span className="font-medium text-sm sm:text-base">{choice}</span>
                        {showResult && choice === questions[currentQuestionIndex]?.correct_answer && (
                          <span className="ml-2 text-green-500">✓</span>
                        )}
                        {showResult && selectedChoice === choice && selectedChoice !== questions[currentQuestionIndex]?.correct_answer && (
                          <span className="ml-2 text-red-500">✗</span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex flex-col space-y-4">
                  {selectedChoice && !showResult && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowResult(true)}
                      className="w-full py-3 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md transition-all"
                    >
                      Submit Answer
                    </motion.button>
                  )}

                  {showResult && (
                    <>
                      {questions[currentQuestionIndex]?.explanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4"
                        >
                          <p className="text-lime-600 font-semibold mb-1">Explanation:</p>
                          <p className="text-gray-600">{questions[currentQuestionIndex]?.explanation}</p>
                        </motion.div>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNextQuestion}
                        className="w-full py-3 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md transition-all"
                      >
                        {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                      </motion.button>
                    </>
                  )}
                </div>

                

              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {phase === 'results' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-8 sm:py-12 px-4 sm:px-8"
          >
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-6 sm:mb-8">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / questions.length) * 283} 283`}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold text-gray-800">
                  {score}/{questions.length}
                </span>
                <span className="text-gray-500 text-xs sm:text-sm mt-1">Your Score</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-800">
              {getRecommendation().message} {getRecommendation().emoji}
            </h2>
            <p className="text-gray-600 mb-5 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
              You answered {score} out of {questions.length} questions correctly.{' '}
              {getRecommendation().description}
            </p>

            <div className={`bg-gradient-to-r ${getRecommendation().bgColor} p-4 sm:p-6 rounded-lg mb-6 sm:mb-8 max-w-lg mx-auto border border-lime-300 shadow-md`}>
              <p className="text-gray-800 font-semibold">
                "Compete again to climb the leaderboards and prove your football knowledge!"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPhase('leaderboard')}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg sm:rounded-xl shadow-lg transition-all text-sm sm:text-base"
              >
                View Leaderboard
              </motion.button>
              <Link href={getRecommendation().leagueLink}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white font-bold rounded-lg sm:rounded-xl shadow-lg transition-all text-sm sm:text-base"
                >
                  {getRecommendation().leagueText}
                </motion.button>
              </Link>
             
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg sm:rounded-xl shadow-md transition-all text-sm sm:text-base"
                >
                  Back to Dashboard
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}

        {phase === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-4 sm:p-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
              {competitionDetails?.name} Leaderboard 🏆
            </h1>
            
            {userRank && (
              <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-4 rounded-lg text-white text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Your Ranking</h3>
                <div className="text-3xl font-bold">{userRank}</div>
                <p className="text-sm">out of {leaderboard.length} players</p>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-lime-500 to-lime-600">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">
                      Score
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
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`hover:bg-gray-50 ${entry.isUser ? 'bg-lime-50 font-semibold' : ''}`}
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {index + 1}
                          {index === 0 && <span className="ml-2 text-yellow-500">🥇</span>}
                          {index === 1 && <span className="ml-2 text-gray-400">🥈</span>}
                          {index === 2 && <span className="ml-2 text-amber-600">🥉</span>}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {entry.name}
                          {entry.isUser && <span className="ml-2 text-lime-500">(You)</span>}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {entry.score}/{questions.length}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link href="/livecompetition">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg sm:rounded-xl shadow-md transition-all text-sm sm:text-base flex items-center justify-center"
                >
                  <RotateCcw size={16} className="mr-2" />
                  View Competitions
                </motion.button>
              </Link>
              <Link href="/livecompetition">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-lime-500 hover:bg-lime-600 text-white font-bold rounded-lg sm:rounded-xl shadow-md transition-all text-sm sm:text-base flex items-center justify-center"
                >
                  <Award size={16} className="mr-2" />
                  Join Another
                </motion.button>
              </Link>
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg sm:rounded-xl shadow-md transition-all text-sm sm:text-base flex items-center justify-center"
                >
                  <Home size={16} className="mr-2" />
                  Dashboard
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}