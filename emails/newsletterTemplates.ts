const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'http://localhost:3000';

export const newsletterTemplates = {
  confirm: (confirmUrl: string, name?: string) => ({
    subject: 'Confirm your subscription to KickExpert',
    html: `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;color:#0f172a;line-height:1.5">
        <div style="max-width:680px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #eef2ff">
          <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a">Confirm your subscription</h1>
          <p style="margin:0 0 16px;color:#475569">Hi ${name || 'there'},</p>
          <p style="margin:0 0 16px;color:#475569">Thanks for signing up for KickExpert's newsletter. Click the button below to confirm your subscription and start receiving tips, match previews, and exclusive offers.</p>
          <div style="text-align:center;margin:20px 0">
            <a href="${confirmUrl}" style="display:inline-block;padding:12px 20px;background:#6b46c1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Confirm subscription</a>
          </div>
          <p style="font-size:13px;color:#94a3b8">If you didn't sign up, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eef2ff;margin:20px 0" />
          <p style="font-size:12px;color:#94a3b8">KickExpert • <a href="${SITE_URL.replace(/\/$/, '')}/" style="color:#6b46c1;text-decoration:none">Visit site</a></p>
        </div>
      </div>
    `,
    text: `Confirm your subscription by visiting: ${confirmUrl}`,
  }),

  confirmed: (name?: string) => ({
    subject: 'Subscription confirmed — Welcome to KickExpert',
    html: `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;color:#0f172a;line-height:1.5">
        <div style="max-width:680px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #eef2ff">
          <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a">You're in!</h1>
          <p style="margin:0 0 16px;color:#475569">Hi ${name || 'there'},</p>
          <p style="margin:0 0 16px;color:#475569">Thanks for confirming your subscription. We'll send the best tips, previews and occasional offers your way — you can unsubscribe anytime.</p>
          <p style="font-size:12px;color:#94a3b8">KickExpert • <a href="${SITE_URL.replace(/\/$/, '')}/" style="color:#6b46c1;text-decoration:none">Visit site</a></p>
        </div>
      </div>
    `,
    text: `Thanks for confirming your KickExpert newsletter subscription.`,
  }),
};
