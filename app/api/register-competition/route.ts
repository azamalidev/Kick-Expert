import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to send competition email
async function sendCompetitionEmail(
  userId: string,
  competitionId: string,
  competitionName: string,
  startTime: string,
  entryFee: number,
  prizePool: string | undefined
) {
  try {
    console.log('📧 Attempting to send competition email to userId:', userId);
    
    const startTimeDate = new Date(startTime);
    const emailPayload = {
      userId,
      competitionId,
      competitionName: competitionName || 'Competition',
      competitionDate: startTimeDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      competitionTime: startTimeDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      entryFee: entryFee.toString(),
      prizePool: prizePool || 'TBD',
    };

    console.log('📦 Email payload:', emailPayload);

    // Use absolute URL for the API call
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const emailApiUrl = `${baseUrl}/api/email/competition`;
    
    console.log('🔗 Calling email API at:', emailApiUrl);

    const response = await fetch(emailApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Email API returned error:', result);
      throw new Error(`Email API failed: ${result.error || 'Unknown error'}`);
    }
    
    console.log('✅ Email sent successfully:', result);
  } catch (emailError) {
    console.error('❌ Failed to send competition email:', emailError);
    // Don't throw - we don't want to fail the registration if email fails
  }
}

// Helper function to send referral confirmation email
async function sendReferralConfirmationEmail(referrerId: string, referredUserId: string) {
  try {
    console.log('📧 Attempting to send referral confirmation email to referrer:', referrerId, 'for referred user:', referredUserId);

    // Get referrer's current referral count for email content
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', referrerId);

    if (referralsError) {
      console.error('❌ Error fetching referrals for email:', referralsError);
      return;
    }

    const effectiveCount = referrals.filter(r => r.email_confirmed && r.competition_joined).length;
    const milestones = [3, 5, 10];
    const nextMilestone = milestones.find(m => effectiveCount < m) || 10;

    const emailPayload = {
      referrerId,
      referredUserId,
      xpAwarded: 50,
      totalReferrals: effectiveCount,
      nextMilestone
    };

    console.log('📦 Referral confirmation email payload:', emailPayload);

    // Use absolute URL for the API call
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const emailApiUrl = `${baseUrl}/api/email/referral-confirmed`;
    
    console.log('🔗 Calling referral confirmation email API at:', emailApiUrl);

    const response = await fetch(emailApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Referral confirmation email API returned error:', result);
      throw new Error(`Referral confirmation email API failed: ${result.error || 'Unknown error'}`);
    }
    
    console.log('✅ Referral confirmation email sent successfully:', result);
  } catch (emailError) {
    console.error('❌ Failed to send referral confirmation email:', emailError);
    // Don't throw - we don't want to fail the registration if email fails
  }
}

export async function POST(req: Request) {
  try {
    const { userId, competitionId, status, paid_amount, payment_method = 'none', payment_type = 'credits' } = await req.json();
    if (!userId || !competitionId || !status || typeof paid_amount !== 'number') {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    // Generate a UUID for id
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();

    // Check if already registered
    const { data: existing, error: checkError } = await supabase
      .from('competition_registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('competition_id', competitionId)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 });
    }

    if (existing) {
      // If status differs, and we're confirming payment, we may need to deduct credits
      if (existing.status !== status) {
        // Proceed to deduct credits and update registration below (fall through)
      } else {
        // Same status — return existing registration instead of error to avoid duplicate failures
        return NextResponse.json({ success: true, data: existing });
      }
    }

    // No existing registration — check competition start time and prevent late registrations (<=5 minutes)
    const { data: competition, error: compErr } = await supabase
      .from('competitions')
      .select('start_time')
      .eq('id', competitionId)
      .maybeSingle();

    if (compErr || !competition) {
      return NextResponse.json({ success: false, error: 'Competition not found.' }, { status: 404 });
    }

    const start = new Date(competition.start_time).getTime();
    const now = Date.now();
    const secondsUntilStart = Math.floor((start - now) / 1000);
    if (secondsUntilStart <= 300) {
      return NextResponse.json({ success: false, error: 'Registration closed for this competition.' }, { status: 400 });
    }

    // Fetch user's current credits
    const { data: userCreditsRow, error: ucErr } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (ucErr) {
      return NextResponse.json({ success: false, error: ucErr.message }, { status: 500 });
    }

    if (!userCreditsRow) {
      return NextResponse.json({ success: false, error: 'User credits not found.' }, { status: 404 });
    }

    // Compute expected cost server-side based on competition name to avoid trusting client values.
    // Fetch competition name
    const { data: compNameRow } = await supabase
      .from('competitions')
      .select('name, prize_pool')
      .eq('id', competitionId)
      .maybeSingle();

    const compName = compNameRow?.name || '';
  const expectedCost = compName === 'Starter League' ? 5 : compName === 'Pro League' ? 10 : compName === 'Elite League' ? 20 : Number(paid_amount);

    // Use expectedCost as authoritative paid_amount
    const authoritativePaidAmount = expectedCost;

    // numeric fields may be returned as strings; normalize to numbers
    const referralCredits = Number(userCreditsRow.referral_credits || 0);
    const winningsCredits = Number(userCreditsRow.winnings_credits || 0);
    const purchasedCredits = Number(userCreditsRow.purchased_credits || 0);

    const totalAvailable = referralCredits + winningsCredits + purchasedCredits;
    if (totalAvailable < authoritativePaidAmount) {
      return NextResponse.json({ success: false, error: 'Insufficient credits' }, { status: 400 });
    }

    // Deduct in order: referral -> winnings -> purchased
  let remaining = authoritativePaidAmount;
    const deducted = { referral: 0, winnings: 0, purchased: 0 } as { referral: number; winnings: number; purchased: number };

    const useReferral = Math.min(referralCredits, remaining);
    deducted.referral = useReferral;
    remaining -= useReferral;

    const useWinnings = Math.min(winningsCredits, remaining);
    deducted.winnings = useWinnings;
    remaining -= useWinnings;

    const usePurchased = Math.min(purchasedCredits, remaining);
    deducted.purchased = usePurchased;
    remaining -= usePurchased;

    // Sanity check
    if (remaining > 0) {
      return NextResponse.json({ success: false, error: 'Insufficient credits after calculation' }, { status: 400 });
    }

    // Update user_credits in one call
    const { data: updatedCredits, error: updateErr } = await supabase
      .from('user_credits')
      .update({
        referral_credits: referralCredits - deducted.referral,
        winnings_credits: winningsCredits - deducted.winnings,
        purchased_credits: purchasedCredits - deducted.purchased,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // Insert or update registration now that credits have been deducted
    const registrationPayload = {
      id,
      user_id: userId,
      competition_id: competitionId,
      status,
      paid_amount: authoritativePaidAmount,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      payment_method,
      payment_type,
    };

    // If existing with different status, update it instead of inserting new
    if (existing && existing.id) {
      const { data: updatedReg, error: updRegErr } = await supabase
        .from('competition_registrations')
        .update({ status, paid_amount, paid_at: new Date().toISOString(), payment_method, payment_type })
        .eq('id', existing.id)
        .select()
        .maybeSingle();

      if (updRegErr) {
        // Try to rollback credits
        await supabase.from('user_credits').update({
          referral_credits: referralCredits,
          winnings_credits: winningsCredits,
          purchased_credits: purchasedCredits,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId);

        return NextResponse.json({ success: false, error: updRegErr.message }, { status: 500 });
      }

      // Send email for updated registration
      sendCompetitionEmail(userId, competitionId, compName, competition.start_time, authoritativePaidAmount, compNameRow?.prize_pool);

      return NextResponse.json({ success: true, data: updatedReg, deductedFrom: deducted });
    }

    const { data, error } = await supabase
      .from('competition_registrations')
      .insert([registrationPayload])
      .select()
      .maybeSingle();

    if (error) {
      // Attempt to rollback deducted credits
      await supabase.from('user_credits').update({
        referral_credits: referralCredits,
        winnings_credits: winningsCredits,
        purchased_credits: purchasedCredits,
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);

      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Send competition confirmation email
    await sendCompetitionEmail(
      userId, 
      competitionId, 
      compName, 
      competition.start_time, 
      authoritativePaidAmount, 
      compNameRow?.prize_pool
    );

    // Check for referral confirmation
    try {
      // Get user data to check for referrer
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('parent_id, email_confirmed')
        .eq('id', userId)
        .single();

      console.log('🔍 Checking referral confirmation for user:', userId, 'userData:', userData, 'userError:', userError);

      if (!userError && userData?.parent_id && userData?.email_confirmed) {
        console.log('✅ User has referrer and email confirmed, checking referral record...');
        
        // User has a referrer and email is confirmed
        // Check if referral record exists and needs updating
        const { data: existingReferral, error: referralError } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', userData.parent_id)
          .eq('referred_id', userId)
          .maybeSingle();

        console.log('📋 Existing referral record:', existingReferral, 'referralError:', referralError);

        if (!referralError) {
          if (!existingReferral) {
            console.log('🆕 Creating new referral record...');
            // Create new referral record
            const { error: insertError } = await supabase
              .from('referrals')
              .insert({
                id: crypto.randomUUID(),
                referrer_id: userData.parent_id,
                referred_id: userId,
                email_confirmed: true,
                competition_joined: true,
                created_at: new Date().toISOString(),
              });

            if (!insertError) {
              console.log('✅ New referral record created, sending confirmation email...');
              // Send referral confirmation email
              await sendReferralConfirmationEmail(userData.parent_id, userId);
            } else {
              console.error('❌ Failed to create referral record:', insertError);
            }
          } else if (!existingReferral.competition_joined) {
            console.log('🔄 Updating existing referral record to mark competition joined...');
            // Update existing referral to mark competition joined
            const { error: updateError } = await supabase
              .from('referrals')
              .update({ 
                competition_joined: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingReferral.id);

            if (!updateError && existingReferral.email_confirmed) {
              console.log('✅ Referral record updated and fully confirmed, sending confirmation email...');
              // Referral is now fully confirmed, send email
              await sendReferralConfirmationEmail(userData.parent_id, userId);
            } else {
              console.log('⚠️ Referral record updated but not sending email - email_confirmed:', existingReferral.email_confirmed, 'updateError:', updateError);
            }
          } else {
            console.log('ℹ️ Referral already fully confirmed, no email sent');
          }
        } else {
          console.error('❌ Error checking referral record:', referralError);
        }
      } else {
        console.log('ℹ️ User has no referrer or email not confirmed - no referral processing needed');
      }
    } catch (referralCheckError) {
      console.error('❌ Error checking referral confirmation:', referralCheckError);
      // Don't fail the registration if referral check fails
    }

    return NextResponse.json({ success: true, data, deductedFrom: deducted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
