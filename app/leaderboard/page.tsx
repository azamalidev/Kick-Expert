'use client';

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
// Local fallback for useUser to avoid missing-module compile error; returns { user: null } by default.
// Replace this with the real import when you add the actual UserContext file:
// import { useUser } from "@/contexts/UserContext";
function useUser(): { user: { id: string } | null } {
    return { user: null };
}
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

interface LeaderboardUser {
    id: string;
    user_id: string;
    username: string;
    avatar_url: string | null;
    xp: number;
    rank_label: string;
    total_games: number;
    total_wins: number;
    win_rate: number;
    rank_position: number;
    nationality: string | null;
    league_type: string;
    bronze_count: number;
    silver_count: number;
    gold_count: number;
    total_trophies: number;
}

function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all_time'>('all_time');
    const [leagueFilter, setLeagueFilter] = useState<'all' | 'starter' | 'pro' | 'elite'>('all');
    const [currentUserRank, setCurrentUserRank] = useState<LeaderboardUser | null>(null);
    const [resetCountdown, setResetCountdown] = useState<string>('');
    const { user } = useUser();

    const fetchLeaderboardData = useCallback(async (period: 'weekly' | 'monthly' | 'all_time' = 'all_time', league: string = 'all') => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc("get_top_users_leaderboard", { 
                period,
                league_filter: league
            });

            if (error) {
                console.error("Error fetching leaderboard:", error);
                setLeaderboardData([]);
            } else {
                console.info("Fetched leaderboard:", data);
                
                // Add default trophy stats since RPC may not exist
                const leaderboardWithTrophies = (data || []).map((user: any) => ({
                    ...user,
                    bronze_count: 0,
                    silver_count: 0,
                    gold_count: 0,
                    total_trophies: 0
                }));
                
                setLeaderboardData(leaderboardWithTrophies);
                
                // Find current user's rank if logged in
                if (user) {
                    const userRank = leaderboardWithTrophies?.find((u: LeaderboardUser) => u.user_id === user.id);
                    setCurrentUserRank(userRank || null);
                }
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            setLeaderboardData([]);
        } finally {
            setLoading(false);
        }
    }, [timeframe, leagueFilter]);

    // Calculate countdown timer
    const updateCountdown = () => {
        const now = new Date();
        let nextReset: Date;

        if (timeframe === 'weekly') {
            // Next Monday
            nextReset = new Date(now);
            nextReset.setDate(now.getDate() + (7 - now.getDay()) % 7);
            nextReset.setHours(0, 0, 0, 0);
        } else if (timeframe === 'monthly') {
            // First day of next month
            nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        } else {
            setResetCountdown('');
            return;
        }

        const diff = nextReset.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        setResetCountdown(`${days}d ${hours}h ${minutes}m`);
    };

    useEffect(() => {
        setLeaderboardData([]);
        fetchLeaderboardData(timeframe, leagueFilter);
        
        if (timeframe !== 'all_time') {
            updateCountdown();
            const interval = setInterval(updateCountdown, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [timeframe, leagueFilter, user]);

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

    const getLeagueBadgeStyle = (league: string) => {
        switch (league) {
            case 'elite':
                return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
            case 'pro':
                return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
            case 'starter':
            default:
                return "bg-gradient-to-r from-green-500 to-lime-500 text-white";
        }
    };

    // Sanitize nationality input to remove variation selectors and zero-width joiners
    const cleanNationality = (val?: string) => {
        if (!val) return '';
        return val.replace(/\uFE0E|\uFE0F|\u200D/g, '').trim();
    };

    const isProbablyEmoji = (val: string) => {
        if (!val) return false;
        try {
            return /\p{Emoji}/u.test(val);
        } catch (e) {
            // Fallback: short non-alphanumeric values are likely emoji
            return val.length <= 3 && /[^\w\s]/.test(val);
        }
    };

    // Common name -> ISO mapping for frequent countries
    const countryNameToCode: Record<string, string> = {
        'UNITED KINGDOM': 'GB',
        'UNITED STATES': 'US',
        'UNITED STATES OF AMERICA': 'US',
        'UK': 'GB',
        'ENGLAND': 'GB',
        'SCOTLAND': 'GB',
        'WALES': 'GB',
        'GERMANY': 'DE',
        'FRANCE': 'FR',
        'SPAIN': 'ES',
        'ITALY': 'IT',
        'BRAZIL': 'BR',
        'JAPAN': 'JP',
        'SOUTH KOREA': 'KR',
        'KOREA': 'KR',
        'INDIA': 'IN',
        'CANADA': 'CA',
        'AUSTRALIA': 'AU',
        'CROATIA': 'HR',
        'POLAND': 'PL',
        'PORTUGAL': 'PT',
        'NETHERLANDS': 'NL',
        'BELGIUM': 'BE',
        'SWEDEN': 'SE',
        'NORWAY': 'NO',
        'DENMARK': 'DK',
        'FINLAND': 'FI',
        'GREECE': 'GR',
        'TURKEY': 'TR',
        'RUSSIA': 'RU',
        'UKRAINE': 'UA',
        'ARGENTINA': 'AR',
        'MEXICO': 'MX',
        'CHILE': 'CL',
        'COLOMBIA': 'CO',
        'PERU': 'PE',
        'VENEZUELA': 'VE',
        'EGYPT': 'EG',
        'SOUTH AFRICA': 'ZA',
        'NIGERIA': 'NG',
        'KENYA': 'KE',
        'MOROCCO': 'MA',
        'ALGERIA': 'DZ',
        'TUNISIA': 'TN',
        'CHINA': 'CN',
        'THAILAND': 'TH',
        'VIETNAM': 'VN',
        'PHILIPPINES': 'PH',
        'INDONESIA': 'ID',
        'MALAYSIA': 'MY',
        'SINGAPORE': 'SG',
        'NEW ZEALAND': 'NZ',
        'PAKISTAN': 'PK',
        'BANGLADESH': 'BD',
        'SRI LANKA': 'LK',
        'NEPAL': 'NP',
        'AFGHANISTAN': 'AF',
        'IRAN': 'IR',
        'IRAQ': 'IQ',
        'SAUDI ARABIA': 'SA',
        'UAE': 'AE',
        'UNITED ARAB EMIRATES': 'AE',
        'QATAR': 'QA',
        'KUWAIT': 'KW',
        'OMAN': 'OM',
        'BAHRAIN': 'BH',
        'JORDAN': 'JO',
        'LEBANON': 'LB',
        'SYRIA': 'SY',
        'ISRAEL': 'IL',
        'PALESTINE': 'PS',
        'AUSTRIA': 'AT',
        'SWITZERLAND': 'CH',
        'CZECH REPUBLIC': 'CZ',
        'CZECHIA': 'CZ',
        'SLOVAKIA': 'SK',
        'HUNGARY': 'HU',
        'ROMANIA': 'RO',
        'BULGARIA': 'BG',
        'SERBIA': 'RS',
        'BOSNIA': 'BA',
        'BOSNIA AND HERZEGOVINA': 'BA',
        'MONTENEGRO': 'ME',
        'ALBANIA': 'AL',
        'NORTH MACEDONIA': 'MK',
        'MACEDONIA': 'MK',
        'SLOVENIA': 'SI',
        'LITHUANIA': 'LT',
        'LATVIA': 'LV',
        'ESTONIA': 'EE',
        'ICELAND': 'IS',
        'IRELAND': 'IE',
        'LUXEMBOURG': 'LU',
        'MALTA': 'MT',
        'CYPRUS': 'CY'
    };

    const getFlagEmoji = (countryInput?: string) => {
        const raw = cleanNationality(countryInput);
        if (!raw) return '🏳️';

        // If input already looks like an emoji, return as-is
        if (isProbablyEmoji(raw)) return raw;

        const upper = raw.toUpperCase().trim();

        // If it's a 2-letter code like 'GB' or 'US', create flag
        const alpha2 = upper.replace(/[^A-Z]/g, '');
        if (alpha2.length === 2) {
            const cps = [...alpha2].map(c => 127397 + c.charCodeAt(0));
            return String.fromCodePoint(...cps);
        }

        // Try mapping common full country names to ISO code
        const mapped = countryNameToCode[upper];
        if (mapped) {
            const cps = [...mapped].map(c => 127397 + c.charCodeAt(0));
            return String.fromCodePoint(...cps);
        }

        // Try partial matching (e.g., "United Kingdom" contains "KINGDOM")
        for (const [name, code] of Object.entries(countryNameToCode)) {
            if (upper.includes(name) || name.includes(upper)) {
                const cps = [...code].map(c => 127397 + c.charCodeAt(0));
                return String.fromCodePoint(...cps);
            }
        }

        // If the name contains multiple words, try to derive code from initials
        const words = upper.split(/\s+/).filter(Boolean);
        if (words.length >= 2) {
            const initials = (words[0][0] || '') + (words[1][0] || '');
            if (/^[A-Z]{2}$/.test(initials)) {
                const cps = [...initials].map(c => 127397 + c.charCodeAt(0));
                return String.fromCodePoint(...cps);
            }
        }

        // Final fallback: return white flag emoji instead of text
        return '🏳️';
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-lime-50 py-4 sm:py-8 px-2 sm:px-4">
                <div className="max-w-6xl mx-auto mt-12 sm:mt-16">
                    {/* Header Section */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="relative inline-block mb-4 sm:mb-6">
                            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black bg-gradient-to-r from-lime-600 via-green-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm px-2">
                                Global Leaderboard
                            </h1>
                            <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 text-xl sm:text-2xl md:text-3xl animate-bounce">
                                🏆
                            </div>
                        </div>
                        <p className="text-base sm:text-lg md:text-xl text-gray-600 font-medium mb-4 sm:mb-6 px-2">
                            Compete with the world's best players
                        </p>

                        {/* Timeframe selector + League filters */}
                        <div className="flex flex-col space-y-3 sm:space-y-4 items-center px-2">
                            {/* Timeframe Selector */}
                            <div className="inline-flex items-center bg-white rounded-full shadow-sm border border-gray-100 overflow-hidden w-full sm:w-auto">
                                <button
                                    onClick={() => setTimeframe('weekly')}
                                    aria-pressed={timeframe === 'weekly'}
                                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-lime-300 ${timeframe === 'weekly' ? 'bg-lime-600 text-white' : 'text-gray-700 hover:bg-lime-50' } rounded-l-full`}
                                >
                                    Weekly
                                </button>
                                <button
                                    onClick={() => setTimeframe('monthly')}
                                    aria-pressed={timeframe === 'monthly'}
                                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-lime-300 ${timeframe === 'monthly' ? 'bg-lime-600 text-white' : 'text-gray-700 hover:bg-lime-50' }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setTimeframe('all_time')}
                                    aria-pressed={timeframe === 'all_time'}
                                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-lime-300 ${timeframe === 'all_time' ? 'bg-lime-600 text-white' : 'text-gray-700 hover:bg-lime-50' } rounded-r-full`}
                                >
                                    All-time
                                </button>
                            </div>

                            {/* League Filter */}
                            <div className="inline-flex items-center bg-white rounded-full shadow-sm border border-gray-100 overflow-hidden w-full sm:w-auto">
                                <button
                                    onClick={() => setLeagueFilter('all')}
                                    aria-pressed={leagueFilter === 'all'}
                                    className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-lime-300 ${leagueFilter === 'all' ? 'bg-lime-600 text-white' : 'text-gray-700 hover:bg-lime-50' } rounded-l-full`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setLeagueFilter('starter')}
                                    aria-pressed={leagueFilter === 'starter'}
                                    className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-lime-300 ${leagueFilter === 'starter' ? 'bg-lime-600 text-white' : 'text-gray-700 hover:bg-lime-50' }`}
                                >
                                    Starter
                                </button>
                                <button
                                    onClick={() => setLeagueFilter('pro')}
                                    aria-pressed={leagueFilter === 'pro'}
                                    className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-lime-300 ${leagueFilter === 'pro' ? 'bg-lime-600 text-white' : 'text-gray-700 hover:bg-lime-50' }`}
                                >
                                    Pro
                                </button>
                                <button
                                    onClick={() => setLeagueFilter('elite')}
                                    aria-pressed={leagueFilter === 'elite'}
                                    className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-lime-300 ${leagueFilter === 'elite' ? 'bg-lime-600 text-white' : 'text-gray-700 hover:bg-lime-50' } rounded-r-full`}
                                >
                                    Elite
                                </button>
                            </div>
                        </div>

                        {/* Countdown Timer */}
                        {resetCountdown && (
                            <div className="mt-4 inline-flex items-center justify-center space-x-2 text-sm text-gray-600 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                                <svg className="w-4 h-4 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Resets in: <strong className="text-lime-700">{resetCountdown}</strong></span>
                            </div>
                        )}
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
                                        const podiumOrder = actualPosition === 1 ? 1 : actualPosition === 2 ? 0 : 2;
                                        const heights = ['h-32', 'h-40', 'h-24'];

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
                                                                    alt={`${user.username}'s avatar`}
                                                                    width={80}
                                                                    height={80}
                                                                    className="object-cover w-full h-full"
                                                                    loading="lazy"
                                                                    unoptimized
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        if (target.parentElement) {
                                                                            target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-lime-100 to-lime-200 flex items-center justify-center"><svg class="w-10 h-10 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>`;
                                                                        }
                                                                    }}
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
                                                        {/* League Badge */}
                                                        <div className={`absolute -bottom-2 -left-2 px-2 py-1 ${getLeagueBadgeStyle(user.league_type)} rounded-full text-xs font-bold`}>
                                                            {user.league_type}
                                                        </div>
                                                    </div>

                                                    {/* User Info */}
                                                    <Link href={`/profile/${user.user_id}`} className="block hover:opacity-80 transition-opacity">
                                                        <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{user.username}</h3>
                                                    </Link>
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
                                                        {user.nationality && (
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-gray-600">Country:</span>
                                                                <span className="font-bold text-gray-700 text-lg">
                                                                    {getFlagEmoji(user.nationality)}
                                                                </span>
                                                            </div>
                                                        )}
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
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                                                        {user.avatar_url ? (
                                                            <Image 
                                                                src={user.avatar_url} 
                                                                alt={`${user.username}'s avatar`} 
                                                                width={64} 
                                                                height={64} 
                                                                className="object-cover w-full h-full" 
                                                                loading="lazy"
                                                                unoptimized
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                    if (target.parentElement) {
                                                                        target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-lime-100 to-lime-200 flex items-center justify-center"><svg class="w-8 h-8 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>`;
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-lime-100 to-lime-200 flex items-center justify-center">
                                                                <svg className="w-8 h-8 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`absolute -bottom-2 -right-2 px-2 py-1 ${getLeagueBadgeStyle(user.league_type)} rounded-full text-xs font-bold`}>
                                                        {user.league_type}
                                                    </div>
                                                </div>

                                                {/* User Info */}
                                                <div className="flex-1 min-w-0">
                                                    <Link href={`/profile/${user.user_id}`} className="block hover:opacity-80 transition-opacity">
                                                        <h3 className="text-lg font-bold text-gray-800 truncate">{user.username}</h3>
                                                    </Link>
                                                    <p className="text-sm text-gray-600">{user.rank_label ?? "Rookie"}</p>
                                                    <div className="flex space-x-4 mt-1">
                                                        <span className="text-xs text-blue-600 font-semibold">{(user.xp ?? 0).toLocaleString()} XP</span>
                                                        <span className="text-xs text-emerald-600 font-semibold">{user.win_rate ?? 0}% WR</span>
                                                        {user.total_trophies > 0 && (
                                                            <span className="text-xs text-purple-600 font-semibold">🏆 {user.total_trophies}</span>
                                                        )}
                                                        {user.nationality && (
                                                            <span className="text-xs text-gray-700 font-semibold">
                                                                {getFlagEmoji(user.nationality)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Current User's Rank (if not in top 10) */}
                            {currentUserRank && currentUserRank.rank_position > 10 && (
                                <div className="mb-6">
                                    <div className="bg-gradient-to-r from-lime-500 to-green-500 rounded-2xl p-1 shadow-lg">
                                        <div className="bg-white rounded-xl p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center text-lime-700 font-bold">
                                                        {currentUserRank.rank_position}
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-lime-300">
                                                            {currentUserRank.avatar_url ? (
                                                                <Image 
                                                                    src={currentUserRank.avatar_url} 
                                                                    alt={`${currentUserRank.username}'s avatar`}
                                                                    width={48}
                                                                    height={48}
                                                                    className="object-cover w-full h-full"
                                                                    loading="lazy"
                                                                    unoptimized
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        if (target.parentElement) {
                                                                            target.parentElement.innerHTML = `<div class="w-full h-full bg-lime-100 flex items-center justify-center"><svg class="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>`;
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-lime-100 flex items-center justify-center">
                                                                    <svg className="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-800">You</h4>
                                                            <p className="text-sm text-gray-600">{currentUserRank.rank_label}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-lime-700">
                                                        {(currentUserRank.xp ?? 0).toLocaleString()} XP
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {currentUserRank.win_rate ?? 0}% win rate
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Remaining Players (4-50) - Enhanced Table Style */}
                            <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-md border border-gray-100">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                                        <div className="p-2 bg-lime-100 rounded-lg mr-2 sm:mr-3">
                                            <svg
                                                className="w-5 h-5 sm:w-6 sm:h-6 text-lime-600"
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
                                        <span className="text-base sm:text-xl">Complete Rankings</span>
                                    </h3>
                                    <div className="text-xs sm:text-sm text-gray-500">
                                        <span className="font-semibold text-gray-700 capitalize">{timeframe.replace('_', ' ')}</span>
                                        {leagueFilter !== 'all' && (
                                            <span className="ml-2">
                                                • <span className="font-semibold text-gray-700 capitalize">{leagueFilter}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Table Headers - Desktop */}
                                <div className="hidden md:grid grid-cols-11 gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                                    <div className="col-span-1 text-sm font-semibold text-gray-700 text-center">Rank</div>
                                    <div className="col-span-3 text-sm font-semibold text-gray-700">Player</div>
                                    <div className="col-span-2 text-sm font-semibold text-gray-700 text-center">League</div>
                                    <div className="col-span-2 text-sm font-semibold text-gray-700 text-center">XP</div>
                                    <div className="col-span-2 text-sm font-semibold text-gray-700 text-center">Win Rate</div>
                                    <div className="col-span-1 text-sm font-semibold text-gray-700 text-center">Country</div>
                                </div>

                                <div className="space-y-2">
                                    {leaderboardData.slice(3).map((user) => (
                                        <div
                                            key={user.user_id}
                                            className={`p-4 rounded-xl border-2 bg-gray-50 border-gray-200 hover:border-lime-400 transition-all duration-200 hover:shadow-lg ${
                                                user.user_id === user?.id ? 'ring-2 ring-lime-500 ring-opacity-50 border-lime-400' : ''
                                            }`}
                                        >
                                            {/* Desktop View */}
                                            <div className="hidden md:grid grid-cols-11 gap-4 items-center">
                                                <div className="col-span-1 text-center">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-lime-500 text-white mx-auto">
                                                        {user.rank_position}
                                                    </div>
                                                </div>
                                                <div className="col-span-3">
                                                    <div className="flex items-center">
                                                        <div className="w-12 h-12 bg-lime-100 rounded-full mr-4 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {user.avatar_url ? (
                                                                <Image
                                                                    src={user.avatar_url}
                                                                    alt={`${user.username}'s avatar`}
                                                                    width={48}
                                                                    height={48}
                                                                    className="w-full h-full object-cover"
                                                                    loading="lazy"
                                                                    unoptimized
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        if (target.parentElement) {
                                                                            target.parentElement.innerHTML = `<svg class="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`;
                                                                        }
                                                                    }}
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
                                                        <div>
                                                            <Link href={`/profile/${user.user_id}`} className="hover:opacity-80 transition-opacity">
                                                                <h4 className="font-bold text-gray-800 hover:text-lime-700">
                                                                    {user.username}
                                                                </h4>
                                                            </Link>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className="text-sm text-gray-600">
                                                                    {user.total_games ?? 0} games
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 text-center">
                                                    <span className={`inline-block px-3 py-1 ${getLeagueBadgeStyle(user.league_type)} text-xs font-semibold rounded-full`}>
                                                        {user.league_type}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 text-center">
                                                    <div className="font-bold text-blue-600 text-lg">
                                                        {(user.xp ?? 0).toLocaleString()}
                                                    </div>
                                                    <span className="text-sm text-gray-500">XP</span>
                                                </div>
                                                <div className="col-span-2 text-center">
                                                    <div className="font-bold text-emerald-600 text-lg">
                                                        {user.win_rate ?? 0}%
                                                    </div>
                                                    <span className="text-sm text-gray-500">Win Rate</span>
                                                </div>
                                                <div className="col-span-1 text-center">
                                                    <span className="text-2xl">
                                                        {getFlagEmoji(user.nationality || '')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mobile View */}
                                            <div className="md:hidden">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center min-w-0 flex-1">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-lime-500 text-white mr-2 flex-shrink-0">
                                                            {user.rank_position}
                                                        </div>
                                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-lime-100 rounded-full mr-2 sm:mr-3 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {user.avatar_url ? (
                                                                <Image
                                                                    src={user.avatar_url}
                                                                    alt={`${user.username}'s avatar`}
                                                                    width={40}
                                                                    height={40}
                                                                    className="w-full h-full object-cover"
                                                                    loading="lazy"
                                                                    unoptimized
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        if (target.parentElement) {
                                                                            target.parentElement.innerHTML = `<svg class="w-5 h-5 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`;
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <svg
                                                                    className="w-5 h-5 text-lime-600"
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
                                                        <div className="min-w-0 flex-1">
                                                            <Link href={`/profile/${user.user_id}`} className="hover:opacity-80 transition-opacity">
                                                                <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate">
                                                                    {user.username}
                                                                </h4>
                                                            </Link>
                                                            <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                                                                <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 ${getLeagueBadgeStyle(user.league_type)} text-xs font-semibold rounded-full`}>
                                                                    {user.league_type}
                                                                </span>
                                                                <span className="text-lg sm:text-2xl">
                                                                    {getFlagEmoji(user.nationality || '')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <div className="font-bold text-blue-600 text-sm sm:text-base">
                                                            {(user.xp ?? 0).toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-gray-500">XP</div>
                                                        <div className="text-xs sm:text-sm text-emerald-600 font-semibold mt-1">
                                                            {user.win_rate ?? 0}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
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

export default React.memo(LeaderboardPage);