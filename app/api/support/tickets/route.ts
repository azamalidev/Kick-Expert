import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Dummy support tickets - replace with actual database queries
    const dummyTickets = [
      {
        id: '1',
        subject: 'Withdrawal delay',
        status: 'open',
        priority: 'medium',
        category: 'withdrawal',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        last_updated: new Date(Date.now() - 3600000).toISOString(),
        messages: [
          {
            id: '1',
            from: 'user',
            message: 'My withdrawal request from 2 days ago still shows as pending.',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '2',
            from: 'admin',
            message: 'We are reviewing your withdrawal request. It should be processed within 24 hours.',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ]
      },
      {
        id: '2',
        subject: 'Refund request',
        status: 'closed',
        priority: 'low',
        category: 'refund',
        created_at: new Date(Date.now() - 604800000).toISOString(),
        last_updated: new Date(Date.now() - 172800000).toISOString(),
        messages: [
          {
            id: '3',
            from: 'user',
            message: 'I would like to request a refund for my recent purchase.',
            timestamp: new Date(Date.now() - 604800000).toISOString()
          },
          {
            id: '4',
            from: 'admin',
            message: 'Your refund has been processed and should appear in your original payment method within 3-5 business days.',
            timestamp: new Date(Date.now() - 172800000).toISOString()
          }
        ]
      }
    ];

    return NextResponse.json({
      tickets: dummyTickets,
      total: dummyTickets.length
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, category, message } = body;

    if (!subject || !category || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Dummy ticket creation - replace with actual database insert
    const newTicket = {
      id: Date.now().toString(),
      subject,
      category,
      message,
      status: 'open',
      priority: 'medium',
      created_at: new Date().toISOString(),
      user_id: user.id
    };

    return NextResponse.json({
      ticket: newTicket,
      message: 'Support ticket created successfully'
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}