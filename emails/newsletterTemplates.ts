const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'http://localhost:3000';

export const newsletterTemplates = {
  confirm: (confirmUrl: string, name?: string) => ({
    subject: 'Confirm your subscription to KickExpert',
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
          <h2 style="margin:0 0 8px;color:#0f172a;text-align:center;">Confirm Your Subscription</h2>
          <p style="margin:0 0 16px;color:#475569;text-align:center;">Hi ${name || 'there'},</p>
          <p style="margin:0 0 16px;color:#475569;text-align:center;">Thanks for signing up for KickExpert’s newsletter. Click the button below to confirm your subscription and start receiving football tips, match previews, and exclusive offers.</p>
          <div style="text-align:center;margin:20px 0;">
            <a href="${confirmUrl}" style="display:inline-block;padding:12px 22px;background:#84cc16;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Confirm Subscription</a>
          </div>
          <p style="font-size:13px;color:#94a3b8;text-align:center;">If you didn't sign up, you can safely ignore this email.</p>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="font-size:12px;color:#94a3b8;text-align:center;">
            KickExpert • 
            <a href="${SITE_URL.replace(/\/$/, '')}/" style="color:#84cc16;text-decoration:none;">Visit Site</a>
          </p>
        </div>
      </div>
    `,
    text: `Hi ${name || 'there'},\n\nConfirm your subscription to KickExpert by visiting: ${confirmUrl}\n\nIf you didn’t sign up, ignore this email.`,
  }),

  confirmed: (name?: string) => ({
    subject: 'Subscription Confirmed — Welcome to KickExpert',
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
          <h2 style="margin:0 0 8px;color:#0f172a;text-align:center;">You're In!</h2>
          <p style="margin:0 0 16px;color:#475569;text-align:center;">Hi ${name || 'there'},</p>
          <p style="margin:0 0 16px;color:#475569;text-align:center;">Thanks for confirming your subscription. You’ll now receive our best football insights, previews, and occasional offers — unsubscribe anytime.</p>
          
          <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:24px;">
            KickExpert • 
            <a href="${SITE_URL.replace(/\/$/, '')}/" style="color:#84cc16;text-decoration:none;">Visit Site</a>
          </p>
        </div>
      </div>
    `,
    text: `Hi ${name || 'there'},\n\nThanks for confirming your KickExpert newsletter subscription!`,
  }),
};
