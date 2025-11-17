const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.APP_URL ||
  "http://localhost:3000";

export const newsletterTemplates = {
  confirm: (confirmUrl: string, name?: string) => ({
    subject: "Confirm your subscription to KickExpert",
    html: `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:24px;line-height:1.6;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 8px rgba(0,0,0,0.08);padding:32px;">
          
          <!-- Branding -->
          <div style="text-align:center;margin-bottom:28px;">
            <img src="https://www.kickexpert.com/logo.png" alt="KickExpert Logo" style="width:62px;height:62px;border-radius:8px;margin-bottom:10px;">
            <h1 style="margin:0;font-size:26px;font-weight:700;">
              <span style="color:#84cc16;">Kick</span><span style="color:#000;">Expert</span>
            </h1>
          </div>

          <!-- Main -->
          <h2 style="font-size:22px;margin:0 0 10px;text-align:center;color:#0f172a;">Confirm Your Subscription</h2>

          <p style="margin:0 0 16px;text-align:center;color:#475569;">
            Hi ${name || "there"},
          </p>

          <p style="margin:0 0 20px;text-align:center;color:#475569;">
            Thanks for signing up for the KickExpert newsletter. Click the button below to confirm your subscription and start receiving football insights, match previews, tips, and exclusive offers.
          </p>

          <div style="text-align:center;margin:26px 0;">
            <a href="${confirmUrl}" style="display:inline-block;padding:13px 26px;background:#84cc16;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Confirm Subscription
            </a>
          </div>

          <p style="font-size:13px;color:#94a3b8;text-align:center;">
            If you didn’t request this, you can safely ignore this email.
          </p>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />

          <p style="font-size:12px;color:#94a3b8;text-align:center;">
            KickExpert • 
            <a href="${SITE_URL.replace(/\/$/, "") + '/'}" style="color:#84cc16;text-decoration:none;">Visit Website</a>
          </p>
        </div>
      </div>
    `,
    text: `Hi ${name || "there"},\n\nConfirm your subscription to KickExpert:\n${confirmUrl}\n\nIf you didn’t sign up, you can ignore this email.`,
  }),

  confirmed: (name?: string) => ({
    subject: "Subscription Confirmed — Welcome to KickExpert",
    html: `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:24px;line-height:1.6;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 8px rgba(0,0,0,0.08);padding:32px;">
          
          <!-- Branding -->
          <div style="text-align:center;margin-bottom:28px;">
            <img src="https://www.kickexpert.com/logo.png" alt="KickExpert Logo" style="width:62px;height:62px;border-radius:8px;margin-bottom:10px;">
            <h1 style="margin:0;font-size:26px;font-weight:700;">
              <span style="color:#84cc16;">Kick</span><span style="color:#000;">Expert</span>
            </h1>
          </div>

          <!-- Main -->
          <h2 style="font-size:22px;margin:0 0 10px;text-align:center;color:#0f172a;">You're In!</h2>

          <p style="margin:0 0 16px;text-align:center;color:#475569;">
            Hi ${name || "there"},
          </p>

          <p style="margin:0 0 20px;text-align:center;color:#475569;">
            Your subscription has been confirmed! You'll now receive our top football insights, predictions, match previews, and occasional offers — unsubscribe anytime.
          </p>

          <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:28px;">
            KickExpert • 
            <a href="${SITE_URL.replace(/\/$/, "") + '/'}" style="color:#84cc16;text-decoration:none;">Visit Website</a>
          </p>
        </div>
      </div>
    `,
    text: `Hi ${name || "there"},\n\nYour KickExpert newsletter subscription is confirmed. You're all set!`,
  }),
};
