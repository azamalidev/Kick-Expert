-- Migration: Withdrawal flow support
-- Creates user_payment_accounts, withdrawal_audit_logs, provider_payouts, and create_withdrawal_request function

-- 1) user_payment_accounts
CREATE TABLE IF NOT EXISTS public.user_payment_accounts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'stripe',
  provider_account_id text NULL,
  kyc_status text NOT NULL DEFAULT 'unverified',
  onboarding_url text NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_payment_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT user_payment_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_payment_accounts_user_id ON public.user_payment_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_accounts_provider_account_id ON public.user_payment_accounts (provider_account_id);

-- 2) withdrawal_audit_logs
CREATE TABLE IF NOT EXISTS public.withdrawal_audit_logs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  withdrawal_id uuid NOT NULL,
  admin_id uuid NULL,
  action text NOT NULL,
  note text NULL,
  data jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT withdrawal_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT withdrawal_audit_logs_withdrawal_fk FOREIGN KEY (withdrawal_id) REFERENCES public.withdrawals (id) ON DELETE CASCADE,
  CONSTRAINT withdrawal_audit_logs_admin_fk FOREIGN KEY (admin_id) REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_withdrawal_id ON public.withdrawal_audit_logs (withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_admin_id ON public.withdrawal_audit_logs (admin_id);

-- 3) provider_payouts (optional but helpful)
CREATE TABLE IF NOT EXISTS public.provider_payouts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  withdrawal_id uuid NOT NULL,
  provider text NOT NULL,
  provider_payout_id text NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'initiated',
  response jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_payouts_pkey PRIMARY KEY (id),
  CONSTRAINT provider_payouts_withdrawal_fk FOREIGN KEY (withdrawal_id) REFERENCES public.withdrawals (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_provider_payouts_withdrawal_id ON public.provider_payouts (withdrawal_id);

-- 4) create_withdrawal_request function
-- This function performs an atomic reservation/deduction of winnings credits and inserts withdrawal + credit transaction rows.

CREATE OR REPLACE FUNCTION public.create_withdrawal_request(p_user_id uuid, p_amount numeric, p_min_amount numeric DEFAULT 20)
RETURNS TABLE(withdrawal_id uuid) LANGUAGE plpgsql AS
$$
DECLARE
  cur_balance numeric;
  w_id uuid := extensions.uuid_generate_v4();
BEGIN
  IF p_amount < p_min_amount THEN
    RAISE EXCEPTION 'Amount % is below minimum %', p_amount, p_min_amount;
  END IF;

  -- Lock the user's credits row
  SELECT winnings_credits INTO cur_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF cur_balance IS NULL THEN
    RAISE EXCEPTION 'User credits not found';
  END IF;

  IF cur_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient winnings credits (have: %, requested: %)', cur_balance, p_amount;
  END IF;

  -- Deduct winnings credits
  UPDATE public.user_credits
  SET winnings_credits = winnings_credits - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Insert withdrawal (pending)
  INSERT INTO public.withdrawals (id, user_id, amount, currency, status, requested_at, updated_at)
  VALUES (w_id, p_user_id, p_amount, 'EUR', 'pending', now(), now());

  -- Insert credit transaction (pending)
  INSERT INTO public.credit_transactions (id, user_id, amount, credit_type, transaction_type, payment_method, status, created_at, updated_at)
  VALUES (extensions.uuid_generate_v4(), p_user_id, p_amount, 'winnings', 'withdrawal_request', 'internal', 'pending', now(), now());

  RETURN QUERY SELECT w_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 5) Trigger helpers: ensure update_updated_at_column exists (many projects have it); if not, create a simple one
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_withdrawals_updated_at') THEN
    CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_payment_accounts_updated_at') THEN
    CREATE TRIGGER update_user_payment_accounts_updated_at
    BEFORE UPDATE ON public.user_payment_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_provider_payouts_updated_at') THEN
    CREATE TRIGGER update_provider_payouts_updated_at
    BEFORE UPDATE ON public.provider_payouts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- End of migration
