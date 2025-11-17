interface SendEmailProps {
  to: string;
  subject: string;
  html: string;
}

function resolveApiKey(): string | undefined {
  // Prefer the correct BREVO_API_KEY name; fall back to older/typo names if present
  return process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || process.env.BRAWO_API_KEY;
}

export async function sendEmail({ to, subject, html }: SendEmailProps) {
  const key = resolveApiKey();
  if (!key) {
    const msg = 'Missing BREVO_API_KEY (or SENDINBLUE_API_KEY / BRAWO_API_KEY) environment variable';
    console.error(msg);
    throw new Error(msg);
  }

  // Accept either EMAIL_SENDER_* or SENDER_* env var names (the repo currently has SENDER_NAME/SENDER_EMAIL)
  const senderName = process.env.EMAIL_SENDER_NAME || process.env.SENDER_NAME;
  const senderEmail = process.env.EMAIL_SENDER_EMAIL || process.env.SENDER_EMAIL;
  if (!senderEmail || !senderName) {
    const msg = 'Missing EMAIL_SENDER_NAME/SENDER_NAME or EMAIL_SENDER_EMAIL/SENDER_EMAIL environment variables';
    console.error(msg);
    throw new Error(msg);
  }

  const emailData = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [{ email: to }],
    subject: subject,
    htmlContent: html,
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': key,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error(`Brevo API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Email sent to', to, 'subject:', subject);
    console.log(result, 'Brevo response');
    return result;
  } catch (error: any) {
    console.error('Brevo Email Send Error:', error?.message || error);
    throw error;
  }
}

// Marketing API functions for Brevo
export async function addContactToList(email: string, name?: string, listId?: string) {
  const key = resolveApiKey();
  if (!key) throw new Error('Missing BREVO_API_KEY');

  const listIds = listId ? [parseInt(listId)] : (process.env.BREVO_LIST_ID_NEWSLETTER ? [parseInt(process.env.BREVO_LIST_ID_NEWSLETTER)] : []);

  if (listIds.length === 0) {
    console.warn('No list ID provided for Brevo contact add');
    return;
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

  try {
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
      throw new Error(`Brevo API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Brevo contact added:', email);
    return result;
  } catch (err: any) {
    console.error('Brevo add contact error:', err?.message || err);
    // Don't throw, as newsletter should still work
  }
}

export async function removeContactFromList(email: string, listId?: string) {
  const key = resolveApiKey();
  if (!key) throw new Error('Missing BREVO_API_KEY');

  // Brevo doesn't have direct remove from list, but can update contact to remove listIds
  // For simplicity, mark as unsubscribed or log
  console.log('Brevo remove contact not implemented for specific list, relying on suppression');
}
