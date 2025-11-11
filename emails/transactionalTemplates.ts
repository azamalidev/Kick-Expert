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

  competitionJoined: (data: {
    name?: string;
    competitionName: string;
    competitionDate: string;
    competitionTime: string;
    entryFee: string;
    prizePool: string;
    competitionId: string;
  }) => ({
    subject: `You're In! ${data.competitionName} - Entry Confirmed ✓`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Competition Entry Confirmed</title>
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
          
            <div style="text-align: center;">
              <h2 style="color: #1e293b; font-size: 22px; font-weight: 600; margin: 0 0 8px 0;">
                Entry Confirmed!
              </h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                ${data.name ? `Hi ${data.name}, you're` : "You're"} all set for the competition. Good luck!
              </p>
            </div>

            <!-- Competition Details Box -->
            <div style="background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); border-radius: 12px; padding: 24px; margin: 24px 0; color: #ffffff;">
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #ffffff;">${data.competitionName}</h3>
              <div style="border-top: 1px solid rgba(255, 255, 255, 0.3); padding-top: 16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">📅 Date:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #ffffff;">${data.competitionDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">⏰ Time:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #ffffff;">${data.competitionTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">💳 Entry Fee:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #ffffff;">${data.entryFee} Credits</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">🏆 Prize Pool:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #ffffff;">${data.prizePool} Credits</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Quick Tips -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #84cc16;">
              <h3 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">📌 Quick Tips for Success:</h3>
              <ul style="color: #64748b; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Join <strong>10 minutes early</strong> to ensure you don't miss the start</li>
                <li>Have a <strong>stable internet connection</strong> for the best experience</li>
                <li>Answer <strong>quickly and accurately</strong> to maximize your score</li>
                <li>You'll receive a <strong>reminder 10 minutes</strong> before it starts</li>
                <li>Read each question carefully - there's only one correct answer!</li>
              </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://www.kickexpert.com/livecompetition" style="display: inline-block; background: #84cc16; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);">
                View Competition Details
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
              Need help? <a href="https://www.kickexpert.com/contact" style="color: #84cc16; text-decoration: none;">Contact Support</a>
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

  competitionEnd: (data: {
    name?: string;
    competitionName: string;
    rank: number;
    totalPlayers: number;
    score: number;
    totalQuestions: number;
    accuracy: number;
    xpAwarded: number;
    prizeAmount: number;
    trophyAwarded: boolean;
    competitionId: string;
  }) => ({
    subject: `🏆 ${data.competitionName} Results - You Ranked #${data.rank}!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Competition Results</title>
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
            <!-- Results Icon -->
            <div style="text-align: center; margin-bottom: 24px;">
              ${data.rank <= 3 ? `
                <div style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 50%; width: 80px; height: 80px; line-height: 80px; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);">
                  <span style="font-size: 40px;">${data.rank === 1 ? '🥇' : data.rank === 2 ? '🥈' : '🥉'}</span>
                </div>
              ` : `
                <div style="display: inline-block; background: #84cc16; border-radius: 50%; width: 80px; height: 80px; line-height: 80px;">
                  <span style="font-size: 40px; color: #ffffff;">🎯</span>
                </div>
              `}
            </div>

            <div style="text-align: center; margin-bottom: 32px;">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
                ${data.rank <= 3 ? 'Congratulations!' : 'Great Performance!'}
              </h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                ${data.name ? `${data.name}, here are` : 'Here are'} your results for ${data.competitionName}
              </p>
            </div>

            <!-- Rank Card -->
            <div style="background: linear-gradient(135deg, ${data.rank <= 3 ? '#fbbf24 0%, #f59e0b 100%' : '#84cc16 0%, #65a30d 100%'}); border-radius: 12px; padding: 24px; margin: 24px 0; color: #ffffff; text-align: center;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: rgba(255, 255, 255, 0.9);">Your Final Rank</h3>
              <div style="font-size: 48px; font-weight: 800; margin: 8px 0;">
                #${data.rank}
              </div>
              <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">
                out of ${data.totalPlayers} players
              </p>
            </div>

            <!-- Performance Stats -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">📊 Your Performance</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Score:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${data.score}/${data.totalQuestions}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Accuracy:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${data.accuracy}%</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">XP Earned:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #8b5cf6; border-bottom: 1px solid #e2e8f0;">+${data.xpAwarded} XP</td>
                </tr>
                ${data.trophyAwarded ? `
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Trophy:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #f59e0b; border-bottom: 1px solid #e2e8f0;">🏆 Awarded</td>
                </tr>
                ` : ''}
                ${data.prizeAmount > 0 ? `
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Prize Credits:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #84cc16; font-size: 18px;">+${data.prizeAmount} Credits 💰</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${data.rank <= 3 ? `
            <!-- Winner Message -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <h3 style="color: #92400e; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
                🎉 ${data.rank === 1 ? 'Champion!' : data.rank === 2 ? 'Runner-Up!' : 'Third Place!'}
              </h3>
              <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.6;">
                You've won ${data.prizeAmount} credits! Your prize has been added to your account.
              </p>
            </div>
            ` : data.rank <= 10 ? `
            <!-- Top 10 Message -->
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #60a5fa; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <h3 style="color: #1e40af; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
                ⭐ Top 10 Finish!
              </h3>
              <p style="color: #1e3a8a; font-size: 14px; margin: 0; line-height: 1.6;">
                ${data.prizeAmount > 0 ? `You've earned ${data.prizeAmount} credits for your excellent performance!` : 'Great job competing against the best!'}
              </p>
            </div>
            ` : `
            <!-- Participation Message -->
            <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border: 2px solid #84cc16; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <h3 style="color: #365314; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
                💪 Keep Improving!
              </h3>
              <p style="color: #3f6212; font-size: 14px; margin: 0; line-height: 1.6;">
                You earned ${data.xpAwarded} XP. Keep practicing to climb the ranks in the next competition!
              </p>
            </div>
            `}

            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://www.kickexpert.com/league?competitionId=${data.competitionId}" style="display: inline-block; background: #3b82f6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); margin: 0 8px 8px 0;">
                View Full Leaderboard
              </a>
              <a href="https://www.kickexpert.com/livecompetition" style="display: inline-block; background: #84cc16; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3); margin: 0 8px 8px 0;">
                Join Next Competition
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
              Questions? <a href="https://www.kickexpert.com/contact" style="color: #84cc16; text-decoration: none;">Contact Support</a>
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

  refundProcessed: (data: {
    name?: string;
    refundId: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    reason?: string;
    processingFee?: number;
    netAmount?: number;
    refundMethod: 'stripe' | 'paypal';
    requestDate: string;
    processedDate?: string;
  }) => {
    const statusConfig = {
      pending: {
        color: '#f59e0b',
        bgColor: '#fef3c7',
        borderColor: '#fbbf24',
        icon: '⏳',
        title: 'Refund Request Received',
        message: 'Your refund request is being reviewed by our team.',
      },
      approved: {
        color: '#10b981',
        bgColor: '#d1fae5',
        borderColor: '#34d399',
        icon: '✅',
        title: 'Refund Approved',
        message: 'Your refund has been approved and is being processed.',
      },
      rejected: {
        color: '#ef4444',
        bgColor: '#fee2e2',
        borderColor: '#f87171',
        title: 'Refund Request Declined',
        message: 'Unfortunately, we could not process your refund request.',
      },
      completed: {
        color: '#84cc16',
        bgColor: '#f0fdf4',
        borderColor: '#84cc16',
        icon: '💰',
        title: 'Refund Completed',
        message: 'Your refund has been successfully processed.',
      },
    };

    const config = statusConfig[data.status];

    return {
      subject: `Refund ${data.status.charAt(0).toUpperCase() + data.status.slice(1)} - ${data.amount} Credits`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Refund Status Update</title>
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
              <!-- Status Icon -->
       

              <div style="text-align: center;">
                <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
                  ${config.title}
                </h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                  ${data.name ? `Hi ${data.name},` : 'Hello,'} ${config.message}
                </p>
              </div>

              <!-- Status Card -->
              <div style="background: linear-gradient(135deg, ${config.bgColor} 0%, ${config.bgColor} 100%); border: 2px solid ${config.borderColor}; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Refund Details</h3>
                <div style="font-size: 32px; font-weight: 800; color: ${config.color}; margin: 8px 0;">
                  ${data.status === 'completed' && data.netAmount ? `€${data.netAmount.toFixed(2)}` : `${data.amount} Credits`}
                </div>
                <p style="margin: 0; font-size: 14px; color: #64748b;">
                  Status: <strong style="color: ${config.color};">${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</strong>
                </p>
              </div>

              <!-- Refund Information -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">📋 Transaction Summary</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Refund ID:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">#${data.refundId.slice(-8).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Credits Requested:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${data.amount} Credits</td>
                  </tr>
                  ${data.processingFee ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Processing Fee:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #dc2626; border-bottom: 1px solid #e2e8f0;">€${data.processingFee.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  ${data.netAmount ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Net Refund Amount:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #84cc16; border-bottom: 1px solid #e2e8f0;">€${data.netAmount.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Payment Method:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${data.refundMethod === 'stripe' ? 'Bank Transfer' : 'PayPal'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Request Date:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${new Date(data.requestDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  </tr>
                  ${data.processedDate ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Processed Date:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b;">${new Date(data.processedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              ${data.status === 'rejected' && data.reason ? `
              <!-- Rejection Reason -->
              <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px solid #f87171; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <h3 style="color: #dc2626; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Reason for Rejection</h3>
                <p style="color: #b91c1c; font-size: 14px; margin: 0; line-height: 1.6;">${data.reason}</p>
              </div>
              ` : ''}

              ${data.status === 'pending' ? `
              <!-- Pending Message -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <h3 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">⏳ What happens next?</h3>
                <ul style="color: #78350f; font-size: 14px; margin: 0; padding-left: 20px; text-align: left; line-height: 1.6;">
                  <li>Our team will review your refund request within 2-3 business days</li>
                  <li>You'll receive another email once a decision is made</li>
                  <li>Credits are temporarily held during the review process</li>
                  <li>You can contact support if you have any questions</li>
                </ul>
              </div>
              ` : data.status === 'approved' ? `
              <!-- Approved Message -->
              <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #34d399; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <h3 style="color: #065f46; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">✅ Processing Your Refund</h3>
                <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;">
                  Your refund is being processed. The funds should appear in your account within 3-5 business days, depending on your bank's processing time.
                </p>
              </div>
              ` : data.status === 'completed' ? `
              <!-- Completed Message -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #84cc16; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <h3 style="color: #365314; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">💰 Refund Processed Successfully</h3>
                <p style="color: #3f6212; font-size: 14px; margin: 0; line-height: 1.6;">
                  Your refund has been completed. Check your ${data.refundMethod === 'stripe' ? 'bank account' : 'PayPal account'} for the credited amount.
                </p>
              </div>
              ` : ''}

              <!-- Support Section -->
              <div style="text-align: center; margin: 32px 0;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;">
                  Need help or have questions about your refund?
                </p>
                <a href="https://www.kickexpert.com/contact" style="display: inline-block; background: #84cc16; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);">
                  Contact Support
                </a>
              </div>

              <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
                This is an automated message. Please do not reply to this email.<br />
                For support, visit our <a href="https://www.kickexpert.com/contact" style="color: #84cc16; text-decoration: none;">help center</a>.
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
                      <a href="https://www.kickexpert.com/termsofservice" style="color: #94a3b8; text-decoration: none;">Terms of Service</a> |
                      <a href="https://www.kickexpert.com/refundpayoutpolicy" style="color: #94a3b8; text-decoration: none;">Refund Policy</a>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },

  withdrawalRequested: (data: {
    name?: string;
    withdrawalId: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    reason?: string;
    withdrawalMethod: 'stripe' | 'paypal';
    paypalEmail?: string;
    requestDate: string;
    processedDate?: string;
  }) => {
    const statusConfig = {
      pending: {
        color: '#f59e0b',
        bgColor: '#fef3c7',
        borderColor: '#fbbf24',
        icon: '⏳',
        title: 'Withdrawal Request Received',
        message: 'Your withdrawal request is being reviewed by our team.',
      },
      approved: {
        color: '#10b981',
        bgColor: '#d1fae5',
        borderColor: '#34d399',
        icon: '✅',
        title: 'Withdrawal Approved',
        message: 'Your withdrawal has been approved and is being processed.',
      },
      rejected: {
        color: '#ef4444',
        bgColor: '#fee2e2',
        borderColor: '#f87171',
        icon: '❌',
        title: 'Withdrawal Request Declined',
        message: 'Unfortunately, we could not process your withdrawal request.',
      },
      completed: {
        color: '#84cc16',
        bgColor: '#f0fdf4',
        borderColor: '#84cc16',
        icon: '💰',
        title: 'Withdrawal Completed',
        message: 'Your withdrawal has been successfully processed.',
      },
    };

    const config = statusConfig[data.status];

    return {
      subject: `Withdrawal ${data.status.charAt(0).toUpperCase() + data.status.slice(1)} - €${data.amount}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Withdrawal Status Update</title>
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
              <!-- Status Icon -->
            

              <div style="text-align: center;">
                <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
                  ${config.title}
                </h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                  ${data.name ? `Hi ${data.name},` : 'Hello,'} ${config.message}
                </p>
              </div>

              <!-- Status Card -->
              <div style="background: linear-gradient(135deg, ${config.bgColor} 0%, ${config.bgColor} 100%); border: 2px solid ${config.borderColor}; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Withdrawal Details</h3>
                <div style="font-size: 32px; font-weight: 800; color: ${config.color}; margin: 8px 0;">
                  €${data.amount.toFixed(2)}
                </div>
                <p style="margin: 0; font-size: 14px; color: #64748b;">
                  Status: <strong style="color: ${config.color};">${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</strong>
                </p>
              </div>

              <!-- Withdrawal Information -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">📋 Transaction Summary</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Withdrawal ID:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">#${data.withdrawalId.slice(-8).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Amount Requested:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">€${data.amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Payment Method:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${data.withdrawalMethod === 'stripe' ? 'Bank Transfer' : 'PayPal'}</td>
                  </tr>
                  ${data.paypalEmail ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">PayPal Email:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${data.paypalEmail}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Request Date:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${new Date(data.requestDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  </tr>
                  ${data.processedDate ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Processed Date:</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b;">${new Date(data.processedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              ${data.status === 'rejected' && data.reason ? `
              <!-- Rejection Reason -->
              <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px solid #f87171; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <h3 style="color: #dc2626; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Reason for Rejection</h3>
                <p style="color: #b91c1c; font-size: 14px; margin: 0; line-height: 1.6;">${data.reason}</p>
              </div>
              ` : ''}

              ${data.status === 'pending' ? `
              <!-- Pending Message -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <h3 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">⏳ What happens next?</h3>
                <ul style="color: #78350f; font-size: 14px; margin: 0; padding-left: 20px; text-align: left; line-height: 1.6;">
                  <li>Our team will review your withdrawal request within 2-3 business days</li>
                  <li>You'll receive another email once a decision is made</li>
                  <li>Credits are temporarily held during the review process</li>
                  <li>You can contact support if you have any questions</li>
                </ul>
              </div>
              ` : data.status === 'approved' ? `
              <!-- Approved Message -->
              <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #34d399; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <h3 style="color: #065f46; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">✅ Processing Your Withdrawal</h3>
                <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;">
                  Your withdrawal is being processed. The funds should appear in your ${data.withdrawalMethod === 'stripe' ? 'bank account' : 'PayPal account'} within 3-5 business days, depending on processing time.
                </p>
              </div>
              ` : data.status === 'completed' ? `
              <!-- Completed Message -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #84cc16; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <h3 style="color: #365314; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">💰 Withdrawal Processed Successfully</h3>
                <p style="color: #3f6212; font-size: 14px; margin: 0; line-height: 1.6;">
                  Your withdrawal has been completed. Check your ${data.withdrawalMethod === 'stripe' ? 'bank account' : 'PayPal account'} for the credited amount.
                </p>
              </div>
              ` : ''}

              <!-- Support Section -->
              <div style="text-align: center; margin: 32px 0;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;">
                  Need help or have questions about your withdrawal?
                </p>
                <a href="https://www.kickexpert.com/contact" style="display: inline-block; background: #84cc16; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);">
                  Contact Support
                </a>
              </div>

              <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
                This is an automated message. Please do not reply to this email.<br />
                For support, visit our <a href="https://www.kickexpert.com/contact" style="color: #84cc16; text-decoration: none;">help center</a>.
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
                      <a href="https://www.kickexpert.com/termsofservice" style="color: #94a3b8; text-decoration: none;">Terms of Service</a> |
                      <a href="https://www.kickexpert.com/refundpayoutpolicy" style="color: #94a3b8; text-decoration: none;">Withdrawal Policy</a>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },

  referralConfirmed: (data: {
    name?: string;
    referrerName: string;
    xpAwarded: number;
    totalReferrals: number;
    nextMilestone?: number;
    referralCredits?: number;
  }) => ({
    subject: `🎉 Referral Confirmed - +${data.xpAwarded} XP Earned!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Referral Confirmed</title>
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
        

            <div style="text-align: center; ">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
                Referral Confirmed!
              </h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                ${data.name ? `Hi ${data.name},` : 'Hello,'} Your referral has been confirmed and you've earned rewards!
              </p>
            </div>

            <!-- XP Award Card -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 12px; padding: 24px; margin: 24px 0; color: #ffffff; text-align: center;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #ffffff;">XP Earned</h3>
              <div style="font-size: 48px; font-weight: 800; margin: 8px 0; color: #ffffff;">
                +${data.xpAwarded} XP
              </div>
              <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">
                Keep referring friends to earn more XP and climb the ranks!
              </p>
            </div>

            <!-- Referral Stats -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">📊 Your Referral Progress</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Total Referrals:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #84cc16; border-bottom: 1px solid #e2e8f0;">${data.totalReferrals}</td>
                </tr>
                ${data.referralCredits ? `
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Referral Credits Earned:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #8b5cf6; border-bottom: 1px solid #e2e8f0;">${data.referralCredits} Credits</td>
                </tr>
                ` : ''}
                ${data.nextMilestone ? `
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Next Milestone:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #f59e0b;">${data.nextMilestone} referrals</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- Milestone Rewards Info -->
            ${data.nextMilestone ? `
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <h3 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">🏆 Upcoming Milestone Rewards</h3>
              <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.6;">
                Reach ${data.nextMilestone} referrals to unlock bonus credits and special rewards!
              </p>
            </div>
            ` : `
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #84cc16; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <h3 style="color: #365314; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">🎊 Milestone Achieved!</h3>
              <p style="color: #3f6212; font-size: 14px; margin: 0; line-height: 1.6;">
                Congratulations! You've reached a referral milestone. Check your profile for new rewards!
              </p>
            </div>
            `}

            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://www.kickexpert.com/profile" style="display: inline-block; background: #84cc16; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3); margin: 0 8px 8px 0;">
                View Profile
              </a>
              <a href="https://www.kickexpert.com/profile" style="display: inline-block; background: #8b5cf6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); margin: 0 8px 8px 0;">
                Share Referral Link
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
              Questions about referrals? <a href="https://www.kickexpert.com/contact" style="color: #84cc16; text-decoration: none;">Contact Support</a>
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

  milestoneAchieved: (data: {
    name?: string;
    milestone: number;
    rewardType: string;
    credits: number;
    totalReferrals: number;
    nextMilestone?: number;
  }) => ({
    subject: `🏆 Milestone Achieved - ${data.milestone} Referrals Reached!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Milestone Achieved</title>
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
            <!-- Trophy Icon -->
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 50%; width: 80px; height: 80px; line-height: 80px; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);">
                <span style="font-size: 40px;">🏆</span>
              </div>
            </div>

            <div style="text-align: center; margin-bottom: 32px;">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
                Milestone Achieved!
              </h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                ${data.name ? `Hi ${data.name},` : 'Hello,'} Congratulations on reaching ${data.milestone} referrals!
              </p>
            </div>

            <!-- Milestone Card -->
            <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; padding: 24px; margin: 24px 0; color: #ffffff; text-align: center;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #ffffff;">${data.milestone} Referrals Milestone</h3>
              <div style="font-size: 32px; font-weight: 800; margin: 8px 0; color: #ffffff;">
                ${data.credits} Credits Earned!
              </div>
              <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">
                ${data.rewardType} - Credits added to your account
              </p>
            </div>

            <!-- Progress Stats -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">📊 Your Referral Progress</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Total Referrals:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #84cc16; border-bottom: 1px solid #e2e8f0;">${data.totalReferrals}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Latest Reward:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #8b5cf6; border-bottom: 1px solid #e2e8f0;">${data.credits} Credits</td>
                </tr>
                ${data.nextMilestone ? `
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Next Milestone:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #f59e0b;">${data.nextMilestone} referrals</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- Next Milestone Info -->
            ${data.nextMilestone ? `
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <h3 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">🎯 Keep Going!</h3>
              <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.6;">
                Reach ${data.nextMilestone} referrals for your next reward. You're doing amazing!
              </p>
            </div>
            ` : `
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #84cc16; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <h3 style="color: #365314; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">🌟 Maximum Achievement!</h3>
              <p style="color: #3f6212; font-size: 14px; margin: 0; line-height: 1.6;">
                You've reached the highest referral milestone! Thank you for being an amazing community member.
              </p>
            </div>
            `}

            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://www.kickexpert.com/profile" style="display: inline-block; background: #84cc16; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3); margin: 0 8px 8px 0;">
                View Profile
              </a>
              <a href="https://www.kickexpert.com/profile" style="display: inline-block; background: #8b5cf6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); margin: 0 8px 8px 0;">
                Share Referral Link
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
              Questions about referrals? <a href="https://www.kickexpert.com/contact" style="color: #84cc16; text-decoration: none;">Contact Support</a>
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
};
