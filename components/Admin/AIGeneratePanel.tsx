'use client';

import React, { useState } from 'react';
import { FiZap, FiEdit2, FiTrash2, FiUpload, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

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

interface DifficultyRatio {
  easy: number;
  medium: number;
  hard: number;
}

/**
 * Helper: Capitalize first letter
 */
const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Helper: Map AI-generated categories to valid CSV categories
 */
const mapCategoryToValid = (aiCategory: string): string => {
  const categoryMap: Record<string, string> = {
    'General': 'General Knowledge',
    'Premier League': 'Sports',
    'La Liga': 'Sports',
    'Serie A': 'Sports',
    'Bundesliga': 'Sports',
    'Champions League': 'Sports',
    'World Cup': 'Sports',
    'European Championship': 'Sports',
    'Player Trivia': 'Sports',
    'Team History': 'History',
    'Records & Statistics': 'Sports',
    'Records': 'Sports',
    'Clubs': 'Sports',
    'Players': 'Sports',
    'Tournaments': 'Sports',
  };

  return categoryMap[aiCategory] || 'Sports'; // Default to Sports for football questions
};

export default function AIGeneratePanel() {
  // Generation parameters
  const [totalQuestions, setTotalQuestions] = useState<number>(20);
  const [difficultyRatio, setDifficultyRatio] = useState<DifficultyRatio>({
    easy: 40,
    medium: 40,
    hard: 20,
  });
  const [category, setCategory] = useState<string>('');
  const [topic, setTopic] = useState<string>('');

  // Generated questions state
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<GeneratedQuestion | null>(null);

  // Upload state
  const [targetTable, setTargetTable] = useState<'questions' | 'competition_questions'>(
    'questions'
  );
  const [isUploading, setIsUploading] = useState(false);

  // Validation
  const ratioSum = difficultyRatio.easy + difficultyRatio.medium + difficultyRatio.hard;
  const isRatioValid = Math.abs(ratioSum - 100) < 0.1;

  /**
   * Handle difficulty ratio change
   */
  const handleRatioChange = (difficulty: keyof DifficultyRatio, value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    setDifficultyRatio((prev) => ({
      ...prev,
      [difficulty]: clampedValue,
    }));
  };

  /**
   * Auto-adjust ratios to sum to 100%
   */
  const handleAutoAdjust = () => {
    if (isRatioValid) return;

    const sum = ratioSum;
    const factor = 100 / sum;

    setDifficultyRatio({
      easy: Math.round(difficultyRatio.easy * factor),
      medium: Math.round(difficultyRatio.medium * factor),
      hard: Math.round(difficultyRatio.hard * factor),
    });

    toast.success('Ratios adjusted to 100%');
  };

  /**
   * Generate questions using OpenAI API
   */
  const handleGenerateQuestions = async () => {
    // Validation
    if (!isRatioValid) {
      toast.error('Difficulty ratios must sum to 100%');
      return;
    }

    if (totalQuestions < 1 || totalQuestions > 50) {
      toast.error('Total questions must be between 1 and 50');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/admin/questions/generate-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalQuestions,
          difficultyRatio,
          category: category.trim() || undefined,
          topic: topic.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      setGeneratedQuestions(data.questions);
      toast.success(
        `Successfully generated ${data.generated} questions! (${data.distribution.easy} easy, ${data.distribution.medium} medium, ${data.distribution.hard} hard)`
      );

      if (data.validationErrors && data.validationErrors.length > 0) {
        console.warn('Validation errors:', data.validationErrors);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Start editing a question
   */
  const handleEditQuestion = (index: number) => {
    setEditingIndex(index);
    setEditedQuestion({ ...generatedQuestions[index] });
  };

  /**
   * Save edited question
   */
  const handleSaveEdit = () => {
    if (editingIndex === null || !editedQuestion) return;

    const updatedQuestions = [...generatedQuestions];
    updatedQuestions[editingIndex] = editedQuestion;
    setGeneratedQuestions(updatedQuestions);
    setEditingIndex(null);
    setEditedQuestion(null);
    toast.success('Question updated');
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedQuestion(null);
  };

  /**
   * Delete a question
   */
  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = generatedQuestions.filter((_, i) => i !== index);
    setGeneratedQuestions(updatedQuestions);
    toast.success('Question deleted');
  };

  /**
   * Upload questions to database
   */
  const handleUploadQuestions = async () => {
    if (generatedQuestions.length === 0) {
      toast.error('No questions to upload');
      return;
    }

    setIsUploading(true);

    try {
      // Transform AI-generated format to CSV upload format
      const transformedQuestions = generatedQuestions.map((q) => ({
        question_text: q.question_text,
        category: mapCategoryToValid(q.category),
        difficulty: capitalizeFirst(q.difficulty), // easy -> Easy
        choices: [q.choice_1, q.choice_2, q.choice_3, q.choice_4], // Array format
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        status: true,
      }));

      // Use existing CSV upload API
      const response = await fetch('/api/admin/questions/upload-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData: transformedQuestions,
          targetTable,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload questions');
      }

      toast.success(`Successfully uploaded ${data.uploadedCount} questions to ${targetTable}!`);
      setGeneratedQuestions([]); // Clear after successful upload
    } catch (error) {
      console.error('Error uploading questions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload questions');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiZap className="text-yellow-500" />
            AI Question Generator
          </h2>
          <p className="text-gray-600 mt-1">
            Generate football trivia questions automatically using AI
          </p>
        </div>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Parameters</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Questions <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Between 1 and 50 questions</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-gray-400">(Optional)</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="General">General</option>
              <option value="Premier League">Premier League</option>
              <option value="La Liga">La Liga</option>
              <option value="Serie A">Serie A</option>
              <option value="Bundesliga">Bundesliga</option>
              <option value="Champions League">Champions League</option>
              <option value="World Cup">World Cup</option>
              <option value="European Championship">European Championship</option>
              <option value="Player Trivia">Player Trivia</option>
              <option value="Team History">Team History</option>
              <option value="Records & Statistics">Records & Statistics</option>
            </select>
          </div>

          {/* Topic */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Topic <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 2022 World Cup, Cristiano Ronaldo, Manchester United"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Focus questions on a specific topic or theme
            </p>
          </div>
        </div>

        {/* Difficulty Ratio */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Difficulty Distribution <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  isRatioValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                Total: {ratioSum.toFixed(0)}%
              </span>
              {!isRatioValid && (
                <button
                  onClick={handleAutoAdjust}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Auto Adjust
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Easy */}
            <div>
              <label className="block text-xs font-medium text-green-600 mb-2">
                Easy Questions
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={difficultyRatio.easy}
                onChange={(e) => handleRatioChange('easy', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={difficultyRatio.easy}
                onChange={(e) => handleRatioChange('easy', parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                {Math.round((totalQuestions * difficultyRatio.easy) / 100)} questions
              </p>
            </div>

            {/* Medium */}
            <div>
              <label className="block text-xs font-medium text-yellow-600 mb-2">
                Medium Questions
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={difficultyRatio.medium}
                onChange={(e) => handleRatioChange('medium', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={difficultyRatio.medium}
                onChange={(e) => handleRatioChange('medium', parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                {Math.round((totalQuestions * difficultyRatio.medium) / 100)} questions
              </p>
            </div>

            {/* Hard */}
            <div>
              <label className="block text-xs font-medium text-red-600 mb-2">
                Hard Questions
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={difficultyRatio.hard}
                onChange={(e) => handleRatioChange('hard', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={difficultyRatio.hard}
                onChange={(e) => handleRatioChange('hard', parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                {totalQuestions -
                  Math.round((totalQuestions * difficultyRatio.easy) / 100) -
                  Math.round((totalQuestions * difficultyRatio.medium) / 100)}{' '}
                questions
              </p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleGenerateQuestions}
            disabled={isGenerating || !isRatioValid}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FiZap className={isGenerating ? 'animate-pulse' : ''} />
            {isGenerating ? 'Generating...' : 'Generate Questions'}
          </button>

          {!isRatioValid && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <FiAlertCircle />
              Ratios must sum to 100%
            </div>
          )}
        </div>
      </div>

      {/* Generated Questions Preview */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Generated Questions ({generatedQuestions.length})
            </h3>
            <button
              onClick={() => setGeneratedQuestions([])}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {generatedQuestions.map((question, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          question.difficulty === 'easy'
                            ? 'bg-green-100 text-green-700'
                            : question.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {question.difficulty.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {question.category}
                      </span>
                    </div>

                    {editingIndex === index ? (
                      // Edit Mode
                      <div className="space-y-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Question
                          </label>
                          <textarea
                            value={editedQuestion?.question_text || ''}
                            onChange={(e) =>
                              setEditedQuestion((prev) =>
                                prev ? { ...prev, question_text: e.target.value } : null
                              )
                            }
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {['choice_1', 'choice_2', 'choice_3', 'choice_4'].map((choiceKey) => (
                            <div key={choiceKey}>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {choiceKey.replace('_', ' ').toUpperCase()}
                              </label>
                              <input
                                type="text"
                                value={
                                  editedQuestion?.[choiceKey as keyof GeneratedQuestion] as string
                                }
                                onChange={(e) =>
                                  setEditedQuestion((prev) =>
                                    prev ? { ...prev, [choiceKey]: e.target.value } : null
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Correct Answer
                          </label>
                          <select
                            value={editedQuestion?.correct_answer || ''}
                            onChange={(e) =>
                              setEditedQuestion((prev) =>
                                prev ? { ...prev, correct_answer: e.target.value } : null
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={editedQuestion?.choice_1}>
                              {editedQuestion?.choice_1}
                            </option>
                            <option value={editedQuestion?.choice_2}>
                              {editedQuestion?.choice_2}
                            </option>
                            <option value={editedQuestion?.choice_3}>
                              {editedQuestion?.choice_3}
                            </option>
                            <option value={editedQuestion?.choice_4}>
                              {editedQuestion?.choice_4}
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Explanation
                          </label>
                          <textarea
                            value={editedQuestion?.explanation || ''}
                            onChange={(e) =>
                              setEditedQuestion((prev) =>
                                prev ? { ...prev, explanation: e.target.value } : null
                              )
                            }
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <p className="font-medium text-gray-900 mb-3">{question.question_text}</p>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {[question.choice_1, question.choice_2, question.choice_3, question.choice_4].map(
                            (choice, choiceIndex) => (
                              <div
                                key={choiceIndex}
                                className={`px-3 py-2 text-sm rounded border ${
                                  choice === question.correct_answer
                                    ? 'bg-green-50 border-green-300 text-green-700 font-medium'
                                    : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}
                              >
                                {choice === question.correct_answer && (
                                  <FiCheckCircle className="inline mr-1" />
                                )}
                                {choice}
                              </div>
                            )
                          )}
                        </div>

                        {question.explanation && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-800">
                            <strong>Explanation:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {editingIndex !== index && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditQuestion(index)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Upload Questions</h4>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-2">Select Target Table</label>
                <select
                  value={targetTable}
                  onChange={(e) =>
                    setTargetTable(e.target.value as 'questions' | 'competition_questions')
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="questions">Free Quiz Questions</option>
                  <option value="competition_questions">Competition Questions</option>
                </select>
              </div>

              <button
                onClick={handleUploadQuestions}
                disabled={isUploading || generatedQuestions.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiUpload className={isUploading ? 'animate-bounce' : ''} />
                {isUploading ? 'Uploading...' : 'Upload Questions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {generatedQuestions.length === 0 && !isGenerating && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <FiZap className="mx-auto text-5xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Generated Yet</h3>
          <p className="text-gray-600">
            Configure your parameters above and click "Generate Questions" to create AI-powered
            football trivia questions.
          </p>
        </div>
      )}
    </div>
  );
}
