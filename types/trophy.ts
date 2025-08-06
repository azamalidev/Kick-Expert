// Trophy System Types and Interfaces

export interface Trophy {
  id: string;
  user_id: string;
  trophy_type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  title: string;
  description: string;
  earned_at: string;
  session_id?: string;
}

export interface AwardedTrophy {
  awarded_trophy_id: string;
  trophy_type: string;
  title: string;
  description: string;
}

export interface TrophyStats {
  total_trophies: number;
  bronze_count: number;
  silver_count: number;
  gold_count: number;
  platinum_count: number;
  diamond_count: number;
  latest_trophy_date: string | null;
}

export interface TrophyLeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_trophies: number;
  diamond_count: number;
  platinum_count: number;
  gold_count: number;
  silver_count: number;
  bronze_count: number;
  latest_trophy_date: string;
}

export type TrophyType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface TrophyColors {
  bg: string;
  text: string;
  border: string;
  accent: string;
}
