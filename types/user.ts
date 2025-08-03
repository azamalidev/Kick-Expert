export interface SupabaseUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
  email_confirmed: boolean;
}

export interface UserProfile {
  user_id: string;
  username: string;
  avatar_url: string;
  nationality: string;
  created_at: string;
  total_wins?: number;
  total_games?: number;
  xp?: number;
  rank_label?: string;
}