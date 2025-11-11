import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

// This script creates test competitions for testing weekly schedule emails
async function createTestCompetitions() {
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
    console.log('Creating test competitions for next Saturday...')

    // Calculate next Saturday
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay()) % 7; // 6 = Saturday
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
    nextSaturday.setHours(14, 0, 0, 0); // 2 PM

    const saturdayDate = nextSaturday.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`Next Saturday: ${saturdayDate}`);

    // Test competitions data
    const testCompetitions = [
      {
        name: 'Starter League',
        start_time: `${saturdayDate}T14:00:00.000Z`, // 2 PM UTC
        entry_fee: 5,
        prize_pool: 50,
        status: 'upcoming'
      },
      {
        name: 'Pro League',
        start_time: `${saturdayDate}T16:00:00.000Z`, // 4 PM UTC
        entry_fee: 10,
        prize_pool: 100,
        status: 'upcoming'
      },
      {
        name: 'Elite League',
        start_time: `${saturdayDate}T18:00:00.000Z`, // 6 PM UTC
        entry_fee: 20,
        prize_pool: 200,
        status: 'upcoming'
      }
    ];

    // Insert competitions
    for (const comp of testCompetitions) {
      const { data, error } = await supabase
        .from('competitions')
        .insert([comp])
        .select();

      if (error) {
        console.error(`Error inserting ${comp.name}:`, error);
      } else {
        console.log(`✅ Created ${comp.name} at ${comp.start_time}`);
      }
    }

    console.log('Test competitions creation completed!');

  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

createTestCompetitions()