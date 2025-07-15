'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti'; 
import { supabase } from '@/lib/supabaseClient';

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

export default function QuizDashboard() {
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
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Shuffle array function
  const shuffleArray = (array: any[]) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  // Check user authentication and fetch questions
  const initializeQuiz = async () => {
    try {
      setStartTime(new Date());
      
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
        supabase.from('questions').select('*').eq('difficulty', 'Easy'),
        supabase.from('questions').select('*').eq('difficulty', 'Medium'),
        supabase.from('questions').select('*').eq('difficulty', 'Hard')
      ]);

      if (easyQuestions.error || mediumQuestions.error || hardQuestions.error) {
        throw easyQuestions.error || mediumQuestions.error || hardQuestions.error;
      }

      const selectedEasy = shuffleArray(easyQuestions.data || []).slice(0, 10);
      const selectedMedium = shuffleArray(mediumQuestions.data || []).slice(0, 6);
      const selectedHard = shuffleArray(hardQuestions.data || []).slice(0, 4);

      const allQuestions = shuffleArray([
        ...selectedEasy,
        ...selectedMedium,
        ...selectedHard
      ]);

      setQuestions(allQuestions);

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
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeQuiz();
  }, []);

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
    setCurrentQuestionIndex(0);
    setSelectedChoice(null);
    setScore(0);
    setShowResult(false);
    setQuizCompleted(false);
    setAnswers([]);
    setLoading(true);
    setError(null);
    setUserId(null);
    initializeQuiz();
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
    <div className="min-h-fit mt-14 bg-gray-50 text-gray-800 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-lime-400 to-lime-500 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">
              Football Knowledge Quiz
            </h1>
            <div className="flex items-center justify-center sm:justify-end space-x-3 sm:space-x-4">
              <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full flex items-center">
                <span className="font-bold text-black">{score}</span>
                <span className="text-black opacity-80">/{questions.length}</span>
              </div>
              <div className="w-24 sm:w-32 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
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
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      currentQuestion.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
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
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        showResult && choice === currentQuestion.correct_answer
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
  );
}