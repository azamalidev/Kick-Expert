export const transactionalTemplates = {
  signupVerification: (verifyLink: string, name?: string) => ({
    subject: 'Verify your KickExpert account',
    html: `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;color:#0f172a;line-height:1.5">
        <div style="max-width:680px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #eef2ff">
          <h2 style="margin:0 0 8px;color:#0f172a">Welcome${name ? `, ${name}` : ''}!</h2>
          <p style="margin:0 0 16px;color:#475569">Thanks for creating an account. Please confirm your email to activate your KickExpert account.</p>
          <div style="text-align:center;margin:20px 0">
            <a href="${verifyLink}" style="display:inline-block;padding:12px 22px;background:#65a30d;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Verify email</a>
          </div>
          <p style="font-size:13px;color:#94a3b8">If you didn't create an account, ignore this email.</p>
        </div>
      </div>
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
