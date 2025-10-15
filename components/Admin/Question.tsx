import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiDownload, FiBarChart2, FiUpload, FiAlertTriangle, FiCopy, FiZap } from 'react-icons/fi';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import CSVUploadPanel from './CSVUploadPanel';
import QualityFlagsPanel from './QualityFlagsPanel';
import QuestionDetailModal from './QuestionDetailModal';
import AIGeneratePanel from './AIGeneratePanel';

type Question = {
  id: number | string;
  question_text: string;
  category: string;
  difficulty: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  status?: boolean; // New field for enable/disable
  last_used_at?: string | null; // New field for rotation tracking
};

type QuestionStats = {
  times_used: number;
  times_answered: number;
  times_correct: number;
  correct_percentage: number;
  avg_response_time_ms: number;
};

type EditFormData = Omit<Question, 'choices'> & {
  choices: string; // For editing, we'll use a comma-separated string
};

const QuestionBank = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [competitionQuestions, setCompetitionQuestions] = useState<Question[]>([]);
  const [questionStats, setQuestionStats] = useState<Record<string | number, QuestionStats>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EditFormData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Competition' | 'FreeQuiz' | 'Insights' | 'Import' | 'QualityFlags' | 'AIGenerate'>('Competition');
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  // Phase 2: New state variables
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string | number>>(new Set());
  const [analytics, setAnalytics] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [showCharts, setShowCharts] = useState(false);
  const [minCorrect, setMinCorrect] = useState<string>('');
  const [maxCorrect, setMaxCorrect] = useState<string>('');
  const [minUsage, setMinUsage] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Phase 3: Quality Flags & Detail Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | number>('');
  const [selectedQuestionSource, setSelectedQuestionSource] = useState<'free_quiz' | 'competition'>('free_quiz');

  // Get unique categories for filter dropdown
  const categories = ['All', ...new Set((activeTab === 'Competition' ? competitionQuestions : questions).map(q => q.category))];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  // Fetch questions from Supabase (FreeQuiz tab)
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_text, category, difficulty, choices, correct_answer, explanation, status, last_used_at')
        .order('id', { ascending: true });
      
      if (error) {
        console.error('Supabase error (questions):', error);
        throw new Error(`Failed to fetch questions: ${error.message}`);
      }
      
      setQuestions(data || []);
      
      // Fetch stats for these questions
      await fetchQuestionStats('free_quiz', (data || []).map(q => q.id));
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
        .select('id, question_text, category, difficulty, choices, correct_answer, explanation, status, last_used_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error (competition_questions):', error);
        throw new Error(`Failed to fetch competition questions: ${error.message}`);
      }
      
      setCompetitionQuestions(data || []);
      
      // Fetch stats for these questions
      await fetchQuestionStats('competition', (data || []).map(q => q.id));
    } catch (err) {
      console.error('Fetch error (competition_questions):', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch competition questions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch question statistics
  const fetchQuestionStats = async (type: 'free_quiz' | 'competition', ids: (string | number)[]) => {
    try {
      console.log(`📊 Fetching ${type} stats for ${ids.length} questions...`);
      
      const { data, error } = await supabase
        .from('question_stats')
        .select('question_id, competition_question_id, times_used, times_answered, times_correct, correct_percentage, avg_response_time_ms')
        .eq('question_type', type);
      
      if (error) {
        console.error('❌ Error fetching question stats:', error);
        return;
      }
      
      console.log(`✅ Fetched ${data?.length || 0} stat records`);
      
      const statsMap: Record<string | number, QuestionStats> = {};
      (data || []).forEach((stat: any) => {
        const key = type === 'free_quiz' ? stat.question_id : stat.competition_question_id;
        if (key) {
          statsMap[key] = {
            times_used: stat.times_used || 0,
            times_answered: stat.times_answered || 0,
            times_correct: stat.times_correct || 0,
            correct_percentage: stat.correct_percentage || 0,
            avg_response_time_ms: stat.avg_response_time_ms || 0
          };
        }
      });
      
      console.log(`📈 Mapped stats for ${Object.keys(statsMap).length} questions`);
      setQuestionStats(statsMap);
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
    }
  };

  // Fetch both questions and competition questions on component mount
  useEffect(() => {
    fetchQuestions();
    fetchCompetitionQuestions();
    fetchAnalytics(); // Phase 2: Fetch analytics on mount
  }, []);

  // Phase 2: Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      // For Insights tab, always fetch 'all' to show combined data
      const source = activeTab === 'Insights' ? 'all' : 
                     activeTab === 'FreeQuiz' ? 'free_quiz' : 
                     activeTab === 'Competition' ? 'competition' : 'all';
      
      const params = new URLSearchParams({
        source,
        ...(selectedCategory !== 'All' && { category: selectedCategory }),
        ...(selectedDifficulty !== 'All' && { difficulty: selectedDifficulty }),
        ...(minCorrect && { minCorrect }),
        ...(maxCorrect && { maxCorrect }),
        ...(minUsage && { minUsage }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/question-analytics?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics);
        setInsights(data.insights);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      toast.error('Failed to load analytics data');
    }
  };

  // Refetch stats when switching tabs
  useEffect(() => {
    if (activeTab === 'FreeQuiz' && questions.length > 0) {
      fetchQuestionStats('free_quiz', questions.map(q => q.id));
    } else if (activeTab === 'Competition' && competitionQuestions.length > 0) {
      fetchQuestionStats('competition', competitionQuestions.map(q => q.id));
    }
  }, [activeTab, questions.length, competitionQuestions.length]);

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
    if (editingId == null || !editForm.question_text || !editForm.category || 
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
  const handleDelete = async (id: number | string) => {
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

  // Handle toggle status (enable/disable question)
  const handleToggleStatus = async (id: number | string, currentStatus: boolean) => {
    try {
      const tableName = activeTab === 'Competition' ? 'competition_questions' : 'questions';
      const newStatus = !currentStatus;
      
      const { error } = await supabase
        .from(tableName)
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) {
        console.error(`Supabase status update error (${tableName}):`, error);
        throw error;
      }

      // Update local state
      if (activeTab === 'Competition') {
        setCompetitionQuestions(competitionQuestions.map(q => 
          q.id === id ? { ...q, status: newStatus } : q
        ));
      } else {
        setQuestions(questions.map(q => 
          q.id === id ? { ...q, status: newStatus } : q
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle question status');
    }
  };

  // Phase 3: Open question detail modal
  const handleOpenDetailModal = (source: string, id: string | number) => {
    setSelectedQuestionId(id);
    setSelectedQuestionSource(source as 'free_quiz' | 'competition');
    setShowDetailModal(true);
  };

  // Phase 3: Clone question
  const handleCloneQuestion = async (question: Question) => {
    const source = activeTab === 'FreeQuiz' ? 'free_quiz' : 'competition';
    
    try {
      const toastId = toast.loading('Cloning question...');
      const response = await fetch('/api/admin/questions/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          questionId: source === 'free_quiz' ? question.id : undefined,
          competitionQuestionId: source === 'competition' ? question.id : undefined,
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Question cloned successfully!', { id: toastId });
        
        // Refresh the question list
        if (activeTab === 'FreeQuiz') {
          fetchQuestions();
        } else {
          fetchCompetitionQuestions();
        }
      } else {
        toast.error(result.error || 'Failed to clone question', { id: toastId });
      }
    } catch (err) {
      toast.error('Error cloning question');
      console.error('Clone error:', err);
    }
  };

  // Phase 2: Handle checkbox selection
  const handleSelectQuestion = (id: string | number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedQuestions(newSelected);
  };

  // Phase 2: Select all questions on current page
  const handleSelectAll = () => {
    if (selectedQuestions.size === currentQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(currentQuestions.map(q => q.id)));
    }
  };

  // Phase 2: Bulk enable/disable
  const handleBulkStatusChange = async (enable: boolean) => {
    if (selectedQuestions.size === 0) {
      toast.error('Please select questions first');
      return;
    }

    const toastId = toast.loading(`${enable ? 'Enabling' : 'Disabling'} ${selectedQuestions.size} questions...`);

    try {
      const questionIds: number[] = [];
      const competitionQuestionIds: string[] = [];

      Array.from(selectedQuestions).forEach(id => {
        if (typeof id === 'number') {
          questionIds.push(id);
        } else {
          competitionQuestionIds.push(id);
        }
      });

      const response = await fetch('/api/admin/question-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: enable ? 'bulk_enable' : 'bulk_disable',
          questionIds,
          competitionQuestionIds
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully ${enable ? 'enabled' : 'disabled'} ${result.updated} questions`, { id: toastId });
        setSelectedQuestions(new Set());
        // Refresh data
        fetchQuestions();
        fetchCompetitionQuestions();
      } else {
        toast.error(`Operation partially failed: ${result.errors.join(', ')}`, { id: toastId });
      }
    } catch (err) {
      console.error('Bulk status change error:', err);
      toast.error('Failed to update questions', { id: toastId });
    }
  };

  // Phase 2: Bulk delete
  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) {
      toast.error('Please select questions first');
      return;
    }

    // Show modal instead of confirm
    setShowDeleteModal(true);
  };

  // Phase 2: Confirm bulk delete (called from modal)
  const confirmBulkDelete = async () => {
    setShowDeleteModal(false);
    const toastId = toast.loading(`Deleting ${selectedQuestions.size} questions...`);

    try {
      const questionIds: number[] = [];
      const competitionQuestionIds: string[] = [];

      Array.from(selectedQuestions).forEach(id => {
        if (typeof id === 'number') {
          questionIds.push(id);
        } else {
          competitionQuestionIds.push(id);
        }
      });

      const response = await fetch('/api/admin/question-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'bulk_delete',
          questionIds,
          competitionQuestionIds
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully deleted ${result.deleted} questions`, { id: toastId });
        setSelectedQuestions(new Set());
        // Refresh data
        fetchQuestions();
        fetchCompetitionQuestions();
      } else {
        toast.error(`Operation partially failed: ${result.errors.join(', ')}`, { id: toastId });
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      toast.error('Failed to delete questions', { id: toastId });
    }
  };

  // Phase 2: Export questions to CSV
  const handleExportCSV = () => {
    const questionsToExport = activeTab === 'Competition' ? competitionQuestions : questions;
    
    if (questionsToExport.length === 0) {
      toast.error('No questions to export');
      return;
    }

    const csvData = questionsToExport.map(q => {
      const stats = questionStats[q.id] || {};
      return {
        id: q.id,
        question: q.question_text,
        category: q.category,
        difficulty: q.difficulty,
        status: q.status ? 'Active' : 'Inactive',
        times_used: stats.times_used || 0,
        times_answered: stats.times_answered || 0,
        times_correct: stats.times_correct || 0,
        correct_percentage: stats.correct_percentage || 0,
        avg_response_time_ms: stats.avg_response_time_ms || 0,
        last_used: q.last_used_at || 'Never'
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h as keyof typeof row] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${csvData.length} questions to CSV`);
  };

  // Phase 2: Export questions to JSON
  const handleExportJSON = () => {
    const questionsToExport = activeTab === 'Competition' ? competitionQuestions : questions;
    
    if (questionsToExport.length === 0) {
      toast.error('No questions to export');
      return;
    }

    const jsonData = questionsToExport.map(q => {
      const stats = questionStats[q.id] || {};
      return {
        ...q,
        stats: {
          times_used: stats.times_used || 0,
          times_answered: stats.times_answered || 0,
          times_correct: stats.times_correct || 0,
          correct_percentage: stats.correct_percentage || 0,
          avg_response_time_ms: stats.avg_response_time_ms || 0
        }
      };
    });

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions_${activeTab}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${jsonData.length} questions to JSON`);
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

      // For competition_questions the primary key is a UUID generated by the DB.
      // For the Free Quiz `questions` table we keep the existing numeric id generation.
      const isCompetition = tableName === 'competition_questions';

      const newQuestion: Omit<Question, 'id'> = {
        question_text: 'New question (click to edit)',
        category: 'General',
        difficulty: 'Easy',
        choices: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correct_answer: 'Option 1',
        explanation: 'Enter explanation here',
      };

      let data: any = null;
      let error: any = null;

      if (isCompetition) {
        // Let Postgres generate the UUID primary key
        const resp = await supabase.from(tableName).insert(newQuestion).select().single();
        data = resp.data;
        error = resp.error;
      } else {
        const computedId = maxIdData ? maxIdData.id + 1 : 1;
        const resp = await supabase.from(tableName).insert({ ...newQuestion, id: computedId }).select().single();
        data = resp.data;
        error = resp.error;
      }
      
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
          <div className="flex border-b overflow-x-auto whitespace-nowrap scrollbar-hide">
  <button 
    className={`px-6 py-3 font-medium inline-block ${activeTab === 'Competition' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
    onClick={() => setActiveTab('Competition')}
  >
    Competition Questions
  </button>
  <button 
    className={`px-6 py-3 font-medium inline-block ${activeTab === 'FreeQuiz' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
    onClick={() => setActiveTab('FreeQuiz')}
  >
    Free Quiz Questions
  </button>
  <button 
    className={`px-6 py-3 font-medium flex flex-row items-center gap-2  ${activeTab === 'Insights' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
    onClick={() => { setActiveTab('Insights'); fetchAnalytics(); }}
  >
  
    Performance Insights
  </button>
  <button 
    className={`px-6 py-3 font-medium flex items-center gap-2 inline-block ${activeTab === 'QualityFlags' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
    onClick={() => setActiveTab('QualityFlags')}
  >

    Quality Flags
  </button>
  <button 
    className={`px-6 py-3 font-medium flex items-center gap-2 inline-block ${activeTab === 'AIGenerate' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
    onClick={() => setActiveTab('AIGenerate')}
  >
 
    AI Generate
  </button>
  <button 
    className={`px-6 py-3 font-medium flex items-center gap-2 inline-block ${activeTab === 'Import' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
    onClick={() => setActiveTab('Import')}
  >
    
    Import CSV
  </button>
</div>


            {/* Phase 2: Insights Dashboard */}
            {activeTab === 'Insights' && insights && (
              <div className="p-6 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">Total Questions</div>
                    <div className="text-3xl font-bold text-blue-900">{insights.totalQuestions}</div>
                    <div className="text-xs text-blue-600 mt-1">{insights.activeQuestions} active</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 font-medium">Total Usage</div>
                    <div className="text-3xl font-bold text-green-900">{insights.totalUsage}</div>
                    <div className="text-xs text-green-600 mt-1">times used</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium">Avg Correct %</div>
                    <div className="text-3xl font-bold text-purple-900">{insights.avgCorrectPercentage.toFixed(1)}%</div>
                    <div className="text-xs text-purple-600 mt-1">across all questions</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-600 font-medium">Avg Response Time</div>
                    <div className="text-3xl font-bold text-orange-900">{(insights.avgResponseTime / 1000).toFixed(1)}s</div>
                    <div className="text-xs text-orange-600 mt-1">{insights.avgResponseTime}ms</div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Difficulty Distribution */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Difficulty Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={Object.entries(insights.difficultyDistribution).map(([key, value]) => ({ name: key, value }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(insights.difficultyDistribution).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444'][index % 3]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category Distribution */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={Object.entries(insights.categoryDistribution).map(([key, value]) => ({ name: key, count: value }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

              
                </div>

                {/* Top/Worst Performers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Performers */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">🏆 Top Performers (Highest Correct %)</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {!insights.topPerformers || insights.topPerformers.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-4">
                          Not enough data yet. Questions need at least 3 answers to appear here.
                        </div>
                      ) : (
                        insights.topPerformers.map((q: any, idx: number) => (
                          <div key={`top-${q.id}-${idx}`} className="bg-white p-3 rounded border border-green-100">
                            <div className="text-sm text-gray-700 font-medium truncate" title={q.question_text}>
                              {q.question_text}
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-green-600 font-bold">{q.correct_percentage?.toFixed(1) || 0}% correct</span>
                              <span className="text-gray-500">{q.times_used} uses • {q.source}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Worst Performers */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="text-lg font-semibold text-red-900 mb-3">⚠️ Needs Improvement (Lowest Correct %)</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {!insights.worstPerformers || insights.worstPerformers.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-4">
                          Not enough data yet. Questions need at least 3 answers to appear here.
                        </div>
                      ) : (
                        insights.worstPerformers.map((q: any, idx: number) => (
                          <div key={`worst-${q.id}-${idx}`} className="bg-white p-3 rounded border border-red-100">
                            <div className="text-sm text-gray-700 font-medium truncate" title={q.question_text}>
                              {q.question_text}
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-red-600 font-bold">{q.correct_percentage?.toFixed(1) || 0}% correct</span>
                              <span className="text-gray-500">{q.times_used} uses • {q.source}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Most/Least Used */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Most Used */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">📈 Most Used Questions</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {!insights.mostUsed || insights.mostUsed.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-4">
                          No questions have been used yet.
                        </div>
                      ) : (
                        insights.mostUsed.map((q: any, idx: number) => (
                          <div key={`most-${q.id}-${idx}`} className="bg-white p-3 rounded border border-blue-100">
                            <div className="text-sm text-gray-700 font-medium truncate" title={q.question_text}>
                              {q.question_text}
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-blue-600 font-bold">{q.times_used} uses</span>
                              <span className="text-gray-500">{q.correct_percentage?.toFixed(1) || 0}% correct • {q.source}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Never Used */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">💤 Never Used Questions</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {!insights.neverUsed || insights.neverUsed.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-4">All questions have been used! 🎉</div>
                      ) : (
                        insights.neverUsed.map((q: any, idx: number) => (
                          <div key={`never-${q.id}-${idx}`} className="bg-white p-3 rounded border border-gray-100">
                            <div className="text-sm text-gray-700 font-medium truncate" title={q.question_text}>
                              {q.question_text}
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-gray-500">{q.category}</span>
                              <span className="text-gray-400">{q.difficulty} • {q.source}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Phase 3: Quality Flags Tab */}
            {activeTab === 'QualityFlags' && (
              <div className="p-6">
                <QualityFlagsPanel 
                  onQuestionClick={handleOpenDetailModal}
                />
              </div>
            )}

            {/* Phase 4: AI Generate Tab */}
            {activeTab === 'AIGenerate' && (
              <div className="p-6">
                <AIGeneratePanel />
              </div>
            )}

            {/* Import CSV Tab */}
            {activeTab === 'Import' && (
              <div className="p-6">
                <div className="mb-8">
                  <CSVUploadPanel
                    targetTable="questions"
                    onUploadComplete={() => {
                      fetchQuestions();
                    }}
                  />
                </div>
                <div className="border-t pt-8">
                  <CSVUploadPanel
                    targetTable="competition_questions"
                    onUploadComplete={() => {
                      fetchCompetitionQuestions();
                    }}
                  />
                </div>
              </div>
            )}

            {/* Question List (Competition & FreeQuiz tabs) */}
            {activeTab !== 'Insights' && activeTab !== 'Import' && activeTab !== 'QualityFlags' && activeTab !== 'AIGenerate' && (
              <>
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
              
              {/* Phase 2: Bulk Operations & Export */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{selectedQuestions.size} selected</span>
                </div>
                <button
                  onClick={() => handleBulkStatusChange(true)}
                  disabled={selectedQuestions.size === 0}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Enable Selected
                </button>
                <button
                  onClick={() => handleBulkStatusChange(false)}
                  disabled={selectedQuestions.size === 0}
                  className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Disable Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedQuestions.size === 0}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Delete Selected
                </button>
              
              </div>
            </div>

            {/* Questions Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.size === currentQuestions.length && currentQuestions.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question Text</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentQuestions.length > 0 ? (
                    currentQuestions.map(question => {
                      const stats = questionStats[question.id] || null;
                      return (
                      <tr key={question.id} className="hover:bg-gray-50">
                        {/* Checkbox */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.has(question.id)}
                            onChange={() => handleSelectQuestion(question.id)}
                            className="rounded"
                          />
                        </td>
                        
                        {/* Status Toggle */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleToggleStatus(question.id, question.status ?? true)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              question.status !== false
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                            title={question.status !== false ? 'Click to disable' : 'Click to enable'}
                          >
                            {question.status !== false ? '✓ Active' : '✗ Disabled'}
                          </button>
                        </td>
                        
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
                        
                        {/* Stats Column */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stats ? (
                            <div className="text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Used:</span>
                                <span className="font-semibold text-gray-800">{stats.times_used}x</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Correct:</span>
                                <span className={`font-semibold ${
                                  stats.correct_percentage >= 70 ? 'text-green-600' :
                                  stats.correct_percentage >= 40 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {stats.correct_percentage.toFixed(0)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Avg Time:</span>
                                <span className="font-semibold text-gray-800">
                                  {(stats.avg_response_time_ms / 1000).toFixed(1)}s
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No data</span>
                          )}
                        </td>
                        
                        {/* Last Used Column */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {question.last_used_at ? (
                            <div className="text-xs">
                              <div className="text-gray-600">
                                {new Date(question.last_used_at).toLocaleDateString()}
                              </div>
                              <div className="text-gray-400">
                                {new Date(question.last_used_at).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Never used</span>
                          )}
                        </td>
                        
                        {/* Removed old Choices and Answer columns - keeping only Actions */}
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
                      );
                    })
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
            </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <FiTrash2 className="text-red-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{selectedQuestions.size}</span> selected question(s)? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 3: Question Detail Modal */}
      {showDetailModal && (
        <QuestionDetailModal
          isOpen={showDetailModal}
          questionId={selectedQuestionId}
          source={selectedQuestionSource}
          onClose={() => setShowDetailModal(false)}
          onEdit={(question) => {
            setShowDetailModal(false);
            handleEditStart(question);
          }}
          onClone={(question) => {
            setShowDetailModal(false);
            handleCloneQuestion(question);
          }}
        />
      )}
    </div>
  );
};

export default QuestionBank;