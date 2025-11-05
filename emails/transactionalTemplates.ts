export const transactionalTemplates = {
  signupVerification: (verifyLink: string, name?: string) => ({
    subject: 'Confirm Your KickExpert Account',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KickExpert Email Confirmation</title>
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
              <h2 style="color: #1e293b; font-size: 22px; font-weight: 600; margin: 0 0 16px 0;">
                Confirm your email to activate your account
              </h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                You’re just one step away from joining the ultimate football experience. Click the button below to verify your email and unlock all features.
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyLink}" style="display: inline-block; background: #84cc16; color: #ffffff; font-size: 18px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3); transition: all 0.3s ease;">
                Confirm My Account
              </a>
            </div>

            <!-- What Happens Next -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #84cc16;">
              <h3 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">What happens next?</h3>
              <ul style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 16px;">
                <li>Join Live Football Trivia Leagues</li>
                <li>Take Football Knowledge Quizzes</li>
                <li>Earn Rewards and Boost Your XP</li>
                <li>Challenge Yourself Across Different Levels</li>
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
    `,
  }),

  passwordReset: (resetLink: string) => ({
    subject: 'Reset Your KickExpert Password',
    html: `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;color:#0f172a;line-height:1.5;background:#f8fafc;padding:24px;">
        <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 8px rgba(0,0,0,0.08);padding:32px;">
          
          <!-- Branding -->
          <div style="text-align:center;margin-bottom:24px;">
            <img src="https://www.kickexpert.com/logo.png" alt="KickExpert Logo" style="width:60px;height:60px;border-radius:8px;margin-bottom:8px;">
            <h1 style="margin:0;font-size:26px;font-weight:700;">
              <span style="color:#84cc16;">Kick</span><span style="color:#000;">Expert</span>
            </h1>
          </div>

          <!-- Main -->
          <h2 style="margin:0 0 8px;color:#0f172a;text-align:center;">Password Reset Requested</h2>
          <p style="margin:0 0 16px;color:#475569;text-align:center;">Click the button below to reset your password. This link will expire in 1 hour.</p>
          <div style="text-align:center;margin:20px 0;">
            <a href="${resetLink}" style="display:inline-block;padding:12px 22px;background:#84cc16;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
          </div>
          <p style="font-size:13px;color:#94a3b8;text-align:center;">If you didn't request this, you can ignore this email.</p>
        </div>
      </div>
    `,
  }),

  receipt: (detailsHtml: string) => ({
    subject: 'Your KickExpert Receipt',
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
