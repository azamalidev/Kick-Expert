import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This route returns competition-specific questions by merging rows from
// `competition_questions` with canonical `questions` when a numeric
// source_question_id (or question_id) is present. The returned shape is
// safe for the client to use when recording answers: it includes both
// `competition_question_id` (uuid) and `question_id` (integer|null).

export async function POST(req: NextRequest) {
  try {
    const { competitionId } = await req.json();
    if (!competitionId) return NextResponse.json({ questions: [] });

    // Fetch competition row to decide which questions to pull
    const { data: compRow, error: compFetchErr } = await supabase
      .from('competitions')
      .select('name')
      .eq('id', competitionId)
      .maybeSingle();

    if (compFetchErr) {
      console.error('Error fetching competition row:', compFetchErr);
      return NextResponse.json({ questions: [] });
    }

    // Fetch from competition_questions table (NOT questions table!)
    // This table has 2400+ questions specifically for competitions
    const { data: qsData, error: qsErr } = await supabase
      .from('competition_questions')
      .select('*')
      .eq('status', true); // Only fetch active questions

    if (qsErr) {
      console.error('❌ Error fetching competition_questions table:', qsErr);
      return NextResponse.json({ 
        questions: [], 
        error: 'Failed to fetch questions from database',
        details: qsErr.message 
      });
    }

    let allQuestions = (qsData || []) as any[];
    console.log(`🔍 competition_questions: found ${allQuestions.length} total rows`);

    // If no questions found, return error with details
    if (allQuestions.length === 0) {
      console.error('❌ No active questions found in competition_questions table!');
      return NextResponse.json({ 
        questions: [], 
        error: 'No active questions available in competition_questions table',
        details: 'Please ensure questions are added and marked as active (status=true)' 
      });
    }

    // Log difficulty distribution from database
    const difficultyCount = allQuestions.reduce((acc: any, q: any) => {
      const diff = q.difficulty || 'unknown';
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Backend total difficulty distribution:', difficultyCount);

    // Determine question count based on competition type
    let targetQuestionCount = 20; // default
    if (compRow?.name) {
      switch (compRow.name) {
        case 'Starter League':
          targetQuestionCount = 15;
          break;
        case 'Pro League':
          targetQuestionCount = 20;
          break;
        case 'Elite League':
          targetQuestionCount = 30;
          break;
        default:
          targetQuestionCount = 20;
      }
    }

    console.log(`🎯 Target question count for ${compRow?.name}: ${targetQuestionCount}`);

    // Calculate distribution based on target count
    // Maintain 40% Easy, 40% Medium, 20% Hard ratio
    const easyCount = Math.round(targetQuestionCount * 0.4);
    const mediumCount = Math.round(targetQuestionCount * 0.4);
    const hardCount = targetQuestionCount - easyCount - mediumCount; // Ensures total is exact

    console.log(`📊 Distribution for ${targetQuestionCount} questions: Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount}`);

    // Seeded shuffle function - same seed produces same order for all users
    const seededShuffle = <T,>(arr: T[], seed: string): T[] => {
      const a = [...arr];

      // Better hash function for seed
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }

      // LCG (Linear Congruential Generator) for better randomization
      const seededRandom = (seed: number): number => {
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);
        seed = (a * seed + c) % m;
        return seed / m;
      };

      let currentSeed = Math.abs(hash);

      // Fisher-Yates shuffle with seeded random
      for (let i = a.length - 1; i > 0; i--) {
        currentSeed = seededRandom(currentSeed) * Math.pow(2, 32);
        const j = Math.floor((currentSeed / Math.pow(2, 32)) * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }

      return a;
    };

    // Use competition ID as seed - all users in same competition get same order
    const seed = competitionId;

    const easyQuestions = seededShuffle(allQuestions.filter(q => q.difficulty === 'Easy'), seed + '-easy');
    const mediumQuestions = seededShuffle(allQuestions.filter(q => q.difficulty === 'Medium'), seed + '-medium');
    const hardQuestions = seededShuffle(allQuestions.filter(q => q.difficulty === 'Hard'), seed + '-hard');

    console.log('📊 Available by difficulty:', {
      Easy: easyQuestions.length,
      Medium: mediumQuestions.length,
      Hard: hardQuestions.length
    });

    // Select the required number from each difficulty
    let finalQs = [
      ...easyQuestions.slice(0, easyCount),
      ...mediumQuestions.slice(0, mediumCount),
      ...hardQuestions.slice(0, hardCount),
    ];

    console.log('📦 Before shuffle - distribution:', {
      total: finalQs.length,
      Easy: finalQs.filter(q => q.difficulty === 'Easy').length,
      Medium: finalQs.filter(q => q.difficulty === 'Medium').length,
      Hard: finalQs.filter(q => q.difficulty === 'Hard').length
    });

    // If we don't have enough questions, fill with available questions
    if (finalQs.length < targetQuestionCount) {
      console.warn(`⚠️ Warning: Expected ${targetQuestionCount} questions but got ${finalQs.length}`);
      console.warn('Filling remaining slots with available questions...');
      
      // Calculate how many more we need
      const needed = targetQuestionCount - finalQs.length;
      
      // Get all unused questions
      const usedIds = new Set(finalQs.map(q => q.id));
      const unusedQuestions = allQuestions.filter(q => !usedIds.has(q.id));
      
      // Shuffle and take what we need
      const additionalQuestions = seededShuffle(unusedQuestions, seed + '-additional').slice(0, needed);
      finalQs = [...finalQs, ...additionalQuestions];
      
      console.log(`✅ Added ${additionalQuestions.length} additional questions to reach ${finalQs.length} total`);
    }

    // Shuffle the final selection so difficulties are mixed (using same seed for all users)
    finalQs = seededShuffle(finalQs, seed + '-final');

    console.log('✅ After shuffle - final distribution:', {
      total: finalQs.length,
      Easy: finalQs.filter(q => q.difficulty === 'Easy').length,
      Medium: finalQs.filter(q => q.difficulty === 'Medium').length,
      Hard: finalQs.filter(q => q.difficulty === 'Hard').length
    });

    // Don't mark questions as used here - they should be marked when actually displayed to user
    // This will be handled in league.tsx when each question is shown

    const normalized = finalQs.map((q: any, idx: number) => {
      // Shuffle choices for this question using its ID as seed
      // All users will get the same shuffled order for this question
      const choiceSeed = `${competitionId}-${q.id}-choices`;
      const shuffledChoices = seededShuffle(q.choices || [], choiceSeed);

      return {
        competition_question_id: q.id, // uuid from competition_questions table
        competition_id: q.competition_id || competitionId,
        question_id: null, // not used anymore
        source_question_id: q.source_question_id || null,
        question_text: q.question_text,
        choices: shuffledChoices, // Shuffled choices
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        difficulty: q.difficulty,
        category: q.category,
        question_order: idx + 1,
        created_at: q.created_at ?? null,
      };
    });

    return NextResponse.json({ questions: normalized });
  } catch (err) {
    console.error('Failed to build merged competition questions:', err);
    return NextResponse.json({ questions: [] });
  }
}
