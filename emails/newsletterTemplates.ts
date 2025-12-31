const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.APP_URL ||
  "http://localhost:3000";

export const newsletterTemplates = {
  confirm: (confirmUrl: string, name?: string) => ({
    subject: "Confirm your subscription to KickExpert",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Confirm Subscription</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; padding: 16px !important; }
            .email-content { padding: 24px 16px !important; }
            .email-header h1 { font-size: 22px !important; }
            .email-title { font-size: 18px !important; }
            .email-text { font-size: 14px !important; }
            .email-button { padding: 12px 20px !important; font-size: 14px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 24px 16px;">
              <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.08);">
                <tr>
                  <td class="email-content" style="padding: 32px;">
                    <!-- Branding -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom: 28px;">
                          <img src="https://www.kickexpert.com/logo.png" alt="KickExpert Logo" width="62" height="62" style="display: block; border-radius: 8px; margin-bottom: 10px;">
                          <h1 class="email-header" style="margin: 0; font-size: 26px; font-weight: 700;">
                            <span style="color: #84cc16;">Kick</span><span style="color: #000000;">Expert</span>
                          </h1>
                        </td>
                      </tr>
                    </table>

                    <!-- Main Content -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <h2 class="email-title" style="font-size: 22px; margin: 0 0 10px; color: #0f172a;">Confirm Your Subscription</h2>
                          <p class="email-text" style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">
                            Hi ${name || "there"},
                          </p>
                          <p class="email-text" style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                            Thanks for signing up for the KickExpert newsletter. Click the button below to confirm your subscription and start receiving football insights, match previews, tips, and exclusive offers.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 26px 0;">
                          <a href="${confirmUrl}" class="email-button" style="display: inline-block; padding: 13px 26px; background-color: #84cc16; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                            Confirm Subscription
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                            If you didn't request this, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 28px 0;">
                          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
                        </td>
                      </tr>
                    </table>

                    <!-- Footer -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                            KickExpert • 
                            <a href="${SITE_URL.replace(/\/$/, "") + '/'}" style="color: #84cc16; text-decoration: none;">Visit Website</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Hi ${name || "there"},\n\nConfirm your subscription to KickExpert:\n${confirmUrl}\n\nIf you didn't sign up, you can ignore this email.`,
  }),

  confirmed: (name?: string) => ({
    subject: "Subscription Confirmed — Welcome to KickExpert",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Subscription Confirmed</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; padding: 16px !important; }
            .email-content { padding: 24px 16px !important; }
            .email-header h1 { font-size: 22px !important; }
            .email-title { font-size: 18px !important; }
            .email-text { font-size: 14px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 24px 16px;">
              <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.08);">
                <tr>
                  <td class="email-content" style="padding: 32px;">
                    <!-- Branding -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom: 28px;">
                          <img src="https://www.kickexpert.com/logo.png" alt="KickExpert Logo" width="62" height="62" style="display: block; border-radius: 8px; margin-bottom: 10px;">
                          <h1 class="email-header" style="margin: 0; font-size: 26px; font-weight: 700;">
                            <span style="color: #84cc16;">Kick</span><span style="color: #000000;">Expert</span>
                          </h1>
                        </td>
                      </tr>
                    </table>

                    <!-- Main Content -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <h2 class="email-title" style="font-size: 22px; margin: 0 0 10px; color: #0f172a;">You're In!</h2>
                          <p class="email-text" style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">
                            Hi ${name || "there"},
                          </p>
                          <p class="email-text" style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                            Your subscription has been confirmed! You'll now receive our top football insights, predictions, match previews, and occasional offers — unsubscribe anytime.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Footer -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-top: 28px;">
                          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                            KickExpert • 
                            <a href="${SITE_URL.replace(/\/$/, "") + '/'}" style="color: #84cc16; text-decoration: none;">Visit Website</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Hi ${name || "there"},\n\nYour KickExpert newsletter subscription is confirmed. You're all set!`,
  }),
};
