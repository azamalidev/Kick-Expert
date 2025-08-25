'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboardData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
        const { data, error } = await supabase
            .rpc("get_top_users_leaderboard"); // remove .select("*")

        if (error) {
            console.error("Error fetching leaderboard:", error);
            setLeaderboardData([]);
        } else if (data) {
            setLeaderboardData(data); // this is already an array
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        setLeaderboardData([]);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
};

    useEffect(() => {
        fetchLeaderboardData();
    }, []);

    const getRankIcon = (position: number) => {
        switch (position) {
            case 1:
                return "🥇";
            case 2:
                return "🥈";
            case 3:
                return "🥉";
            default:
                return position;
        }
    };

    const getRankBadgeStyle = (position: number) => {
        switch (position) {
            case 1:
                return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg";
            case 2:
                return "bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-lg";
            case 3:
                return "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg";
            default:
                return "bg-gradient-to-r from-lime-400 to-lime-500 text-white";
        }
    };

    const getCardStyle = (position: number) => {
        switch (position) {
            case 1:
                return "bg-gradient-to-br from-yellow-50 via-yellow-25 to-amber-50 border-2 border-yellow-200 shadow-2xl transform hover:scale-[1.02]";
            case 2:
                return "bg-gradient-to-br from-gray-50 via-slate-25 to-gray-50 border-2 border-gray-200 shadow-xl transform hover:scale-[1.02]";
            case 3:
                return "bg-gradient-to-br from-orange-50 via-orange-25 to-orange-50 border-2 border-orange-200 shadow-xl transform hover:scale-[1.02]";
            default:
                return "bg-white border border-gray-200 shadow-md hover:shadow-lg transform hover:scale-[1.01]";
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-lime-50 py-8 px-4">
                <div className="max-w-6xl mx-auto mt-16">
                    {/* Header Section */}
                    <div className="text-center mb-12">
                        <div className="relative inline-block mb-6">
                            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-lime-600 via-green-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm">
                                Global Leaderboard
                            </h1>
                            <div className="absolute -top-2 -right-2 text-2xl md:text-3xl animate-bounce">
                                🏆
                            </div>
                        </div>
                        <p className="text-lg md:text-xl text-gray-600 font-medium mb-6">
                            Compete with the world's best players
                        </p>

                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                            <p className="text-xl text-gray-600 animate-pulse">Loading global rankings...</p>
                        </div>
                    ) : leaderboardData.length > 0 ? (
                        <>
                            {/* Top 3 Podium - Desktop */}
                            <div className="hidden md:block mb-12">
                                <div className="flex justify-center items-end space-x-8 mb-8">
                                    {leaderboardData.slice(0, 3).map((user, idx) => {
                                        const actualPosition = user.rank_position;
                                        const podiumOrder = actualPosition === 1 ? 1 : actualPosition === 2 ? 0 : 2; // Center 1st place
                                        const heights = ['h-32', 'h-40', 'h-24']; // 2nd, 1st, 3rd heights

                                        return (
                                            <div key={user.user_id} className={`flex flex-col items-center ${podiumOrder === 1 ? 'order-2' : podiumOrder === 0 ? 'order-1' : 'order-3'}`}>
                                                {/* Trophy/Medal */}
                                                <div className="text-6xl mb-4 animate-pulse">
                                                    {getRankIcon(actualPosition)}
                                                </div>

                                                {/* User Card */}
                                                <div className={`${getCardStyle(actualPosition)} rounded-2xl p-6 text-center transition-all duration-300 min-w-[200px]`}>
                                                    {/* Avatar */}
                                                    <div className="relative mx-auto mb-4">
                                                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto">
                                                            {user.avatar_url ? (
                                                                <Image
                                                                    src={user.avatar_url}
                                                                    alt={user.username}
                                                                    width={80}
                                                                    height={80}
                                                                    className="object-cover w-full h-full"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-lime-100 to-lime-200 flex items-center justify-center">
                                                                    <svg className="w-10 h-10 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Rank Badge */}
                                                        <div className={`absolute -top-2 -right-2 w-8 h-8 ${getRankBadgeStyle(actualPosition)} rounded-full flex items-center justify-center text-sm font-bold`}>
                                                            {actualPosition}
                                                        </div>
                                                    </div>

                                                    {/* User Info */}
                                                    <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{user.username}</h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">XP:</span>
                                                            <span className="font-bold text-blue-600">{(user.xp ?? 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Level:</span>
                                                            <span className="font-bold text-purple-600">{user.rank_label ?? "Rookie"}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Win Rate:</span>
                                                            <span className="font-bold text-emerald-600">{user.win_rate ?? 0}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Podium Base */}
                                                <div className={`w-24 ${heights[podiumOrder]} bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg border-t-4 ${actualPosition === 1 ? 'border-yellow-400' : actualPosition === 2 ? 'border-gray-400' : 'border-orange-400'} mt-4 flex items-end justify-center pb-2`}>
                                                    <span className="text-2xl font-black text-gray-700">{actualPosition}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Mobile Top 3 */}
                            <div className="md:hidden mb-8">
                                <div className="grid gap-4">
                                    {leaderboardData.slice(0, 3).map((user) => (
                                        <div key={user.user_id} className={`${getCardStyle(user.rank_position)} rounded-2xl p-4 transition-all duration-300`}>
                                            <div className="flex items-center space-x-4">
                                                {/* Rank */}
                                                <div className={`w-12 h-12 ${getRankBadgeStyle(user.rank_position)} rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0`}>
                                                    {getRankIcon(user.rank_position)}
                                                </div>

                                                {/* Avatar */}
                                                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                                                    {user.avatar_url ? (
                                                        <Image src={user.avatar_url} alt={user.username} width={64} height={64} className="object-cover w-full h-full" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-lime-100 to-lime-200 flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* User Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-bold text-gray-800 truncate">{user.username}</h3>
                                                    <p className="text-sm text-gray-600">{user.rank_label ?? "Rookie"}</p>
                                                    <div className="flex space-x-4 mt-1">
                                                        <span className="text-xs text-blue-600 font-semibold">{(user.xp ?? 0).toLocaleString()} XP</span>
                                                        <span className="text-xs text-emerald-600 font-semibold">{user.win_rate ?? 0}% WR</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Remaining Players (4-10) - Dashboard Style */}
                            {leaderboardData.length > 3 && (
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                            <div className="p-2 bg-lime-100 rounded-lg mr-3">
                                                <svg
                                                    className="w-6 h-6 text-lime-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                                    />
                                                </svg>
                                            </div>
                                            Complete Rankings
                                        </h3>
                                    </div>

                                    <div className="space-y-3">
                                        {leaderboardData.slice(3, 10).map((user, index) => (
                                            <div
                                                key={user.user_id}
                                                className="p-4 rounded-xl border-2 bg-gray-50 border-gray-200 hover:border-lime-400 transition-all duration-200 hover:shadow-lg"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        {/* Rank Badge */}
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 bg-lime-500 text-white">
                                                            {user.rank_position}
                                                        </div>

                                                        {/* Avatar */}
                                                        <div className="w-12 h-12 bg-lime-100 rounded-full mr-4 flex items-center justify-center overflow-hidden">
                                                            {user.avatar_url ? (
                                                                <Image
                                                                    src={user.avatar_url}
                                                                    alt={user.username}
                                                                    width={48}
                                                                    height={48}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <svg
                                                                    className="w-6 h-6 text-lime-600"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </div>

                                                        {/* User Info */}
                                                        <div>
                                                            <h4 className="font-bold text-gray-800">
                                                                {user.username}
                                                            </h4>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="inline-block px-2 py-1 bg-lime-100 text-lime-800 text-xs font-semibold rounded-full">
                                                                    {user.rank_label ?? "Rookie"}
                                                                </span>
                                                                <span className="text-sm text-gray-600">
                                                                    {user.total_games ?? 0} games • {user.win_rate ?? 0}% win
                                                                    rate
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* XP Points */}
                                                    <div className="text-right">
                                                        <div className="flex justify-end items-center">
                                                            <span className="font-semibold">
                                                                {(user.xp ?? 0).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-gray-500">XP</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-600 mb-4">No Rankings Yet</h3>
                            <p className="text-gray-500 text-lg">Be the first to climb the leaderboard!</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}