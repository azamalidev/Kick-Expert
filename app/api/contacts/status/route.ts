import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('id');

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Try to find by full ID or last 8 characters
    let contact = null;
    let error = null;

    // First try exact match
    const exactMatch = await supabase
      .from('contacts')
      .select('id, name, email, topic, message, status, priority, response, responded_at, created_at, updated_at')
      .eq('id', contactId)
      .single();

    if (exactMatch.data) {
      contact = exactMatch.data;
    } else {
      // Try matching last 8 characters (case insensitive)
      const cleanId = contactId.replace('#', '').toUpperCase();
      const { data: allContacts, error: searchError } = await supabase
        .from('contacts')
        .select('id, name, email, topic, message, status, priority, response, responded_at, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (searchError) {
        error = searchError;
      } else if (allContacts) {
        contact = allContacts.find(c => 
          c.id.slice(-8).toUpperCase() === cleanId
        );
      }
    }

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found. Please check your reference ID.' },
        { status: 404 }
      );
    }

    // Mask sensitive information - only show partial email
    const maskedContact = {
      ...contact,
      email: contact.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    };

    return NextResponse.json({ 
      success: true, 
      contact: maskedContact 
    });
  } catch (error: any) {
    console.error('Contact status fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
