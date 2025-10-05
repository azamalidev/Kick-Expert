export const transactionalTemplates = {
  signupVerification: (verifyLink: string, name?: string) => ({
    subject: 'Welcome to KickExpert - Confirm Your Account',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to KickExpert</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #65a30d 0%, #4ade80 100%); padding: 32px 24px; text-align: center;">
            <img src="https://www.kickexpert.com/logo.png" alt="KickExpert Logo" style="width: 60px; height: 60px; margin-bottom: 16px; border-radius: 8px;">
            <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">Welcome to KickExpert</h1>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 32px;">
            <div style="text-align: center; margin-bottom: 32px;">
          
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">Confirm your email to activate your account and start playing</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">You're just one step away from joining the ultimate football experience. Click the button below to verify your email and unlock all features.</p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyLink}" style="display: inline-block; background: linear-gradient(135deg, #65a30d 0%, #4ade80 100%); color: #ffffff; font-size: 18px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(101, 163, 13, 0.3); transition: all 0.3s ease;">
                Confirm My Account
              </a>
            </div>

            <!-- Additional Info -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #65a30d;">
              <h3 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">What happens next?</h3>
              <ul style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 16px;">
                <li>Access to exclusive football quizzes and competitions</li>
                <li>Track your progress and earn rewards</li>
                <li>Join leagues and compete with players worldwide</li>
                <li>Get personalized football insights and statistics</li>
              </ul>
            </div>

            <!-- Security Note -->
            <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 24px 0 0 0;">
              This link will expire in 24 hours for security reasons. If you didn't create an account, please ignore this email.
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
                  <span style="font-size: 16px; font-weight: 600; color: #ffffff;">KickExpert</span>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 16px;">
                  <span style="color: #cbd5e1; font-size: 14px;">The ultimate destination for football enthusiasts</span>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 16px;">
                  <table border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td style="padding: 0 8px;">
                        <a href="https://www.kickexpert.com/about" style="color: #65a30d; text-decoration: none; font-size: 14px; font-weight: 500;">About Us</a>
                      </td>
                      <td style="padding: 0 8px; color: #cbd5e1;">|</td>
                      <td style="padding: 0 8px;">
                        <a href="https://www.kickexpert.com/howitworks" style="color: #65a30d; text-decoration: none; font-size: 14px; font-weight: 500;">How It Works</a>
                      </td>
                      <td style="padding: 0 8px; color: #cbd5e1;">|</td>
                      <td style="padding: 0 8px;">
                        <a href="https://www.kickexpert.com/faq" style="color: #65a30d; text-decoration: none; font-size: 14px; font-weight: 500;">FAQ</a>
                      </td>
                      <td style="padding: 0 8px; color: #cbd5e1;">|</td>
                      <td style="padding: 0 8px;">
                        <a href="https://www.kickexpert.com/contact" style="color: #65a30d; text-decoration: none; font-size: 14px; font-weight: 500;">Contact</a>
                      </td>
                    </tr>
                  </table>
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
    `,
  }),

  passwordReset: (resetLink: string) => ({
    subject: 'Reset your KickExpert password',
    html: `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;color:#0f172a;line-height:1.5">
        <div style="max-width:680px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #eef2ff">
          <h2 style="margin:0 0 8px;color:#0f172a">Password reset requested</h2>
          <p style="margin:0 0 16px;color:#475569">Click the button below to reset your password. This link will expire in 1 hour.</p>
          <div style="text-align:center;margin:20px 0">
            <a href="${resetLink}" style="display:inline-block;padding:12px 22px;background:#0369a1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a>
          </div>
          <p style="font-size:13px;color:#94a3b8">If you didn't request this, you can ignore this email.</p>
        </div>
      </div>
    `,
  }),

  receipt: (detailsHtml: string) => ({
    subject: 'Your KickExpert receipt',
    html: `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;color:#0f172a;line-height:1.5">
        <div style="max-width:680px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #eef2ff">
          <h2 style="margin:0 0 8px;color:#0f172a">Payment receipt</h2>
          <div style="margin-top:12px">${detailsHtml}</div>
        </div>
      </div>
    `,
  }),

  testCheck: () => ({
    subject: 'Test Email from KickExpert',
    html: `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;color:#0f172a;line-height:1.5">
        <div style="max-width:680px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #eef2ff">
          <h2 style="margin:0 0 8px;color:#0f172a">Test Email</h2>
          <p style="margin:0 0 16px;color:#475569">This is a test email to verify the email system is working correctly.</p>
        </div>
      </div>
    `,
  }),
};
