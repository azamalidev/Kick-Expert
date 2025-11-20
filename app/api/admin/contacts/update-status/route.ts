import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { contactId, status } = await req.json();

    if (!contactId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing contactId or status' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('contacts')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', contactId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin update status error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
