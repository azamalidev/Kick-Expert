export interface SupabaseUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
  email_confirmed: boolean;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  accepted_terms?: boolean;
  terms_accepted_at?: string;
  email_opt_in?: boolean;
  email_opt_in_at?: string | null;
  is_sso_user?: boolean;
  is_anonymous?: boolean;
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
  credits?: number;
}