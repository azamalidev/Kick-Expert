import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for request/response
interface GenerateRequest {
  totalQuestions: number;
  difficultyRatio: {
    easy: number;
    medium: number;
    hard: number;
  };
  category?: string;
  topic?: string;
}

interface GeneratedQuestion {
  question_text: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  correct_answer: string;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * POST /api/admin/questions/generate-ai
 * Generate football trivia questions using OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body: GenerateRequest = await request.json();
    const { totalQuestions, difficultyRatio, category, topic } = body;

    // Validate input
    if (!totalQuestions || totalQuestions < 1 || totalQuestions > 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'Total questions must be between 1 and 50.',
        },
        { status: 400 }
      );
    }

    // Validate difficulty ratio sums to 100
    const ratioSum = difficultyRatio.easy + difficultyRatio.medium + difficultyRatio.hard;
    if (Math.abs(ratioSum - 100) > 0.1) {
      return NextResponse.json(
        {
          success: false,
          error: `Difficulty ratios must sum to 100%. Current sum: ${ratioSum}%`,
        },
        { status: 400 }
      );
    }

    // Calculate question distribution
    const easyCount = Math.round((totalQuestions * difficultyRatio.easy) / 100);
    const mediumCount = Math.round((totalQuestions * difficultyRatio.medium) / 100);
    const hardCount = totalQuestions - easyCount - mediumCount; // Ensure total matches exactly

    console.log(`Generating ${totalQuestions} questions: ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard`);

    // Build prompt for OpenAI
    const systemPrompt = `You are a professional football (soccer) trivia question generator. 
Generate high-quality, accurate, and engaging football trivia questions.

IMPORTANT RULES:
1. Questions must be factually accurate
2. All 4 answer choices must be plausible (no obviously wrong answers)
3. Only ONE choice should be correct
4. Provide a brief explanation (1-2 sentences) for the correct answer
5. Use proper grammar and formatting
6. Questions should test real football knowledge
7. Avoid overly obscure or trick questions
8. Include a mix of topics: players, teams, tournaments, history, records, tactics, etc.
9. NEVER use phrases like "As of 2023", "As of [year]", or similar time qualifiers in explanations
10. Write explanations as definitive facts without temporal disclaimers
11. ENSURE ALL QUESTIONS ARE COMPLETELY UNIQUE - no repetition of similar questions
12. Vary question types: who/what/when/where/how many questions, true/false style, etc.
13. Use different players, teams, tournaments, and time periods for each question
14. Avoid asking about the same player/team/tournament multiple times
15. Each question must be distinct and not similar to any other generated question

AVAILABLE CATEGORIES (use these exact names):
- World Cup History
- UEFA Champions League
- UEFA Europa League
- Premier League
- La Liga
- Serie A
- Bundesliga
- Ligue 1
- Copa América
- African Cup of Nations
- Asian Cup
- CONCACAF Gold Cup
- FIFA Club World Cup
- Transfer History
- Player Statistics
- Coach and Manager Facts
- Stadium Trivia
- Historical Records
- Famous Matches
- National Team Records
- Referee Decisions
- Match Rules and Regulations
- Youth Competitions (U17, U20)
- Miscellaneous Football Facts

Assign appropriate categories based on the question content using ONLY the categories listed above.`;

    const categoryText = category ? ` in the category of "${category}"` : '';
    const topicText = topic ? ` focusing on the topic of "${topic}"` : '';

    const userPrompt = `Generate exactly ${totalQuestions} football trivia questions${categoryText}${topicText}.

DIFFICULTY DISTRIBUTION:
- ${easyCount} EASY questions (basic football knowledge, famous players/teams, major tournaments)
- ${mediumCount} MEDIUM questions (more specific knowledge, statistics, historical events)
- ${hardCount} HARD questions (detailed knowledge, lesser-known facts, specific records)

${!category ? `CATEGORY DISTRIBUTION REQUIREMENT:
- Since no specific category was selected, distribute questions ACROSS ALL available categories
- Ensure each of the 24 categories gets at least one question if possible
- Cover as many different categories as feasible given the total question count
- Balance the distribution across: leagues, tournaments, player topics, historical aspects, etc.` : ''}

CRITICAL UNIQUENESS REQUIREMENTS:
- Each question must be completely unique and different from all others
- No repetition of the same players, teams, tournaments, or topics
- Vary the question types: who, what, when, where, how many, which team, etc.
- Use different historical periods, different competitions, different players
- Avoid asking about the same person/team/event multiple times
- Ensure maximum variety in question content and structure
- Each question should cover a different aspect of football

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question_text": "Which country won the FIFA World Cup in 2018?",
    "choice_1": "France",
    "choice_2": "Croatia",
    "choice_3": "Brazil",
    "choice_4": "Germany",
    "correct_answer": "France",
    "explanation": "France won the 2018 FIFA World Cup in Russia, defeating Croatia 4-2 in the final.",
    "category": "${category || 'Premier League'}",
    "difficulty": "easy"
  }
]

CRITICAL REQUIREMENTS: 
- Return ONLY the JSON array, no other text
- Ensure "correct_answer" exactly matches one of the four choices
- Distribute difficulties: ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard
- Each question must have all required fields
- Use EXACT category names from the list above (World Cup History, UEFA Champions League, UEFA Europa League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Copa América, African Cup of Nations, Asian Cup, CONCACAF Gold Cup, FIFA Club World Cup, Transfer History, Player Statistics, Coach and Manager Facts, Stadium Trivia, Historical Records, Famous Matches, National Team Records, Referee Decisions, Match Rules and Regulations, Youth Competitions (U17, U20), Miscellaneous Football Facts)
- Do NOT use variations like "UEFA Champions League" or "FIFA World Cup" - use the exact names listed
- ENSURE ZERO REPETITION: Every question must be unique with different content, players, teams, and topics${!category ? '\n- DISTRIBUTE ACROSS ALL CATEGORIES: Cover multiple categories when no specific category is selected' : ''}`;

    console.log('Calling OpenAI API...');

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for cost efficiency (you can change to gpt-4 for better quality)
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8, // Some creativity, but not too random
      max_tokens: 4000, // Enough for 50 questions
      response_format: { type: 'json_object' }, // Ensure JSON response
    });

    console.log('OpenAI API response received');

    // Parse response (handle both string and object responses)
    const responseContent = completion.choices?.[0]?.message?.content;
    if (responseContent === undefined || responseContent === null) {
      throw new Error('No response from OpenAI API');
    }

    console.debug('OpenAI response content type:', typeof responseContent);

    let parsedResponse: any = null;

    if (typeof responseContent === 'object') {
      // Some SDK/formatters return a parsed object already
      parsedResponse = responseContent;
    } else if (typeof responseContent === 'string') {
      // Try to parse the entire string as JSON
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch (e) {
        // If parsing fails, attempt to extract a JSON array/object substring from the text
        const arrayMatch = responseContent.match(/\[\s*\{[\s\S]*\}\s*\]/m);
        const objMatch = responseContent.match(/\{[\s\S]*\}/m);
        const candidate = arrayMatch?.[0] || objMatch?.[0];
        if (candidate) {
          try {
            parsedResponse = JSON.parse(candidate);
          } catch (e2) {
            console.error('Failed to parse extracted JSON candidate from OpenAI response');
            console.error('Raw response:', responseContent);
            throw new Error('Invalid JSON response from OpenAI');
          }
        } else {
          console.error('OpenAI returned non-JSON text:', responseContent);
          throw new Error('Invalid JSON response from OpenAI');
        }
      }
    } else {
      console.error('Unhandled OpenAI response content type', typeof responseContent, responseContent);
      throw new Error('Unexpected response type from OpenAI');
    }

    // Extract questions array (handle different response structures)
    let questions: GeneratedQuestion[] = [];
    if (Array.isArray(parsedResponse)) {
      questions = parsedResponse;
    } else if (parsedResponse && Array.isArray(parsedResponse.questions)) {
      questions = parsedResponse.questions;
    } else if (parsedResponse && Array.isArray(parsedResponse.data)) {
      questions = parsedResponse.data;
    } else {
      // Try to aggressively extract JSON array/object substrings from the original string response
      const rawString = typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent);
      let extracted: any = null;

      try {
        const startArr = rawString.indexOf('[');
        const endArr = rawString.lastIndexOf(']');
        if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
          const candidate = rawString.slice(startArr, endArr + 1);
          extracted = JSON.parse(candidate);
          if (Array.isArray(extracted)) questions = extracted;
        }
      } catch (e) {
        // ignore and try object extraction
      }

      if (questions.length === 0) {
        try {
          const startObj = rawString.indexOf('{');
          const endObj = rawString.lastIndexOf('}');
          if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
            const candidateObj = rawString.slice(startObj, endObj + 1);
            const parsedObj = JSON.parse(candidateObj);
            if (parsedObj && Array.isArray(parsedObj.questions)) questions = parsedObj.questions;
            else if (parsedObj && Array.isArray(parsedObj.data)) questions = parsedObj.data;
          }
        } catch (e) {
          // ignore
        }
      }

      if (!questions || questions.length === 0) {
        console.error('Parsed OpenAI response structure not recognized:', parsedResponse);
        console.error('Raw OpenAI response content:', responseContent);
        const debugPayload: any = { success: false, error: 'Unexpected response structure from OpenAI' };
        if (process.env.NODE_ENV !== 'production') {
          debugPayload.debug = { parsedResponse, raw: responseContent };
        }
        return NextResponse.json(debugPayload, { status: 500 });
      }
    }

    // Validate generated questions
    const validatedQuestions: GeneratedQuestion[] = [];
    const errors: string[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionNum = i + 1;

      // Check required fields
      if (!q.question_text || q.question_text.length < 10) {
        errors.push(`Question ${questionNum}: Missing or too short question_text`);
        continue;
      }
      if (!q.choice_1 || !q.choice_2 || !q.choice_3 || !q.choice_4) {
        errors.push(`Question ${questionNum}: Missing one or more choices`);
        continue;
      }
      if (!q.correct_answer) {
        errors.push(`Question ${questionNum}: Missing correct_answer`);
        continue;
      }

      // Verify correct_answer matches one of the choices
      const choices = [q.choice_1, q.choice_2, q.choice_3, q.choice_4];
      if (!choices.includes(q.correct_answer)) {
        errors.push(
          `Question ${questionNum}: correct_answer "${q.correct_answer}" doesn't match any choice`
        );
        continue;
      }

      // Validate difficulty
      if (!['easy', 'medium', 'hard'].includes(q.difficulty)) {
        q.difficulty = 'medium'; // Default to medium if invalid
      }

      // Set defaults for optional fields
      if (!q.explanation) {
        q.explanation = '';
      }
      if (!q.category) {
        q.category = category || 'General';
      }

      validatedQuestions.push(q);
    }

    console.log(`Validated ${validatedQuestions.length} out of ${questions.length} questions`);

    if (validatedQuestions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid questions generated. Please try again.',
          validationErrors: errors,
        },
        { status: 500 }
      );
    }

    // Return generated questions
    return NextResponse.json({
      success: true,
      questions: validatedQuestions,
      generated: validatedQuestions.length,
      requested: totalQuestions,
      distribution: {
        easy: validatedQuestions.filter((q) => q.difficulty === 'easy').length,
        medium: validatedQuestions.filter((q) => q.difficulty === 'medium').length,
        hard: validatedQuestions.filter((q) => q.difficulty === 'hard').length,
      },
      validationErrors: errors.length > 0 ? errors : undefined,
      model: completion.model,
      tokensUsed: completion.usage?.total_tokens || 0,
    });
  } catch (error: unknown) {
    console.error('Error generating questions with AI:', error);

    // Handle OpenAI specific errors
    if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
      const apiError = error as { status?: number; message: string; type?: string };
      return NextResponse.json(
        {
          success: false,
          error: `OpenAI API Error: ${apiError.message}`,
          details: apiError.type,
        },
        { status: apiError.status || 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate questions',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/questions/generate-ai
 * Get configuration info and usage guidelines
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: '/api/admin/questions/generate-ai',
    method: 'POST',
    description: 'Generate football trivia questions using OpenAI',
    configured: !!process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    parameters: {
      totalQuestions: {
        type: 'number',
        required: true,
        min: 1,
        max: 50,
        description: 'Total number of questions to generate',
      },
      difficultyRatio: {
        type: 'object',
        required: true,
        properties: {
          easy: { type: 'number', description: 'Percentage of easy questions (0-100)' },
          medium: { type: 'number', description: 'Percentage of medium questions (0-100)' },
          hard: { type: 'number', description: 'Percentage of hard questions (0-100)' },
        },
        note: 'easy + medium + hard must equal 100',
      },
      category: {
        type: 'string',
        required: false,
        description: 'Optional category for questions (e.g., "UEFA Champions League", "World Cup History")',
      },
      topic: {
        type: 'string',
        required: false,
        description: 'Optional specific topic (e.g., "Cristiano Ronaldo", "2022 World Cup")',
      },
    },
    example: {
      totalQuestions: 20,
      difficultyRatio: {
        easy: 40,
        medium: 40,
        hard: 20,
      },
      category: 'UEFA Champions League',
      topic: '2022 Final',
    },
    validCategories: [
      'World Cup History',
      'UEFA Champions League',
      'UEFA Europa League',
      'Premier League',
      'La Liga',
      'Serie A',
      'Bundesliga',
      'Ligue 1',
      'Copa América',
      'African Cup of Nations',
      'Asian Cup',
      'CONCACAF Gold Cup',
      'FIFA Club World Cup',
      'Transfer History',
      'Player Statistics',
      'Coach and Manager Facts',
      'Stadium Trivia',
      'Historical Records',
      'Famous Matches',
      'National Team Records',
      'Referee Decisions',
      'Match Rules and Regulations',
      'Youth Competitions (U17, U20)',
      'Miscellaneous Football Facts',
    ],
  });
}
