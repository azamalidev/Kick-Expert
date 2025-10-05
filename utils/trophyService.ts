import { createClient } from '@supabase/supabase-js';
import { Trophy, AwardedTrophy, TrophyLeaderboardEntry, TrophyStats, TrophyType, TrophyColors } from '../types/trophy';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class TrophyService {
  /**
   * Check and award XP-based trophies for a user
   */
  static async checkAndAwardXPTrophies(userId: string, sessionId?: string): Promise<AwardedTrophy[]> {
    try {
      const { data, error } = await supabase.rpc('check_and_award_xp_trophies', {
        target_user_id: userId,
        current_session_id: sessionId || null
      });

      if (error) {
        console.error('Error checking XP trophies:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Trophy service error:', error);
      return [];
    }
  }

  /**
   * Get all trophies for a specific user
   */
  static async getUserTrophies(userId: string): Promise<Trophy[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_trophies', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error fetching user trophies:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user trophies:', error);
      return [];
    }
  }

  /**
   * Get trophy statistics for a user
   */
  static async getTrophyStats(userId: string): Promise<TrophyStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_trophy_stats', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error fetching trophy stats:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching trophy stats:', error);
      return null;
    }
  }

  /**
   * Get trophy leaderboard
   */
  static async getTrophyLeaderboard(): Promise<TrophyLeaderboardEntry[]> {
    try {
      const { data, error } = await supabase.rpc('get_trophy_leaderboard');

      if (error) {
        console.error('Error fetching trophy leaderboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching trophy leaderboard:', error);
      return [];
    }
  }

  /**
   * Get trophy icon/emoji based on type
   */
  static getTrophyIcon(trophyType: string): string {
    switch (trophyType) {
      case 'bronze': return '🥉'; // Starter tier
      case 'silver': return '🥈'; // Pro tier
      case 'gold': return '🥇'; // Elite tier
      case 'platinum': return '🏆';
      case 'diamond': return '💎';
      default: return '🏅';
    }
  }

  /**
   * Get trophy color classes for Tailwind
   */
  static getTrophyColors(trophyType: string): TrophyColors {
    switch (trophyType) {
      case 'bronze':
        return { 
          bg: 'bg-amber-100', 
          text: 'text-amber-800', 
          border: 'border-amber-300',
          accent: 'bg-amber-500'
        };
      case 'silver':
        return { 
          bg: 'bg-slate-100', 
          text: 'text-slate-800', 
          border: 'border-slate-300',
          accent: 'bg-slate-500'
        };
      case 'gold':
        return { 
          bg: 'bg-yellow-100', 
          text: 'text-yellow-800', 
          border: 'border-yellow-300',
          accent: 'bg-yellow-500'
        };
      case 'platinum':
        return { 
          bg: 'bg-purple-100', 
          text: 'text-purple-800', 
          border: 'border-purple-300',
          accent: 'bg-purple-500'
        };
      case 'diamond':
        return { 
          bg: 'bg-blue-100', 
          text: 'text-blue-800', 
          border: 'border-blue-300',
          accent: 'bg-blue-500'
        };
      default:
        return { 
          bg: 'bg-gray-100', 
          text: 'text-gray-800', 
          border: 'border-gray-300',
          accent: 'bg-gray-500'
        };
    }
  }

  /**
   * Get trophy rarity/rank for display purposes
   */
  static getTrophyRarity(trophyType: string): { level: number; label: string } {
    switch (trophyType) {
      case 'bronze': return { level: 1, label: 'Starter' };
      case 'silver': return { level: 2, label: 'Pro' };
      case 'gold': return { level: 3, label: 'Elite' };
      case 'platinum': return { level: 4, label: 'Epic' };
      case 'diamond': return { level: 5, label: 'Legendary' };
      default: return { level: 0, label: 'Unknown' };
    }
  }

  /**
   * Check if user qualifies for a specific trophy type based on XP
   */
  static checkXPQualification(userXP: number, trophyType: TrophyType): boolean {
    const thresholds = {
      bronze: 200,    // Updated to match new Starter rank
      silver: 500,    // Updated to match new Pro rank
      gold: 1000,     // Updated to match new Expert rank
      platinum: 2000, // Updated to match new Champion rank
      diamond: 5000
    };

    return userXP >= thresholds[trophyType];
  }

  /**
   * Get next trophy milestone for user
   */
  static getNextMilestone(userXP: number): { type: TrophyType; title: string; xpNeeded: number } | null {
    const milestones = [
      { type: 'bronze' as TrophyType, title: 'Starter Achiever', xpThreshold: 200 },
      { type: 'silver' as TrophyType, title: 'Pro Competitor', xpThreshold: 500 },
      { type: 'gold' as TrophyType, title: 'Elite Champion', xpThreshold: 1000 },
      { type: 'platinum' as TrophyType, title: 'Elite Master', xpThreshold: 2000 },
      { type: 'diamond' as TrophyType, title: 'Legendary Player', xpThreshold: 5000 }
    ];

    for (const milestone of milestones) {
      if (userXP < milestone.xpThreshold) {
        return {
          type: milestone.type,
          title: milestone.title,
          xpNeeded: milestone.xpThreshold - userXP
        };
      }
    }

    // All milestones achieved
    return null;
  }

  /**
   * Format trophy earned date for display
   */
  static formatTrophyDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get trophy count by type for a user
   */
  static countTrophiesByType(trophies: Trophy[]): Record<TrophyType, number> {
    const counts: Record<TrophyType, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0
    };

    trophies.forEach(trophy => {
      const type = trophy.trophy_type as TrophyType;
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });

    return counts;
  }

  /**
   * Calculate total trophy value/score
   * Different trophy types have different point values
   */
  static calculateTrophyScore(trophies: Trophy[]): number {
    const points = {
      bronze: 1,
      silver: 3,
      gold: 5,
      platinum: 10,
      diamond: 20
    };

    return trophies.reduce((total, trophy) => {
      const type = trophy.trophy_type as TrophyType;
      return total + (points[type] || 0);
    }, 0);
  }

  /**
   * Get user's trophy rank based on total trophy score
   */
  static getTrophyRank(score: number): { rank: string; color: string; nextRank?: string; pointsNeeded?: number } {
    const ranks = [
      { rank: 'Novice', color: 'text-gray-600', minScore: 0 },
      { rank: 'Collector', color: 'text-orange-600', minScore: 10 },
      { rank: 'Achiever', color: 'text-yellow-600', minScore: 25 },
      { rank: 'Champion', color: 'text-purple-600', minScore: 50 },
      { rank: 'Legend', color: 'text-blue-600', minScore: 100 }
    ];

    for (let i = ranks.length - 1; i >= 0; i--) {
      if (score >= ranks[i].minScore) {
        const nextRank = ranks[i + 1];
        return {
          rank: ranks[i].rank,
          color: ranks[i].color,
          nextRank: nextRank?.rank,
          pointsNeeded: nextRank ? nextRank.minScore - score : undefined
        };
      }
    }

    return ranks[0];
  }
}
