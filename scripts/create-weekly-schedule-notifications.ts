import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

// This script creates the weekly_schedule_notifications table
async function createWeeklyScheduleNotificationsTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('Checking if weekly_schedule_notifications table exists...')

    // Check if the table already exists by trying to select from it
    const { data: existingData, error: checkError } = await supabase
      .from('weekly_schedule_notifications')
      .select('id')
      .limit(1);

    // If no error, table exists
    if (!checkError) {
      console.log('✅ weekly_schedule_notifications table already exists')
      return
    }

    // If error is about table not existing, we need to create it
    if (checkError.code === 'PGRST116' || checkError.message?.includes('does not exist')) {
      console.log('❌ weekly_schedule_notifications table does not exist')
      console.log('')
      console.log('Please run the following SQL in your Supabase SQL Editor:')
      console.log('')
      console.log('-- Create weekly_schedule_notifications table to track when weekly schedule emails are sent')
      console.log('-- This prevents duplicate weekly schedule emails for the same week')
      console.log('')
      console.log('CREATE TABLE IF NOT EXISTS weekly_schedule_notifications (')
      console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
      console.log('    week_start_date DATE NOT NULL, -- The Saturday date for the week')
      console.log('    sent_at TIMESTAMPTZ NOT NULL,')
      console.log('    total_recipients INTEGER NOT NULL DEFAULT 0,')
      console.log('    successful_sends INTEGER NOT NULL DEFAULT 0,')
      console.log('    competitions_count INTEGER NOT NULL DEFAULT 0,')
      console.log('    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),')
      console.log('')
      console.log('    -- Ensure only one notification per week')
      console.log('    UNIQUE(week_start_date)')
      console.log(');')
      console.log('')
      console.log('-- Add RLS policies')
      console.log('ALTER TABLE weekly_schedule_notifications ENABLE ROW LEVEL SECURITY;')
      console.log('')
      console.log('-- Allow service role to manage notifications')
      console.log('CREATE POLICY "Service role can manage weekly schedule notifications"')
      console.log('ON weekly_schedule_notifications')
      console.log('FOR ALL')
      console.log('TO service_role')
      console.log('USING (true)')
      console.log('WITH CHECK (true);')
      console.log('')
      console.log('CREATE POLICY "Users can read weekly schedule notifications"')
      console.log('ON weekly_schedule_notifications')
      console.log('FOR SELECT')
      console.log('TO authenticated')
      console.log('USING (true);')
      console.log('')
      console.log('-- Add indexes for performance')
      console.log('CREATE INDEX IF NOT EXISTS idx_weekly_schedule_notifications_week_start_date')
      console.log('ON weekly_schedule_notifications(week_start_date);')
      console.log('')
      console.log('CREATE INDEX IF NOT EXISTS idx_weekly_schedule_notifications_sent_at')
      console.log('ON weekly_schedule_notifications(sent_at);')
      console.log('')
      console.log('Or run the migration file: database/create-weekly-schedule-notifications.sql')
      return
    }

    // If it's a different error, log it
    console.error('Error checking table existence:', checkError)
    process.exit(1)

    // If table doesn't exist, provide SQL instructions
    console.log('❌ weekly_schedule_notifications table does not exist')
    console.log('')
    console.log('Please run the following SQL in your Supabase SQL Editor:')
    console.log('')
    console.log('-- Create weekly_schedule_notifications table to track when weekly schedule emails are sent')
    console.log('-- This prevents duplicate weekly schedule emails for the same week')
    console.log('')
    console.log('CREATE TABLE IF NOT EXISTS weekly_schedule_notifications (')
    console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
    console.log('    week_start_date DATE NOT NULL, -- The Saturday date for the week')
    console.log('    sent_at TIMESTAMPTZ NOT NULL,')
    console.log('    total_recipients INTEGER NOT NULL DEFAULT 0,')
    console.log('    successful_sends INTEGER NOT NULL DEFAULT 0,')
    console.log('    competitions_count INTEGER NOT NULL DEFAULT 0,')
    console.log('    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),')
    console.log('')
    console.log('    -- Ensure only one notification per week')
    console.log('    UNIQUE(week_start_date)')
    console.log(');')
    console.log('')
    console.log('-- Add RLS policies')
    console.log('ALTER TABLE weekly_schedule_notifications ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Allow service role to manage notifications')
    console.log('CREATE POLICY "Service role can manage weekly schedule notifications"')
    console.log('ON weekly_schedule_notifications')
    console.log('FOR ALL')
    console.log('TO service_role')
    console.log('USING (true)')
    console.log('WITH CHECK (true);')
    console.log('')
    console.log('-- Allow authenticated users to read notifications (optional, for transparency)')
    console.log('CREATE POLICY "Users can read weekly schedule notifications"')
    console.log('ON weekly_schedule_notifications')
    console.log('FOR SELECT')
    console.log('TO authenticated')
    console.log('USING (true);')
    console.log('')
    console.log('-- Add indexes for performance')
    console.log('CREATE INDEX IF NOT EXISTS idx_weekly_schedule_notifications_week_start_date')
    console.log('ON weekly_schedule_notifications(week_start_date);')
    console.log('')
    console.log('CREATE INDEX IF NOT EXISTS idx_weekly_schedule_notifications_sent_at')
    console.log('ON weekly_schedule_notifications(sent_at);')
    console.log('')
    console.log('Or run the migration file: database/create-weekly-schedule-notifications.sql')

  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

createWeeklyScheduleNotificationsTable()