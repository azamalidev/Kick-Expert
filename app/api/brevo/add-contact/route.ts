import { NextRequest, NextResponse } from 'next/server';

function resolveApiKey(): string | undefined {
  // Prefer the correct BREVO_API_KEY name; fall back to older/typo names if present
  return process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || process.env.BRAWO_API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, listId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const key = resolveApiKey();
    if (!key) {
      console.error('Missing BREVO_API_KEY environment variable');
      return NextResponse.json({ error: 'Brevo API key not configured' }, { status: 500 });
    }

    const listIds = listId ? [parseInt(listId)] : (process.env.BREVO_LIST_ID_NEWSLETTER ? [parseInt(process.env.BREVO_LIST_ID_NEWSLETTER)] : []);

    if (listIds.length === 0) {
      console.warn('No list ID provided for Brevo contact add');
      return NextResponse.json({ error: 'No Brevo list ID configured' }, { status: 500 });
    }

    const contactData: any = {
      email: email,
      listIds: listIds,
    };

    if (name) {
      const parts = name.trim().split(' ');
      contactData.attributes = {
        FIRSTNAME: parts[0],
        LASTNAME: parts.length > 1 ? parts.slice(1).join(' ') : '',
      };
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': key,
        'content-type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brevo API error:', response.status, response.statusText, errorText);

      // If contact already exists, that's actually okay for our use case
      if (response.status === 400 && errorText.includes('Contact already exist')) {
        console.log('Contact already exists in Brevo, which is fine');
        return NextResponse.json({ success: true, message: 'Contact already exists' });
      }

      return NextResponse.json({
        error: `Brevo API error: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('Brevo contact added successfully:', email);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in Brevo add contact API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}