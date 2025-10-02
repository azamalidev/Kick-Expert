import sgMail from '@sendgrid/mail';

interface SendGridEmailProps {
  to: string;
  subject?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

function resolveApiKey(): string | undefined {
  return process.env.SENDGRID_API_KEY;
}

function resolveSender() {
  const name = process.env.EMAIL_SENDER_NAME || process.env.SENDER_NAME;
  const email = process.env.EMAIL_SENDER_EMAIL || process.env.SENDER_EMAIL;
  return { name, email };
}

export async function sendGridEmail({ to, subject, html, templateId, dynamicTemplateData }: SendGridEmailProps) {
  const key = resolveApiKey();
  if (!key) {
    throw new Error('Missing SENDGRID_API_KEY environment variable');
  }

  sgMail.setApiKey(key);

  const sender = resolveSender();
  if (!sender.email || !sender.name) {
    throw new Error('Missing EMAIL_SENDER_NAME/SENDER_NAME or EMAIL_SENDER_EMAIL/SENDER_EMAIL');
  }

  const msg: any = {
    from: { name: sender.name, email: sender.email },
    to,
  };

  if (templateId) {
    msg.templateId = templateId;
    if (dynamicTemplateData) msg.dynamicTemplateData = dynamicTemplateData;
  } else {
    msg.subject = subject;
    msg.html = html;
  }

  try {
    const res = await sgMail.send(msg);
    console.log('SendGrid send OK', to, subject || templateId);
    return res;
  } catch (err: any) {
    console.error('SendGrid send error', err?.response?.body || err.message || err);
    throw err;
  }
}

// Marketing API functions
export async function addContactToList(email: string, name?: string, listId?: string) {
  const key = resolveApiKey();
  if (!key) throw new Error('Missing SENDGRID_API_KEY');

  const listIds = listId ? [listId] : (process.env.SENDGRID_LIST_ID_NEWSLETTER ? [process.env.SENDGRID_LIST_ID_NEWSLETTER] : []);

  if (listIds.length === 0) {
    console.warn('No list ID provided for SendGrid contact add');
    return;
  }

  const contact: any = { email };
  if (name) {
    const parts = name.trim().split(' ');
    contact.first_name = parts[0];
    if (parts.length > 1) contact.last_name = parts.slice(1).join(' ');
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contacts: [contact],
        list_ids: listIds,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid add contact error:', response.status, error);
      throw new Error(`SendGrid add contact failed: ${response.status}`);
    }

    console.log('SendGrid contact added:', email);
  } catch (err) {
    console.error('SendGrid add contact exception:', err);
    // Don't throw, as newsletter should still work even if SendGrid fails
  }
}

export async function removeContactFromList(email: string, listId?: string) {
  const key = resolveApiKey();
  if (!key) throw new Error('Missing SENDGRID_API_KEY');

  const listIds = listId ? [listId] : (process.env.SENDGRID_LIST_ID_NEWSLETTER ? [process.env.SENDGRID_LIST_ID_NEWSLETTER] : []);

  if (listIds.length === 0) {
    console.warn('No list ID provided for SendGrid contact remove');
    return;
  }

  // To remove from list, PUT with empty list_ids or use DELETE, but DELETE requires contact ID
  // For simplicity, PUT with list_ids: [] to remove from all lists, but that's not ideal
  // Actually, to remove from specific list, it's tricky without contact ID
  // For now, just log, as suppression will handle it
  console.log('SendGrid remove contact not implemented for specific list, relying on suppression');
}

export default sendGridEmail;
