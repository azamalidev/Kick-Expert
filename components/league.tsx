'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Award, Star, Clock, Users, ChevronRight, Home, RotateCcw, Shield } from 'lucide-react';
import { handleFingerprintCheck, logCheatAction } from '@/utils/fingerprint';

interface Question {
  id: number | string;
  sourceQuestionId?: number | string;
  question_text: string;
  category: string;
  difficulty: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
}

interface AnswerRecord {
  question_id: number | string;
  is_correct: boolean;
  difficulty: string;
  selected_answer?: string | null; // Store user's selected answer
  answer_time?: number; // Time remaining when answer was submitted (in seconds)
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
  prizeAmount?: number; // Prize amount from database
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
  const [phase, setPhase] = useState<'waiting' | 'quiz' | 'results' | 'leaderboard' | 'detailed-results'>('waiting');
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
  const [answerSubmittedAt, setAnswerSubmittedAt] = useState<number | null>(null); // Track when answer was submitted
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [competitionDetails, setCompetitionDetails] = useState<CompetitionDetails | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [suspiciousActivity, setSuspiciousActivity] = useState(false);
  const [showCompetitionEndModal, setShowCompetitionEndModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCompetitionEndingWarning, setShowCompetitionEndingWarning] = useState(false);
  const [competitionEndingCountdown, setCompetitionEndingCountdown] = useState<string>('');
  const [resultsViewingTimeLeft, setResultsViewingTimeLeft] = useState<number | null>(null);
  const [resultsViewingTimer, setResultsViewingTimer] = useState<NodeJS.Timeout | null>(null);
  const [leaderboardLastUpdated, setLeaderboardLastUpdated] = useState<Date | null>(null);
  const [isLateJoiner, setIsLateJoiner] = useState(false);
  const [missedQuestions, setMissedQuestions] = useState(0);
  const [competitionStartTime, setCompetitionStartTime] = useState<number | null>(null);
  const [showAnswerRequiredWarning, setShowAnswerRequiredWarning] = useState(false); // NEW: Warning when trying to skip
  const [showLateJoinerWarning, setShowLateJoinerWarning] = useState(false);
  const [showQuizLateJoinerWarning, setShowQuizLateJoinerWarning] = useState(false);
  const [isRejoin, setIsRejoin] = useState(false); // Track if user is rejoining
  const [competitionTimeWarning, setCompetitionTimeWarning] = useState<string | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false); // Loading state for results calculation
  const nextCalled = useRef(false);
  const timerStartTime = useRef<number | null>(null); // Timestamp when timer started
  const questionStartTime = useRef<number | null>(null); // Server timestamp when question was displayed
  const responseLatencies = useRef<number[]>([]); // Track all response times
  const syncCheckInterval = useRef<NodeJS.Timeout | null>(null); // NEW: For global sync checking
  const router = useRouter();
  const searchParams = useSearchParams();
  const competitionId = searchParams ? searchParams.get('competitionId') || '' : '';

  // Fetch competition detail
  useEffect(() => {
    const fetchCompetitionDetails = async () => {
      if (!competitionId) {
        console.error('❌ No competition ID provided');
        return;
      }

      console.log('🔍 Fetching competition details for ID:', competitionId);

      try {
        // First, check if user is authenticated
        const authResponse = await supabase.auth.getUser();
        console.log('👤 Auth check:', authResponse.data.user ? 'Logged in' : 'Not logged in');
        
        if (authResponse.data.user) {
          // 🔒 STEP 2: Browser Fingerprint Check
          console.log('🔍 Checking device fingerprint...');
          const fingerprintResult = await handleFingerprintCheck(
            competitionId,
            authResponse.data.user.id,
            null
          );

          if (!fingerprintResult.allowed) {
            // Device conflict detected - block access
            setError(fingerprintResult.message || 'Device verification failed');
            setInitializing(false);
            setTimeout(() => {
              router.push('/livecompetition');
            }, 4000);
            return;
          }

          console.log('✅ Device verified:', fingerprintResult.fingerprintId);

          // Check if user has already played this competition
          const { data: existingSession } = await supabase
            .from('competition_sessions')
            .select('*')
            .eq('competition_id', competitionId)
            .eq('user_id', authResponse.data.user.id)
            .maybeSingle();

          if (existingSession && existingSession.end_time) {
            // User has completed this competition (has end_time) - block access
            setError('You have already completed this competition. Redirecting...');
            setInitializing(false);
            setTimeout(() => {
              router.push('/livecompetition');
            }, 2000);
            return;
          }

          // If session exists but no end_time, user can rejoin (handled in quiz initialization)
          if (existingSession && !existingSession.end_time) {
            console.log('🔄 User has incomplete session - will allow rejoin');
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

          // Check if competition is in a valid state for participation
          if (data.status === 'completed' || data.status === 'cancelled') {
            setError('This competition has ended or been cancelled.');
            setInitializing(false);
            setTimeout(() => {
              router.push('/livecompetition');
            }, 3000);
            return;
          }

          // initialize countdown based on start_time if available
          if (data.start_time) {
            const start = new Date(data.start_time).getTime();
            const now = new Date().getTime();
            const seconds = Math.max(0, Math.floor((start - now) / 1000));

            // Only allow entering quiz if competition has actually started (current time >= start time)
            if (now >= start) {
              // Competition has started - check if it's still running
              if (data.status === 'running') {
                setCompetitionStartTime(start);
                setPhase('quiz');
                setCountdown(0);
              } else if (data.status === 'upcoming') {
                // Competition start time has passed but status is still upcoming - this shouldn't happen
                // but if it does, update status and allow entry
                console.warn('Competition start time passed but status is still upcoming - updating status');
                await supabase
                  .from('competitions')
                  .update({ status: 'running' })
                  .eq('id', competitionId);
                setCompetitionDetails(prev => prev ? { ...prev, status: 'running' } : null);
                setCompetitionStartTime(start);
                setPhase('quiz');
                setCountdown(0);
              } else {
                // Competition has ended or invalid status
                setError('This competition is no longer accepting participants.');
                setInitializing(false);
                setTimeout(() => {
                  router.push('/livecompetition');
                }, 3000);
                return;
              }
            } else {
              // Show actual time remaining until competition starts
              setCountdown(seconds);
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
        // Don't check if competition has ended during waiting phase
        // Only check after competition has started
        
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // Set competition start time when countdown reaches 0
            setCompetitionStartTime(Date.now());
            setPhase('quiz');

            // Update competition status to "running" when it starts
            supabase
              .from('competitions')
              .update({ status: 'running' })
              .eq('id', competitionId)
              .then(({ error }) => {
                if (error) {
                  console.error('Failed to update competition status to running:', error);
                } else {
                  console.log('✅ Competition status updated to running');
                  // Update local competition details
                  setCompetitionDetails(prev => prev ? { ...prev, status: 'running' } : null);
                }
              });

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
      // Declare variables at the top of the function scope
      let isRejoin = false;
      let existingAnswers: any[] = [];
      let rejoinSessionId: string | null = null;
      let registrationId: string | null = null;

      try {
        setLoading(true);

        // Only check if competition has ended if it's already running
        // Don't block quiz initialization if competition just started
        if (competitionDetails?.status === 'completed' || competitionDetails?.status === 'cancelled') {
          setError('This competition has ended. You cannot participate anymore.');
          setLoading(false);
          setTimeout(() => {
            router.push('/livecompetition');
          }, 3000);
          return;
        }

        // Global synchronization will handle late joiners automatically
        // The sync checker will place them on the correct current question
        const now = Date.now();
        const isLate = competitionStartTime && (now > competitionStartTime);

        if (isLate) {
          console.log(`🚨 Late Joiner Detected: Global sync will place you on the current question`);
          setIsLateJoiner(true);
        } else {
          setIsLateJoiner(false);
        }
        setMissedQuestions(0); // Not tracking missed questions - global sync handles this

        // Get the authenticated user
        console.log('🔐 Checking user authentication...');
        const authResponse = await supabase.auth.getUser();
        console.log('👤 Auth response:', {
          hasUser: !!authResponse.data.user,
          userId: authResponse.data.user?.id,
          error: authResponse.error
        });

        if (authResponse.error) {
          console.error('❌ Auth error:', authResponse.error);
          setError('Authentication error. Please log in again.');
          setLoading(false);
          setTimeout(() => {
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
          }, 2000);
          return;
        }

        if (!authResponse.data.user) {
          console.error('❌ No user found in auth response');
          setError('You must be logged in to participate. Redirecting to login...');
          setLoading(false);
          setTimeout(() => {
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
          }, 2000);
          return;
        }

        console.log('✅ User authenticated:', authResponse.data.user.id);

        // Call the local route which merges competition_questions with questions
        console.log('🚀 Fetching questions for competition:', competitionId);
        
        const routeRes = await fetch('/api/competition-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitionId }),
        });

        console.log('📡 API Response Status:', routeRes.status, routeRes.statusText);

        if (!routeRes.ok) {
          console.error('❌ Failed to fetch questions - HTTP', routeRes.status);
          const errorText = await routeRes.text();
          console.error('❌ Error response:', errorText);
          setError(`Failed to load questions (HTTP ${routeRes.status}). Please try again.`);
          setLoading(false);
          return;
        }

        const routeJson = await routeRes.json();
        console.log('📦 Full API Response:', routeJson);
        
        // Check if API returned an error
        if (routeJson.error) {
          console.error('❌ API returned error:', routeJson.error);
          console.error('❌ Error details:', routeJson.details);
          setError(routeJson.error || 'Failed to load questions');
          setLoading(false);
          return;
        }

        const questionsData = routeJson?.questions ?? [];

        console.log('🌐 Received from API:', questionsData.length, 'questions');
        
        if (questionsData.length > 0) {
          console.log('📊 First question sample:', questionsData[0]);
          console.log('📊 Difficulty breakdown:',
            questionsData.reduce((acc: any, q: any) => {
              const d = q.difficulty || 'unknown';
              acc[d] = (acc[d] || 0) + 1;
              return acc;
            }, {})
          );
        }

        if (!questionsData || questionsData.length === 0) {
          console.error('❌ No questions returned from API');
          console.error('❌ This usually means:');
          console.error('   1. No questions in database with status=true');
          console.error('   2. Database connection issue');
          console.error('   3. Questions table is empty');
          setError('No questions are configured for this competition. Please check database.');
          setLoading(false);
          return;
        }

        // Start the competition (update registration statuses)
        try {
          console.log('🚀 Starting competition via API...');
          const startRes = await fetch('/api/start-competition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              competitionId,
              userId: authResponse.data.user.id // Pass userId to ensure specific activation
            }),
          });

          const startData = await startRes.json();
          console.log('Start competition response:', startRes.status, startData);

          if (!startRes.ok) {
            console.warn('⚠️ Failed to start competition via API:', startData);
          } else {
            console.log('✅ Competition started successfully');
          }
        } catch (startErr) {
          console.warn('⚠️ Error calling start-competition API:', startErr);
        }

        // 🔧 FORCE ACTIVATION (Fail-safe)
        try {
          console.log('🔧 Calling force activation...');
          await fetch('/api/activate-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              competitionId,
              userId: authResponse.data.user.id
            }),
          });
        } catch (activateErr) {
          console.error('⚠️ Error calling activation API:', activateErr);
        }

        // Normalize returned rows to client's Question shape
        // NOTE: API already shuffles questions and choices with seeded randomization
        // so all users get the same order. DO NOT shuffle again here!
        const normalizedQuestions: Question[] = questionsData.map((q: any, index: number) => {
          const questionText = String(q.question_text || '');
          console.log(`📋 Q${index + 1}: "${questionText.substring(0, 40)}..." - ID: ${q.competition_question_id}`);

          return {
            id: q.competition_question_id ?? null,
            sourceQuestionId: q.source_question_id ?? q.question_id ?? null,
            // @ts-ignore preserve for later inserts
            competition_question_id: q.competition_question_id ?? null,
            question_text: q.question_text,
            category: q.category,
            difficulty: q.difficulty,
            choices: q.choices, // Already shuffled by API with seed
            correct_answer: q.correct_answer,
            explanation: q.explanation,
          };
        });

        // Questions stay in synchronized order (seeded by competition ID)
        console.log('✅ Final questions ready (synchronized order from API):', normalizedQuestions.length);
        console.log('🎲 Question IDs:', normalizedQuestions.map((q, i) => `Q${i + 1}:${String(q.id).substring(0, 8)}`).join(', '));

        // Questions stay in synchronized order, but choices within each question are shuffled
        console.log('✅ Final questions ready (synchronized order, shuffled choices):', normalizedQuestions.length);
        console.log('🎲 Questions order:', normalizedQuestions.map((q, i) => `${i + 1}. ${q.difficulty}`));

        setQuestions(normalizedQuestions);

        // ========================================
        // STEP 1: Check registration and session FIRST (before question initialization)
        // ========================================
        
        // Check registration
        const { data: reg, error: regErr } = await supabase
          .from('competition_registrations')
          .select('*')
          .eq('competition_id', competitionId)
          .eq('user_id', authResponse.data.user.id)
          .or('status.eq.confirmed,status.eq.registered') // Accept both confirmed and registered statuses
          .maybeSingle();

        if (regErr || !reg) {
          // user is not registered or registration not confirmed
          setError('You are not registered for this competition or your registration is not confirmed.');
          setLoading(false);
          return;
        }
        // Save registration id locally so we can link answers to it
        registrationId = reg.id;

        // Check if user has already played this competition
        const { data: existingSession, error: existingSessionErr } = await supabase
          .from('competition_sessions')
          .select('*')
          .eq('competition_id', competitionId)
          .eq('user_id', authResponse.data.user.id)
          .maybeSingle();

        // Check if competition has ended - if ended, don't allow rejoin
        if (existingSession && existingSession.end_time) {
          // User has completed this competition (has end_time)
          setError('You have already completed this competition. You can only participate once per competition.');
          setLoading(false);
          // Redirect to home or leaderboard after a delay
          setTimeout(() => {
            router.push('/livecompetition');
          }, 3000);
          return;
        }

        // If session exists but no end_time, user left mid-competition - allow rejoin
        if (existingSession && !existingSession.end_time) {
          console.log('🔄 User is rejoining competition - session exists without end_time');
          console.log('📋 Existing session:', existingSession);
          isRejoin = true;
          rejoinSessionId = existingSession.id;
          
          // CRITICAL: Set state immediately when rejoin is detected
          setIsRejoin(true);

          // Fetch existing answers to know which questions were already answered
          const { data: answersData, error: answersError } = await supabase
            .from('competition_answers')
            .select('*')
            .eq('session_id', existingSession.id)
            .eq('competition_id', competitionId);

          console.log('📋 Fetching existing answers for session:', existingSession.id);
          console.log('📋 Answers query result:', { answersData, answersError });

          if (!answersError && answersData) {
            existingAnswers = answersData;
            console.log(`✅ Found ${existingAnswers.length} existing answers for rejoin`);
            console.log('📋 Existing answers details:', existingAnswers.map(a => ({
              question_id: a.competition_question_id,
              selected: a.selected_answer,
              correct: a.is_correct
            })));
          } else if (answersError) {
            console.error('❌ Error fetching existing answers:', answersError);
          } else {
            console.warn('⚠️ No existing answers found for session');
          }
        }

        // NOTE: Session creation moved to handleNextQuestion when user actually starts answering
        // This allows users to enter waiting room without being marked as "played"
        // EXCEPTION: If rejoining, session already exists - use it
        if (isRejoin) {
          setSessionId(rejoinSessionId);
          console.log('✅ Using existing session for rejoin:', rejoinSessionId);
        } else {
          setSessionId(null); // No session yet for new users
        }
        
        // persist registration id for use when saving answers
        // @ts-ignore
        (window as any).__currentCompetitionRegistrationId = registrationId;

        // ========================================
        // STEP 2: NOW calculate correct starting question (isRejoin is set correctly now)
        // ========================================
        
        // IMMEDIATELY calculate correct starting question for late joiners OR rejoining users
        // This prevents showing Q1 before jumping to correct question
        if (competitionStartTime && Date.now() > competitionStartTime) {
          const elapsedMs = Date.now() - competitionStartTime;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          const currentGlobalQuestion = Math.floor(elapsedSeconds / 30); // 30s per question
          const missed = Math.min(currentGlobalQuestion, normalizedQuestions.length - 1);

          if (missed > 0 || isRejoin) {
            if (isRejoin) {
              console.log(`🔄 REJOIN: User returning to competition at question ${missed + 1}`);
              console.log(`📋 Will process questions 1-${missed} to restore/mark as missed`);
              
              // Restore existing session ID
              setSessionId(rejoinSessionId);
              (window as any).__currentCompetitionRegistrationId = registrationId;

              // Build answers array from existing answers
              const restoredAnswers: AnswerRecord[] = [];
              const answeredQuestionIds = new Set(existingAnswers.map(a => a.competition_question_id));

              console.log(`📋 Existing answers from database:`, existingAnswers.length);
              console.log(`📋 Question IDs in existing answers:`, Array.from(answeredQuestionIds));
              console.log(`📋 Full existing answers:`, existingAnswers.map(a => ({
                id: a.competition_question_id,
                answer: a.selected_answer,
                correct: a.is_correct
              })));

              // Process all questions up to current global question
              for (let i = 0; i < missed; i++) {
                const question = normalizedQuestions[i];
                
                // Try multiple matching strategies
                const existingAnswer = existingAnswers.find(
                  a => a.competition_question_id === question.id || 
                       String(a.competition_question_id) === String(question.id)
                );

                console.log(`🔍 Q${i + 1} (ID: ${question.id}): ${existingAnswer ? '✅ Found in DB' : '❌ NOT found in DB'}`);
                if (existingAnswer) {
                  console.log(`   └─ Answer: "${existingAnswer.selected_answer}" (${existingAnswer.is_correct ? 'correct' : 'wrong'})`);
                }
                if (existingAnswer) {
                  // Question was answered before leaving
                  restoredAnswers.push({
                    question_id: question.id,
                    is_correct: existingAnswer.is_correct,
                    difficulty: question.difficulty,
                    selected_answer: existingAnswer.selected_answer,
                    answer_time: existingAnswer.answer_time
                  });
                  console.log(`✅ Q${i + 1}: Already answered (${existingAnswer.is_correct ? 'correct' : 'wrong'})`);
                } else {
                  // Question was missed (not answered before leaving)
                  restoredAnswers.push({
                    question_id: question.id,
                    is_correct: false,
                    difficulty: question.difficulty,
                    selected_answer: null,
                    answer_time: undefined
                  });
                  console.log(`❌ Q${i + 1}: Missed (marked as wrong)`);

                  // Insert missed question as wrong answer in database
                  supabase.from('competition_answers').insert({
                    competition_id: competitionId,
                    session_id: rejoinSessionId,
                    user_id: authResponse.data.user.id,
                    question_id: null,
                    competition_question_id: String(question.id),
                    registration_id: registrationId,
                    selected_answer: null,
                    is_correct: false,
                    submitted_at: new Date().toISOString(),
                  }).then(({ error }) => {
                    if (error) console.error(`Error saving missed Q${i + 1}:`, error);
                  });
                }
              }

              // Restore answers and score
              setAnswers(restoredAnswers);
              const correctCount = restoredAnswers.filter(a => a.is_correct).length;
              setScore(correctCount);
              console.log(`📊 Restored score: ${correctCount}/${restoredAnswers.length}`);

              // Calculate missed questions (questions not answered)
              const missedCount = restoredAnswers.filter(a => a.selected_answer === null).length;
              console.log(`📊 Missed questions count: ${missedCount} out of ${restoredAnswers.length}`);
              console.log(`📊 Answered questions: ${restoredAnswers.filter(a => a.selected_answer !== null).length}`);
              setMissedQuestions(missedCount);
              setIsLateJoiner(false); // NOT a late joiner - this is a rejoin
            } else {
              console.log(`🚨 Late Joiner: Starting at question ${missed + 1}, missed ${missed} questions`);
              setMissedQuestions(missed);
              setIsLateJoiner(true);
            }

            // CRITICAL: Reset timer refs so user gets proper time for current question
            timerStartTime.current = null;
            questionStartTime.current = null;
            setCurrentQuestionIndex(missed);
            // Increment timerKey to trigger timer effect with fresh calculation
            setTimerKey(prev => prev + 1);
          } else {
            setCurrentQuestionIndex(0);
            setMissedQuestions(0);
            setIsLateJoiner(false);
          }
        } else {
          // On time - start at question 0
          setCurrentQuestionIndex(0);
          setMissedQuestions(0);
          setIsLateJoiner(false);
        }
        setLoading(false);
      } catch (err) {
        console.error('❌❌❌ CRITICAL ERROR in initializeQuiz:', err);
        console.error('❌ Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : 'No stack trace',
          error: err
        });
        setError(`Failed to load quiz: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
      }
    };


    initializeQuiz();
  }, [phase, competitionId]);

  // Timer for each question - using timestamp to work even when tab is inactive
  useEffect(() => {
    // MODIFIED: Removed showResult from check so timer keeps running after answer
    if (phase !== 'quiz' || quizCompleted || questions.length === 0) return;

    // Mark the current question as used (displayed to user)
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      const markAsUsed = async () => {
        try {
          // Use competition_question_id for competition questions
          const competitionQuestionId = (currentQuestion as any).competition_question_id;

          if (competitionQuestionId) {
            await supabase.rpc('mark_question_as_used', {
              p_competition_question_id: competitionQuestionId
            });
          }
        } catch (err) {
          console.error('Failed to mark question as used:', err);
        }
      };
      // Only mark as used once per question index change
      // We can rely on timerStartTime.current change for this
      if (timerStartTime.current === null) {
        markAsUsed();
      }
    }

    // Set the start time for this question if not set
    if (!timerStartTime.current) {
      // Calculate how much time has elapsed globally for this question
      if (competitionStartTime) {
        const now = Date.now();
        const globalElapsedMs = now - competitionStartTime;
        const globalElapsedSeconds = Math.floor(globalElapsedMs / 1000);

        // Each question lasts 30 seconds globally
        // Calculate which question we're on and how much time has passed in current question
        const currentGlobalQuestionIndex = Math.floor(globalElapsedSeconds / 30);
        const timeElapsedInCurrentQuestion = globalElapsedSeconds % 30; // 0-29 seconds

        // If user is on the correct global question, calculate when this question started globally
        if (currentGlobalQuestionIndex === currentQuestionIndex) {
          // This question started globally at: competitionStartTime + (currentQuestionIndex * 30 seconds)
          const questionGlobalStartTime = competitionStartTime + (currentQuestionIndex * 30 * 1000);
          timerStartTime.current = questionGlobalStartTime;
          questionStartTime.current = questionGlobalStartTime;

          const remainingTime = 30 - timeElapsedInCurrentQuestion;
          console.log(`⏱️ Timer started for Q${currentQuestionIndex + 1} - Global sync: ${timeElapsedInCurrentQuestion}s elapsed, ${remainingTime}s remaining`);
        } else {
          // Fallback: give full 30 seconds (should not happen with proper sync)
          timerStartTime.current = now;
          questionStartTime.current = now;
          console.log(`⏱️ Timer started for Q${currentQuestionIndex + 1} - Full 30s (not synced)`);
        }
      } else {
        // No competition start time, give full 30 seconds
        timerStartTime.current = Date.now();
        questionStartTime.current = Date.now();
        console.log(`⏱️ Timer started for Q${currentQuestionIndex + 1} - Full 30s (no global time)`);
      }
    }

    // All users get full 30 seconds per question
    const questionDuration = 30000; // 30 seconds

    const timerInterval = setInterval(() => {
      if (!timerStartTime.current) return;

      // Calculate elapsed time based on actual timestamp difference
      const elapsed = Date.now() - timerStartTime.current;
      const remaining = Math.max(0, (questionDuration - elapsed) / 1000);

      setTimer(remaining);

      if (remaining <= 0) {
        clearInterval(timerInterval);

        // Check if competition has ended
        if (hasCompetitionEnded()) {
          console.log('Competition ended - timer expired, completing quiz...');
          // Set loading state IMMEDIATELY
          setResultsLoading(true);
          setPhase('results');
          
          if (sessionId && !quizCompleted) {
            completeQuiz().then(() => {
              setQuizCompleted(true);
            }).catch(err => {
              console.error('Error completing quiz:', err);
            });
          }
          return;
        }

        if (nextCalled.current) return;

        console.log('⏰ Timer expired (30s) - Moving to next question');

        // If user hasn't answered yet, show warning/auto-submit logic
        if (!selectedChoiceRef.current && !showResult) {
          // Logic for unanswered question (handled in handleNextQuestion or here)
          // For now, we just proceed. handleNextQuestion handles the transition.
          // If you want to force "No Answer" submission, do it here.
          // But existing logic seems to handle "no choice" in handleNextQuestion? 
          // Actually, handleNextQuestion just moves index. 
          // We should probably auto-submit if not answered? 
          // The previous code had "Case 2: user selected something -> show result".
          // But now we wait for timer regardless.
        }

        // ALWAYS move to next question when timer hits 0
        console.log(`⏰ Timer expired - Question ${currentQuestionIndex + 1}/${questions.length}`);
        console.log(`   Is last question: ${currentQuestionIndex === questions.length - 1}`);
        handleNextQuestion();
      }
    }, 100);

    return () => clearInterval(timerInterval);
  }, [
    phase,
    quizCompleted,
    questions.length,
    currentQuestionIndex,
    timerKey
    // Removed showResult dependency so it doesn't reset/stop
  ]);

  // REMOVED: Auto-progression effect
  // The previous useEffect that called handleNextQuestion after 2.5s is deleted.


  // Confetti effect on results phase (only when not loading)
  useEffect(() => {
    if (phase === 'results' && !resultsLoading && score >= 1) {
      // Delay confetti slightly to ensure modal is rendered
      const timer = setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#84cc16', '#22c55e', '#15803d'],
        });
      }, 300); // 300ms delay to ensure modal is visible
      
      return () => clearTimeout(timer);
    }
  }, [phase, score, resultsLoading]);

  // Generate leaderboard when entering results or leaderboard phase
  // Fetch leaderboard periodically in leaderboard phase
  useEffect(() => {
    if (phase === 'leaderboard' || phase === 'results' || (phase !== 'quiz' && hasCompetitionEnded())) {
      const fetchLeaderboard = async () => {
        const authData = await supabase.auth.getUser();
        const userId = authData.data.user?.id;

        try {
          console.log('🔍 Fetching leaderboard for competition:', competitionId);

          // PRIORITY 1: Try to fetch from competition_results table (most reliable)
          const { data: results, error: resultsError } = await supabase
            .from('competition_results')
            .select('user_id, score, rank, prize_amount')
            .eq('competition_id', competitionId)
            .order('rank', { ascending: true });

          console.log('📊 Competition results query:', { 
            results, 
            error: resultsError,
            resultCount: results?.length || 0 
          });

          // If competition_results has data, use it (most accurate)
          if (results && results.length > 0) {
            console.log('✅ Using competition_results table (', results.length, 'entries)');

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

            // Map results to leaderboard entries
            const leaderboardData: LeaderboardEntry[] = results.map((result: any) => {
              return {
                id: result.rank,
                name: (profilesMap[result.user_id] && profilesMap[result.user_id].username) || `User ${result.user_id.substring(0, 8)}`,
                score: result.score || 0,
                rank: result.rank,
                prizeAmount: result.prize_amount || 0,
                isUser: result.user_id === userId
              };
            });

            setLeaderboard(leaderboardData);

            // Set user's rank if they participated
            if (userId) {
              const userEntry = leaderboardData.find(entry => entry.isUser);
              if (userEntry) {
                setUserRank(userEntry.rank);
                console.log('👤 User rank set to:', userEntry.rank);
              }
            }

            // Update last updated timestamp
            setLeaderboardLastUpdated(new Date());
            console.log('✅ Leaderboard updated from competition_results with', leaderboardData.length, 'entries');
            return; // Exit early - we have the data
          }

          // FALLBACK: Use competition_sessions if competition_results is empty
          console.log('⚠️ No data in competition_results, falling back to competition_sessions');

          const { data: sessions, error: leaderboardError } = await supabase
            .from('competition_sessions')
            .select('user_id, correct_answers, end_time')
            .eq('competition_id', competitionId)
            .not('end_time', 'is', null);

          console.log('📊 Sessions query result:', { 
            sessions, 
            error: leaderboardError,
            sessionCount: sessions?.length || 0 
          });

          if (leaderboardError) {
            console.error('❌ Sessions fetch error:', leaderboardError);
            throw leaderboardError;
          }

          if (!sessions || sessions.length === 0) {
            console.warn('⚠️ No completed sessions found');
            console.log('💡 Tip: Check if completeQuiz() is being called when quiz ends');
            setLeaderboard([]);
            return;
          }

          console.log('✅ Found', sessions.length, 'completed sessions');

          // Sort sessions by score desc, then end_time asc (faster completion is better for ties)
          const sortedSessions = sessions.sort((a, b) => {
            if (b.correct_answers !== a.correct_answers) return b.correct_answers - a.correct_answers;
            return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
          });

          const userIds = Array.from(new Set(sortedSessions.map((s: any) => s.user_id).filter(Boolean)));

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

          // Map sessions to leaderboard entries
          const leaderboardData: LeaderboardEntry[] = sortedSessions.map((session: any, index: number) => {
            const rank = index + 1;
            const prizeAmount = calculatePrizeAmount(rank);
            return {
              id: index + 1,
              name: (profilesMap[session.user_id] && profilesMap[session.user_id].username) || `User ${session.user_id.substring(0, 8)}`,
              score: session.correct_answers || 0,
              rank: rank,
              prizeAmount: prizeAmount,
              isUser: session.user_id === userId
            };
          });

          setLeaderboard(leaderboardData);

          // Set user's rank if they participated
          if (userId) {
            const userEntry = leaderboardData.find(entry => entry.isUser);
            if (userEntry) {
              setUserRank(userEntry.rank);
              console.log('👤 User rank set to:', userEntry.rank);
            }
          }

          // Update last updated timestamp
          setLeaderboardLastUpdated(new Date());
          console.log('✅ Leaderboard updated from sessions with', leaderboardData.length, 'entries');

        } catch (error) {
          console.error('Failed to fetch leaderboard:', error);
          setLeaderboard([]);
        }
      };

      // Fetch immediately
      fetchLeaderboard();

      // Auto-refresh leaderboard every 10 seconds in leaderboard phase
      let refreshInterval: NodeJS.Timeout | null = null;
      if (phase === 'leaderboard') {
        refreshInterval = setInterval(fetchLeaderboard, 10000); // Refresh every 10 seconds
        console.log('🔄 Started leaderboard auto-refresh (10s intervals)');
      }

      return () => {
        if (refreshInterval) {
          clearInterval(refreshInterval);
          console.log('🛑 Stopped leaderboard auto-refresh');
        }
      };
    }
  }, [phase, competitionId]);

  // Monitor competition end time and auto-redirect to leaderboard when time expires
  useEffect(() => {
    if (!competitionDetails) return;

    const checkAndRedirectToResults = () => {
      const competitionEnded = hasCompetitionEnded();

      if (competitionEnded) {
        console.log('⏰ Competition end time reached - automatically showing leaderboard');

        // Update competition status to "completed" when it ends
        if (competitionDetails.status !== 'completed') {
          supabase
            .from('competitions')
            .update({ status: 'completed' })
            .eq('id', competitionId)
            .then(({ error }) => {
              if (error) {
                console.error('Failed to update competition status to completed:', error);
              } else {
                console.log('✅ Competition status updated to completed');
                // Update local competition details
                setCompetitionDetails(prev => prev ? { ...prev, status: 'completed' } : null);
              }
            });
        }

        // If currently in quiz or waiting phase, move to results first
        // DO NOT auto-redirect from 'results' - user must click button to see leaderboard
        if (phase === 'quiz' || phase === 'waiting') {
          console.log(`📊 Moving from ${phase} to results (competition time expired)`);
          // Set loading state IMMEDIATELY
          setResultsLoading(true);
          setPhase('results');
          
          // Complete quiz if in quiz phase
          if (phase === 'quiz' && sessionId && !quizCompleted) {
            completeQuiz().then(() => {
              setQuizCompleted(true);
            }).catch(err => {
              console.error('Error completing quiz:', err);
            });
          }
        }
      }
    };

    // Check immediately
    checkAndRedirectToResults();

    // Check every 15 seconds
    const checkInterval = setInterval(checkAndRedirectToResults, 15000);

    return () => clearInterval(checkInterval);
  }, [phase, competitionDetails]);

  // Monitor competition end time and auto-redirect to results during quiz
  useEffect(() => {
    if (phase === 'quiz' && competitionDetails) {
      const checkCompetitionEndTime = () => {
        const competitionEnded = hasCompetitionEnded();

        if (competitionEnded) {
          // Competition time has expired - force move to results (not leaderboard)
          console.log('Competition end time reached - moving to results phase');

          // Auto-submit current question as "No Answer" if still answering
          if (!showResult && questions[currentQuestionIndex] && !quizCompleted) {
            console.log('🚨 Auto-submitting unanswered question as "No Answer" due to competition end');

            const currentQuestion = questions[currentQuestionIndex];
            const isCorrect = false; // No answer = incorrect

            // Update score (no points for unanswered)
            setScore(prev => prev);

            // Save answer record as unanswered
            const answerRecord = {
              question_id: currentQuestion.id,
              is_correct: false,
              difficulty: currentQuestion.difficulty,
              selected_answer: null // No answer selected
            };
            setAnswers(prev => [...prev, answerRecord]);

            // Save to database as unanswered
            supabase.auth.getUser().then(({ data }) => {
              if (data.user && sessionId) {
                let competitionQuestionId: string | null = null;

                // Use id as competition_question_id (UUID from competition_questions table)
                if (currentQuestion.id !== null && currentQuestion.id !== undefined) {
                  competitionQuestionId = String(currentQuestion.id);
                }

                const registrationId = (window as any).__currentCompetitionRegistrationId ?? null;

                supabase.from('competition_answers').insert({
                  competition_id: competitionId,
                  session_id: sessionId,
                  user_id: data.user.id,
                  question_id: null, // NULL for competition questions
                  competition_question_id: competitionQuestionId, // UUID from competition_questions
                  registration_id: registrationId,
                  selected_answer: null, // No answer selected
                  is_correct: false, // Marked as incorrect
                  submitted_at: new Date().toISOString(),
                }).then(({ error }) => {
                  if (error) {
                    console.error('❌ Error auto-saving unanswered question:', error);
                    // Show error to user if database save fails
                    setError('Failed to save your answer. Please refresh and try again.');
                  } else {
                    console.log('✅ Auto-saved unanswered question as incorrect');
                  }
                });
              }
            }).catch(err => {
              console.error('❌ Error getting user for auto-submission:', err);
              setError('Failed to save your answer. Please refresh and try again.');
            });
          }

          // Set loading state IMMEDIATELY
          setResultsLoading(true);
          setPhase('results');
          
          // Complete quiz and move to results (not leaderboard)
          if (sessionId && !quizCompleted) {
            completeQuiz().then(() => {
              setQuizCompleted(true);
            }).catch(err => {
              console.error('Error completing quiz:', err);
            });
          }
        } else {
          // Check if competition is nearing end (within 2 minutes)
          const endTimeInfo = getCompetitionEndTime();
          if (endTimeInfo) {
            try {
              // FIX: Use proper date parsing instead of string concatenation
              const endDateTime = new Date(`${endTimeInfo.date} ${endTimeInfo.time}`);
              const timeLeftMs = endDateTime.getTime() - new Date().getTime();
              const timeLeftMinutes = timeLeftMs / (1000 * 60);

              // Show warning when less than 2 minutes remaining
              if (timeLeftMinutes <= 2 && timeLeftMinutes > 0 && !showCompetitionEndingWarning && !hasCompetitionEnded()) {
                console.log('⚠️ Competition ending soon - showing warning');
                setShowCompetitionEndingWarning(true);
              } else if ((timeLeftMinutes > 2 || hasCompetitionEnded()) && showCompetitionEndingWarning) {
                // Hide warning if time left increases or competition has ended
                setShowCompetitionEndingWarning(false);
                setCompetitionEndingCountdown('');
              }

              // Update countdown text when warning is active
              if (showCompetitionEndingWarning && timeLeftMinutes > 0) {
                if (timeLeftMinutes >= 1) {
                  setCompetitionEndingCountdown('2 minutes');
                } else {
                  setCompetitionEndingCountdown('Less than a minute');
                }
              }
            } catch (error) {
              console.error('❌ Error calculating competition end warning:', error);
              // Hide warning if calculation fails
              if (showCompetitionEndingWarning) {
                setShowCompetitionEndingWarning(false);
                setCompetitionEndingCountdown('');
              }
            }
          }
        }
      };

      // Check immediately
      checkCompetitionEndTime();

      // Check every 30 seconds for end warning, every 5 seconds when close to end
      const checkInterval = showCompetitionEndingWarning ? 5000 : 30000;
      const endTimeInterval = setInterval(checkCompetitionEndTime, checkInterval);

      return () => clearInterval(endTimeInterval);
    }
  }, [phase, competitionDetails, currentQuestionIndex, questions, sessionId, showResult, showCompetitionEndingWarning]);

  // Results viewing timer - automatically move to leaderboard after 4 minutes
  // Results viewing timer - REMOVED automatic transition
  // The user must manually click "View Final Leaderboard"
  useEffect(() => {
    // Logic removed to prevent auto-redirect
    setResultsViewingTimeLeft(null);
  }, [phase]);

  // Late Joiner Warning Timer - Show for 30 seconds when user joins late
  useEffect(() => {
    if (isLateJoiner && missedQuestions > 0) {
      setShowLateJoinerWarning(true);
      const timer = setTimeout(() => setShowLateJoinerWarning(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [isLateJoiner, missedQuestions]);

  // Quiz Phase Late Joiner Warning Timer - Show for 20 seconds when entering quiz as late joiner OR rejoin
  useEffect(() => {
    if (phase === 'quiz' && (isLateJoiner || isRejoin)) {
      setShowQuizLateJoinerWarning(true);
      const timer = setTimeout(() => setShowQuizLateJoinerWarning(false), 20000); // Hide after 20 seconds
      return () => clearTimeout(timer);
    }
  }, [phase, isLateJoiner, isRejoin, missedQuestions]);

  // NEW: Global Synchronization System
  // Calculate which question should be globally shown based on competition start time
  const calculateGlobalQuestionIndex = (): number => {
    if (!competitionStartTime || questions.length === 0) return 0;

    const now = Date.now();
    const elapsedMs = now - competitionStartTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    // Each question lasts exactly 30 seconds for ALL users
    const globalQuestionIndex = Math.floor(elapsedSeconds / 30);

    // Clamp to valid range (0 to questions.length - 1)
    const clampedIndex = Math.max(0, Math.min(globalQuestionIndex, questions.length - 1));

    return clampedIndex;
  };

  // Sync checker - ensures all users are on the same question at the same time
  useEffect(() => {
    if (phase !== 'quiz' || !competitionStartTime || questions.length === 0 || quizCompleted) {
      // Clean up interval if not actively in quiz
      if (syncCheckInterval.current) {
        clearInterval(syncCheckInterval.current);
        syncCheckInterval.current = null;
      }
      return;
    }

    // Check synchronization every 2 seconds
    syncCheckInterval.current = setInterval(() => {
      const globalIndex = calculateGlobalQuestionIndex();

      // If user is behind the global question, check if we should force sync
      if (globalIndex > currentQuestionIndex && globalIndex < questions.length) {
        // Only force sync if user's local 30-second timer has actually expired
        // This ensures every user gets exactly 30 seconds per question
        const userTimerExpired = questionStartTime.current && (Date.now() - questionStartTime.current) >= 30000;

        if (!userTimerExpired) {
          // User's timer hasn't expired yet - don't force sync
          console.log(`⏱️ User timer not expired yet (Q${currentQuestionIndex + 1}), waiting...`);
          return;
        }

        console.log(`🔄 Global Sync: User's timer expired, moving from Q${currentQuestionIndex + 1} to Q${globalIndex + 1}`);

        // Check if competition has ended before saving answers during sync
        if (hasCompetitionEnded()) {
          console.log('Competition ended during sync - completing quiz and moving to results');
          // Set loading state IMMEDIATELY
          setResultsLoading(true);
          setPhase('results');
          
          if (sessionId && !quizCompleted) {
            completeQuiz().then(() => {
              setQuizCompleted(true);
            }).catch(err => {
              console.error('Error completing quiz during sync:', err);
            });
          }
          return;
        }

        // CRITICAL: Save current answer BEFORE forcing sync (even if no answer selected)
        if (questions[currentQuestionIndex]) {
          const currentQuestion = questions[currentQuestionIndex];
          
          // Check if this question was already answered (rejoin scenario)
          const alreadyAnswered = answers.find(a => a.question_id === currentQuestion.id);
          
          if (!alreadyAnswered) {
            const userAnswer = selectedChoiceRef.current;
            const isCorrect = userAnswer ? userAnswer === currentQuestion.correct_answer : false; // Ensure boolean

            // Update score if correct
            if (isCorrect) {
              setScore(prev => prev + 1);
            }

            // Save answer record (even if null - marks as unanswered/incorrect)
            const answerRecord = {
              question_id: currentQuestion.id,
              is_correct: isCorrect,
              difficulty: currentQuestion.difficulty,
              selected_answer: userAnswer // Store user's selection (can be null)
            };
            setAnswers(prev => [...prev, answerRecord]);

            // Save to database
            supabase.auth.getUser().then(({ data }) => {
              if (data.user && sessionId) {
                let competitionQuestionId: string | null = null;

                // Use id as competition_question_id (UUID from competition_questions table)
                if (currentQuestion.id !== null && currentQuestion.id !== undefined) {
                  competitionQuestionId = String(currentQuestion.id);
                }

                const registrationId = (window as any).__currentCompetitionRegistrationId ?? null;

                supabase.from('competition_answers').insert({
                  competition_id: competitionId,
                  session_id: sessionId,
                  user_id: data.user.id,
                  question_id: null, // NULL for competition questions
                  competition_question_id: competitionQuestionId, // UUID from competition_questions
                  registration_id: registrationId,
                  selected_answer: userAnswer, // Can be null if no answer
                  is_correct: isCorrect, // Will be false if null
                  submitted_at: new Date().toISOString(),
                }).then(({ error }) => {
                  if (error) console.error('Error saving answer during sync:', error);
                });
              }
            });

            console.log('💾 Answer saved during global sync:', {
              answered: userAnswer !== null,
              is_correct: isCorrect
            });
          } else {
            console.log('⚠️ Question already answered - skipping duplicate save during sync');
          }
        }

        // Now force user to the correct globally synchronized question
        setCurrentQuestionIndex(globalIndex);
        setSelectedChoice(null);
        setShowResult(false);
        setShowAnswerRequiredWarning(false);
        setAnswerSubmittedAt(null); // Reset pin when moving to next question
        setTimerKey(prev => prev + 1);
        nextCalled.current = false;
      }

      // Check if all questions are done
      const now = Date.now();
      const totalElapsedSeconds = Math.floor((now - competitionStartTime) / 1000);
      const totalQuizDuration = questions.length * 30; // 30 seconds per question

      if (totalElapsedSeconds >= totalQuizDuration && !quizCompleted) {
        console.log('⏱️ Global timer expired - completing quiz');
        setQuizCompleted(true);

        // Clean up interval
        if (syncCheckInterval.current) {
          clearInterval(syncCheckInterval.current);
          syncCheckInterval.current = null;
        }

        // Set loading state IMMEDIATELY
        setResultsLoading(true);
        setPhase('results');
        
        // Complete quiz properly (calculate results, save to DB, etc.)
        completeQuiz().then(() => {
          // Loading will be cleared in completeQuiz finally block
        }).catch(err => {
          console.error('Error completing quiz on global timeout:', err);
        });
      }
    }, 2000); // Check every 2 seconds

    return () => {
      if (syncCheckInterval.current) {
        clearInterval(syncCheckInterval.current);
        syncCheckInterval.current = null;
      }
    };
  }, [phase, competitionStartTime, questions.length, currentQuestionIndex, quizCompleted]);

  const handleChoiceSelect = (choice: string) => {
    // store selection for the currently visible question index
    setSelectedChoice(choice);
    setShowAnswerRequiredWarning(false); // Clear warning when answer is selected
  };

  // Keep a ref of the current selection so the timer effect does not restart on select
  const selectedChoiceRef = useRef<string | null>(null);
  useEffect(() => {
    selectedChoiceRef.current = selectedChoice;
  }, [selectedChoice]);

  // Handle submitting answer when user clicks "Submit Answer" button
  const handleSubmitAnswer = async () => {
    console.log('🔘 Submit Answer clicked!', { selectedChoice, showResult });
    
    if (!selectedChoice || showResult) {
      console.log('❌ Submit blocked:', { selectedChoice, showResult });
      return;
    }

    // Track the time when answer was submitted
    setAnswerSubmittedAt(timer);

    console.log('✅ Proceeding with answer submission...');

    // Check if competition has ended
    if (hasCompetitionEnded()) {
      console.log('Competition ended - preventing submission');
      setError('Competition has ended. No more submissions are accepted.');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    // Check if this question was already answered (rejoin scenario)
    const alreadyAnswered = answers.find(a => a.question_id === currentQuestion.id);
    if (alreadyAnswered) {
      console.log('⚠️ Question already answered during previous session - skipping duplicate submission');
      setShowResult(true); // Show the existing result
      return;
    }

    // Create session if it doesn't exist yet - STORE THE ID IN A VARIABLE
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        console.log('Creating competition session - user is submitting answer');
        const authData = await supabase.auth.getUser();
        const userId = authData.data.user?.id;
        if (!userId) throw new Error('User not authenticated');

        const { data: session, error: sessionError } = await supabase
          .from('competition_sessions')
          .insert({
            competition_id: competitionId,
            user_id: userId,
            questions_played: Math.min(20, questions.length),
            correct_answers: 0,
            score_percentage: 0,
            start_time: new Date().toISOString(),
            quiz_type: 'competition',
            difficulty_breakdown: ((): any => {
              const acc: any = { easy: 0, medium: 0, hard: 0 };
              (questions || []).forEach((q: any) => {
                const d = (q.difficulty || '').toString().toLowerCase();
                if (d.includes('easy')) acc.easy += 1;
                else if (d.includes('medium')) acc.medium += 1;
                else if (d.includes('hard')) acc.hard += 1;
              });
              return acc;
            })(),
            late_joiner: isLateJoiner,
            missed_questions: missedQuestions,
            penalty_seconds: 0,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        currentSessionId = session.id; // ✅ STORE IN LOCAL VARIABLE
        setSessionId(session.id); // Also update state for future use
        console.log('✅ Competition session created:', session.id);
      } catch (err) {
        console.error('Failed to create competition session:', err);
        setError('Failed to start competition session. Please try again.');
        return;
      }
    }

    // Calculate response latency
    const answerTime = Date.now();
    let latencyMs = 0;
    if (questionStartTime.current && selectedChoiceRef.current) {
      latencyMs = answerTime - questionStartTime.current;
      responseLatencies.current.push(latencyMs);
      console.log(`Response latency: ${latencyMs}ms`);

      // Flag suspicious activity if response is too fast
      if (latencyMs < 300) {
        console.warn(`⚠️ Suspicious response time detected: ${latencyMs}ms (< 300ms threshold)`);
        setSuspiciousActivity(true);
      }
    }

    // Determine if answer is correct
    const isCorrect = selectedChoice === currentQuestion.correct_answer;

    // Update score if correct
    if (isCorrect) {
      setScore((prev) => {
        console.log(`Score update: ${prev} -> ${prev + 1}`);
        return prev + 1;
      });
    }

    // Save answer record with selected answer
    const answerRecord = {
      question_id: currentQuestion.id,
      is_correct: isCorrect,
      difficulty: currentQuestion.difficulty,
      selected_answer: selectedChoice, // Store user's selection
      answer_time: timer // Store time remaining when answered
    };
    setAnswers((prev) => [...prev, answerRecord]);

    // Show result immediately for better UX
    setShowResult(true);

    // Save to database asynchronously (don't wait for it)
    const competitionQuestionId = String(currentQuestion.id);
    const registrationId = (window as any).__currentCompetitionRegistrationId ?? null;

    // Get userId from existing auth state (cached, no API call)
    const sessionData = await supabase.auth.getSession();
    const userId = sessionData.data.session?.user?.id;

    if (!userId) {
      console.error('No user ID found');
      return;
    }

    const payload: any = {
      competition_id: competitionId,
      session_id: currentSessionId,
      user_id: userId,
      question_id: null,
      competition_question_id: competitionQuestionId,
      registration_id: registrationId,
      selected_answer: selectedChoice,
      is_correct: isCorrect,
      submitted_at: new Date().toISOString(),
    };

    console.log('💾 Saving answer immediately:', {
      session_id: currentSessionId,
      competition_question_id: competitionQuestionId,
      selected_answer: selectedChoice,
      is_correct: isCorrect
    });

    // Save answer to database - CRITICAL operation, must succeed
    try {
      const { data: savedAnswer, error: saveError } = await supabase
        .from('competition_answers')
        .insert(payload)
        .select()
        .single();

      if (saveError) {
        console.error('❌ Error saving answer:', saveError);
        console.error('❌ Payload that failed:', payload);
        console.error('❌ Session ID:', currentSessionId);
        console.error('❌ Competition ID:', competitionId);
        setError('Failed to save your answer. Please try again.');
        setShowResult(false); // Hide result if save failed
        return;
      } else {
        console.log('✅ Answer saved successfully to database');
        console.log('✅ Saved answer details:', {
          id: savedAnswer.id,
          session_id: savedAnswer.session_id,
          competition_question_id: savedAnswer.competition_question_id,
          selected_answer: savedAnswer.selected_answer,
          is_correct: savedAnswer.is_correct
        });
      }
    } catch (err) {
      console.error('❌ Unexpected error saving answer:', err);
      setError('Failed to save your answer. Please try again.');
      setShowResult(false);
      return;
    }

    // Fire and forget - non-critical background operations
    Promise.all([
      // Track question statistics (fire and forget)
      fetch('/api/track-answer-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: null,
          competition_question_id: competitionQuestionId,
          is_correct: isCorrect,
          was_skipped: false,
          response_time_ms: latencyMs > 0 ? latencyMs : null
        })
      }).catch(err => console.error('Failed to track answer stats:', err)),
      
      // Save speed detection data (fire and forget)
      selectedChoice && latencyMs > 0 ? 
        supabase.from('competition_speed_detection').insert({
          competition_id: competitionId,
          user_id: userId,
          latency_ms: latencyMs,
          detected_at: new Date().toISOString()
        }).then(({ error }) => {
          if (error) console.error('Error saving speed detection:', error);
        })
        : Promise.resolve()
    ]).catch(err => {
      console.error('Error in background operations:', err);
      // Don't show error to user - these are non-critical operations
    });
  };

  const handleNextQuestion = async () => {
    // Prevent multiple calls - use a more robust check
    if (nextCalled.current) {
      console.log('handleNextQuestion already called, skipping...');
      return;
    }
    nextCalled.current = true;

    // Check if competition has ended - prevent submissions after end time
    if (hasCompetitionEnded()) {
      console.log('Competition ended - preventing submission and completing quiz...');
      setError('Competition has ended. No more submissions are accepted.');
      // Set loading state IMMEDIATELY
      setResultsLoading(true);
      setPhase('results');
      
      if (sessionId && !quizCompleted) {
        await completeQuiz();
        setQuizCompleted(true);
      }
      nextCalled.current = false; // Reset for future use
      return;
    }

    // Additional check: if quiz is already completed, don't allow further submissions
    if (quizCompleted) {
      console.log('Quiz already completed - preventing further submissions');
      nextCalled.current = false;
      return;
    }

    if (questions.length === 0) {
      nextCalled.current = false; // Reset for future use
      return;
    }

    // Move to next question or complete the quiz
    if (currentQuestionIndex < questions.length - 1) {
      // Reset timer refs BEFORE state updates to ensure next effect run sees them as null
      timerStartTime.current = null;
      questionStartTime.current = null;

      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setShowResult(false);
      setAnswerSubmittedAt(null); // Reset pin for next question
      // Reset timer - all users get full 30 seconds per question
      setTimer(30);
      setTimerKey((prev) => prev + 1);
      // Reset the flag after state updates to allow next question
      setTimeout(() => {
        nextCalled.current = false;
      }, 500);
    } else {
      // Last question - complete the quiz
      console.log('🏁 Last question answered - completing quiz...');
      
      // Set loading state immediately to prevent footer from showing
      setResultsLoading(true);
      setPhase('results'); // Move to results phase immediately with loading state
      
      setTimeout(async () => {
        console.log('🏁 Calling completeQuiz from handleNextQuestion...');
        await completeQuiz();
        setQuizCompleted(true);
        setShowResult(false);
        nextCalled.current = false; // Reset after completion
      }, 100);
    }
  };

  // Analyze response patterns for cheating detection
  const analyzeResponsePatterns = () => {
    const latencies = responseLatencies.current;
    if (latencies.length === 0) return { isSuspicious: false, reasons: [] };

    const reasons: string[] = [];
    let isSuspicious = false;

    // Check 1: Average response time too fast (< 1 second)
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    if (avgLatency < 1000) {
      reasons.push(`Average response time too fast: ${avgLatency.toFixed(0)}ms`);
      isSuspicious = true;
    }

    // Check 2: Multiple extremely fast responses (< 300ms)
    const fastResponses = latencies.filter(l => l < 300).length;
    if (fastResponses >= 3) {
      reasons.push(`${fastResponses} responses under 300ms (bot-like behavior)`);
      isSuspicious = true;
    }

    // Check 3: Identical or nearly identical response times (pattern cheating)
    const uniqueLatencies = new Set(latencies.map(l => Math.floor(l / 100) * 100)); // Group by 100ms
    if (uniqueLatencies.size <= 2 && latencies.length >= 5) {
      reasons.push('Identical response time pattern detected');
      isSuspicious = true;
    }

    // Check 4: Perfect accuracy with fast responses
    const correctAnswers = answers.filter(a => a.is_correct).length;
    const accuracy = correctAnswers / answers.length;
    if (accuracy >= 0.95 && avgLatency < 2000) {
      reasons.push(`Impossible combination: ${(accuracy * 100).toFixed(0)}% accuracy with ${avgLatency.toFixed(0)}ms avg response`);
      isSuspicious = true;
    }

    return { isSuspicious, reasons, avgLatency, fastResponses };
  };

  const completeQuiz = async () => {
    console.log('🏁 completeQuiz called!', { sessionId, answersCount: answers.length });
    
    if (!sessionId) {
      console.error("❌ No session ID found - cannot complete quiz");
      console.error("💡 This means the session was never created. Check if user answered any questions.");
      setResultsLoading(false); // Clear loading if no session
      return;
    }

    console.log('✅ Session ID exists:', sessionId);
    
    // Loading state should already be set by caller, but ensure it's true
    if (!resultsLoading) {
      setResultsLoading(true);
    }

    // Analyze patterns before completing
    const patternAnalysis = analyzeResponsePatterns();
    if (patternAnalysis.isSuspicious) {
      console.warn('🚨 SUSPICIOUS ACTIVITY DETECTED:', patternAnalysis.reasons);
      setSuspiciousActivity(true);
    }


    // Aggregate answers, update session, calculate results
    try {
      const authData = await supabase.auth.getUser();
      const userId = authData.data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Update session summary - fetch from database to ensure accuracy
      const { data: sessionAnswers, error: answersError } = await supabase
        .from('competition_answers')
        .select('is_correct')
        .eq('session_id', sessionId);

      const correctAnswers = sessionAnswers?.filter(a => a.is_correct).length || answers.filter(a => a.is_correct).length;
      console.log('📊 Correct answers count:', correctAnswers, 'from DB:', sessionAnswers?.length, 'from state:', answers.length);
      
      const scorePercentage = (correctAnswers / questions.length) * 100;

      await supabase.from('competition_sessions').update({
        correct_answers: correctAnswers,
        score_percentage: scorePercentage,
        end_time: new Date().toISOString(),
      }).eq('id', sessionId);

      // Calculate rank based on score and time (this should be handled by a database function in production)
      const { data: allScores, error: scoresError } = await supabase
        .from('competition_sessions')
        .select('user_id, correct_answers, end_time')
        .eq('competition_id', competitionId)
        .not('end_time', 'is', null);

      console.log('📊 All scores for ranking:', allScores, 'Error:', scoresError);

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

        console.log('🏆 Sorted scores for ranking:', sortedScores);

        const userRank = sortedScores.findIndex(score => score.user_id === userId) + 1;
        console.log('👤 User rank calculated:', userRank, 'for user:', userId);
        const prizeAmount = calculatePrizeAmount(userRank);
        const prizeConfig = getPrizePoolConfig(players.length);
        const xpAwarded = calculateXPAwarded(userRank, correctAnswers);
        const isTrophyWinner = userRank <= prizeConfig.winnerCount;

        // Upsert into competition_results table (prevents duplicate errors)
        console.log('💾 Upserting competition result:', {
          competition_id: competitionId,
          user_id: userId,
          rank: userRank,
          score: correctAnswers,
          xp_awarded: xpAwarded,
          trophy_awarded: isTrophyWinner,
          prize_amount: prizeAmount
        });

        const { data: upsertResult, error: upsertError } = await supabase
          .from('competition_results')
          .upsert({
            competition_id: competitionId,
            user_id: userId,
            score: correctAnswers,
            rank: userRank,
            xp_awarded: xpAwarded,
            trophy_awarded: isTrophyWinner,
            prize_amount: prizeAmount
          }, {
            onConflict: 'competition_id,user_id' // Prevent duplicates
          });

        if (upsertError) {
          console.error('❌ Failed to upsert competition result:', upsertError);
        } else {
          console.log('✅ Successfully upserted competition result:', upsertResult);
        }

        // Insert transaction record if prize won
        if (prizeAmount > 0) {
          try {
            const rankSuffix = userRank === 1 ? '1st' : userRank === 2 ? '2nd' : userRank === 3 ? '3rd' : `${userRank}th`;
            const competitionName = competitionDetails?.name || 'League Competition';

            const { error: txError } = await supabase.from('transactions').insert({
              user_id: userId,
              type: 'reward',
              amount: prizeAmount,
              status: 'completed',
              metadata: {
                rank: userRank,
                score: correctAnswers,
                prize_amount: prizeAmount,
                competition_id: competitionId,
                total_questions: questions.length,
                competition_name: competitionName
              },
              description: `Competition Reward (${competitionName}) - Rank: ${rankSuffix} - Score: ${correctAnswers}/${questions.length}`,
              session_id: sessionId,
              source: 'league_competition'
            });

            if (txError) {
              console.error('❌ Failed to insert transaction record:', txError);
            } else {
              console.log('✅ Transaction record created for prize reward');

              // CRITICAL: Update user_credits to add winnings
              try {
                const { data: currentCredits, error: fetchError } = await supabase
                  .from('user_credits')
                  .select('winnings_credits')
                  .eq('user_id', userId)
                  .maybeSingle();

                if (fetchError) {
                  console.error('❌ Error fetching current credits:', fetchError);
                } else if (currentCredits) {
                  const newWinningsCredits = (parseFloat(currentCredits.winnings_credits) || 0) + prizeAmount;

                  const { error: updateError } = await supabase
                    .from('user_credits')
                    .update({
                      winnings_credits: newWinningsCredits,
                      updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId);

                  if (updateError) {
                    console.error('❌ Error updating winnings_credits:', updateError);
                  } else {
                    console.log(`✅ Winnings credits updated: +${prizeAmount} credits (new total: ${newWinningsCredits})`);
                  }
                } else {
                  console.error('❌ No user_credits record found for user');
                }
              } catch (creditsErr) {
                console.error('Unexpected error updating user credits:', creditsErr);
              }
            }
          } catch (txErr) {
            console.error('Unexpected error creating transaction:', txErr);
          }
        }

        // Log suspicious activity if detected
        if (patternAnalysis.isSuspicious) {
          try {
            const avgLatency = patternAnalysis.avgLatency || 0;
            const reasonDetails = `Speed anomaly detected: ${patternAnalysis.reasons.join(', ')}. Avg latency: ${avgLatency.toFixed(2)}ms, Fast responses: ${patternAnalysis.fastResponses}/${responseLatencies.current.length}`;

            await logCheatAction(
              competitionId,
              userId,
              'flag',
              reasonDetails
            );

            console.log('✅ Suspicious speed activity logged to competition_cheat_actions');
          } catch (err) {
            console.warn('Could not log cheat action:', err);
          }
        }

        // Save competition results to user profile for permanent access
        try {
          const { error: historyError } = await supabase
            .from('competition_history')
            .insert({
              user_id: userId,
              competition_id: competitionId,
              competition_name: competitionDetails?.name || 'League Competition',
              final_rank: userRank,
              final_score: correctAnswers,
              total_questions: questions.length,
              xp_earned: xpAwarded,
              credits_earned: prizeAmount,
              // completed_at removed - not in schema
              metadata: {
                questions_answered: answers.length,
                total_questions: questions.length,
                accuracy_percentage: (correctAnswers / questions.length) * 100,
                late_joiner: isLateJoiner,
                missed_questions: missedQuestions,
                prize_won: prizeAmount > 0,
                trophy_earned: userRank <= prizeConfig.winnerCount,
                completed_at: new Date().toISOString() // Store in metadata instead
              }
            });

          if (historyError) {
            console.error('Error saving competition history:', historyError);
          } else {
            console.log('✅ Competition history saved for permanent access');
          }
        } catch (historyErr) {
          console.error('Unexpected error saving competition history:', historyErr);
        }

        // Update user profile - increment games, wins (if winner), and XP
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
            const isWinner = userRank <= prizeConfig.winnerCount;

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

        // Award trophies for winners
        if (userRank <= prizeConfig.winnerCount) {
          const trophyTitles: { [key: number]: string } = {
            1: 'Champion',
            2: 'Runner-up',
            3: 'Third Place',
            4: 'Fourth Place',
            5: 'Fifth Place',
            6: 'Sixth Place',
            7: 'Seventh Place',
            8: 'Eighth Place',
            9: 'Ninth Place',
            10: 'Tenth Place'
          };
          const trophyTitle = trophyTitles[userRank] || `Place ${userRank}`;

          try {
            // Try to insert into competition_trophies table
            // If table doesn't exist or has schema issues, log and continue
            const { error: trophyErr } = await supabase
              .from('competition_trophies')
              .upsert([
                {
                  competition_id: competitionId,
                  user_id: userId,
                  trophy_title: trophyTitle,
                  rank: userRank, // Use 'rank' field instead of 'trophy_type'
                  earned_at: new Date().toISOString(),
                }
              ], { onConflict: 'competition_id,user_id' });

            if (trophyErr) {
              console.error('Failed to insert/upsert competition_trophy:', trophyErr);
              console.log('💡 Tip: Check if competition_trophies table exists and has correct schema');
            } else {
              console.log('✅ Competition trophy awarded');
            }
          } catch (tErr) {
            console.error('Unexpected error inserting competition_trophy:', tErr);
            console.log('💡 Continuing without trophy - this is not critical');
          }
        }
      }
    } catch (err) {
      console.error('Failed to finish competition:', err);
    } finally {
      // Clear loading state
      setResultsLoading(false);
    }
  };

  // Calculate XP awarded based on rank and competition difficulty
  const calculateXPAwarded = (rank: number, correctCount: number): number => {
    const competitionName = competitionDetails?.name || '';
    const playerCount = players.length;
    const prizeConfig = getPrizePoolConfig(playerCount);

    // Winners get XP based on placement
    if (rank <= prizeConfig.winnerCount) {
      // Winners get 5 XP per correct answer (existing logic)
      return correctCount * 5;
    }

    // Non-winners get fixed XP based on difficulty
    if (competitionName.includes('Starter')) {
      return 10; // Starter: +10 XP
    } else if (competitionName.includes('Pro')) {
      return 20; // Pro: +20 XP
    } else if (competitionName.includes('Elite')) {
      return 30; // Elite: +30 XP
    }

    return 10; // Default fallback
  };

  // Calculate total revenue from all players
  const calculateTotalRevenue = (): number => {
    return players.length * getCreditCost();
  };

  // Get prize pool percentage and winner count based on player count
  const getPrizePoolConfig = (playerCount: number): { percentage: number; winnerCount: number; distribution: number[] } => {
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

  const calculatePrizeAmount = (rank: number): number => {
    const playerCount = players.length;
    const config = getPrizePoolConfig(playerCount);

    // Return 0 if rank exceeds winner count
    if (rank > config.winnerCount) return 0;

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

    // Calculate based on total revenue and distribution
    // Distribution percentages are applied to the POOL (not total revenue)
    const totalRevenue = calculateTotalRevenue();
    const prizePool = Math.floor(totalRevenue * config.percentage);
    const rankIndex = rank - 1; // Convert to 0-based index

    if (rankIndex < config.distribution.length) {
      // Apply distribution percentage to the pool
      return Math.ceil(prizePool * config.distribution[rankIndex]);
    }

    return 0;
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
    if (!competitionDetails) {
      console.log('❌ No competition details available');
      return false;
    }

    // First check status - if it's completed or cancelled, it has ended
    if (competitionDetails.status === 'completed' || competitionDetails.status === 'cancelled') {
      console.log('✅ Competition status indicates it has ended:', competitionDetails.status);
      return true;
    }

    // If status is upcoming or waiting, it hasn't ended
    if (competitionDetails.status === 'upcoming' || competitionDetails.status === 'waiting') {
      console.log('⏳ Competition status indicates it hasn\'t started yet:', competitionDetails.status);
      return false;
    }

    console.log('⏰ Checking competition end time:', competitionDetails);

    // Check if end_time exists and has passed
    if (competitionDetails.end_time) {
      const endTime = new Date(competitionDetails.end_time).getTime();
      const now = new Date().getTime();
      const hasEnded = now >= endTime;
      console.log('📅 End time check:', { endTime: new Date(endTime), now: new Date(now), hasEnded });
      return hasEnded;
    }

    // Fallback: Calculate end time from start_time + duration
    if (competitionDetails.start_time && competitionDetails.duration_minutes) {
      const startTime = new Date(competitionDetails.start_time).getTime();
      const durationMs = competitionDetails.duration_minutes * 60 * 1000;
      const calculatedEndTime = startTime + durationMs;
      const now = new Date().getTime();
      const hasEnded = now >= calculatedEndTime;
      console.log('⏳ Duration-based end time check:', {
        startTime: new Date(startTime),
        durationMinutes: competitionDetails.duration_minutes,
        calculatedEndTime: new Date(calculatedEndTime),
        now: new Date(now),
        hasEnded
      });
      return hasEnded;
    }

    console.log('❓ No end time info available, assuming not ended');
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
    <div className="min-h-fit mt-14 bg-gray-50 text-gray-800 p-2 sm:p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden mt-4 sm:mt-0">
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

            {/* Exit Button */}
            <div className="flex justify-end mb-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExitModal(true)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-all shadow-sm flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Exit Waiting Room
              </motion.button>
            </div>

            {/* Countdown Timer - Full Format */}
            <div className="mb-8">
              <h3 className="text-center text-gray-600 font-semibold mb-4">Competition Starts In</h3>
              <div className="flex justify-center space-x-3">
                {/* Days */}
                {Math.floor(countdown / 86400) > 0 && (
                  <div className="flex flex-col items-center">
                    <div className="bg-gradient-to-br from-lime-100 to-lime-200 text-lime-700 font-bold rounded-xl py-3 px-4 min-w-[4rem] shadow-md border-2 border-lime-300">
                      <span className="text-3xl">{Math.floor(countdown / 86400)}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-2 font-medium">Days</span>
                  </div>
                )}
                
                {/* Hours */}
                {countdown >= 3600 && (
                  <div className="flex flex-col items-center">
                    <div className="bg-gradient-to-br from-lime-100 to-lime-200 text-lime-700 font-bold rounded-xl py-3 px-4 min-w-[4rem] shadow-md border-2 border-lime-300">
                      <span className="text-3xl">{Math.floor((countdown % 86400) / 3600)}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-2 font-medium">Hours</span>
                  </div>
                )}
                
                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-br from-lime-100 to-lime-200 text-lime-700 font-bold rounded-xl py-3 px-4 min-w-[4rem] shadow-md border-2 border-lime-300">
                    <span className="text-3xl">{Math.floor((countdown % 3600) / 60)}</span>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 font-medium">Mins</span>
                </div>
                
                {/* Seconds */}
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-br from-lime-100 to-lime-200 text-lime-700 font-bold rounded-xl py-3 px-4 min-w-[4rem] shadow-md border-2 border-lime-300">
                    <span className="text-3xl">{countdown % 60}</span>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 font-medium">Secs</span>
                </div>
              </div>
            </div>

            {/* Late Joiner Warning - Show when less than 30 seconds remaining */}
            {showLateJoinerWarning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 mb-6 shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ Late Joiner Warning</h3>
                    <div className="space-y-2 text-sm text-red-700">

                      <p>• If you join after the timer reaches zero, you'll miss the first questions</p>
                      <p>• Late joiners receive penalties and may not be eligible for prizes</p>
                      <p>• Make sure you're ready to start when the countdown ends!</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

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
                    {Math.floor(players.length * getCreditCost() * getPrizePoolConfig(players.length).percentage)} Credits
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
                      {(() => {
                        const totalPool = Math.floor(players.length * getCreditCost() * getPrizePoolConfig(players.length).percentage);
                        const distribution = getPrizePoolConfig(players.length).distribution;
                        return Math.ceil(totalPool * distribution[0]);
                      })()} Credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      🥈 <span className="font-medium">2nd Place</span>
                    </span>
                    <span className="text-sm font-bold text-gray-600">
                      {(() => {
                        const totalPool = Math.floor(players.length * getCreditCost() * getPrizePoolConfig(players.length).percentage);
                        const distribution = getPrizePoolConfig(players.length).distribution;
                        return Math.ceil(totalPool * distribution[1]);
                      })()} Credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      🥉 <span className="font-medium">3rd Place</span>
                    </span>
                    <span className="text-sm font-bold text-amber-600">
                      {(() => {
                        const totalPool = Math.floor(players.length * getCreditCost() * getPrizePoolConfig(players.length).percentage);
                        const distribution = getPrizePoolConfig(players.length).distribution;
                        return Math.ceil(totalPool * distribution[2]);
                      })()} Credits
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
          <>
            <div className="bg-gradient-to-r from-lime-400 to-lime-500 p-3 sm:p-6">
              <div className="flex flex-row justify-between items-center space-x-3">
                <h1 className="text-sm sm:text-2xl font-bold text-white">
                  {competitionDetails?.name || 'League Competition'}
                </h1>
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="w-16 sm:w-32 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime-700 transition-all duration-500"
                      style={{
                        width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Timer Bar */}
              <div className="mt-3 sm:mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    <span className="text-white font-medium text-xs sm:text-sm">
                      Time: {Math.ceil(timer)}s
                    </span>
                  </div>
                  
                </div>
                <div className="w-full h-3 bg-white bg-opacity-30 rounded-full overflow-visible relative">
                  <div
                    className={`h-full transition-all duration-100 ${timer > 20
                      ? 'bg-green-400'
                      : timer > 10
                        ? 'bg-yellow-400'
                        : 'bg-red-400 animate-pulse'
                      }`}
                    style={{
                      width: `${(timer / 30) * 100}%`
                    }}
                  />
                  
                  {/* Answer Pin Marker - Google Maps Style */}
                  {/* COMMENTED OUT: Red badge showing submission time
                  {answerSubmittedAt !== null && (
                    <div
                      className="absolute -top-10 flex flex-col items-center transition-all duration-300 z-10"
                      style={{
                        left: `${(answerSubmittedAt / 30) * 100}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      {/* Pin Head - Teardrop Shape with Hollow Center */}
                      {/* <div className="relative">
                        {/* Outer pin shape */}
                        {/* <div className="relative w-8 h-8">
                          {/* Red circle with hollow center */}
                          {/* <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                            {/* Hollow center - white circle */}
                            {/* <div className="absolute inset-[6px] rounded-full bg-white"></div>
                          </div>
                          
                          {/* Time label in center */}
                          {/* <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-red-600 z-10">
                              {Math.ceil(answerSubmittedAt)}s
                            </span>
                          </div>
                        </div>
                        
                        {/* Pin point - triangle */}
                        {/* <div className="absolute left-1/2 -translate-x-1/2 top-[26px]">
                          <div 
                            className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-600"
                            style={{
                              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))'
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Pin shadow */}
                      {/* <div className="w-3 h-1 bg-black opacity-20 rounded-full blur-sm mt-1"></div>
                    </div>
                  )}
                  */}
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-6">
              {/* Competition Ending Warning */}
              {showCompetitionEndingWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 mb-6 shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-red-600 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-800 mb-2">Competition Ending Soon!</h3>
                      <div className="space-y-2 text-sm text-red-700">
                        <p className="flex items-center gap-2">
                          <strong>The competition will end in {competitionEndingCountdown}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Late Joiner Penalty Warning */}
              {showQuizLateJoinerWarning && missedQuestions > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gradient-to-r ${isRejoin ? 'from-blue-50 to-indigo-50 border-blue-200' : 'from-amber-50 to-orange-50 border-amber-200'} border-2 rounded-xl p-4 mb-6 shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {isRejoin ? (
                        <RotateCcw className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Users className="h-6 w-6 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold ${isRejoin ? 'text-blue-800' : 'text-amber-800'} mb-2`}>
                        {isRejoin ? 'Rejoined Competition' : 'Late Joiner Notice'}
                      </h3>
                      <div className={`space-y-2 text-sm ${isRejoin ? 'text-blue-700' : 'text-amber-700'}`}>
                        {isRejoin ? (
                          <>
                            <p className="flex items-center gap-2">
                              <strong>Welcome back! Continuing from current question.</strong>
                            </p>
                            {missedQuestions > 0 && (
                              <p>• {missedQuestions} unanswered question{missedQuestions !== 1 ? 's' : ''} marked wrong</p>
                            )}
                            {missedQuestions === 0 && (
                              <p>• All your answers restored successfully</p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="flex items-center gap-2">
                              <strong>You missed {missedQuestions} question{missedQuestions !== 1 ? 's' : ''} - counted as incorrect</strong>
                            </p>
                            <p>• May affect prize eligibility</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Rejoin Success Message - Show when user rejoined but didn't miss any questions */}
              {showQuizLateJoinerWarning && isRejoin && missedQuestions === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6 shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <RotateCcw className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-green-800 mb-2">✅ Rejoined Successfully</h3>
                      <div className="space-y-2 text-sm text-green-700">
                        <p className="flex items-center gap-2">
                          <strong>All answers restored. Continue playing!</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Question Metadata */}
                  <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <div className="flex items-center space-x-3">
                      <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                        {questions[currentQuestionIndex]?.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${questions[currentQuestionIndex]?.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        questions[currentQuestionIndex]?.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {questions[currentQuestionIndex]?.difficulty}
                      </span>
                    </div>
                    <span className="text-gray-500">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h2 className="text-xl font-semibold mb-6 text-gray-800">
                    {questions[currentQuestionIndex]?.question_text}
                  </h2>

                  {/* Answer Choices */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {questions[currentQuestionIndex]?.choices.map((choice, index) => (
                      <motion.button
                        key={index}
                        whileHover={!showResult ? { scale: 1.02 } : {}}
                        whileTap={!showResult ? { scale: 0.98 } : {}}
                        onClick={() => handleChoiceSelect(choice)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedChoice === choice
                            ? 'border-lime-400 bg-lime-50'
                            : 'border-gray-200 hover:border-lime-300 bg-white'
                          }`}
                        disabled={showResult || quizCompleted}
                      >
                        <div className="flex items-center">
                          <span className="font-medium">{choice}</span>
                          {showResult && selectedChoice === choice && (
                            <span className="ml-2 text-lime-600">Submitted</span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* NEW: Answer Required Warning */}
                  {showAnswerRequiredWarning && !selectedChoice && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mb-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Shield className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-red-800 mb-1">Answer Required!</h4>
                          <p className="text-sm text-red-700">
                            You must select an answer before proceeding. Question skipping is not allowed in this competition.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-4">
                    <motion.button
                      whileHover={!showResult && selectedChoice ? { scale: 1.02 } : {}}
                      whileTap={!showResult && selectedChoice ? { scale: 0.98 } : {}}
                      onClick={handleSubmitAnswer}
                      disabled={!selectedChoice || showResult}
                      className={`w-full py-3 font-bold rounded-xl shadow-md transition-all ${!selectedChoice || showResult
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white'
                        }`}
                    >
                      {showResult ? 'Answer Submitted' : 'Submit Answer'}
                    </motion.button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}

        {phase === 'results' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-8 sm:py-12 px-4 sm:px-8"
          >
            {/* Loading State */}
            {resultsLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-lime-600"></div>
                <p className="text-xl font-semibold text-gray-700">Calculating your results...</p>
                <p className="text-sm text-gray-500">Please wait while we process your score</p>
              </div>
            ) : (
              <>
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



              {/* Competition Status & Tie-Breaker Info */}
              <div className="space-y-4 mb-6">


                {/* Tie-Breaker Logic */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 max-w-lg mx-auto shadow-md">
                  <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center justify-center gap-2">
                    <Award className="h-5 w-5" />
                    Ranking System
                  </h3>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-blue-800">1.</span>
                      <span><strong>Primary:</strong> Total correct answers (higher is better)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-blue-800">2.</span>
                      <span><strong>Tie-breaker:</strong> Completion time (faster completion wins)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-blue-800">3.</span>
                      <span><strong>Secondary:</strong> Response consistency (steady timing)</span>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Clear the results viewing timer when manually navigating
                  if (resultsViewingTimer) {
                    clearInterval(resultsViewingTimer);
                    setResultsViewingTimer(null);
                  }
                  setResultsViewingTimeLeft(null);
                  setPhase('leaderboard');
                }}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg sm:rounded-xl shadow-lg transition-all text-sm sm:text-base"
              >
                View Final Leaderboard
              </motion.button>
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg sm:rounded-xl shadow-lg transition-all text-sm sm:text-base"
                >
                  <svg className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go Home
                </motion.button>
              </Link>
              <Link href="/livecompetition">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white font-bold rounded-lg sm:rounded-xl shadow-lg transition-all text-sm sm:text-base"
                >
                  Join Another Competition
                </motion.button>
              </Link>
            </div>
              </>
            )}
          </motion.div>
        )}

        {phase === 'detailed-results' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 sm:p-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Detailed Results
            </h1>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-700">{score}</div>
                <div className="text-sm text-green-600 font-medium">Correct</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-700">{questions.length - score}</div>
                <div className="text-sm text-red-600 font-medium">Wrong</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-700">{questions.length}</div>
                <div className="text-sm text-blue-600 font-medium">Total</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-700">{Math.round((score / questions.length) * 100)}%</div>
                <div className="text-sm text-purple-600 font-medium">Accuracy</div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4 max-w-4xl mx-auto mb-6">
              {questions.map((question, index) => {
                // Find the user's answer for this specific question by matching question_id
                // This ensures we show the correct answer for each question regardless of order
                let userAnswer = answers.find(a => 
                  a.question_id === question.id || 
                  String(a.question_id) === String(question.id)
                );
                
                // If no answer found by ID, this question was not answered (missed or skipped)
                // Create a placeholder answer object
                if (!userAnswer) {
                  userAnswer = {
                    question_id: question.id,
                    is_correct: false,
                    difficulty: question.difficulty,
                    selected_answer: null,
                    answer_time: undefined
                  };
                }
                
                const isCorrect = userAnswer?.is_correct || false;
                
                return (
                  <div key={index} className={`border-2 rounded-xl p-4 sm:p-6 ${isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-700">Q{index + 1}.</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {question.difficulty}
                        </span>
                        {/* Answer Time Badge */}
                        {userAnswer?.answer_time !== undefined && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Answered at {Math.ceil(userAnswer.answer_time)}s
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {isCorrect ? (
                          <>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Correct
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Wrong
                          </>
                        )}
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-gray-800 font-medium mb-4">{question.question_text}</p>

                    {/* Answer Choices */}
                    <div className="space-y-2">
                      {question.choices.map((choice, choiceIndex) => {
                        // Use the userAnswer already found above for this question
                        const isUserAnswer = userAnswer && choice === userAnswer.selected_answer;
                        const isCorrectAnswer = choice === question.correct_answer;
                        
                        return (
                          <div
                            key={choiceIndex}
                            className={`p-3 rounded-lg border-2 ${
                              isCorrectAnswer
                                ? 'border-green-500 bg-green-100'
                                : isUserAnswer
                                ? 'border-red-500 bg-red-100'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`${isCorrectAnswer || isUserAnswer ? 'font-semibold' : ''}`}>
                                {choice}
                              </span>
                              {isCorrectAnswer && (
                                <span className="text-green-700 font-bold flex items-center gap-1">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Correct Answer
                                </span>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <span className="text-red-700 font-bold flex items-center gap-1">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Your Answer
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPhase('results')}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold rounded-lg sm:rounded-xl shadow-lg transition-all text-sm sm:text-base"
              >
                ← Back to Summary
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPhase('leaderboard')}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg sm:rounded-xl shadow-lg transition-all text-sm sm:text-base"
              >
                View Leaderboard
              </motion.button>
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg sm:rounded-xl shadow-lg transition-all text-sm sm:text-base"
                >
                  Go Home
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
              {competitionDetails?.name} - Final Leaderboard
            </h1>




            {/* Prize Pool Summary */}
            {competitionDetails && leaderboard.length > 0 && (
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
                      {leaderboard[0]?.prizeAmount || 0} Credits
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
                    <div className="text-3xl mb-2">🥈</div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">2nd Place</p>
                    <p className="text-xl font-bold text-gray-600">
                      {leaderboard[1]?.prizeAmount || 0} Credits
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-amber-200">
                    <div className="text-3xl mb-2">🥉</div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">3rd Place</p>
                    <p className="text-xl font-bold text-amber-600">
                      {leaderboard[2]?.prizeAmount || 0} Credits
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
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
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
                      // Use the prize_amount directly from the database
                      const prize = entry.prizeAmount || 0;

                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`hover:bg-gray-50 ${entry.isUser ? 'bg-lime-50 font-semibold' : ''} ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPhase('detailed-results')}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg sm:rounded-xl shadow-md transition-all text-sm sm:text-base flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                View Detailed Results
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Competition End Time Modal */}
      <AnimatePresence>
        {showCompetitionEndModal && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col"
              style={{ maxHeight: '90vh' }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white flex-shrink-0">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-center">Competition In Progress</h2>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-4 overflow-y-auto flex-grow">
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
              <div className="p-6 bg-gray-50 border-t flex-shrink-0">
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

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                <div className="flex items-center justify-center mb-2">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-center">Exit Waiting Room?</h2>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-700 text-lg mb-4">
                    Are you sure you want to leave the waiting room?
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>⚠️ Important:</strong> If you exit now, you can still rejoin before the competition starts, but you may miss questions if you're late.
                    </p>
                  </div>
                  <p className="text-gray-600 text-sm">
                    You won't be charged any credits for leaving the waiting room.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowExitModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all shadow-md"
                  >
                    Stay in Room
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowExitModal(false);
                      router.push('/livecompetition');
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all shadow-lg"
                  >
                    Exit Competition
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}