import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cron Job: Finalize Competitions
 * 
 * This endpoint should be called periodically (e.g., every 5 minutes) by a cron service like Vercel Cron.
 * It checks for competitions that have ended and:
 * 1. Finalizes the leaderboard
 * 2. Distributes prize credits to winners
 * 3. Sends result emails to all participants
 * 
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/finalize-competitions",
 *     "schedule": "every 5 minutes"
 *   }]
 * }
 */

export async function GET(req: NextRequest) {
  try {
    // Verify the request is from authorized source (Vercel Cron or internal)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting competition finalization cron job...');

    // Find competitions that have ended but not been finalized
    // Check for 'active' OR 'running' status and end_time has passed
    const now = new Date().toISOString();
    const { data: endedCompetitions, error: fetchError } = await supabase
      .from('competitions')
      .select('*')
      .in('status', ['active', 'running']) // ✅ Check both active and running
      .lte('end_time', now);

    if (fetchError) {
      console.error('❌ Error fetching ended competitions:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!endedCompetitions || endedCompetitions.length === 0) {
      console.log('✅ No competitions to finalize');
      return NextResponse.json({ 
        success: true, 
        message: 'No competitions to finalize',
        finalized: 0 
      });
    }

    console.log(`📋 Found ${endedCompetitions.length} competition(s) to finalize`);

    const results = [];

    for (const competition of endedCompetitions) {
      try {
        console.log(`\n🏆 Processing competition: ${competition.name} (${competition.id})`);

        // Get all results for this competition
        const { data: competitionResults, error: resultsError } = await supabase
          .from('competition_results')
          .select('*')
          .eq('competition_id', competition.id)
          .order('rank', { ascending: true });

        if (resultsError) {
          console.error(`❌ Error fetching results for ${competition.id}:`, resultsError);
          continue;
        }

        if (!competitionResults || competitionResults.length === 0) {
          console.log(`⚠️ No results found for competition ${competition.id}`);
          
          // Mark as finalized even if no participants
          await supabase
            .from('competitions')
            .update({
              status: 'completed'
            })
            .eq('id', competition.id);
          
          continue;
        }

        console.log(`👥 Processing ${competitionResults.length} participants...`);

        // Distribute credits to winners
        let creditsDistributed = 0;
        const creditUpdates = [];

        for (const result of competitionResults) {
          if (result.prize_amount > 0) {
            console.log(`💰 Awarding ${result.prize_amount} credits to user ${result.user_id} (Rank #${result.rank})`);

            // Fetch current credits
            const { data: userCredits } = await supabase
              .from('user_credits')
              .select('winnings_credits')
              .eq('user_id', result.user_id)
              .maybeSingle();

            const currentWinnings = Number(userCredits?.winnings_credits || 0);
            const newWinnings = currentWinnings + result.prize_amount;

            // Update winnings credits
            const { error: creditError } = await supabase
              .from('user_credits')
              .update({
                winnings_credits: newWinnings,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', result.user_id);

            if (creditError) {
              console.error(`❌ Error updating credits for ${result.user_id}:`, creditError);
            } else {
              creditsDistributed += result.prize_amount;
              creditUpdates.push({
                userId: result.user_id,
                amount: result.prize_amount,
                rank: result.rank
              });
            }
          }

          // Send result email to participant
          try {
            const accuracy = result.score > 0 && competition.total_questions > 0
              ? Math.round((result.score / 20) * 100) // Assuming 20 questions
              : 0;

            const emailPayload = {
              userId: result.user_id,
              competitionId: competition.id,
              competitionName: competition.name,
              rank: result.rank,
              totalPlayers: competitionResults.length,
              score: result.score,
              totalQuestions: 20, // Standard question count
              accuracy,
              xpAwarded: result.xp_awarded || 0,
              prizeAmount: result.prize_amount || 0,
              trophyAwarded: result.trophy_awarded || false,
            };

            console.log(`📧 Sending result email to user ${result.user_id} (Rank #${result.rank})`);

            const emailResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/competition-end`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailPayload),
              }
            );

            if (!emailResponse.ok) {
              const errorData = await emailResponse.json();
              console.error(`❌ Failed to send email to ${result.user_id}:`, errorData);
            } else {
              console.log(`✅ Email sent to user ${result.user_id}`);
            }
          } catch (emailError) {
            console.error(`❌ Error sending email to ${result.user_id}:`, emailError);
            // Don't fail the entire process if email fails
          }
        }

        // Mark competition as finalized
        const { error: updateError } = await supabase
          .from('competitions')
          .update({
            status: 'completed'
          })
          .eq('id', competition.id);

        if (updateError) {
          console.error(`❌ Error marking competition as finalized:`, updateError);
        } else {
          console.log(`✅ Competition ${competition.name} finalized successfully`);
          results.push({
            competitionId: competition.id,
            competitionName: competition.name,
            participants: competitionResults.length,
            creditsDistributed,
            emailsSent: competitionResults.length,
            creditUpdates
          });
        }

      } catch (compError) {
        console.error(`❌ Error processing competition ${competition.id}:`, compError);
        continue;
      }
    }

    console.log(`\n✅ Cron job completed. Finalized ${results.length} competition(s)`);

    return NextResponse.json({
      success: true,
      message: `Successfully finalized ${results.length} competition(s)`,
      finalized: results.length,
      results
    });

  } catch (error) {
    console.error('❌ Error in finalize-competitions cron:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Also support POST for manual triggering
export async function POST(req: NextRequest) {
  return GET(req);
}
