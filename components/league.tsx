'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Award, Star, Clock, Users, ChevronRight, Home, RotateCcw, Shield } from 'lucide-react';

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
  credit_cost: number;
  entry_fee?: number; // Keep for backwards compatibility
  prize_structure: any;
  status: string;
  start_time?: string; // Added to match usage in code
  end_time?: string; // Competition end time
  duration_minutes?: number; // Competition duration in minutes
}

export default function LeaguePage() {
  const [countdown, setCountdown] = useState(120);
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<'waiting' | 'quiz' | 'results' | 'leaderboard'>('waiting');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [timer, setTimer] = useState(10);
  const [timerKey, setTimerKey] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [competitionDetails, setCompetitionDetails] = useState<CompetitionDetails | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [suspiciousActivity, setSuspiciousActivity] = useState(false);
  const [showCompetitionEndModal, setShowCompetitionEndModal] = useState(false);
  const nextCalled = useRef(false);
  const timerStartTime = useRef<number | null>(null); // Timestamp when timer started
  const router = useRouter();
  const searchParams = useSearchParams();
  const competitionId = searchParams ? searchParams.get('competitionId') || '' : '';

  // Fetch competition details
  useEffect(() => {
    const fetchCompetitionDetails = async () => {
      if (!competitionId) return;
      
      try {
        // First, check if user is authenticated
        const authResponse = await supabase.auth.getUser();
        if (authResponse.data.user) {
          // Check if user has already played this competition
          const { data: existingSession } = await supabase
            .from('competition_sessions')
            .select('*')
            .eq('competition_id', competitionId)
            .eq('user_id', authResponse.data.user.id)
            .maybeSingle();

          if (existingSession) {
            // User has already played this competition
            setError('You have already completed this competition. Redirecting...');
            setInitializing(false);
            setTimeout(() => {
              router.push('/livecompetition');
            }, 2000);
            return;
          }
        }

        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .eq('id', competitionId)
          .single();
        
        if (!error && data) {
          console.log('Competition details fetched:', data); // Debug log
          setCompetitionDetails(data);
          // initialize countdown based on start_time if available
          if (data.start_time) {
            const start = new Date(data.start_time).getTime();
            const now = new Date().getTime();
            const seconds = Math.max(0, Math.floor((start - now) / 1000));
            
            // Only allow entering quiz if competition has actually started (current time >= start time)
            if (now >= start) {
              // Competition has started - go directly to quiz
              setPhase('quiz');
              setCountdown(0);
            } else if (seconds <= 120) {
              // Less than 2 minutes remaining but not started yet - show countdown
              setCountdown(seconds);
            } else {
              // More than 2 minutes remaining - set countdown to exactly 2 minutes (120 seconds)
              setCountdown(120);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching competition details:', err);
      } finally {
        setInitializing(false);
      }
    };
    
    fetchCompetitionDetails();
  }, [competitionId]);

  // Fetch actual registered players for this competition
  useEffect(() => {
    if (!competitionId) return;
    
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
  }, [competitionId]);

  // Countdown timer for waiting phase
  useEffect(() => {
    if (phase === 'waiting' && competitionId) {
      const countdownInterval = setInterval(() => {
        // Check if competition has ended before continuing countdown
        if (hasCompetitionEnded()) {
          clearInterval(countdownInterval);
          setError('This competition has ended. You cannot participate anymore.');
          setTimeout(() => {
            router.push('/livecompetition');
          }, 3000);
          return;
        }

        setCountdown((prev) => {
            if (prev <= 1) {
            clearInterval(countdownInterval);
            setPhase('quiz');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
  }, [phase, competitionId]);

  // Fetch questions and initialize quiz session when entering quiz phase
  useEffect(() => {
    if (phase !== 'quiz' || !competitionId) return;
    
    const initializeQuiz = async () => {
      try {
        setLoading(true);
        
        // Check if competition has ended before starting quiz
        if (hasCompetitionEnded()) {
          setError('This competition has ended. You cannot participate anymore.');
          setLoading(false);
          setTimeout(() => {
            router.push('/livecompetition');
          }, 3000);
          return;
        }

        // Get the authenticated user
        const authResponse = await supabase.auth.getUser();
        if (!authResponse.data.user) {
          throw new Error('User not authenticated');
        }

        // Call the local route which merges competition_questions with questions
        const routeRes = await fetch('/api/competition-questions', {
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

        // Check if user has already played this competition
        const { data: existingSession, error: existingSessionErr } = await supabase
          .from('competition_sessions')
          .select('*')
          .eq('competition_id', competitionId)
          .eq('user_id', authResponse.data.user.id)
          .maybeSingle();

        if (existingSession) {
          // User has already played this competition
          setError('You have already completed this competition. You can only participate once per competition.');
          setLoading(false);
          // Redirect to home or leaderboard after a delay
          setTimeout(() => {
            router.push('/livecompetition');
          }, 3000);
          return;
        }

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

  // Timer for each question - using timestamp to work even when tab is inactive
  useEffect(() => {
    if (phase !== 'quiz' || quizCompleted || showResult || questions.length === 0) return;

    // Set the start time for this question
    timerStartTime.current = Date.now();
    const questionDuration = 30000; // 30 seconds in milliseconds

    const timerInterval = setInterval(() => {
      if (!timerStartTime.current) return;

      // Calculate elapsed time based on actual timestamp difference
      const elapsed = Date.now() - timerStartTime.current;
      const remaining = Math.max(0, (questionDuration - elapsed) / 1000);

      setTimer(remaining);

      if (remaining <= 0) {
        clearInterval(timerInterval);

        // Case 1: user did NOT select an answer → skip to next
        if (!selectedChoice) {
          handleNextQuestion();
        }

        // Case 2: user selected something → show result, wait for button
        else if (!showResult) {
          setShowResult(true);
        }
      }
    }, 100); // Check every 100ms for smooth updates

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

  // Monitor competition end time and auto-redirect to results
  useEffect(() => {
    if (phase === 'quiz' && competitionDetails) {
      const checkCompetitionEndTime = () => {
        if (hasCompetitionEnded()) {
          // Competition time has expired - force move to results
          console.log('Competition end time reached - moving to results phase');
          setPhase('results');
        }
      };

      // Check immediately
      checkCompetitionEndTime();

      // Check every 5 seconds
      const endTimeInterval = setInterval(checkCompetitionEndTime, 5000);

      return () => clearInterval(endTimeInterval);
    }
  }, [phase, competitionDetails]);

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

    // Check if competition has ended
    if (hasCompetitionEnded()) {
      console.log('Competition ended - moving to results');
      setPhase('results');
      return;
    }

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
        const prizeAmount = calculatePrizeAmount(userRank);
        
        // Insert into competition_results
        await supabase.from('competition_results').insert({
          competition_id: competitionId,
          user_id: userId,
          rank: userRank,
          score: correctAnswers,
          xp_awarded: correctAnswers * 5,
          trophy_awarded: userRank <= 3,
          prize_amount: prizeAmount,
          created_at: new Date().toISOString(),
        });

        // Add winning credits to user's account if they won a prize
        if (userRank <= 3 && prizeAmount > 0) {
          try {
            // Check if user_credits record exists
            const { data: existingCredits, error: fetchError } = await supabase
              .from('user_credits')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
              console.error('Error fetching user credits:', fetchError);
            }

            if (existingCredits) {
              // Update existing record - add to winnings_credits
              const { error: updateError } = await supabase
                .from('user_credits')
                .update({
                  winnings_credits: (existingCredits.winnings_credits || 0) + prizeAmount,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

              if (updateError) {
                console.error('Error updating user credits:', updateError);
              } else {
                console.log(`Added ${prizeAmount} credits to user's winnings`);
              }
            } else {
              // Create new record with winnings_credits
              const { error: insertError } = await supabase
                .from('user_credits')
                .insert({
                  user_id: userId,
                  purchased_credits: 0,
                  winnings_credits: prizeAmount,
                  referral_credits: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (insertError) {
                console.error('Error creating user credits record:', insertError);
              } else {
                console.log(`Created user credits record with ${prizeAmount} winnings`);
              }
            }

            // Insert transaction record for the reward
            const rankSuffix = userRank === 1 ? 'st' : userRank === 2 ? 'nd' : 'rd';
            const { error: transactionError } = await supabase
              .from('transactions')
              .insert({
                user_id: userId,
                type: 'reward',
                amount: prizeAmount,
                status: 'completed',
                description: `Competition Reward (${competitionDetails?.name}) - Rank: ${userRank}${rankSuffix} - Score: ${correctAnswers}/${questions.length}`,
                session_id: sessionId,
                source: 'league_competition',
                created_at: new Date().toISOString(),
                metadata: {
                  competition_id: competitionId,
                  competition_name: competitionDetails?.name,
                  rank: userRank,
                  score: correctAnswers,
                  total_questions: questions.length,
                  prize_amount: prizeAmount
                }
              });

            if (transactionError) {
              console.error('Error creating transaction record:', transactionError);
            } else {
              console.log(`Transaction record created for ${prizeAmount} credits reward`);
            }
          } catch (creditsErr) {
            console.error('Unexpected error updating user credits:', creditsErr);
          }
        }

        // Update user profile - increment games, wins (if top 3), and XP
        try {
          // Fetch current profile data
          const { data: currentProfile, error: profileFetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (profileFetchError) {
            console.error('Error fetching profile:', profileFetchError);
          } else if (currentProfile) {
            const xpAwarded = correctAnswers * 5; // 5 XP per correct answer
            const isWinner = userRank <= 3; // Top 3 counts as a win

            const { error: profileUpdateError } = await supabase
              .from('profiles')
              .update({
                total_games: (currentProfile.total_games || 0) + 1,
                total_wins: (currentProfile.total_wins || 0) + (isWinner ? 1 : 0),
                xp: (currentProfile.xp || 0) + xpAwarded,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId);

            if (profileUpdateError) {
              console.error('Error updating profile:', profileUpdateError);
            } else {
              console.log(`Profile updated: +1 game, ${isWinner ? '+1 win, ' : ''}+${xpAwarded} XP`);
            }
          }
        } catch (profileErr) {
          console.error('Unexpected error updating profile:', profileErr);
        }
        
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
    // Return 0 for ranks beyond 3rd place
    if (rank > 3) return 0;

    // Try to use prize_structure from competition details if available
    if (competitionDetails?.prize_structure) {
      try {
        const prizeStructure = typeof competitionDetails.prize_structure === 'string' 
          ? JSON.parse(competitionDetails.prize_structure)
          : competitionDetails.prize_structure;
        
        const structurePrize = prizeStructure[rank];
        if (structurePrize && structurePrize > 0) {
          return structurePrize;
        }
      } catch (e) {
        console.error('Error parsing prize structure:', e);
      }
    }

    // Fallback: Calculate based on total prize pool
    // Prize pool = number of players × entry cost
    const totalPool = players.length * getCreditCost();
    
    // Prize distribution: 1st = 50%, 2nd = 30%, 3rd = 20%
    switch (rank) {
      case 1:
        return Math.floor(totalPool * 0.5);
      case 2:
        return Math.floor(totalPool * 0.3);
      case 3:
        return Math.floor(totalPool * 0.2);
      default:
        return 0;
    }
  };

  // Helper function to get credit cost with fallback
  const getCreditCost = (): number => {
    if (competitionDetails?.credit_cost) {
      return competitionDetails.credit_cost;
    }
    if (competitionDetails?.entry_fee) {
      return competitionDetails.entry_fee;
    }
    // Fallback based on competition name
    const name = competitionDetails?.name || '';
    if (name.includes('Starter')) return 10;
    if (name.includes('Pro')) return 20;
    if (name.includes('Elite')) return 30;
    return 10; // Default fallback
  };

  // Helper function to check if competition has ended
  const hasCompetitionEnded = (): boolean => {
    if (!competitionDetails) return false;
    
    // Check if end_time exists and has passed
    if (competitionDetails.end_time) {
      const endTime = new Date(competitionDetails.end_time).getTime();
      const now = new Date().getTime();
      return now >= endTime;
    }
    
    // Fallback: Calculate end time from start_time + duration
    if (competitionDetails.start_time && competitionDetails.duration_minutes) {
      const startTime = new Date(competitionDetails.start_time).getTime();
      const durationMs = competitionDetails.duration_minutes * 60 * 1000;
      const calculatedEndTime = startTime + durationMs;
      const now = new Date().getTime();
      return now >= calculatedEndTime;
    }
    
    // If no end time info available, assume it hasn't ended
    return false;
  };

  // Helper function to get formatted competition end time
  const getCompetitionEndTime = (): { date: string; time: string; timeLeft: string } | null => {
    if (!competitionDetails) return null;
    
    let endTime: Date | null = null;
    
    if (competitionDetails.end_time) {
      endTime = new Date(competitionDetails.end_time);
    } else if (competitionDetails.start_time && competitionDetails.duration_minutes) {
      const startTime = new Date(competitionDetails.start_time).getTime();
      const durationMs = competitionDetails.duration_minutes * 60 * 1000;
      endTime = new Date(startTime + durationMs);
    }
    
    if (!endTime) return null;
    
    const now = new Date().getTime();
    const timeLeft = endTime.getTime() - now;
    
    let timeLeftStr = '';
    if (timeLeft > 0) {
      const minutes = Math.floor(timeLeft / 1000 / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) {
        timeLeftStr = `${days} day${days > 1 ? 's' : ''} remaining`;
      } else if (hours > 0) {
        timeLeftStr = `${hours} hour${hours > 1 ? 's' : ''} remaining`;
      } else if (minutes > 0) {
        timeLeftStr = `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
      } else {
        timeLeftStr = 'Less than a minute';
      }
    } else {
      timeLeftStr = 'Competition has ended';
    }
    
    return {
      date: endTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timeLeft: timeLeftStr
    };
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
        {initializing && (
          <div className="p-6 sm:p-8 text-center min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600"></div>
              <p className="text-gray-600">Loading competition...</p>
            </div>
          </div>
        )}
        
        {phase === 'waiting' && !initializing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 sm:p-8 text-center"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {competitionDetails?.name || 'League Competition'}
            </h1>
            <p className="text-gray-600 mb-6">Get ready! Competition starts soon</p>
            
            {/* Countdown Timer */}
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
                  strokeDasharray={`${(countdown / 120) * 283} 283`}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#22c55e"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-bold text-gray-800">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
                <span className="text-xs text-gray-500 mt-1">minutes</span>
              </div>
            </div>
            
            {/* League Recap */}
            <div className="bg-gradient-to-br from-lime-50 to-lime-100 border-2 border-lime-300 rounded-xl p-6 mb-6 shadow-md">
              <h2 className="text-xl font-bold text-lime-800 mb-4 flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6" />
                League Recap
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-semibold text-gray-600">Prize Pool</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">
                    {players.length * getCreditCost()} Credits
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-600">Players Registered</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{players.length}</p>
                </div>
              </div>
              
              {/* Prize Breakdown */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Prize Distribution</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      🥇 <span className="font-medium">1st Place</span>
                    </span>
                    <span className="text-sm font-bold text-yellow-600">
                      {Math.floor(players.length * getCreditCost() * 0.5)} Credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      🥈 <span className="font-medium">2nd Place</span>
                    </span>
                    <span className="text-sm font-bold text-gray-600">
                      {Math.floor(players.length * getCreditCost() * 0.3)} Credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      🥉 <span className="font-medium">3rd Place</span>
                    </span>
                    <span className="text-sm font-bold text-amber-600">
                      {Math.floor(players.length * getCreditCost() * 0.2)} Credits
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rules Reminder */}
            {/* <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
              <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center justify-center gap-2">
                <Shield className="h-5 w-5" />
                Quick Rules Reminder
              </h3>
              <ul className="text-sm text-blue-700 space-y-2 text-left max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>30 seconds per question - answer quickly!</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Accuracy + Speed = Higher score</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Top 3 players win prizes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Play fair - no external help allowed</span>
                </li>
              </ul>
            </div> */}
            
            {/* Players List */}
            <p className="text-lg text-gray-600 mb-4 font-semibold">
              {players.length} players ready to compete
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
                      <span className="text-lime-500 font-semibold text-sm">Ready</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'quiz' && !quizCompleted && (
          <div className="p-4 sm:p-6">
            {/* Header with Progress */}
            <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-4 sm:p-6 rounded-lg mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">
                  {competitionDetails?.name || 'League Competition'}
                </h1>
                <div className="flex items-center justify-center sm:justify-end space-x-3 sm:space-x-4">
                  <div className="bg-white  bg-opacity-20 px-3 py-1 rounded-full flex items-center">
                    <span className="font-bold text-lime-500">{score}</span>
                    <span className="text-lime-500 opacity-90">/{questions.length}</span>
                  </div>
                  <div className="w-24 sm:w-32 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Enhanced Timer Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-white" />
                    <span className="text-white font-medium text-sm">
                      Time Remaining: {Math.ceil(timer)}s
                    </span>
                  </div>
                  <span className="text-white text-xs font-semibold">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>
                <div className="w-full h-3 bg-white bg-opacity-30 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-100 ${
                      timer > 20 ? 'bg-green-400' : 
                      timer > 10 ? 'bg-yellow-400' : 
                      'bg-red-400 animate-pulse'
                    }`}
                    style={{ width: `${(timer / 30) * 100}%` }}
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
                {/* Question Metadata */}
                <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-600 font-medium">
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
                </div>

                {/* Question Text */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 leading-relaxed">
                    {questions[currentQuestionIndex]?.question_text}
                  </h2>
                </div>

                {/* Answer Choices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {questions[currentQuestionIndex]?.choices.map((choice, index) => (
                    <motion.button
                      key={index}
                      whileHover={!showResult ? { scale: 1.02 } : {}}
                      whileTap={!showResult ? { scale: 0.98 } : {}}
                      onClick={() => handleChoiceSelect(choice)}
                      className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-all ${
                        showResult && choice === questions[currentQuestionIndex]?.correct_answer
                          ? 'border-green-500 bg-green-50 shadow-lg'
                          : showResult && selectedChoice === choice
                            ? 'border-red-500 bg-red-50'
                            : selectedChoice === choice
                              ? 'border-lime-400 bg-lime-50 shadow-md'
                              : 'border-gray-200 hover:border-lime-300 bg-white hover:shadow-md'
                      }`}
                      disabled={showResult || quizCompleted}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm sm:text-base">{choice}</span>
                        {showResult && choice === questions[currentQuestionIndex]?.correct_answer && (
                          <span className="ml-2 text-green-500 text-xl">✓</span>
                        )}
                        {showResult && selectedChoice === choice && selectedChoice !== questions[currentQuestionIndex]?.correct_answer && (
                          <span className="ml-2 text-red-500 text-xl">✗</span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Action Buttons */}
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
                          className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 mb-4 shadow-sm"
                        >
                          <p className="text-lime-600 font-semibold mb-1 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Explanation:
                          </p>
                          <p className="text-gray-700">{questions[currentQuestionIndex]?.explanation}</p>
                        </motion.div>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNextQuestion}
                        className="w-full py-3 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md transition-all"
                      >
                        {currentQuestionIndex < questions.length - 1 ? 'Next Question →' : 'View Results 🎯'}
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
            {/* Personal Stats Section */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
                Your Performance 🎯
              </h2>
              
              {/* Score Circle */}
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
                  <span className="text-gray-500 text-xs sm:text-sm mt-1">Correct Answers</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-600">Accuracy</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {Math.round((score / questions.length) * 100)}%
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-lime-50 to-lime-100 border-2 border-lime-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-lime-600" />
                    <span className="text-sm font-semibold text-gray-600">Questions</span>
                  </div>
                  <p className="text-2xl font-bold text-lime-700">{questions.length}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-600">XP Earned</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">+{score * 5}</p>
                </div>
              </div>

              {/* Performance Message */}
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">
                {getRecommendation().message} {getRecommendation().emoji}
              </h3>
              <p className="text-gray-600 mb-5 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
                {getRecommendation().description}
              </p>

              {/* Competition Status */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6 max-w-lg mx-auto">
                <p className="text-yellow-800 font-semibold flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5" />
                  Waiting for all players to finish...
                </p>
                <p className="text-yellow-700 text-sm mt-2">
                  Final rankings and prize distribution will be shown after the competition ends
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Check if competition has ended
                  if (hasCompetitionEnded()) {
                    setPhase('leaderboard');
                  } else {
                    // Show modal with competition end time
                    setShowCompetitionEndModal(true);
                  }
                }}
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              {competitionDetails?.name} Leaderboard
            </h1>
            
            {/* Prize Pool Summary */}
            {competitionDetails && (
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-6 mb-6 max-w-2xl mx-auto shadow-md">
                <h2 className="text-xl font-bold text-yellow-800 mb-4 flex items-center justify-center gap-2">
                  <Award className="h-6 w-6" />
                  Prize Distribution
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-yellow-200">
                    <div className="text-3xl mb-2">🥇</div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">1st Place</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {Math.floor(leaderboard.length * getCreditCost() * 0.5)} Credits
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
                    <div className="text-3xl mb-2">🥈</div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">2nd Place</p>
                    <p className="text-xl font-bold text-gray-600">
                      {Math.floor(leaderboard.length * getCreditCost() * 0.3)} Credits
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-amber-200">
                    <div className="text-3xl mb-2">🥉</div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">3rd Place</p>
                    <p className="text-xl font-bold text-amber-600">
                      {Math.floor(leaderboard.length * getCreditCost() * 0.2)} Credits
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* User Rank Highlight */}
            {userRank && (
              <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-4 rounded-lg text-white text-center mb-6 max-w-md mx-auto shadow-md">
                <h3 className="text-lg font-semibold mb-2">Your Final Ranking</h3>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-4xl font-bold"># {userRank}</div>
                  <div className="text-left">
                    <p className="text-sm opacity-90">out of {leaderboard.length} players</p>
                    {userRank <= 3 && (
                      <p className="text-sm font-semibold mt-1 flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        Prize Winner!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Leaderboard Table */}
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
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">
                      Prize
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {leaderboard.map((entry, index) => {
                      const prize = index === 0 
                        ? Math.floor(leaderboard.length * (competitionDetails?.entry_fee || 0) * 0.5)
                        : index === 1
                        ? Math.floor(leaderboard.length * (competitionDetails?.entry_fee || 0) * 0.3)
                        : index === 2
                        ? Math.floor(leaderboard.length * (competitionDetails?.entry_fee || 0) * 0.2)
                        : 0;
                      
                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`hover:bg-gray-50 ${entry.isUser ? 'bg-lime-50 font-semibold' : ''} ${
                            index < 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                          }`}
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{index + 1}</span>
                              {index === 0 && <span className="text-xl">🥇</span>}
                              {index === 1 && <span className="text-xl">🥈</span>}
                              {index === 2 && <span className="text-xl">🥉</span>}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {entry.name}
                            {entry.isUser && <span className="ml-2 text-lime-600 font-semibold">(You)</span>}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <span className="font-semibold">{entry.score}/{questions.length}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                            {prize > 0 ? (
                              <span className="font-bold text-lime-600">{prize} Credits</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
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

      {/* Competition End Time Modal */}
      <AnimatePresence>
        {showCompetitionEndModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-center">Competition In Progress</h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-gray-700 text-lg mb-4">
                    The final leaderboard will be revealed when the competition ends.
                  </p>
                  <p className="text-gray-600 text-sm mb-6">
                    All players must complete their matches, and the competition must reach its end time.
                  </p>
                </div>

                {/* Competition End Time Display */}
                {getCompetitionEndTime() && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-800 mb-3 text-center">Competition Ends At</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white rounded-lg p-3">
                        <span className="text-sm text-gray-600">Date</span>
                        <span className="text-sm font-bold text-gray-800">{getCompetitionEndTime()!.date}</span>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg p-3">
                        <span className="text-sm text-gray-600">Time</span>
                        <span className="text-sm font-bold text-gray-800">{getCompetitionEndTime()!.time}</span>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                        <p className="text-sm font-semibold text-yellow-800">
                          ⏱️ {getCompetitionEndTime()!.timeLeft}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
                  <p className="text-sm text-lime-800 text-center">
                    <strong>💡 Tip:</strong> Check back after the competition ends to see where you rank!
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCompetitionEndModal(false)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                >
                  Got It!
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}