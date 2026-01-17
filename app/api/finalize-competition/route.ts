import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key to bypass RLS for server-side operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get prize pool configuration based on player count
function getPrizePoolConfig(playerCount: number): { percentage: number; winnerCount: number; distribution: number[] } {
    if (playerCount < 50) {
        return {
            percentage: 0.4,
            winnerCount: 3,
            distribution: [0.2, 0.12, 0.08]
        };
    } else if (playerCount < 100) {
        return {
            percentage: 0.45,
            winnerCount: 5,
            distribution: [0.2, 0.12, 0.07, 0.03, 0.03]
        };
    } else {
        return {
            percentage: 0.5,
            winnerCount: 10,
            distribution: [0.2, 0.1, 0.07, 0.04, 0.03, 0.02, 0.01, 0.01, 0.01, 0.01]
        };
    }
}

// Get credit cost based on competition name
function getCreditCost(competitionName: string): number {
    if (competitionName.includes('Starter')) return 5;
    if (competitionName.includes('Pro')) return 10;
    if (competitionName.includes('Elite')) return 20;
    return 5;
}

// Calculate XP awarded based on rank and competition difficulty
function calculateXPAwarded(rank: number, correctCount: number, competitionName: string, winnerCount: number): number {
    if (rank <= winnerCount) {
        return correctCount * 5;
    }
    if (competitionName.includes('Starter')) return 10;
    if (competitionName.includes('Pro')) return 20;
    if (competitionName.includes('Elite')) return 30;
    return 10;
}

export async function POST(req: Request) {
    try {
        const { competitionId } = await req.json();

        if (!competitionId) {
            return NextResponse.json({ success: false, error: "Missing competitionId" }, { status: 400 });
        }

        console.log('🏁 Finalize competition called for:', competitionId);

        // 1. Check if competition exists and get details
        const { data: competition, error: compError } = await supabase
            .from('competitions')
            .select('*')
            .eq('id', competitionId)
            .single();

        if (compError || !competition) {
            console.error('Competition not found:', compError);
            return NextResponse.json({ success: false, error: "Competition not found" }, { status: 404 });
        }

        // 2. Check if competition has ended (allow some buffer time)
        const now = new Date();
        let competitionEndTime: Date | null = null;

        if (competition.end_time) {
            competitionEndTime = new Date(competition.end_time);
        } else if (competition.start_time && competition.duration_minutes) {
            const startTime = new Date(competition.start_time).getTime();
            const durationMs = competition.duration_minutes * 60 * 1000;
            competitionEndTime = new Date(startTime + durationMs);
        }

        // If competition hasn't ended yet, return early
        if (competitionEndTime && now < competitionEndTime) {
            console.log('⏳ Competition has not ended yet, skipping finalization');
            return NextResponse.json({
                success: true,
                message: "Competition not ended yet",
                endsAt: competitionEndTime.toISOString()
            });
        }

        // 3. Check if already finalized (by checking if competition_results has correct data)
        const { data: existingResults, error: existingError } = await supabase
            .from('competition_results')
            .select('id, rank')
            .eq('competition_id', competitionId);

        // Check if we already have finalized results
        if (existingResults && existingResults.length > 0) {
            // Already finalized - return early to prevent duplicate notifications
            console.log('✅ Competition already finalized with', existingResults.length, 'results');
            return NextResponse.json({
                success: true,
                message: "Already finalized",
                resultCount: existingResults.length
            });
        }

        console.log('🔄 Finalizing competition results...');

        // 4. Fetch all completed sessions
        const { data: sessions, error: sessionsError } = await supabase
            .from('competition_sessions')
            .select('id, user_id, correct_answers, end_time, start_time')
            .eq('competition_id', competitionId)
            .not('end_time', 'is', null);

        if (sessionsError) {
            console.error('Error fetching sessions:', sessionsError);
            return NextResponse.json({ success: false, error: sessionsError.message }, { status: 500 });
        }

        if (!sessions || sessions.length === 0) {
            console.log('⚠️ No completed sessions found');
            return NextResponse.json({ success: true, message: "No completed sessions" });
        }

        console.log(`📊 Found ${sessions.length} completed sessions`);

        // 5. Sort sessions by score (desc) and end_time (asc for tie-breaker)
        const sortedSessions = sessions.sort((a, b) => {
            const scoreA = a.correct_answers ?? 0;
            const scoreB = b.correct_answers ?? 0;
            if (scoreB !== scoreA) return scoreB - scoreA;
            return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
        });

        // 6. Calculate prize configuration
        const competitionName = competition.name || '';
        const creditCost = competition.credit_cost || competition.entry_fee || getCreditCost(competitionName);
        const actualPlayerCount = sortedSessions.length;
        const prizeConfig = getPrizePoolConfig(actualPlayerCount);
        const totalRevenue = actualPlayerCount * creditCost;

        console.log('💰 Prize pool calculation:', {
            playerCount: actualPlayerCount,
            creditCost,
            totalRevenue,
            prizePoolPercentage: prizeConfig.percentage,
            winnerCount: prizeConfig.winnerCount
        });

        // 7. Process each user with correct rank
        const results = [];
        for (let i = 0; i < sortedSessions.length; i++) {
            const session = sortedSessions[i];
            const rank = i + 1; // 1-based rank
            const correctAnswers = session.correct_answers ?? 0;

            // Calculate prize amount
            let prizeAmount = 0;
            if (rank <= prizeConfig.winnerCount) {
                const rankIndex = rank - 1;
                prizeAmount = Math.ceil(totalRevenue * prizeConfig.distribution[rankIndex]);
            }

            const xpAwarded = calculateXPAwarded(rank, correctAnswers, competitionName, prizeConfig.winnerCount);
            const isTrophyWinner = rank <= prizeConfig.winnerCount;

            console.log(`👤 User ${session.user_id}: Rank ${rank}, Score ${correctAnswers}, Prize ${prizeAmount}`);

            // 8. Upsert competition_results with CORRECT rank
            const { error: upsertError } = await supabase
                .from('competition_results')
                .upsert({
                    competition_id: competitionId,
                    user_id: session.user_id,
                    score: correctAnswers,
                    rank: rank,
                    xp_awarded: xpAwarded,
                    trophy_awarded: isTrophyWinner,
                    prize_amount: prizeAmount
                }, {
                    onConflict: 'competition_id,user_id'
                });

            if (upsertError) {
                console.error(`❌ Failed to upsert result for user ${session.user_id}:`, upsertError);
            }

            // 9. Handle prize distribution for winners
            if (prizeAmount > 0) {
                // Check if transaction already exists for this session
                const { data: existingTx } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('session_id', session.id)
                    .eq('type', 'reward')
                    .maybeSingle();

                if (!existingTx) {
                    // Insert transaction record
                    const rankSuffix = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;

                    const { error: txError } = await supabase.from('transactions').insert({
                        user_id: session.user_id,
                        type: 'reward',
                        amount: prizeAmount,
                        status: 'completed',
                        metadata: {
                            rank: rank,
                            score: correctAnswers,
                            prize_amount: prizeAmount,
                            competition_id: competitionId,
                            competition_name: competitionName,
                            finalized_at: new Date().toISOString()
                        },
                        description: `Competition Reward (${competitionName}) - Rank: ${rankSuffix} - Score: ${correctAnswers}`,
                        session_id: session.id,
                        source: 'league_competition_finalized'
                    });

                    if (txError) {
                        console.error(`❌ Failed to insert transaction for user ${session.user_id}:`, txError);
                    } else {
                        console.log(`✅ Transaction inserted for user ${session.user_id}: +${prizeAmount} credits`);

                        // Update user_credits - use upsert to handle missing records
                        const { data: currentCredits, error: creditsFetchError } = await supabase
                            .from('user_credits')
                            .select('winnings_credits')
                            .eq('user_id', session.user_id)
                            .maybeSingle();

                        if (creditsFetchError) {
                            console.error(`❌ Error fetching credits for user ${session.user_id}:`, creditsFetchError);
                        }

                        const currentWinnings = currentCredits ? (parseFloat(currentCredits.winnings_credits as any) || 0) : 0;
                        const newWinningsCredits = currentWinnings + prizeAmount;

                        console.log(`💰 Updating credits for user ${session.user_id}: ${currentWinnings} -> ${newWinningsCredits}`);

                        const { error: creditsUpdateError } = await supabase
                            .from('user_credits')
                            .upsert({
                                user_id: session.user_id,
                                winnings_credits: newWinningsCredits,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'user_id' });

                        if (creditsUpdateError) {
                            console.error(`❌ Error updating credits for user ${session.user_id}:`, creditsUpdateError);
                        } else {
                            console.log(`✅ Credits successfully updated for user ${session.user_id}: +${prizeAmount}`);
                        }
                    }
                } else {
                    console.log(`⏭️ Transaction already exists for session ${session.id}, skipping`);
                }
            }

            // 10. Award trophy for winners
            if (isTrophyWinner) {
                const trophyTitles: { [key: number]: string } = {
                    1: 'Champion', 2: 'Runner-up', 3: 'Third Place',
                    4: 'Fourth Place', 5: 'Fifth Place', 6: 'Sixth Place',
                    7: 'Seventh Place', 8: 'Eighth Place', 9: 'Ninth Place', 10: 'Tenth Place'
                };
                const trophyTitle = trophyTitles[rank] || `Place ${rank}`;

                await supabase
                    .from('competition_trophies')
                    .upsert({
                        competition_id: competitionId,
                        user_id: session.user_id,
                        trophy_title: trophyTitle,
                        rank: rank,
                        earned_at: new Date().toISOString()
                    }, { onConflict: 'competition_id,user_id' });
            }

            // 11. Update profile (games, wins, XP)
            const { data: currentProfile } = await supabase
                .from('profiles')
                .select('total_games, total_wins, xp')
                .eq('user_id', session.user_id)
                .maybeSingle();

            if (currentProfile) {
                // Check if we already updated this profile for this competition
                const { data: historyCheck } = await supabase
                    .from('competition_history')
                    .select('id')
                    .eq('competition_id', competitionId)
                    .eq('user_id', session.user_id)
                    .maybeSingle();

                if (!historyCheck) {
                    // Update profile
                    await supabase
                        .from('profiles')
                        .update({
                            total_games: (currentProfile.total_games || 0) + 1,
                            total_wins: (currentProfile.total_wins || 0) + (isTrophyWinner ? 1 : 0),
                            xp: (currentProfile.xp || 0) + xpAwarded,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', session.user_id);

                    // Save competition history
                    await supabase
                        .from('competition_history')
                        .insert({
                            user_id: session.user_id,
                            competition_id: competitionId,
                            competition_name: competitionName,
                            final_rank: rank,
                            final_score: correctAnswers,
                            total_questions: competition.question_count || 15,
                            xp_earned: xpAwarded,
                            credits_earned: prizeAmount,
                            metadata: {
                                finalized_at: new Date().toISOString(),
                                prize_won: prizeAmount > 0,
                                trophy_earned: isTrophyWinner
                            }
                        });

                    console.log(`📊 Profile updated for user ${session.user_id}: +1 game, ${isTrophyWinner ? '+1 win, ' : ''}+${xpAwarded} XP`);
                }
            }

            results.push({
                user_id: session.user_id,
                rank,
                score: correctAnswers,
                prizeAmount,
                xpAwarded
            });
        }

        // 12. Update competition status to 'completed'
        await supabase
            .from('competitions')
            .update({ status: 'completed' })
            .eq('id', competitionId);

        console.log('✅ Competition finalized successfully!');

        return NextResponse.json({
            success: true,
            message: "Competition finalized",
            results: results.slice(0, 10), // Return top 10 for debugging
            totalPlayers: actualPlayerCount,
            prizePool: Math.floor(totalRevenue * prizeConfig.percentage)
        });

    } catch (err: any) {
        console.error('❌ Finalization error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
