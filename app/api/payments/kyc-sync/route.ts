/**
 * Real-time KYC Sync Endpoint
 * 
 * This endpoint allows the frontend to trigger a real-time KYC sync from Stripe
 * It's useful when:
 * 1. User just completed Stripe onboarding
 * 2. User wants to check if their KYC is verified
 * 3. Admin wants to refresh KYC status
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncKycStatusFromStripe, getKycStatusWithSync } from '../../utils/kyc-sync';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const forceRefresh = body.force_refresh === true;

    // Sync KYC status from Stripe
    const syncResult = await syncKycStatusFromStripe(user.id, forceRefresh);

    return NextResponse.json({
      ok: true,
      kyc_status: syncResult.kyc_status,
      provider_account_id: syncResult.provider_account_id,
      synced: syncResult.synced,
      message: syncResult.message
    });
  } catch (error: any) {
    console.error('KYC sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync KYC status', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get KYC status with real-time sync
    const kycStatus = await getKycStatusWithSync(user.id);

    return NextResponse.json({
      ok: true,
      kyc_status: kycStatus.kyc_status,
      provider_account_id: kycStatus.provider_account_id,
      provider: kycStatus.provider,
      synced: kycStatus.synced,
      message: kycStatus.message
    });
  } catch (error: any) {
    console.error('KYC status error:', error);
    return NextResponse.json(
      { error: 'Failed to get KYC status', message: error.message },
      { status: 500 }
    );
  }
}
