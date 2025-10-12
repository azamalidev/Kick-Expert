import React, { useEffect, useState } from 'react';
import { FiCheck, FiX, FiClock, FiCheckCircle, FiXCircle, FiChevronDown } from 'react-icons/fi';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type Withdrawal = {
  id: string;
  user_id?: string;
  amount: number;
  requested_at?: string;
  status: string;
  provider?: string | null;
  provider_account?: string | null;
  provider_payout_id?: string | null;
  provider_response?: any;
  provider_kyc_status?: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const Payout = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in as admin to view withdrawals');
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch withdrawals');
      const body = await res.json();
      const rows: Withdrawal[] = (body.withdrawals || []).map((r: any) => {
        // provider_response may come from user_payment_accounts.metadata or provider_payouts.response
        const provResp = r.provider_response || r.metadata || {};
        // If provider_account missing, try to infer from the provider_response (stripe account id in `id`)
        const provAcct = r.provider_account || provResp?.id || null;
        return {
          id: r.id,
          user_id: r.user_id,
          amount: Number(r.amount),
          requested_at: r.requested_at,
          status: r.status,
          provider: r.provider,
          provider_account: provAcct,
          provider_payout_id: r.provider_payout_id,
          provider_response: provResp,
          provider_kyc_status: r.provider_kyc_status ?? null
        } as Withdrawal;
      });
      setWithdrawals(rows);
    } catch (err) {
      console.error('Fetch withdrawals error', err);
      toast.error('Failed to load withdrawals');
    } finally {
      setIsLoading(false);
    }
  };

  const approve = async (id: string) => {
    try {
      setActionLoadingId(id);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return toast.error('Admin session missing');

      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Approve failed');

      // update local state
      setWithdrawals((prev) => prev.map(w => w.id === id ? { ...w, status: body.paid ? 'Paid' : 'Approved', provider_payout_id: body.payout_id ?? w.provider_payout_id } : w));
      toast.success(body.paid ? 'Payout sent' : 'Withdrawal approved');
    } catch (err: any) {
      console.error('Approve error', err);
      toast.error(err?.message || 'Failed to approve');
    } finally {
      setActionLoadingId(null);
    }
  };

  const startReject = (id: string) => {
    setRejectingId(id);
    setRejectNote('');
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectNote('');
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    try {
      setActionLoadingId(rejectingId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return toast.error('Admin session missing');

      const res = await fetch(`/api/admin/withdrawals/${rejectingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ note: rejectNote || null })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Reject failed');

      setWithdrawals((prev) => prev.map(w => w.id === rejectingId ? { ...w, status: 'Rejected' } : w));
      toast.success('Withdrawal rejected and funds returned');
      cancelReject();
    } catch (err: any) {
      console.error('Reject error', err);
      toast.error(err?.message || 'Failed to reject');
    } finally {
      setActionLoadingId(null);
    }
  };

  const refreshKyc = async (providerAccountId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return toast.error('Admin session missing');

      // allow admin to pass providerAccountId or rely on provider_response.id if available
      const payload: any = {};
      if (providerAccountId) payload.provider_account_id = providerAccountId;

      const res = await fetch('/api/admin/payments/stripe/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(payload) });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to refresh');
      toast.success(`KYC status: ${body.kyc_status}`);
      // refresh withdrawals (to pick up updated metadata if backend maps it)
      fetchWithdrawals();
    } catch (err: any) {
      console.error('Refresh KYC error', err);
      toast.error(err?.message || 'Failed to refresh KYC');
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

  const pendingAmount = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0);
  const approvedAmount = withdrawals.filter(w => w.status === 'approved' || w.status === 'Paid' || w.status === 'paid').reduce((s, w) => s + w.amount, 0);
  const rejectedAmount = withdrawals.filter(w => w.status === 'rejected' || w.status === 'Rejected').reduce((s, w) => s + w.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Wallet & Payouts</h1>
          <div className="flex items-center space-x-3">
            <button onClick={fetchWithdrawals} className="px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50">Refresh</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">PENDING</p>
                <p className="text-2xl font-semibold text-gray-800">{formatCurrency(pendingAmount)}</p>
                <p className="text-xs text-gray-400 mt-1">{withdrawals.filter(w => w.status === 'pending').length} requests</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <FiClock className="text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">APPROVED</p>
                <p className="text-2xl font-semibold text-gray-800">{formatCurrency(approvedAmount)}</p>
                <p className="text-xs text-gray-400 mt-1">{withdrawals.filter(w => (w.status === 'approved' || w.status === 'Paid' || w.status === 'paid')).length} requests</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FiCheckCircle className="text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">REJECTED</p>
                <p className="text-2xl font-semibold text-gray-800">{formatCurrency(rejectedAmount)}</p>
                <p className="text-xs text-gray-400 mt-1">{withdrawals.filter(w => (w.status === 'rejected' || w.status === 'Rejected')).length} requests</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <FiXCircle className="text-xl" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Withdrawal Requests</h2>
            <div className="text-sm text-gray-500">{isLoading ? 'Loading...' : `${withdrawals.length} total`}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals.map(w => (
                  <React.Fragment key={w.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.user_id ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(w.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.requested_at ? new Date(w.requested_at).toLocaleString() : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          w.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          w.status === 'approved' || w.status === 'Paid' || w.status === 'paid' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>{w.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {w.status === 'pending' ? (
                          <div className="flex items-center space-x-2">
                            <button onClick={() => approve(w.id)} disabled={!!actionLoadingId} className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 flex items-center">
                              {actionLoadingId === w.id ? 'Processing...' : <><FiCheck className="mr-2"/>Approve</>}
                            </button>
                            <button onClick={() => startReject(w.id)} disabled={!!actionLoadingId} className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 flex items-center">
                              <FiX className="mr-2"/>Reject
                            </button>
                            <button onClick={() => setExpandedId(expandedId === w.id ? null : w.id)} className="p-2 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center">
                              <FiChevronDown />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Completed</span>
                        )}
                      </td>
                    </tr>

                    {expandedId === w.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-4 text-sm text-gray-700">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div><strong>Provider:</strong> {w.provider ?? '—'}</div>
                                <div><strong>Provider Account:</strong> {w.provider_account ?? '—'}</div>

                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600 mb-2"><strong>KYC:</strong> {/* we'll show 'unknown' unless provider_response contains account metadata */}
                                  {w.provider_response?.id ? (
                                    (w.provider_response.details_submitted && (w.provider_response.requirements?.currently_due || []).length === 0 && w.provider_response.payouts_enabled) ? (
                                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">Verified</span>
                                    ) : (
                                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">Unverified</span>
                                    )
                                  ) : (
                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">Unknown</span>
                                  )}
                                </div>
                                <div className="mt-2">
                                  <button onClick={() => refreshKyc(w.provider_account || undefined)} className="px-3 py-1 bg-white border rounded-md text-sm">Refresh KYC</button>
                                </div>
                              </div>
                            </div>

                          
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reject modal */}
        {rejectingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-xs bg-opacity-40 p-4">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-3">Reject Withdrawal</h3>
              <p className="text-sm text-gray-600 mb-4">Provide an optional note explaining why this withdrawal is rejected. The funds will be returned to the user's winnings credits.</p>
              <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason (optional)" className="w-full border rounded-md p-3 mb-4" rows={4} />
              <div className="flex justify-end space-x-2">
                <button onClick={cancelReject} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
                <button onClick={confirmReject} className="px-4 py-2 bg-red-600 text-white rounded-md">Confirm Reject</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payout;