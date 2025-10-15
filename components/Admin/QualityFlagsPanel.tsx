import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiCheckCircle, FiX, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

type QualityFlag = {
  id: number;
  question_source: string;
  question_id?: number;
  competition_question_id?: string;
  flag_type: 'critical' | 'warning' | 'too_easy' | 'slow' | 'high_skip' | 'unused';
  flag_reason: string;
  flag_value: number;
  flag_threshold: number;
  flagged_at: string;
  question_text?: string;
  category?: string;
  difficulty?: string;
  question_status?: boolean;
  times_used?: number;
  current_correct_percentage?: number;
};

type FlagsSummary = {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  critical: number;
  warning: number;
  info: number;
};

interface QualityFlagsPanelProps {
  onQuestionClick?: (source: string, id: number | string) => void;
}

const QualityFlagsPanel: React.FC<QualityFlagsPanelProps> = ({ onQuestionClick }) => {
  const [flags, setFlags] = useState<QualityFlag[]>([]);
  const [summary, setSummary] = useState<FlagsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all'); // all, critical, warning, etc.
  const [sourceFilter, setSourceFilter] = useState<string>('all'); // all, free_quiz, competition
  const [selectedFlags, setSelectedFlags] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchFlags();
  }, [selectedFilter, sourceFilter]);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('status', 'active');
      if (selectedFilter !== 'all') params.append('type', selectedFilter);
      if (sourceFilter !== 'all') params.append('source', sourceFilter);

      const response = await fetch(`/api/admin/quality-flags?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setFlags(data.flags);
        setSummary(data.summary);
      } else {
        toast.error('Failed to fetch quality flags');
      }
    } catch (error) {
      console.error('Error fetching flags:', error);
      toast.error('Error loading quality flags');
    } finally {
      setLoading(false);
    }
  };

  const runQualityCheck = async () => {
    const toastId = toast.loading('Running quality check on all questions...');
    try {
      const response = await fetch('/api/admin/quality-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'run-check' })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Quality check complete! Found ${data.newFlagsCreated} new issues.`, { id: toastId });
        fetchFlags(); // Refresh the list
      } else {
        toast.error(`Quality check failed: ${data.error}`, { id: toastId });
      }
    } catch (error) {
      toast.error('Error running quality check', { id: toastId });
    }
  };

  const handleResolveFlags = async (flagIds: number[]) => {
    if (flagIds.length === 0) {
      toast.error('Please select flags to resolve');
      return;
    }

    const toastId = toast.loading(`Resolving ${flagIds.length} flag(s)...`);
    try {
      const response = await fetch('/api/admin/quality-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'resolve',
          flagIds,
          resolvedBy: 'admin', // In production, get from auth
          notes: 'Resolved from admin panel'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Resolved ${data.resolved} flag(s)`, { id: toastId });
        setSelectedFlags(new Set());
        fetchFlags();
      } else {
        toast.error(`Failed to resolve flags: ${data.error}`, { id: toastId });
      }
    } catch (error) {
      toast.error('Error resolving flags', { id: toastId });
    }
  };

  const handleDismissFlags = async (flagIds: number[]) => {
    if (flagIds.length === 0) {
      toast.error('Please select flags to dismiss');
      return;
    }

    const toastId = toast.loading(`Dismissing ${flagIds.length} flag(s)...`);
    try {
      const response = await fetch('/api/admin/quality-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'dismiss',
          flagIds,
          resolvedBy: 'admin',
          notes: 'Dismissed as false positive'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Dismissed ${data.dismissed} flag(s)`, { id: toastId });
        setSelectedFlags(new Set());
        fetchFlags();
      } else {
        toast.error(`Failed to dismiss flags: ${data.error}`, { id: toastId });
      }
    } catch (error) {
      toast.error('Error dismissing flags', { id: toastId });
    }
  };

  const toggleFlagSelection = (flagId: number) => {
    const newSelected = new Set(selectedFlags);
    if (newSelected.has(flagId)) {
      newSelected.delete(flagId);
    } else {
      newSelected.add(flagId);
    }
    setSelectedFlags(newSelected);
  };

  const getFlagIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <FiAlertTriangle className="text-red-600" />;
      case 'warning':
      case 'high_skip':
        return <FiAlertCircle className="text-yellow-600" />;
      default:
        return <FiInfo className="text-blue-600" />;
    }
  };

  const getFlagBadgeColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high_skip':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'slow':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'too_easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unused':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Total Flags</div>
            <div className="text-3xl font-bold text-gray-900">{summary.total}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-sm text-red-600 font-medium">Critical</div>
            <div className="text-3xl font-bold text-red-900">{summary.critical}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-600 font-medium">Warning</div>
            <div className="text-3xl font-bold text-yellow-900">{summary.warning}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Info</div>
            <div className="text-3xl font-bold text-blue-900">{summary.info}</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={runQualityCheck}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Run Quality Check
          </button>

          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
          >
            <option value="all">All Types</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="too_easy">Too Easy</option>
            <option value="slow">Slow</option>
            <option value="high_skip">High Skip</option>
            <option value="unused">Unused</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
          >
            <option value="all">All Sources</option>
            <option value="free_quiz">Free Quiz</option>
            <option value="competition">Competition</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedFlags.size} selected</span>
            <button
              onClick={() => handleResolveFlags(Array.from(selectedFlags))}
              disabled={selectedFlags.size === 0}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 text-sm"
            >
              Resolve Selected
            </button>
            <button
              onClick={() => handleDismissFlags(Array.from(selectedFlags))}
              disabled={selectedFlags.size === 0}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 text-sm"
            >
              Dismiss Selected
            </button>
          </div>
        </div>
      </div>

      {/* Flags List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <FiRefreshCw className="animate-spin mx-auto text-3xl mb-2" />
            Loading quality flags...
          </div>
        ) : flags.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiCheckCircle className="mx-auto text-5xl text-green-500 mb-3" />
            <div className="text-lg font-medium">No Quality Issues Found!</div>
            <div className="text-sm">All questions are performing well.</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {flags.map((flag) => (
              <div key={flag.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFlags.has(flag.id)}
                    onChange={() => toggleFlagSelection(flag.id)}
                    className="mt-1"
                  />
                  <div className="flex-shrink-0 text-xl mt-1">
                    {getFlagIcon(flag.flag_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600"
                        onClick={() => onQuestionClick?.(
                          flag.question_source,
                          flag.question_id || flag.competition_question_id!
                        )}
                      >
                        {flag.question_text?.substring(0, 150)}
                        {flag.question_text && flag.question_text.length > 150 ? '...' : ''}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getFlagBadgeColor(flag.flag_type)}`}>
                        {flag.flag_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{flag.flag_reason}</div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Category:</span> {flag.category || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Difficulty:</span> {flag.difficulty || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Source:</span> {flag.question_source}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Times Used:</span> {flag.times_used || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Flagged:</span> 
                        {new Date(flag.flagged_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityFlagsPanel;
