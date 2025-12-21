'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function getQuizQuestions() {
    const supabase = await createServerClient();

    try {
        const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
            supabase.from('questions').select('*').eq('difficulty', 'Easy').eq('status', true),
            supabase.from('questions').select('*').eq('difficulty', 'Medium').eq('status', true),
            supabase.from('questions').select('*').eq('difficulty', 'Hard').eq('status', true)
        ]);

        if (easyQuestions.error || mediumQuestions.error || hardQuestions.error) {
            throw new Error('Failed to fetch questions');
        }

        const shuffleArray = (array: any[]) => {
            return [...array].sort(() => Math.random() - 0.5);
        };

        const selectedEasy = shuffleArray(easyQuestions.data || []).slice(0, 10);
        const selectedMedium = shuffleArray(mediumQuestions.data || []).slice(0, 6);
        const selectedHard = shuffleArray(hardQuestions.data || []).slice(0, 4);

        const allQuestions = shuffleArray([
            ...selectedEasy,
            ...selectedMedium,
            ...selectedHard
        ]);

        // Shuffle choices for each question
        const questionsWithShuffledChoices = allQuestions.map(question => ({
            ...question,
            choices: shuffleArray(question.choices)
        }));

        return questionsWithShuffledChoices;
    } catch (error) {
        console.error('Error fetching quiz questions:', error);
        return [];
    }
}
