import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      .select('name')
      .eq('id', competitionId)
      .maybeSingle();

    const compName = compNameRow?.name || '';
  const expectedCost = compName === 'Starter League' ? 10 : compName === 'Pro League' ? 20 : compName === 'Elite League' ? 30 : Number(paid_amount);

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

    return NextResponse.json({ success: true, data, deductedFrom: deducted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
