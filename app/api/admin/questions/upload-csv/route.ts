import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * CSV Upload API for Bulk Question Import
 * Validates and uploads questions from CSV file
 */

type QuestionRow = {
  question_text: string;
  category: string;
  difficulty: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  status?: boolean;
};

type ValidationError = {
  row: number;
  field: string;
  error: string;
  value?: any;
};

// Required fields for questions
const REQUIRED_FIELDS = [
  'question_text',
  'category',
  'difficulty',
  'correct_answer',
];

// Valid values
const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const VALID_CATEGORIES = [
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
];

/**
 * POST /api/admin/questions/upload-csv
 * Upload and validate CSV data for bulk question import
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { csvData, targetTable } = body;

    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json(
        { error: 'Invalid CSV data format' },
        { status: 400 }
      );
    }

    if (!targetTable || !['questions', 'competition_questions'].includes(targetTable)) {
      return NextResponse.json(
        { error: 'Invalid target table. Must be "questions" or "competition_questions"' },
        { status: 400 }
      );
    }

    // Step 1: Validate all rows
    const { validQuestions, errors } = validateCSVData(csvData);

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors,
        validCount: validQuestions.length,
        errorCount: errors.length,
        totalRows: csvData.length
      }, { status: 400 });
    }

    // Step 2: Upload valid questions
    const uploadResult = await uploadQuestions(validQuestions, targetTable);

    return NextResponse.json({
      success: true,
      ...uploadResult,
      message: `Successfully uploaded ${uploadResult.uploaded} questions to ${targetTable}`
    });

  } catch (err) {
    console.error('CSV upload error:', err);
    return NextResponse.json(
      { error: 'CSV upload failed', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Validate CSV data
 */
function validateCSVData(csvData: any[]): {
  validQuestions: QuestionRow[];
  errors: ValidationError[];
} {
  const validQuestions: QuestionRow[] = [];
  const errors: ValidationError[] = [];

  csvData.forEach((row, index) => {
    const rowNumber = index + 1;
    const rowErrors: ValidationError[] = [];

    // Check required fields
    REQUIRED_FIELDS.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        rowErrors.push({
          row: rowNumber,
          field,
          error: `${field} is required`,
          value: row[field]
        });
      }
    });

    // Validate question_text length
    if (row.question_text && row.question_text.length < 10) {
      rowErrors.push({
        row: rowNumber,
        field: 'question_text',
        error: 'Question text must be at least 10 characters',
        value: row.question_text
      });
    }

    if (row.question_text && row.question_text.length > 1000) {
      rowErrors.push({
        row: rowNumber,
        field: 'question_text',
        error: 'Question text must not exceed 1000 characters',
        value: `${row.question_text.substring(0, 50)}...`
      });
    }

    // Validate difficulty
    if (row.difficulty && !VALID_DIFFICULTIES.includes(row.difficulty)) {
      rowErrors.push({
        row: rowNumber,
        field: 'difficulty',
        error: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
        value: row.difficulty
      });
    }

    // Validate category
    if (row.category && !VALID_CATEGORIES.includes(row.category)) {
      rowErrors.push({
        row: rowNumber,
        field: 'category',
        error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
        value: row.category
      });
    }

    // Parse and validate choices
    let choices: string[] = [];
    if (row.choice1 && row.choice2 && row.choice3 && row.choice4) {
      // Format 1: Separate columns for each choice
      choices = [
        row.choice1.toString().trim(),
        row.choice2.toString().trim(),
        row.choice3.toString().trim(),
        row.choice4.toString().trim()
      ];
    } else if (row.choices) {
      // Format 2: Comma-separated or JSON array
      if (typeof row.choices === 'string') {
        try {
          // Try parsing as JSON first
          choices = JSON.parse(row.choices);
        } catch {
          // If not JSON, split by delimiter
          const delimiter = row.choices.includes('|') ? '|' : ',';
          choices = row.choices.split(delimiter).map((c: string) => c.trim());
        }
      } else if (Array.isArray(row.choices)) {
        choices = row.choices;
      }
    }

    // Validate choices
    if (choices.length !== 4) {
      rowErrors.push({
        row: rowNumber,
        field: 'choices',
        error: 'Must have exactly 4 choices. Use columns: choice1, choice2, choice3, choice4 OR choices with comma/pipe separated values',
        value: choices.length
      });
    }

    // Check if choices are not empty
    if (choices.some(c => !c || c.trim() === '')) {
      rowErrors.push({
        row: rowNumber,
        field: 'choices',
        error: 'All choices must be non-empty',
        value: choices
      });
    }

    // Validate correct_answer is one of the choices
    if (row.correct_answer && choices.length === 4) {
      if (!choices.includes(row.correct_answer.trim())) {
        rowErrors.push({
          row: rowNumber,
          field: 'correct_answer',
          error: 'Correct answer must match one of the choices exactly',
          value: row.correct_answer
        });
      }
    }

    // Validate explanation (optional but should be reasonable length if provided)
    if (row.explanation && row.explanation.length > 2000) {
      rowErrors.push({
        row: rowNumber,
        field: 'explanation',
        error: 'Explanation must not exceed 2000 characters',
        value: `${row.explanation.substring(0, 50)}...`
      });
    }

    // If row has errors, add them to errors array
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      // Row is valid, add to validQuestions
      validQuestions.push({
        question_text: row.question_text.trim(),
        category: row.category.trim(),
        difficulty: row.difficulty.trim(),
        choices,
        correct_answer: row.correct_answer.trim(),
        explanation: row.explanation ? row.explanation.trim() : '',
        status: row.status !== undefined ? Boolean(row.status) : true
      });
    }
  });

  return { validQuestions, errors };
}

/**
 * Upload questions to database
 */
async function uploadQuestions(
  questions: QuestionRow[],
  targetTable: 'questions' | 'competition_questions'
) {
  const uploaded: any[] = [];
  const failed: any[] = [];

  for (const question of questions) {
    try {
      const { data, error } = await supabase
        .from(targetTable)
        .insert({
          question_text: question.question_text,
          category: question.category,
          difficulty: question.difficulty,
          choices: question.choices,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          status: question.status ?? true
        })
        .select()
        .single();

      if (error) {
        failed.push({
          question: question.question_text.substring(0, 50),
          error: error.message
        });
      } else {
        uploaded.push(data);
      }
    } catch (err) {
      failed.push({
        question: question.question_text.substring(0, 50),
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  return {
    uploaded: uploaded.length,
    failed: failed.length,
    uploadedQuestions: uploaded,
    failedQuestions: failed,
    totalProcessed: questions.length
  };
}

/**
 * GET /api/admin/questions/upload-csv
 * Get CSV template and instructions
 */
export async function GET(req: NextRequest) {
  const template = {
    format: 'CSV',
    requiredFields: REQUIRED_FIELDS,
    optionalFields: ['explanation', 'status'],
    validDifficulties: VALID_DIFFICULTIES,
    validCategories: VALID_CATEGORIES,
    choicesFormat: [
      'Option 1: Separate columns (choice1, choice2, choice3, choice4)',
      'Option 2: Single column with comma-separated values',
      'Option 3: Single column with pipe-separated values (|)',
      'Option 4: JSON array as string'
    ],
    exampleRows: [
      {
        question_text: 'Which country won the FIFA World Cup in 2018?',
        category: 'World Cup History',
        difficulty: 'Easy',
        choice1: 'France',
        choice2: 'Croatia',
        choice3: 'Brazil',
        choice4: 'Germany',
        correct_answer: 'France',
        explanation: 'France won the 2018 FIFA World Cup in Russia, defeating Croatia 4-2 in the final.',
        status: true
      },
      {
        question_text: 'Who has won the most UEFA Champions League titles as a manager?',
        category: 'UEFA Champions League',
        difficulty: 'Medium',
        choices: 'Pep Guardiola,Zinedine Zidane,Carlo Ancelotti,Jürgen Klopp',
        correct_answer: 'Carlo Ancelotti',
        explanation: 'Carlo Ancelotti has won the UEFA Champions League 4 times as a manager, more than any other coach.',
        status: true
      }
    ],
    instructions: [
      '1. Prepare your CSV file with required columns',
      '2. Ensure all required fields are filled',
      '3. Use valid categories and difficulties',
      '4. Provide exactly 4 choices per question',
      '5. Correct answer must match one of the choices exactly',
      '6. Upload to appropriate table (questions or competition_questions)',
      '7. Review validation errors if upload fails'
    ]
  };

  return NextResponse.json(template);
}
