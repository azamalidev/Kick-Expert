import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QuestionData {
  id: number;
  question_text: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  category: string;
}

interface RawCompetitionQuestion {
  id: number;
  competition_id: string;
  question_order: number | null;
  questions: QuestionData | null;
}

interface FormattedQuestion {
  id: number;
  competition_id: string;
  question_text: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  category: string;
  source_question_id: number | null;
  question_order: number | null;
}

export async function POST(req: NextRequest) {
  try {
    const { competitionId } = await req.json();
    if (!competitionId) return NextResponse.json({ questions: [] });

    // Call the get_competition_questions stored procedure
    const { data: rawQuestions, error: questionsError } = await supabase
      .rpc('get_competition_questions', { p_competition_id: competitionId });

    if (questionsError) {
      console.error('Error fetching competition questions:', questionsError);
      return NextResponse.json({ error: questionsError.message }, { status: 500 });
    }

    if (!rawQuestions || !Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // The stored procedure returns already formatted questions
    const questions: FormattedQuestion[] = rawQuestions;

    // Return the formatted questions array
    return NextResponse.json({ 
      questions: questions.sort((a, b) => 
        (a.question_order ?? 0) - (b.question_order ?? 0)
      )
    });
  } catch (err) {
    console.error('Error processing competition questions:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
