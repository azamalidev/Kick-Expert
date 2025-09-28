import SibApiV3Sdk from 'sib-api-v3-sdk';

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BRAWO_API_KEY as string;

const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

interface SendEmailProps {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailProps) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = {
    name: process.env.EMAIL_SENDER_NAME as string,
    email: process.env.EMAIL_SENDER_EMAIL as string,
  };
  sendSmtpEmail.to = [{ email: to }];

  try {
    const response = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);

    console.log('000000000000000000000',to, subject, html);
    console.log(response, '--------------responseresponseresponse---------------')
    return response;
  } catch (error) {
    console.error('Brawo Email Send Error:', error);
    throw error;
  }
}
