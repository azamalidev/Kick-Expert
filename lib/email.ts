import SibApiV3Sdk from 'sib-api-v3-sdk';

const defaultClient = SibApiV3Sdk.ApiClient.instance;

const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();
const contactsApi = new SibApiV3Sdk.ContactsApi();

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
  // Set API key at call time so missing env var is easier to detect and doesn't throw during module import
  const apiKey = defaultClient.authentications['api-key'];
  const key = resolveApiKey();
  if (!key) {
    const msg = 'Missing BREVO_API_KEY (or SENDINBLUE_API_KEY / BRAWO_API_KEY) environment variable';
    console.error(msg);
    throw new Error(msg);
  }
  apiKey.apiKey = key as string;

  // Accept either EMAIL_SENDER_* or SENDER_* env var names (the repo currently has SENDER_NAME/SENDER_EMAIL)
  const senderName = process.env.EMAIL_SENDER_NAME || process.env.SENDER_NAME;
  const senderEmail = process.env.EMAIL_SENDER_EMAIL || process.env.SENDER_EMAIL;
  if (!senderEmail || !senderName) {
    const msg = 'Missing EMAIL_SENDER_NAME/SENDER_NAME or EMAIL_SENDER_EMAIL/SENDER_EMAIL environment variables';
    console.error(msg);
    throw new Error(msg);
  }

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = {
    name: senderName as string,
    email: senderEmail as string,
  };
  sendSmtpEmail.to = [{ email: to }];

  try {
    const response = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);

    console.log('Email sent to', to, 'subject:', subject);
    console.log(response, 'Brevo response');
    return response;
  } catch (error: any) {
    // Axios-style errors from the SDK include response etc. Log the most useful parts.
    console.error('Brevo Email Send Error:', error?.response || error?.message || error);
    throw error;
  }
}

// Marketing API functions for Brevo
export async function addContactToList(email: string, name?: string, listId?: string) {
  const key = resolveApiKey();
  if (!key) throw new Error('Missing BREVO_API_KEY');

  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = key;

    const listIds = listId ? [parseInt(listId)] : (process.env.BREVO_LIST_ID_NEWSLETTER ? [parseInt(process.env.BREVO_LIST_ID_NEWSLETTER)] : []);

  if (listIds.length === 0) {
    console.warn('No list ID provided for Brevo contact add');
    return;
  }

  const createContact = new SibApiV3Sdk.CreateContact();
  createContact.email = email;
  createContact.listIds = listIds;

  if (name) {
    const parts = name.trim().split(' ');
    createContact.attributes = {
      FIRSTNAME: parts[0],
      LASTNAME: parts.length > 1 ? parts.slice(1).join(' ') : '',
    };
  }

  try {
    await contactsApi.createContact(createContact);
    console.log('Brevo contact added:', email);
  } catch (err: any) {
    console.error('Brevo add contact error:', err?.response?.text || err.message || err);
    // Don't throw, as newsletter should still work
  }
}

export async function removeContactFromList(email: string, listId?: string) {
  const key = resolveApiKey();
  if (!key) throw new Error('Missing BREVO_API_KEY');

  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = key;

  // Brevo doesn't have direct remove from list, but can update contact to remove listIds
  // For simplicity, mark as unsubscribed or log
  console.log('Brevo remove contact not implemented for specific list, relying on suppression');
}
