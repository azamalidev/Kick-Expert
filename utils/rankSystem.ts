// XP and Rank System Utilities

export interface RankInfo {
  label: string;
  minXP: number;
  maxXP: number | null;
  color: string;
  bgColor: string;
  icon: string;
}

export const RANK_THRESHOLDS: RankInfo[] = [
  {
    label: 'Rookie',
    minXP: 0,
    maxXP: 199,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '🌱'
  },
  {
    label: 'Starter',
    minXP: 200,
    maxXP: 499,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '⚡'
  },
  {
    label: 'Pro',
    minXP: 500,
    maxXP: 999,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '🔥'
  },
  {
    label: 'Expert',
    minXP: 1000,
    maxXP: 1999,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '⭐'
  },
  {
    label: 'Champion',
    minXP: 2000,
    maxXP: null,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: '👑'
  }
];

export function getRankFromXP(xp: number): RankInfo {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    const rank = RANK_THRESHOLDS[i];
    if (xp >= rank.minXP) {
      return rank;
    }
  }
  return RANK_THRESHOLDS[0]; // Default to Rookie
}

export function getNextRank(currentXP: number): { nextRank: RankInfo; xpNeeded: number } | null {
  const currentRank = getRankFromXP(currentXP);
  const currentRankIndex = RANK_THRESHOLDS.findIndex(rank => rank.label === currentRank.label);
  
  if (currentRankIndex < RANK_THRESHOLDS.length - 1) {
    const nextRank = RANK_THRESHOLDS[currentRankIndex + 1];
    const xpNeeded = nextRank.minXP - currentXP;
    return { nextRank, xpNeeded };
  }
  
  return null; // Already at max rank
}

export function getProgressToNextRank(currentXP: number): number {
  const currentRank = getRankFromXP(currentXP);
  const nextRankInfo = getNextRank(currentXP);
  
  if (!nextRankInfo) return 100; // Max rank reached
  
  const progressInCurrentRank = currentXP - currentRank.minXP;
  const totalXPForCurrentRank = nextRankInfo.nextRank.minXP - currentRank.minXP;
  
  return Math.min(100, (progressInCurrentRank / totalXPForCurrentRank) * 100);
}
