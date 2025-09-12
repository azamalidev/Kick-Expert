export type CreditType = 'purchased' | 'winnings' | 'referral';

export type TransactionType = 
  | 'purchase'
  | 'competition_entry'
  | 'competition_win'
  | 'referral_bonus'
  | 'withdrawal';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface CreditBalance {
  purchased_credits: number;
  winnings_credits: number;
  referral_credits: number;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  credit_type: CreditType;
  transaction_type: TransactionType;
  payment_method?: 'stripe' | 'paypal';
  payment_id?: string;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
}
