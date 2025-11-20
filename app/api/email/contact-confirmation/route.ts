import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email, name, topic, contactId } = await req.json();

    if (!email || !contactId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <div style="background: #ffffff; padding: 32px 24px; text-align: center;">
            <img src="https://www.kickexpert.com/logo.png" alt="KickExpert Logo" style="width: 60px; height: 60px; margin-bottom: 8px; border-radius: 8px;">
            <h1 style="font-size: 28px; font-weight: 700; margin: 0;">
              <span style="color: #84cc16;">Kick</span><span style="color: #000000;">Expert</span>
            </h1>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 32px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background: #84cc16; border-radius: 50%; width: 80px; height: 80px; line-height: 80px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.4); margin-bottom: 16px;">
                <span style="font-size: 40px;">✉️</span>
              </div>
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
                Message Received!
              </h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                ${name ? `Hi ${name},` : 'Hello,'} Thank you for contacting KickExpert
              </p>
            </div>

            

            <!-- Message Details -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">📧 Message Details</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Topic:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${topic}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Status:</td>
                  <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid #e2e8f0;">
                    <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">New</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Expected Response:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #84cc16;">24-48 hours</td>
                </tr>
              </table>
            </div>

            <!-- What Happens Next -->
            <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border: 2px solid #84cc16; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #365314; font-size: 16px; font-weight: 600; margin: 0 0 12px 0; text-align: center;">✅ What Happens Next?</h3>
              <ul style="color: #3f6212; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Our support team will review your message</li>
                <li>You'll receive an email when we respond (usually within 24-48 hours)</li>
                <li>You can track your inquiry status using your reference ID</li>
                <li>Check your spam folder if you don't see our reply</li>
              </ul>
            </div>

            <!-- Track Status Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://www.kickexpert.com/contact/track?id=${contactId}" style="display: inline-block; background: #84cc16; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);">
                Track Inquiry Status
              </a>
            </div>

            <!-- Support Note -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                <strong>💡 Tip:</strong> For urgent issues, please check our <a href="https://www.kickexpert.com/faq" style="color: #84cc16; text-decoration: none; font-weight: 600;">FAQ page</a> for instant answers.
              </p>
            </div>

            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
              This is an automated confirmation. We'll reply to your message soon.<br />
              Need immediate help? Visit our <a href="https://www.kickexpert.com/faq" style="color: #84cc16; text-decoration: none;">Help Center</a>.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #1e293b; color: #ffffff; padding: 32px 24px;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="color: #ffffff;">
              <tr>
                <td align="center" style="padding-bottom: 16px;">
                  <img src="https://www.kickexpert.com/logo.png" alt="KickExpert Logo" style="width: 40px; height: 40px; border-radius: 6px;" />
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 8px;">
                  <span style="font-size: 16px; font-weight: 600;">
                    <span style="color: #84cc16;">Kick</span><span style="color: #ffffff;">Expert</span>
                  </span>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 16px;">
                  <span style="color: #cbd5e1; font-size: 14px;">The ultimate destination for football enthusiasts</span>
                </td>
              </tr>
              <tr>
                <td align="center" style="border-top: 1px solid #334155; padding-top: 16px;">
                  <div style="color: #94a3b8; font-size: 12px; line-height: 1.4;">
                    © 2025 KickExpert. All rights reserved.<br />
                    <a href="https://www.kickexpert.com/policy" style="color: #94a3b8; text-decoration: none;">Privacy Policy</a> |
                    <a href="https://www.kickexpert.com/termsofservice" style="color: #94a3b8; text-decoration: none;">Terms of Service</a>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: `Contact Confirmation`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contact confirmation email error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
