'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Check, X, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface RefundRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  payment_method?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('pending');
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, [filter]);

  const fetchRefunds = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in');
        return;
      }

      let query = supabase
        .from('refund_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRefunds(data || []);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast.error('Failed to fetch refund requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (refund: RefundRequest) => {
    try {
      setIsProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/admin/refunds/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ refund_id: refund.id })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to approve refund');
      }

      toast.success('Refund approved and processing initiated');
      fetchRefunds();
      setSelectedRefund(null);
    } catch (error) {
      console.error('Error approving refund:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (refund: RefundRequest, reason: string) => {
    try {
      setIsProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/admin/refunds/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ refund_id: refund.id, reason })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to reject refund');
      }

      toast.success('Refund rejected');
      fetchRefunds();
      setSelectedRefund(null);
    } catch (error) {
      console.error('Error rejecting refund:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'approved':
        return <Check size={16} />;
      case 'completed':
        return <Check size={16} />;
      case 'rejected':
        return <X size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Refund Management</h1>
        <p className="text-gray-600 mt-1">Review and process refund requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{refunds.filter(r => r.status === 'pending').length}</p>
            </div>
            <Clock size={32} className="text-yellow-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{refunds.filter(r => r.status === 'approved').length}</p>
            </div>
            <Check size={32} className="text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{refunds.filter(r => r.status === 'completed').length}</p>
            </div>
            <Check size={32} className="text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{refunds.filter(r => r.status === 'rejected').length}</p>
            </div>
            <X size={32} className="text-red-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          {(['all', 'pending', 'approved', 'completed', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                filter === status
                  ? 'border-b-2 border-lime-500 text-lime-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Refunds Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600"></div>
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No refund requests found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {refunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{refund.user_email || refund.user_id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{refund.amount} credits</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{refund.reason}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(refund.status)}`}>
                        {getStatusIcon(refund.status)}
                        <span>{refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(refund.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      {refund.status === 'pending' && (
                        <button
                          onClick={() => setSelectedRefund(refund)}
                          className="text-lime-600 hover:text-lime-700 font-medium"
                        >
                          Review
                        </button>
                      )}
                      {refund.status !== 'pending' && (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Review Refund Request</h2>

            <div className="space-y-4 mb-6">

              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold text-gray-900">{selectedRefund.amount} credits</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reason</p>
                <p className="text-gray-900">{selectedRefund.reason}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Requested</p>
                <p className="text-gray-900">{new Date(selectedRefund.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Approving this refund will initiate a refund to the user's original payment method via Stripe/PayPal.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedRefund(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedRefund, 'Rejected by admin')}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleApprove(selectedRefund)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
