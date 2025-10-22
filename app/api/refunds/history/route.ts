import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Fetch refund history for the user
    const { data: refunds, error } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Refund history error:', error);
      return NextResponse.json({ error: 'Failed to fetch refund history' }, { status: 500 });
    }

    return NextResponse.json(refunds || []);
  } catch (error) {
    console.error('Refund history API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
