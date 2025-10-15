import React, { useState, useEffect } from 'react';
import { FiX, FiEdit2, FiCopy, FiBarChart2, FiClock, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

type QuestionDetail = {
  question: any;
  stats: any;
  performance: {
    correctPercentage: number;
    skipRate: number;
    avgResponseTime: number;
    performanceRating: number;
    totalInteractions: number;
  };
  flags: any[];
  relatedQuestions: any[];
  history: any[];
};

interface QuestionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string | number;
  source: 'free_quiz' | 'competition';
  onEdit?: (question: any) => void;
  onClone?: (question: any) => void;
}

const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  isOpen,
  onClose,
  questionId,
  source,
  onEdit,
  onClone
}) => {
  const [data, setData] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'related'>('overview');

  useEffect(() => {
    if (isOpen && questionId) {
      fetchQuestionDetail();
    }
  }, [isOpen, questionId, source]);

  const fetchQuestionDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/questions/${questionId}/detail?source=${source}`);
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        toast.error('Failed to load question details');
      }
    } catch (error) {
      console.error('Error fetching question detail:', error);
      toast.error('Error loading question details');
    } finally {
      setLoading(false);
    }
  };

  const handleClone = () => {
    if (data?.question) {
      onClone?.(data.question);
      toast.success('Question cloned!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Question Details</h2>
            <p className="text-indigo-100 text-sm mt-1">
              {source === 'free_quiz' ? 'Free Quiz' : 'Competition'} Question #{questionId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading question details...</div>
            </div>
          </div>
        ) : data ? (
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200 px-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'analytics'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiBarChart2 />
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('related')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'related'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Related Questions
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quality Flags */}
                  {data.flags && data.flags.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                        <FiAlertCircle />
                        Quality Issues Detected
                      </div>
                      <div className="space-y-2">
                        {data.flags.map((flag: any, idx: number) => (
                          <div key={idx} className="text-sm text-red-700">
                            • {flag.flag_reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question Content */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="text-lg font-semibold text-gray-900 mb-4">
                      {data.question.question_text}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {data.question.choices?.map((choice: string, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            choice === data.question.correct_answer
                              ? 'bg-green-50 border-green-300 text-green-900'
                              : 'bg-white border-gray-200 text-gray-700'
                          }`}
                        >
                          {choice}
                          {choice === data.question.correct_answer && (
                            <span className="ml-2 text-xs font-semibold">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {data.question.explanation && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-1">Explanation:</div>
                        <div className="text-sm text-blue-800">{data.question.explanation}</div>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-xs text-gray-500 mb-1">Category</div>
                      <div className="font-semibold text-gray-900">{data.question.category}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-xs text-gray-500 mb-1">Difficulty</div>
                      <div className="font-semibold text-gray-900">{data.question.difficulty}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div className={`font-semibold ${data.question.status ? 'text-green-600' : 'text-red-600'}`}>
                        {data.question.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-xs text-gray-500 mb-1">Performance</div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < data.performance.performanceRating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-xs text-green-600 mb-1">Correct %</div>
                      <div className="text-2xl font-bold text-green-900">
                        {data.performance.correctPercentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-xs text-blue-600 mb-1">Total Uses</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {data.performance.totalInteractions}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="text-xs text-orange-600 mb-1 flex items-center gap-1">
                        <FiClock /> Avg Time
                      </div>
                      <div className="text-2xl font-bold text-orange-900">
                        {(data.performance.avgResponseTime / 1000).toFixed(1)}s
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-xs text-purple-600 mb-1">Skip Rate</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {data.performance.skipRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {data.history && data.history.length > 0 ? (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FiTrendingUp />
                          Performance Trend (Last 30 Days)
                        </h3>
                        <div className="bg-white p-4 rounded-lg border">
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.history}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="snapshot_date" 
                                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              />
                              <YAxis />
                              <Tooltip />
                              <Line 
                                type="monotone" 
                                dataKey="correct_percentage" 
                                stroke="#10b981" 
                                name="Correct %"
                                strokeWidth={2}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="times_used" 
                                stroke="#3b82f6" 
                                name="Times Used"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Total Answered</h4>
                          <div className="text-2xl font-bold text-gray-900">{data.stats?.times_answered || 0}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Total Correct</h4>
                          <div className="text-2xl font-bold text-green-600">{data.stats?.times_correct || 0}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Total Skipped</h4>
                          <div className="text-2xl font-bold text-orange-600">{data.stats?.times_skipped || 0}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Last Used</h4>
                          <div className="text-sm text-gray-600">
                            {data.question.last_used_at 
                              ? new Date(data.question.last_used_at).toLocaleDateString()
                              : 'Never'}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <FiBarChart2 className="mx-auto text-5xl mb-3" />
                      <div className="text-lg font-medium">No Historical Data</div>
                      <div className="text-sm">Performance history will appear once the question is used.</div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'related' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Related Questions ({data.relatedQuestions.length})
                  </h3>
                  {data.relatedQuestions.length > 0 ? (
                    <div className="space-y-3">
                      {data.relatedQuestions.map((relQ: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border hover:border-indigo-300 transition-colors">
                          <div className="text-sm font-medium text-gray-900 mb-2">
                            {relQ.question_text?.substring(0, 150)}...
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded">{relQ.category}</span>
                            <span className="px-2 py-1 bg-gray-100 rounded">{relQ.difficulty}</span>
                            <span className={`px-2 py-1 rounded ${relQ.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {relQ.status ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-lg font-medium">No Related Questions</div>
                      <div className="text-sm">No similar questions found in this category and difficulty.</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit?.(data.question)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <FiEdit2 />
                  Edit Question
                </button>
                <button
                  onClick={handleClone}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <FiCopy />
                  Clone Question
                </button>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center text-gray-500">
              <div className="text-lg font-medium">Failed to Load Question</div>
              <div className="text-sm">Please try again.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetailModal;
