import { NextResponse } from 'next/server';

// Test endpoint for refund email system
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      status = 'pending',
      amount = 10,
      refundId = 'test-refund-123',
      userId = 'test-user-123',
      refundMethod = 'stripe',
      reason,
      processingFee,
      netAmount,
      email = 'test@example.com'
    } = body;

    // Call the refund email API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const emailUrl = `${appUrl}/api/email/refund-processed`;

    console.log('Testing refund email with status:', status);

    const emailResponse = await fetch(emailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refundId,
        userId,
        amount,
        status,
        reason,
        processingFee,
        netAmount,
        refundMethod,
        requestDate: new Date().toISOString(),
        processedDate: status !== 'pending' ? new Date().toISOString() : undefined,
        email,
      })
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Email test failed:', emailResult);
      return NextResponse.json({
        success: false,
        error: 'Email sending failed',
        details: emailResult
      }, { status: 500 });
    }

    console.log('Email test successful:', emailResult);

    return NextResponse.json({
      success: true,
      message: `Test refund email sent successfully for status: ${status}`,
      emailResult
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to show available test options
export async function GET() {
  return NextResponse.json({
    message: 'Refund Email Test Endpoint',
    usage: 'POST with JSON body containing refund email parameters',
    examplePayloads: {
      pending: {
        status: 'pending',
        amount: 10,
        refundId: 'test-123',
        userId: 'user-123',
        refundMethod: 'stripe',
        email: 'test@example.com'
      },
      approved: {
        status: 'approved',
        amount: 25,
        refundId: 'test-456',
        userId: 'user-456',
        refundMethod: 'paypal',
        email: 'approved@example.com'
      },
      completed: {
        status: 'completed',
        amount: 50,
        refundId: 'test-789',
        userId: 'user-789',
        refundMethod: 'stripe',
        processingFee: 2.50,
        netAmount: 47.50,
        email: 'completed@example.com'
      },
      rejected: {
        status: 'rejected',
        amount: 15,
        refundId: 'test-999',
        userId: 'user-999',
        refundMethod: 'stripe',
        reason: 'Purchase made more than 7 days ago',
        email: 'rejected@example.com'
      }
    }
  });
}