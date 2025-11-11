import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      competitionId = 'test-competition-123',
      userId,
      testMode = true
    } = await request.json();

    // Test payload for competition reminder
    const testPayload = {
      competitionId,
      userId: userId || 'test-user-123',
      testMode
    };

    console.log('Testing competition reminder email with payload:', testPayload);

    // Call the actual competition reminder API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/competition-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Competition reminder test failed:', result);
      return NextResponse.json(
        { error: 'Test failed', details: result },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: 'Competition reminder email test completed',
      testPayload,
      result
    });

  } catch (error) {
    console.error('Competition reminder test error:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details },
      { status: 500 }
    );
  }
}

// Example usage endpoint
export async function GET() {
  const examplePayload = {
    competitionId: '550e8400-e29b-41d4-a716-446655440000',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    testMode: true
  };

  return NextResponse.json({
    message: 'Competition Reminder Email Test Endpoint',
    description: 'Test the competition reminder email functionality',
    method: 'POST',
    examplePayload,
    notes: [
      'Set testMode to true to see what would be sent without actually sending emails',
      'Set testMode to false to send actual emails',
      'If userId is provided, sends to that specific user only',
      'If no userId, sends to all registered users for the competition'
    ]
  });
}