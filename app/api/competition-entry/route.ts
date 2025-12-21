import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { competitionId, credits } = await req.json();

    // Initialize Supabase client with auth context
    const supabase = await createServerClient();

    // Get current session (single call)
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has enough credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (creditsError) {
      return NextResponse.json(
        { error: 'Could not verify credit balance' },
        { status: 500 }
      );
    }

    // Get competition details
    const { data: competition, error: compError } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', competitionId)
      .single();

    if (compError || !competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    const requiredCredits = competition.credit_cost;

    // Calculate total available credits
    const totalCredits = (userCredits.purchased_credits || 0) +
      (userCredits.winnings_credits || 0) +
      (userCredits.referral_credits || 0);

    if (totalCredits < requiredCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      );
    }

    // Deduct credits in the following order: referral > winnings > purchased
    let remainingCost = requiredCredits;
    let updatedCredits = { ...userCredits };
    let creditsUsed = {
      referral: 0,
      winnings: 0,
      purchased: 0
    };

    // Use referral credits first
    if (remainingCost > 0 && userCredits.referral_credits > 0) {
      const referralUsed = Math.min(userCredits.referral_credits, remainingCost);
      updatedCredits.referral_credits -= referralUsed;
      remainingCost -= referralUsed;
      creditsUsed.referral = referralUsed;
    }

    // Use winnings credits second
    if (remainingCost > 0 && userCredits.winnings_credits > 0) {
      const winningsUsed = Math.min(userCredits.winnings_credits, remainingCost);
      updatedCredits.winnings_credits -= winningsUsed;
      remainingCost -= winningsUsed;
      creditsUsed.winnings = winningsUsed;
    }

    // Use purchased credits last
    if (remainingCost > 0 && userCredits.purchased_credits > 0) {
      const purchasedUsed = Math.min(userCredits.purchased_credits, remainingCost);
      updatedCredits.purchased_credits -= purchasedUsed;
      remainingCost -= purchasedUsed;
      creditsUsed.purchased = purchasedUsed;
    }

    // Update user's credit balance
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        purchased_credits: updatedCredits.purchased_credits,
        winnings_credits: updatedCredits.winnings_credits,
        referral_credits: updatedCredits.referral_credits
      })
      .eq('user_id', session.user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update credit balance' },
        { status: 500 }
      );
    }

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: session.user.id,
        amount: requiredCredits,
        credit_type: 'competition_entry',
        transaction_type: 'competition_entry',
        competition_id: competitionId,
        status: 'completed'
      });

    if (transactionError) {
      console.error('Failed to record transaction:', transactionError);
    }

    // Register user for the competition
    const { error: regError } = await supabase
      .from('competition_registrations')
      .insert({
        user_id: session.user.id,
        competition_id: competitionId,
        status: 'confirmed',
        paid_amount: requiredCredits,
        payment_type: 'credits'
      });

    if (regError) {
      return NextResponse.json(
        { error: 'Failed to register for competition' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for competition',
      deductedFrom: creditsUsed,
      remainingCredits: {
        purchased: updatedCredits.purchased_credits,
        winnings: updatedCredits.winnings_credits,
        referral: updatedCredits.referral_credits
      }
    });

  } catch (error) {
    console.error('Error processing competition entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
