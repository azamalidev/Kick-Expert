import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

interface EmailRequestBody {
  toEmail: string;
  subject: string;
  htmlContent: string;
  fromEmail?: string;
  fromName?: string;
  ccEmails?: string[];
  bccEmails?: string[];
  replyTo?: string;
  attachments?: { name: string; content: string }[]; 
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { 
    toEmail, 
    subject, 
    htmlContent, 
    fromEmail = 'noreply@mail.kickexpert.com', 
    fromName = 'KickExpert',
    ccEmails = [],
    bccEmails = [],
    replyTo = 'support@kickexpert.com',
    attachments = []
  }: EmailRequestBody = req.body;

  if (!toEmail || !subject || !htmlContent) {
    return res.status(400).json({ success: false, error: 'Missing required fields: toEmail, subject, or htmlContent' });
  }

  try {
    const emailData = {
      sender: { email: fromEmail, name: fromName },
      to: [{ email: toEmail }],
      subject,
      htmlContent,
      ...(ccEmails.length > 0 && { cc: ccEmails.map((email: string) => ({ email })) }),
      ...(bccEmails.length > 0 && { bcc: bccEmails.map((email: string) => ({ email })) }),
      replyTo: { email: replyTo, name: fromName },
      ...(attachments.length > 0 && { attachment: attachments }),
    };

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailData,
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json({ success: true, data: response.data });
  } catch (err: unknown) {  
    let errorMessage = 'An unknown error occurred';
    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.message || err.message;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }
    else if (typeof err === 'string') {
      errorMessage = err;
    }

    console.error('Email error:', errorMessage);
    res.status(500).json({ success: false, error: errorMessage });
  }
}