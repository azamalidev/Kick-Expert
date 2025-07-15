import React, { useState } from 'react';
import { FiCheck, FiX, FiDollarSign, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

type Payout = {
  id: number;
  user: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

const Payout = () => {
  // Sample payout data
  const initialPayouts: Payout[] = [
    { id: 1, user: 'ExpertPlayer7', amount: 50.00, date: '6/23/2025', status: 'Pending' },
    { id: 2, user: 'Winner_99', amount: 120.50, date: '6/23/2025', status: 'Pending' },
    { id: 3, user: 'QuizMaster', amount: 75.25, date: '6/22/2025', status: 'Approved' },
    { id: 4, user: 'BrainBox', amount: 200.00, date: '6/21/2025', status: 'Rejected' },
    { id: 5, user: 'ExpertPlayer7', amount: 200.00, date: '6/21/2025', status: 'Pending' },
    { id: 6, user: 'QuizMaster', amount: 400.00, date: '6/24/2025', status: 'Approved' },
  ];

  const [payouts, setPayouts] = useState<Payout[]>(initialPayouts);
  const [pendingAmount] = useState(2450.75);
  const [approvedAmount] = useState(12830.00);
  const [rejectedAmount] = useState(315.25);

  // Handle approve payout
  const handleApprove = (id: number) => {
    setPayouts(payouts.map(payout => 
      payout.id === id ? { ...payout, status: 'Approved' } : payout
    ));
  };

  // Handle reject payout
  const handleReject = (id: number) => {
    setPayouts(payouts.map(payout => 
      payout.id === id ? { ...payout, status: 'Rejected' } : payout
    ));
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <h1 className="text-3xl font-bold text-gray-800">Wallet & Payouts</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pending Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">PENDING THIS WEEK</p>
                  <p className="text-2xl font-semibold text-gray-800">{formatCurrency(pendingAmount)}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <FiClock className="text-xl" />
                </div>
              </div>
            </div>

            {/* Approved Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">APPROVED THIS WEEK</p>
                  <p className="text-2xl font-semibold text-gray-800">{formatCurrency(approvedAmount)}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <FiCheckCircle className="text-xl" />
                </div>
              </div>
            </div>

            {/* Rejected Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">REJECTED THIS WEEK</p>
                  <p className="text-2xl font-semibold text-gray-800">{formatCurrency(rejectedAmount)}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <FiXCircle className="text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal Requests */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Withdrawal Requests</h2>
            </div>

            {/* Payouts Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payouts.map(payout => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payout.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payout.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payout.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          payout.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payout.status === 'Pending' ? (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleApprove(payout.id)}
                              className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50"
                              title="Approve"
                            >
                              <FiCheck className="text-lg" />
                            </button>
                            <button 
                              onClick={() => handleReject(payout.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                              title="Reject"
                            >
                              <FiX className="text-lg" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payout;