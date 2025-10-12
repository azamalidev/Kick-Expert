'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, AlertTriangle, Ban, Flag, CheckCircle, RefreshCw, User, Clock, FileText, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CheatAction {
  id: number;
  competition_id: string;
  user_id: string;
  action_type: 'flag' | 'block' | 'ban';
  reason: string;
  created_by?: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  admin_email?: string;
}

export default function CheatActions() {
  const [cheatActions, setCheatActions] = useState<CheatAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'flag' | 'block' | 'ban'>('all');
  const [updating, setUpdating] = useState<number | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  // Get current admin user
  useEffect(() => {
    const getAdminUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentAdminId(user.id);
      }
    };
    getAdminUser();
  }, []);

  // Fetch cheat actions with user details
  const fetchCheatActions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('competition_cheat_actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('action_type', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching cheat actions:', error);
        toast.error('Failed to load cheat actions');
        return;
      }

      // Fetch user details for each cheat action
      if (data) {
        const enrichedData = await Promise.all(
          data.map(async (action) => {
            // Get user details
            const { data: userData } = await supabase
              .from('users')
              .select('email, full_name')
              .eq('id', action.user_id)
              .single();

            // Get admin details if created_by exists
            let adminData = null;
            if (action.created_by) {
              const { data: admin } = await supabase
                .from('users')
                .select('email')
                .eq('id', action.created_by)
                .single();
              adminData = admin;
            }

            return {
              ...action,
              user_email: userData?.email || 'Unknown',
              user_name: userData?.full_name || 'Unknown User',
              admin_email: adminData?.email || 'System',
            };
          })
        );

        setCheatActions(enrichedData);
      }
    } catch (error) {
      console.error('Error in fetchCheatActions:', error);
      toast.error('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheatActions();
  }, [filter]);

  // Update action type (escalate/de-escalate)
  const updateActionType = async (actionId: number, newType: 'flag' | 'block' | 'ban') => {
    setUpdating(actionId);
    try {
      const { error } = await supabase
        .from('competition_cheat_actions')
        .update({
          action_type: newType,
          created_by: currentAdminId, // Track admin who updated
        })
        .eq('id', actionId);

      if (error) {
        console.error('Error updating action type:', error);
        toast.error('Failed to update action type');
        return;
      }

      // Refresh the list
      await fetchCheatActions();
      toast.success('Action type updated successfully!');
    } catch (error) {
      console.error('Error in updateActionType:', error);
      toast.error('An error occurred while updating');
    } finally {
      setUpdating(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get action badge styling
  const getActionBadge = (type: string) => {
    switch (type) {
      case 'flag':
        return {
          icon: <Flag className="w-3 h-3" />,
          color: 'bg-yellow-100 text-yellow-800',
          label: 'Flagged',
        };
      case 'block':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          color: 'bg-orange-100 text-orange-800',
          label: 'Blocked',
        };
      case 'ban':
        return {
          icon: <Ban className="w-3 h-3" />,
          color: 'bg-red-100 text-red-800',
          label: 'Banned',
        };
      default:
        return {
          icon: <Shield className="w-3 h-3" />,
          color: 'bg-gray-100 text-gray-800',
          label: 'Unknown',
        };
    }
  };

  // Stats
  const stats = {
    total: cheatActions.length,
    flagged: cheatActions.filter((a) => a.action_type === 'flag').length,
    blocked: cheatActions.filter((a) => a.action_type === 'block').length,
    banned: cheatActions.filter((a) => a.action_type === 'ban').length,
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-lime-600" />
            Anti-Cheat System
          </h1>
          <p className="text-gray-600 text-sm mt-1">Monitor and manage suspicious activities</p>
        </div>
        <button
          onClick={fetchCheatActions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Flagged</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.flagged}</p>
            </div>
            <Flag className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Blocked</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.blocked}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Banned</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.banned}</p>
            </div>
            <Ban className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {['all', 'flag', 'block', 'ban'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType as any)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              filter === filterType
                ? 'text-lime-600 border-b-2 border-lime-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            {filterType !== 'all' && (
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {filterType === 'flag' && stats.flagged}
                {filterType === 'block' && stats.blocked}
                {filterType === 'ban' && stats.banned}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cheat Actions Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-lime-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading cheat actions...</p>
          </div>
        ) : cheatActions.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No cheat actions found!</p>
            <p className="text-gray-500 text-sm mt-2">The system is running clean.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Competition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cheatActions.map((action) => {
                  const badge = getActionBadge(action.action_type);
                  return (
                    <tr key={action.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{action.user_name}</p>
                            <p className="text-xs text-gray-500">{action.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                          {action.competition_id}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 line-clamp-2">{action.reason}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-600 text-xs">
                          <Clock className="w-3 h-3" />
                          {formatDate(action.created_at)}
                        </div>
                        {action.admin_email !== 'System' && (
                          <p className="text-xs text-gray-500 mt-1">by {action.admin_email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {action.action_type !== 'flag' && (
                            <button
                              onClick={() => updateActionType(action.id, 'flag')}
                              disabled={updating === action.id}
                              className="text-yellow-600 hover:text-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                              title="Downgrade to Flag"
                            >
                              Flag
                            </button>
                          )}
                          {action.action_type !== 'block' && (
                            <button
                              onClick={() => updateActionType(action.id, 'block')}
                              disabled={updating === action.id}
                              className="text-orange-600 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                              title="Block User"
                            >
                              Block
                            </button>
                          )}
                          {action.action_type !== 'ban' && (
                            <button
                              onClick={() => updateActionType(action.id, 'ban')}
                              disabled={updating === action.id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                              title="Ban User"
                            >
                              Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <h3 className="text-gray-900 font-semibold mb-3 flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-lime-600" />
          Action Levels
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-2">
            <Flag className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-700 font-medium">Flag</p>
              <p className="text-gray-600 text-xs">
                Suspicious activity detected. User can still compete but is monitored.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-orange-700 font-medium">Block</p>
              <p className="text-gray-600 text-xs">
                User temporarily blocked from competitions. Can be reviewed and reversed.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Ban className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium">Ban</p>
              <p className="text-gray-600 text-xs">
                Permanent ban. User cannot participate in any competitions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
