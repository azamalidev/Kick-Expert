import { NextResponse } from 'next/server';

/**
 * Manual Trigger for Competition Finalization
 * 
 * This endpoint allows manual triggering of the competition finalization process.
 * Useful for testing or immediate finalization without waiting for cron.
 * 
 * Usage: POST /api/manual-finalize-competition
 * Body: { "competitionId": "optional-competition-id" }
 */

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { competitionId } = body;

    console.log('🔧 Manual finalization triggered');

    // Call the cron endpoint
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cronUrl = `${baseUrl}/api/cron/finalize-competitions`;

    const response = await fetch(cronUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'local-dev'}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        error: 'Failed to trigger finalization',
        details: result
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Competition finalization triggered successfully',
      result
    });

  } catch (error) {
    console.error('❌ Error triggering manual finalization:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
