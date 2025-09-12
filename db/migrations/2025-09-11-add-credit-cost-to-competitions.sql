-- Add credit_cost column to competitions table
ALTER TABLE competitions
ADD COLUMN credit_cost INTEGER NOT NULL DEFAULT 100;

-- Add payment_type to competition_registrations
ALTER TABLE competition_registrations
ADD COLUMN payment_type VARCHAR(20) CHECK (payment_type IN ('credits', 'stripe', 'paypal')) DEFAULT 'credits';
