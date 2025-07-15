'use client';

import { useState } from "react";
import toast, { Toaster } from 'react-hot-toast';

export default function Dashboard() {
    const [username, setUsername] = useState<string>("John Doe");
    const [userEmail, setUserEmail] = useState<string>("johndoe@gmail.com");
    const [walletBalance, setWalletBalance] = useState<number>(47.50);
    const [entryCredits, setEntryCredits] = useState<number>(2);
    const [competitionsPlayed, setCompetitionsPlayed] = useState<number>(25);
    const [winPercentage, setWinPercentage] = useState<number>(60);
    const [totalEarnings, setTotalEarnings] = useState<number>(250.75);
    const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
    const [withdrawAmount, setWithdrawAmount] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'wallet' | 'history' | 'notifications' | 'support'>('wallet');
    const [supportMessage, setSupportMessage] = useState<string>("");
    const [supportSubject, setSupportSubject] = useState<string>("");

    const handleWithdraw = () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount)) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (amount < 5) {
            toast.error("Minimum withdrawal amount is $5.00");
            return;
        }
        if (amount > walletBalance) {
            toast.error("Insufficient funds");
            return;
        }
        setWalletBalance(walletBalance - amount);
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        toast.success(`Successfully withdrew $${amount.toFixed(2)}`);

    };

    const handleSupportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supportMessage) {
            toast.error("Please fill in all fields");
            return;
        }
        // In a real app, you would send this to your backend
        toast.success("Support ticket submitted successfully!");
        setSupportMessage("");
    };

    return (
        <div className="min-h-fit mt-15 bg-gray-50 text-gray-800 flex items-center justify-center p-6">
            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-transparent bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-lg">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Withdraw Funds</h3>
                        <p className="text-gray-600 mb-6">
                            Enter the amount you wish to withdraw. Current balance: ${walletBalance.toFixed(2)}. Min $5.00.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2 text-gray-600">Amount</label>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 text-gray-700 placeholder-gray-400"
                                placeholder="e.g., 20.00"
                                step="0.01"
                                min="5"
                                max={walletBalance}
                            />
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={() => setShowWithdrawModal(false)}
                                className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWithdraw}
                                className="flex-1 py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Confirm Withdraw
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border-gray-100 w-full">
                {/* Profile Section */}
                <div className="flex items-center border p-6 border-gray-200 rounded-2xl mb-8">
                    <div className="w-16 h-16 bg-lime-100 rounded-full mr-4 flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-lime-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{username}</h2>
                        <p className="text-gray-600">{userEmail}</p>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    {/* Wallet Balance */}
                    <div className="bg-gray-50 p-5 py-8 rounded-xl border-2 border-gray-200 hover:border-lime-400 transition duration-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-lime-100 rounded-lg mr-3">
                                <svg className="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Wallet Balance</p>
                                <p className="text-xl font-bold">${walletBalance.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Entry Credits */}
                    <div className="bg-gray-50 p-5 py-8 rounded-xl border-2 border-gray-200 hover:border-lime-400 transition duration-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entry Credits</p>
                                <p className="text-xl font-bold">{entryCredits}</p>
                            </div>
                        </div>
                    </div>

                    {/* Competitions Played */}
                    <div className="bg-gray-50 p-5 py-8 rounded-xl border-2 border-gray-200 hover:border-lime-400 transition duration-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Competitions</p>
                                <p className="text-xl font-bold">{competitionsPlayed}</p>
                            </div>
                        </div>
                    </div>

                    {/* Win Percentage */}
                    <div className="bg-gray-50 p-5 py-8 rounded-xl border-2 border-gray-200 hover:border-lime-400 transition duration-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg mr-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Win %</p>
                                <p className="text-xl font-bold">{winPercentage}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Earnings */}
                    <div className="bg-gray-50 p-5 py-8 rounded-xl border-2 border-gray-200 hover:border-lime-400 transition duration-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Earnings</p>
                                <p className="text-xl font-bold">${totalEarnings.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        className="w-full py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Withdraw Funds
                    </button>
                </div>

                {/* Recent Transactions Section */}
                <div className="bg-white rounded-2xl p-6 mt-8 shadow-xl border border-gray-100">
                    <div className="flex justify-center items-center mb-6">
                      
                            <div className="w-full grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2 md:justify-center">
                                {/* Wallet Button */}
                                <button
                                    onClick={() => setActiveTab('wallet')}
                                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors ${activeTab === 'wallet'
                                        ? 'bg-lime-400 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Wallet
                                </button>

                                {/* History Button */}
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors ${activeTab === 'history'
                                        ? 'bg-lime-400 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    History
                                </button>

                                {/* Notifications Button */}
                                <button
                                    onClick={() => setActiveTab('notifications')}
                                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors relative ${activeTab === 'notifications'
                                        ? 'bg-lime-400 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">2</span>
                                    Notifications
                                </button>

                                {/* Support Button */}
                                <button
                                    onClick={() => setActiveTab('support')}
                                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-full flex items-center justify-center transition-colors ${activeTab === 'support'
                                        ? 'bg-lime-400 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c-.549-1.165-2.03-2-3.728-2 1.682-2.2 4.694-3.5 7.5-3.5 4.142 0 7.5 3.358 7.5 7.5s-3.358 7.5-7.5 7.5c-1.887 0-3.624-.63-5-1.69v-2.86c.958.284 2.038.444 3.128.444 3.484 0 6.322-2.838 6.322-6.322s-2.838-6.322-6.322-6.322c-1.768 0-3.357.695-4.5 1.822V9z" />
                                    </svg>
                                    Support
                                </button>
                            </div>
                        </div>

                    {/* Wallet Tab Content */}
                    {activeTab === 'wallet' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div>
                                        <p className="text-gray-800 font-medium">Welcome Bonus</p>
                                        <p className="text-sm text-gray-500">6/23/2025, 10:17:05 AM</p>
                                    </div>
                                    <p className="text-lime-600 font-bold">+$10.00</p>
                                </div>
                                <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div>
                                        <p className="text-gray-800 font-medium">Initial Entry Credits Grant</p>
                                        <p className="text-sm text-gray-500">6/23/2025, 10:17:05 AM</p>
                                    </div>
                                    <p className="text-lime-600 font-bold">+$0.00</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History Tab Content */}
                    {activeTab === 'history' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Betting History</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">Premier League Prediction</span>
                                        <span className="text-lime-600 font-bold">+$12.50</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Completed • 6/22/2025</span>
                                        <span>Odds: 2.5</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">Champions League</span>
                                        <span className="text-red-500 font-bold">-$5.00</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Completed • 6/20/2025</span>
                                        <span>Odds: 3.0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab Content */}
                    {activeTab === 'notifications' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-start">
                                        <div className="p-2 bg-lime-100 rounded-full mr-3">
                                            <svg className="w-5 h-5 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium">New competition available</p>
                                            <p className="text-sm text-gray-500">Premier League predictions now open</p>
                                            <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-start">
                                        <div className="p-2 bg-blue-100 rounded-full mr-3">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium">Withdrawal processed</p>
                                            <p className="text-sm text-gray-500">$20.00 has been sent to your account</p>
                                            <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Support Tab Content */}
                    {activeTab === 'support' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Support Center</h3>
                            <div className="space-y-6">


                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-bold mb-3">Contact Support</h4>
                                    <form onSubmit={handleSupportSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Your Message</label>
                                            <textarea
                                                value={supportMessage}
                                                onChange={(e) => setSupportMessage(e.target.value)}
                                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                                                placeholder="Describe your issue or question......"
                                                rows={4}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full max-w-sm py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                                        >
                                            Submit Support Request
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}