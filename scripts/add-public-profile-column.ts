import { createClient } from '@supabase/supabase-js'

// This script adds the public_profile column to the profiles table
async function addPublicProfileColumn() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('Adding public_profile column to profiles table...')

    // First, let's check if the column already exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .eq('column_name', 'public_profile')

    if (checkError) {
      console.error('Error checking column existence:', checkError)
      process.exit(1)
    }

    if (columns && columns.length > 0) {
      console.log('✅ public_profile column already exists')
      return
    }

    // If column doesn't exist, we need to run the ALTER TABLE command
    // Since we can't run DDL through the REST API, we'll provide instructions
    console.log('❌ public_profile column does not exist')
    console.log('')
    console.log('Please run the following SQL in your Supabase SQL Editor:')
    console.log('')
    console.log('ALTER TABLE profiles')
    console.log('ADD COLUMN public_profile BOOLEAN DEFAULT true;')
    console.log('')
    console.log('UPDATE profiles')
    console.log('SET public_profile = true')
    console.log('WHERE public_profile IS NULL;')
    console.log('')
    console.log('Or run the migration file: database/migrations/20251004_add_public_profile_to_profiles.sql')

  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

addPublicProfileColumn()