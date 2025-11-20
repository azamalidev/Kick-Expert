import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { contactId, response } = await req.json();

    if (!contactId || !response) {
      return NextResponse.json(
        { success: false, error: 'Missing contactId or response' },
        { status: 400 }
      );
    }

    // Update contact with response (do NOT auto-resolve status)
    const { error } = await supabase
      .from('contacts')
      .update({ 
        response, 
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', contactId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin send response error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
