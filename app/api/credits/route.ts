import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';
import { CreditType } from '@/types/credits';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get bearer token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify the token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Get user's credit balance
    const { data: credits, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record doesn't exist, create it
        const { data: newCredits, error: createError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            purchased_credits: 0,
            winnings_credits: 0,
            referral_credits: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        return NextResponse.json(newCredits);
      }
      throw error;
    }

    return NextResponse.json(credits);
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { creditType, amount, transactionType, competitionId } =
      await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get bearer token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify the token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Get existing credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (creditsError) {
      if (creditsError.code === 'PGRST116') {
        // Record doesn't exist, create it
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            purchased_credits: creditType === 'purchased' ? amount : 0,
            winnings_credits: creditType === 'winnings' ? amount : 0,
            referral_credits: creditType === 'referral' ? amount : 0,
          });

        if (insertError) throw insertError;
      } else {
        throw creditsError;
      }
    } else {
      // Record exists, update it
      let updateData: Record<string, number> = {};

      switch (creditType as CreditType) {
        case 'purchased':
          updateData.purchased_credits = credits.purchased_credits + amount;
          break;
        case 'winnings':
          updateData.winnings_credits = credits.winnings_credits + amount;
          break;
        case 'referral':
          updateData.referral_credits = credits.referral_credits + amount;
          break;
      }

      const { error: updateError } = await supabase
        .from('user_credits')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    }

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount,
        credit_type: creditType,
        transaction_type: transactionType,
        competition_id: competitionId || null,
        status: 'completed',
      });

    if (transactionError) throw transactionError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error managing credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
