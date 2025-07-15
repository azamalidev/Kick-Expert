'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Question {
  id: number;
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
}

export default function League() {
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
  const nextCalled = useRef(false);
  const router = useRouter();

  // Dummy player names
  const dummyNames = [
    'SoccerFan123', 'GoalMaster', 'StrikerX', 'MidfieldMaestro', 'DefenderPro',
    'KeeperLegend', 'PitchKing', 'BallWizard', 'TurfTitan', 'NetNinja',
    'DribbleStar', 'HeaderHero', 'FreekickAce', 'CornerCaptain', 'OffsideOracle',
    'TackleTiger', 'SprintSavant', 'CrossCrafter', 'VolleyViper', 'ShotSlinger',
    'PassPrince', 'FoulFox', 'RedCardRogue', 'YellowYeti', 'SoccerSage'
  ];

  // Initialize waiting phase with countdown and dummy players
  useEffect(() => {
    if (phase === 'waiting') {
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

      // Simulate players joining
      const playerInterval = setInterval(() => {
        setPlayers((prev) => {
          if (prev.length < 25) {
            const newPlayer = {
              id: prev.length + 1,
              name: dummyNames[prev.length] || `Player${prev.length + 1}`
            };
            return [...prev, newPlayer];
          }
          return prev;
        });
      }, 400);

      return () => {
        clearInterval(countdownInterval);
        clearInterval(playerInterval);
      };
    }
  }, [phase]);

  // Fetch questions and initialize quiz session when entering quiz phase
  useEffect(() => {
    if (phase !== 'quiz') return;

    const initializeQuiz = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('competition_questions')
          .select('*');

        if (questionsError) throw questionsError;

        const shuffledQuestions = questionsData
          .sort(() => Math.random() - 0.5)
          .slice(0, 20);

        setQuestions(shuffledQuestions);

        const { data: session, error: sessionError } = await supabase
          .from('competition_sessions')
          .insert({
            quiz_type: 'league',
            questions_played: 20,
            correct_answers: 0,
            score_percentage: 0,
            difficulty_breakdown: {
              easy: { total: shuffledQuestions.filter(q => q.difficulty === 'Easy').length, correct: 0 },
              medium: { total: shuffledQuestions.filter(q => q.difficulty === 'Medium').length, correct: 0 },
              hard: { total: shuffledQuestions.filter(q => q.difficulty === 'Hard').length, correct: 0 }
            },
            user_id: user?.id || null,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        setSessionId(session.id);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
        setLoading(false);
      }
    };

    initializeQuiz();
  }, [phase]);

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
    if (phase === 'results') {
      const leaderboardData: LeaderboardEntry[] = players.map((player, index) => ({
        id: player.id,
        name: player.name,
        score: Math.floor(Math.random() * 21), // Random score between 0 and 20 for dummy players
        isUser: false,
      }));
      
      // Add user's score
      leaderboardData.push({
        id: 0,
        name: 'You',
        score,
        isUser: true,
      });

      // Sort by score (descending) and assign ranks
      leaderboardData.sort((a, b) => b.score - a.score);
      setLeaderboard(leaderboardData);
    }
  }, [phase, score, players]);

  const handleChoiceSelect = (choice: string) => {
    if (!showResult) {
      setSelectedChoice(choice);
    }
  };

  const handleNextQuestion = async () => {
    // Prevent multiple calls
    if (nextCalled.current) return;
    nextCalled.current = true;

    console.log("➡️ handleNextQuestion called at index:", currentQuestionIndex);

    if (questions.length === 0) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedChoice === currentQuestion?.correct_answer;

    // Update score
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Save answer record
    if (currentQuestion) {
      setAnswers((prev) => [
        ...prev,
        {
          question_id: currentQuestion.id,
          is_correct: isCorrect,
          difficulty: currentQuestion.difficulty
        }
      ]);
    }

    // Move to next question or complete the quiz
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setShowResult(false);
      setTimer(10);
      setTimerKey((prev) => prev + 1);
    } else {
      await completeQuiz();
      setQuizCompleted(true);
      setPhase('results');
    }

    // Allow handleNextQuestion to run again after short delay
    setTimeout(() => {
      nextCalled.current = false;
    }, 300);
  };

  const completeQuiz = async () => {
    if (!sessionId) return;

    const difficultyBreakdown = {
      easy: {
        total: questions.filter(q => q.difficulty === 'Easy').length,
        correct: answers.filter(a => a.difficulty === 'Easy' && a.is_correct).length
      },
      medium: {
        total: questions.filter(q => q.difficulty === 'Medium').length,
        correct: answers.filter(a => a.difficulty === 'Medium' && a.is_correct).length
      },
      hard: {
        total: questions.filter(q => q.difficulty === 'Hard').length,
        correct: answers.filter(a => a.difficulty === 'Hard' && a.is_correct).length
      }
    };

    try {
      await supabase
        .from('competition_sessions')
        .update({
          correct_answers: score,
          score_percentage: (score / questions.length) * 100,
          end_time: new Date().toISOString(),
          difficulty_breakdown: difficultyBreakdown,
          answers: answers,
        })
        .eq('id', sessionId);
    } catch (err) {
      console.error('Failed to update quiz session:', err);
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
    setShowResult(false);
    setQuizCompleted(false);
    setAnswers([]);
    setLoading(true);
    setError(null);
    setSessionId(null);
    setTimer(10);
    setTimerKey(0);
    setLeaderboard([]);
  };

  const getRecommendation = () => {
    if (score >= 16) {
      return {
        message: "Elite League Champion!",
        description: "Your skills are top-tier! Keep dominating in the Elite League!",
        leagueLink: "/league",
        leagueText: "Play Again in Elite League",
        emoji: "🏆",
        bgColor: "from-emerald-100 to-emerald-200"
      };
    } else if (score >= 13) {
      return {
        message: "Pro League Star!",
        description: "Great performance! Try the Pro League again or aim for Elite!",
        leagueLink: "/league",
        leagueText: "Play Again in Pro League",
        emoji: "⭐",
        bgColor: "from-blue-100 to-blue-200"
      };
    } else if (score >= 10) {
      return {
        message: "Solid Starter League Performance!",
        description: "Well done! Keep practicing in the Starter League or step up to Pro!",
        leagueLink: "/league",
        leagueText: "Play Again in Starter League",
        emoji: "👍",
        bgColor: "from-lime-100 to-lime-200"
      };
    } else {
      return {
        message: "Keep Practicing!",
        description: "You're getting there! Try again to improve your score!",
        leagueLink: "/league",
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
              Preparing League Competition
            </h1>
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
                  strokeDasharray={`${(countdown / 10) * 283} 283`}
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
              {players.length} of 25 players have joined
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
                  League Competition
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
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-medium text-sm">
                    {Math.ceil(timer)}s
                  </span>
                </div>
                <div className="w-full ml-3 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lime-800 transition-all duration-100"
                    style={{ width: `${(timer / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>

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
                      disabled={showResult}
                    >
                      <div className="flex items-center">
                        <span className="font-medium text-sm sm:text-base">{choice}</span>
                        {showResult && choice === questions[currentQuestionIndex]?.correct_answer && (
                          <span className="ml-2 text-green-500">✓</span>
                        )}
                        {showResult && selectedChoice === choice &&
                          selectedChoice !== questions[currentQuestionIndex]?.correct_answer && (
                            <span className="ml-2 text-red-500">✗</span>
                          )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex flex-col space-y-3">
                  {selectedChoice && !showResult && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowResult(true)}
                      className="w-full py-3 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white font-bold rounded-lg shadow-md transition-all"
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
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4"
                        >
                          <p className="text-lime-600 font-semibold mb-1">Explanation:</p>
                          <p className="text-gray-600 text-sm sm:text-base">
                            {questions[currentQuestionIndex]?.explanation}
                          </p>
                        </motion.div>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNextQuestion}
                        className="w-full py-3 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white font-bold rounded-lg shadow-md transition-all"
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
                  {score}/20
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
              League Leaderboard 🏆
            </h1>
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
                          {entry.score}/20
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestartQuiz}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg sm:rounded-xl shadow-md transition-all text-sm sm:text-base"
              >
                Try Again
              </motion.button>
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
      </div>
    </div>
  );
}