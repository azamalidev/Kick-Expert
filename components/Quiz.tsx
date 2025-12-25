'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabaseClient';
import { BookOpen, Layers, MousePointer, Trophy, Clock, Sparkles, Shield, RefreshCcw, RotateCcw, ShieldCheck, Star, BarChart, SkipForward, CheckCircle, BarChart3, ListChecks } from "lucide-react";

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

interface QuizDashboardProps {
  initialQuestions: Question[];
}

export default function QuizDashboard({ initialQuestions }: QuizDashboardProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(false); // No longer loading initially
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        setStartTime(new Date());
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);

        // Create session
        const { data: session, error: sessionError } = await supabase
          .from('free_quiz_sessions')
          .insert({
            quiz_type: 'free',
            questions_played: 20,
            correct_answers: 0,
            score_percentage: 0,
            difficulty_breakdown: {
              easy: { total: 10, correct: 0 },
              medium: { total: 6, correct: 0 },
              hard: { total: 4, correct: 0 }
            },
            user_id: user?.id || null
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        setSessionId(session.id);
      } catch (err) {
        console.error('Failed to initialize session:', err);
        // Don't block the quiz if session creation fails, just log it
      }
    };

    if (initialQuestions.length > 0) {
      initSession();
    } else {
      setError("Failed to load questions. Please try refreshing.");
    }
  }, []);

  // Track when a new question is displayed
  useEffect(() => {
    if (currentQuestion && !quizCompleted) {
      // Mark question as used when it's displayed
      const markAsUsed = async () => {
        try {
          await supabase.rpc('mark_question_as_used', {
            p_question_id: currentQuestion.id,
            p_competition_question_id: null
          });
        } catch (err) {
          console.error('Failed to mark question as used:', err);
        }
      };

      markAsUsed();
      // Set the time when this question was shown
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, quizCompleted]);

  // Trigger confetti for scores >= 10
  useEffect(() => {
    if (quizCompleted && score >= 1) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#84cc16', '#22c55e', '#15803d'],
      });
    }
  }, [quizCompleted, score]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + (quizCompleted ? 1 : 0)) / questions.length) * 100;

  const handleChoiceSelect = (choice: string) => {
    if (!showResult) {
      setSelectedChoice(choice);
    }
  };

  const handleNextQuestion = async () => {
    const isCorrect = selectedChoice === currentQuestion.correct_answer;
    const wasSkipped = !selectedChoice; // True if no answer selected

    // Calculate response time
    let responseTimeMs: number | null = null;
    if (questionStartTime && selectedChoice) {
      responseTimeMs = Date.now() - questionStartTime;
    }

    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswers(prev => [
      ...prev,
      {
        question_id: currentQuestion.id,
        is_correct: isCorrect,
        difficulty: currentQuestion.difficulty
      }
    ]);

    // Track question statistics
    try {
      await fetch('/api/track-answer-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          competition_question_id: null,
          is_correct: isCorrect,
          was_skipped: wasSkipped,
          response_time_ms: responseTimeMs
        })
      });
    } catch (err) {
      console.error('Failed to track answer stats:', err);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedChoice(null);
      setShowResult(false);
    } else {
      await completeQuiz();
      setQuizCompleted(true);
    }
  };

  const completeQuiz = async () => {
    if (!sessionId || !startTime) return;

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
        .from('free_quiz_sessions')
        .update({
          correct_answers: score,
          score_percentage: (score / questions.length) * 100,
          end_time: new Date().toISOString(),
          difficulty_breakdown: difficultyBreakdown,
          answers: answers,
          user_id: userId
        })
        .eq('id', sessionId);
    } catch (err) {
      console.error('Failed to update quiz session:', err);
    }
  };

  const handleRestartQuiz = () => {
    window.location.reload();
  };

  const getRecommendation = () => {
    if (score >= 16) {
      return {
        message: "Elite League Awaits! You're a football trivia master!",
        description: "Join the Elite League and compete with the best of the best!",
        leagueLink: "/livecompetition",
        leagueText: "Join Elite League",
      };
    } else if (score >= 13) {
      return {
        message: "You're Ready for Pro League!",
        description: "Step up to the Pro League and challenge top-tier trivia enthusiasts!",
        leagueLink: "/livecompetition",
        leagueText: "Join Pro League",
      };
    } else if (score >= 10) {
      return {
        message: "Try the Starter League!",
        description: "The Starter League is perfect for sharpening your skills!",
        leagueLink: "/livecompetition",
        leagueText: "Join Starter League",
      };
    } else {
      return {
        message: "Keep Practicing!",
        description: "Brush up on your football knowledge and try again to unlock the Starter League!",
        leagueLink: "/livecompetition",
        leagueText: "Live Competition",
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error Loading Quiz</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={handleRestartQuiz}
            className="px-6 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-fit mt-14 bg-gray-50 text-gray-800 p-2 sm:p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden mt-4 sm:mt-0">
          <div className="bg-gradient-to-r from-lime-400 to-lime-500 p-3 sm:p-6">
            <div className="flex flex-row justify-between items-center gap-2 sm:gap-4">
              <h1 className="text-sm sm:text-2xl font-bold text-white whitespace-nowrap">
                Football Knowledge Quiz
              </h1>
              <div className="flex items-center justify-end space-x-1.5 sm:space-x-4 flex-shrink-0">
                <div className="bg-white bg-opacity-20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center">
                  <span className="font-bold text-black text-xs sm:text-base">{score}</span>
                  <span className="text-black opacity-80 text-xs sm:text-base">/{questions.length}</span>
                </div>
                <div className="w-16 sm:w-32 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lime-700 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {!quizCompleted ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <div className="flex items-center space-x-3">
                      <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                        {currentQuestion.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${currentQuestion.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        currentQuestion.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {currentQuestion.difficulty}
                      </span>
                    </div>
                    <span className="text-gray-500">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold mb-6 text-gray-800">
                    {currentQuestion.question_text}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {currentQuestion.choices.map((choice, index) => (
                      <motion.button
                        key={index}
                        whileHover={!showResult ? { scale: 1.02 } : {}}
                        whileTap={!showResult ? { scale: 0.98 } : {}}
                        onClick={() => handleChoiceSelect(choice)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${showResult && choice === currentQuestion.correct_answer
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
                          <span className="font-medium">{choice}</span>
                          {showResult && choice === currentQuestion.correct_answer && (
                            <span className="ml-2 text-green-500">✓</span>
                          )}
                          {showResult && selectedChoice === choice &&
                            selectedChoice !== currentQuestion.correct_answer && (
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
                        {currentQuestion.explanation && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4"
                          >
                            <p className="text-lime-600 font-semibold mb-1">Explanation:</p>
                            <p className="text-gray-600">{currentQuestion.explanation}</p>
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
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12 px-4 sm:px-8"
              >
                {/* Score Display */}
                <div className="relative w-48 h-48 mx-auto mb-8">
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
                    <span className="text-4xl font-bold text-gray-800">
                      {score}/20
                    </span>
                    <span className="text-gray-500 text-sm mt-1">Your Score</span>
                  </div>
                </div>

                {/* Recommendation Message */}
                <h2 className="text-3xl font-bold mb-4 text-gray-800">
                  {getRecommendation().message}
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You answered {score} out of {questions.length} questions correctly.{' '}
                  {getRecommendation().description}
                </p>

                {/* Static Competition Note */}
                <div className="bg-gradient-to-r from-lime-100 to-lime-200 p-6 rounded-lg mb-8 max-w-lg mx-auto border border-lime-300 shadow-md">
                  <p className="text-gray-800 font-semibold">
                    "In competitions, you'll only have <span className="text-lime-600">20 seconds</span> per question — can you handle the pressure?"
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link href={getRecommendation().leagueLink ?? '/quiz'}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                      {getRecommendation().leagueText}
                    </motion.button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRestartQuiz}
                    className="w-full sm:w-auto px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl shadow-md transition-all"
                  >
                    Try Again
                  </motion.button>
                  <Link href="/">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl shadow-md transition-all"
                    >
                      Back to Dashboard
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Rules Section */}
      <div className="w-full mt-16 p-8 bg-white rounded-xl border border-lime-100 shadow-md">
        <h2 className="text-3xl font-bold mb-6 text-lime-600 text-center">Quiz Rules</h2>
        <div className="space-y-5 text-gray-700">

          {/* Total Questions */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-lime-500/20 rounded-lg">
              <ListChecks className="h-6 w-6 text-lime-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Total Questions</h3>
              <p className="text-sm leading-relaxed">
                Each quiz contains <strong>20 questions</strong> — <strong>10 Easy</strong>, <strong>6 Medium</strong>, and <strong>4 Hard</strong>.
                Questions are randomly selected each time you play.
              </p>
            </div>
          </div>

          {/* Question Difficulty */}
          <div className="flex items-start p-5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200">
            <div className="p-2.5 mr-4 bg-blue-500/20 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Difficulty Levels</h3>
              <p className="text-sm leading-relaxed">
                Questions are categorized by difficulty. Each difficulty level affects your score tracking and final performance rating.
              </p>
            </div>
          </div>

          {/* Answering Questions */}
          <div className="flex items-start p-5 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors border border-yellow-200">
            <div className="p-2.5 mr-4 bg-yellow-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Answering Questions</h3>
              <p className="text-sm leading-relaxed">
                Choose your answer and click <strong>Submit Answer</strong>. Once submitted, it cannot be changed.
                The correct answer will be highlighted in green, with an explanation shown below.
              </p>
            </div>
          </div>

          {/* Skipping Questions */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-orange-500/20 rounded-lg">
              <SkipForward className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Skipping Questions</h3>
              <p className="text-sm leading-relaxed">
                You can skip questions, but unanswered or skipped ones are counted as incorrect and give no score.
              </p>
            </div>
          </div>

          {/* Scoring System */}
          <div className="flex items-start p-5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200">
            <div className="p-2.5 mr-4 bg-blue-500/20 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Scoring System</h3>
              <p className="text-sm leading-relaxed">
                Each correct answer awards <strong>1 point</strong>. Incorrect or skipped questions give <strong>0 points</strong>.
                Your score and progress are displayed at the top throughout the quiz.
              </p>
            </div>
          </div>

          {/* Timing */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-purple-500/20 rounded-lg">
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Timing</h3>
              <p className="text-sm leading-relaxed">
                While the free quiz has no strict time limit, your response time is recorded for performance analytics.
                In competitions, each question allows <strong>20 seconds</strong>.
              </p>
            </div>
          </div>

          {/* Completion & Results */}
          <div className="flex items-start p-5 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors border border-yellow-200">
            <div className="p-2.5 mr-4 bg-yellow-500/20 rounded-lg">
              <BarChart className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Quiz Completion</h3>
              <p className="text-sm leading-relaxed">
                Once all 20 questions are answered, your total score and performance breakdown are displayed along with a recommended league level.
              </p>
            </div>
          </div>


          {/* Fair Play */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-red-500/20 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Fair Play</h3>
              <p className="text-sm leading-relaxed">
                Do not use unfair means, bots, or external help. Violations may lead to disqualification or account restrictions.
              </p>
            </div>
          </div>

          {/* Retry Option */}
          <div className="flex items-start p-5 bg-lime-50 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200">
            <div className="p-2.5 mr-4 bg-teal-500/20 rounded-lg">
              <RotateCcw className="h-6 w-6 text-teal-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Retry Option</h3>
              <p className="text-sm leading-relaxed">
                You can retry the quiz anytime using the <strong>“Try Again”</strong> button to challenge a new random set of questions.
              </p>
            </div>
          </div>

        </div>
      </div>



    </>
  );
}