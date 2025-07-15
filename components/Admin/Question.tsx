import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { supabase } from '@/lib/supabaseClient';

type Question = {
  id: number;
  question_text: string;
  category: string;
  difficulty: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
};

type EditFormData = Omit<Question, 'choices'> & {
  choices: string; // For editing, we'll use a comma-separated string
};

const QuestionBank = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [competitionQuestions, setCompetitionQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<EditFormData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Competition' | 'FreeQuiz'>('Competition');
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  // Get unique categories for filter dropdown
  const categories = ['All', ...new Set((activeTab === 'Competition' ? competitionQuestions : questions).map(q => q.category))];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  // Fetch questions from Supabase (FreeQuiz tab)
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_text, category, difficulty, choices, correct_answer, explanation')
        .order('id', { ascending: true });
      
      if (error) {
        console.error('Supabase error (questions):', error);
        throw new Error(`Failed to fetch questions: ${error.message}`);
      }
      
      setQuestions(data || []);
    } catch (err) {
      console.error('Fetch error (questions):', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch competition questions from Supabase (Competition tab)
  const fetchCompetitionQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('competition_questions')
        .select('id, question_text, category, difficulty, choices, correct_answer, explanation')
        .order('id', { ascending: true });
      
      if (error) {
        console.error('Supabase error (competition_questions):', error);
        throw new Error(`Failed to fetch competition questions: ${error.message}`);
      }
      
      setCompetitionQuestions(data || []);
    } catch (err) {
      console.error('Fetch error (competition_questions):', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch competition questions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch both questions and competition questions on component mount
  useEffect(() => {
    fetchQuestions();
    fetchCompetitionQuestions();
  }, []);

  // Reset to first page when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedDifficulty, activeTab]);

  // Filter questions based on search and filters
  const filteredQuestions = (activeTab === 'Competition' ? competitionQuestions : questions).filter(question => {
    const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || question.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || question.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Calculate pagination
  const totalQuestions = filteredQuestions.length;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);

  // Handle pagination navigation
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Handle edit start
  const handleEditStart = (question: Question) => {
    setEditingId(question.id);
    setEditForm({
      ...question,
      choices: question.choices.join(', ') // Convert array to comma-separated string for editing
    });
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!editingId || !editForm.question_text || !editForm.category || 
        !editForm.difficulty || !editForm.choices || !editForm.correct_answer || 
        !editForm.explanation) {
      setError('All fields are required to save the question');
      return;
    }

    const choicesArray = editForm.choices.split(',').map(choice => choice.trim());
    if (choicesArray.length !== 4) {
      setError('Exactly 4 choices are required');
      return;
    }

    try {
      const tableName = activeTab === 'Competition' ? 'competition_questions' : 'questions';
      const { error } = await supabase
        .from(tableName)
        .update({
          question_text: editForm.question_text,
          category: editForm.category,
          difficulty: editForm.difficulty,
          choices: choicesArray,
          correct_answer: editForm.correct_answer,
          explanation: editForm.explanation,
        })
        .eq('id', editingId);
      
      if (error) {
        console.error(`Supabase update error (${tableName}):`, error);
        throw error;
      }

      if (activeTab === 'Competition') {
        setCompetitionQuestions(competitionQuestions.map(q => 
          q.id === editingId ? { 
            ...q, 
            ...editForm,
            choices: choicesArray
          } : q
        ));
      } else {
        setQuestions(questions.map(q => 
          q.id === editingId ? { 
            ...q, 
            ...editForm,
            choices: choicesArray
          } : q
        ));
      }
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question');
    }
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      const tableName = activeTab === 'Competition' ? 'competition_questions' : 'questions';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Supabase delete error (${tableName}):`, error);
        throw error;
      }

      if (activeTab === 'Competition') {
        setCompetitionQuestions(competitionQuestions.filter(q => q.id !== id));
      } else {
        setQuestions(questions.filter(q => q.id !== id));
      }
      // Adjust current page if necessary
      if (currentQuestions.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  // Handle add new question
  const handleAddQuestion = async () => {
    try {
      const tableName = activeTab === 'Competition' ? 'competition_questions' : 'questions';
      // Fetch the highest ID from the appropriate table
      const { data: maxIdData, error: maxIdError } = await supabase
        .from(tableName)
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (maxIdError && maxIdError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error(`Supabase max ID error (${tableName}):`, maxIdError);
        throw maxIdError;
      }

      const newId = maxIdData ? maxIdData.id + 1 : 1;

      const newQuestion: Omit<Question, 'id'> = {
        question_text: 'New question (click to edit)',
        category: 'General',
        difficulty: 'Easy',
        choices: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correct_answer: 'Option 1',
        explanation: 'Enter explanation here',
      };

      const { data, error } = await supabase
        .from(tableName)
        .insert({ ...newQuestion, id: newId })
        .select()
        .single();
      
      if (error) {
        console.error(`Supabase insert error (${tableName}):`, error);
        throw error;
      }

      const addedQuestion: Question = data;
      if (activeTab === 'Competition') {
        setCompetitionQuestions([addedQuestion, ...competitionQuestions]);
      } else {
        setQuestions([addedQuestion, ...questions]);
      }
      setEditingId(addedQuestion.id);
      setEditForm({ 
        ...addedQuestion,
        choices: addedQuestion.choices.join(', ')
      });
      setCurrentPage(1); // Go to first page to show new question
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
    }
  };

  // Handle input change for edit form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Render loading state
  if (loading && (activeTab === 'FreeQuiz' || activeTab === 'Competition')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-800">Loading questions...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && (activeTab === 'FreeQuiz' || activeTab === 'Competition')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            onClick={() => {
              fetchQuestions();
              fetchCompetitionQuestions();
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Question Bank</h1>
            <button 
              onClick={handleAddQuestion}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
            >
              <FiPlus className="text-lg" />
              Add Question
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex border-b">
              <button 
                className={`px-6 py-3 font-medium ${activeTab === 'Competition' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('Competition')}
              >
                Competition Questions
              </button>
              <button 
                className={`px-6 py-3 font-medium ${activeTab === 'FreeQuiz' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('FreeQuiz')}
              >
                Free Quiz Questions
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    className="pl-10 w-full p-2 bg-gray-50 text-gray-800 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="p-2 bg-gray-50 text-gray-800 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedCategory}
                  onClick={handleEditCancel}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'All' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
                <select
                  className="p-2 bg-gray-50 text-gray-800 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty === 'All' ? 'All Difficulties' : difficulty}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Questions Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question Text</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Choices</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentQuestions.length > 0 ? (
                    currentQuestions.map(question => (
                      <tr key={question.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {editingId === question.id ? (
                            <input
                              type="text"
                              name="question_text"
                              value={editForm.question_text || ''}
                              onChange={handleInputChange}
                              className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter question text"
                            />
                          ) : (
                            question.question_text
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === question.id ? (
                            <input
                              type="text"
                              name="category"
                              value={editForm.category || ''}
                              onChange={handleInputChange}
                              className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter category"
                            />
                          ) : (
                            question.category
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === question.id ? (
                            <select
                              name="difficulty"
                              value={editForm.difficulty || ''}
                              onChange={handleInputChange}
                              className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                              question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {question.difficulty}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === question.id ? (
                            <input
                              type="text"
                              name="choices"
                              value={editForm.choices || ''}
                              onChange={handleInputChange}
                              className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter 4 choices, comma-separated"
                            />
                          ) : (
                            question.choices.join(', ')
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === question.id ? (
                            <input
                              type="text"
                              name="correct_answer"
                              value={editForm.correct_answer || ''}
                              onChange={handleInputChange}
                              className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter correct answer"
                            />
                          ) : (
                            question.correct_answer
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === question.id ? (
                            <div className="flex space-x-2">
                              <button 
                                onClick={handleEditSave}
                                className="text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <FiCheck />
                              </button>
                              <button 
                                onClick={handleEditCancel}
                                className="text-red-600 hover:text-red-800"
                                title="Cancel"
                              >
                                <FiX />
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEditStart(question)}
                                className="text-indigo-600 hover:text-indigo-800"
                                title="Edit"
                              >
                                <FiEdit2 />
                              </button>
                              <button 
                                onClick={() => handleDelete(question.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No questions found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalQuestions > questionsPerPage && (
              <div className="flex justify-end items-center p-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-full ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-indigo-600 hover:bg-indigo-100'
                    }`}
                    title="Previous Page"
                  >
                    <FiChevronsLeft className="text-lg" />
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(page => {
                      // Show first 3 pages, last 3 pages, and pages around the current page
                      return (
                        page <= 3 ||
                        page > totalPages - 3 ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'text-indigo-600 hover:bg-indigo-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-full ${
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-indigo-600 hover:bg-indigo-100'
                    }`}
                    title="Next Page"
                  >
                    <FiChevronsRight className="text-lg" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;