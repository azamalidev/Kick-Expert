import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
  // don't throw at import time in Next.js edge; just warn
  console.warn('Supabase service role or URL not configured for /api/admin/broadcasts');
}

export async function POST(req: Request) {
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = authHeader.split(' ')[1];

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Validate user and admin role
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token as string);
  if (userError || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check admin role in public.users table using email
  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('id, email, role')
    .eq('email', userData.user.email)
    .single();
  
  if (!dbUser || (dbUser as any).role !== 'admin') {
    console.log('Access denied for user:', userData.user.email, 'Role:', (dbUser as any)?.role);
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { title, message, type = 'informational', priority = 'medium', cta_url = null, is_banner = false, expiry_date = null, target = {}, schedule_at = null, send_now = true } = body;
  if (!title || !message) return NextResponse.json({ error: 'Missing title or message' }, { status: 400 });

  try {
    // Normalize incoming type to match notifications table check constraint
    // notifications table expects: informational, transactional, custom, alert, promotional, broadcast
    function normalizeType(t: any) {
      const v = String(t || '').toLowerCase();
      switch (v) {
        case 'informational':
        case 'info':
          return 'informational';
        case 'promotional':
        case 'marketing':
          return 'promotional';
        case 'support':
        case 'transactional':
          return 'transactional';
        case 'alert':
        case 'warning':
          return 'alert';
        case 'broadcast':
          return 'broadcast';
        case 'custom':
          return 'custom';
        default:
          return 'informational'; // Default fallback
      }
    }

    const normalizedType = normalizeType(type);

    // Insert broadcast record (if broadcasts table exists)
    let broadcast: any = null;
    if (await tableExists(supabaseAdmin, 'broadcasts')) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('broadcasts')
        .insert([{ created_by: userData.user.id, title, message, type: normalizedType, priority, cta_url, is_banner: !!is_banner, expiry_date: expiry_date ?? null, target, schedule_at }])
        .select()
        .maybeSingle();
      if (insertError) throw insertError;
      broadcast = inserted;

      // Log creation if logs table exists
      if (await tableExists(supabaseAdmin, 'broadcast_logs')) {
        await supabaseAdmin.from('broadcast_logs').insert([{ broadcast_id: (inserted as any)?.id ?? null, action: 'created', actor_id: userData.user.id, meta: { send_now } }]);
      }
    }

    if (send_now) {
      // Get delivery methods from request
      const deliveryMethods = body.deliveryMethods || ['In-App'];
      const shouldSendEmail = deliveryMethods.includes('Email');
      const shouldSendSMS = deliveryMethods.includes('SMS');

      // Direct implementation: insert notifications and send emails
      // This replaces the old RPC-based approach for better control
      try {
        const isPromotional = String(type || '').toLowerCase().includes('marketing') || String(type || '').toLowerCase().includes('promo');

        // Get users from public.users table (has email, name, email_opt_in)
        let usersQuery = supabaseAdmin
          .from('users')
          .select('id, email, name, email_opt_in');

        const { data: usersData, error: usersErr } = await usersQuery;
        if (usersErr) throw usersErr;

        console.log(`📊 Found ${usersData?.length || 0} users in public.users table`);

        // Get profiles for marketing preferences
        const { data: profilesData, error: profilesErr } = await supabaseAdmin
          .from('profiles')
          .select('user_id, marketing_opt_in');
        if (profilesErr) {
          console.warn('⚠️ Error fetching profiles (non-critical):', profilesErr);
        }

        // Create a map of profiles by user_id
        const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));

        // Combine users and profiles - USE public.users.id DIRECTLY
        let recipientsList = (usersData || [])
          .filter((u: any) => u.email && u.id) // Must have email and ID
          .map((u: any) => {
            const profile = profileMap.get(u.id);
            return {
              user_id: u.id, // Use public.users.id directly for notifications
              email: u.email,
              full_name: u.name || '',
              marketing_opt_in: profile?.marketing_opt_in || u.email_opt_in || false,
            };
          });

        // Filter for promotional if needed
        if (isPromotional) {
          recipientsList = recipientsList.filter((r: any) => r.marketing_opt_in === true);
        }

        const userIds: string[] = recipientsList.map((r: any) => r.user_id).filter(Boolean);

        console.log(`📊 Sending to ${userIds.length} users (Promotional: ${isPromotional})`);

        // Insert in-app notifications into notifications table
        // Now using public.users.id directly (foreign key constraint removed)
        const chunkSize = 500;
        let totalInserted = 0;
        for (let i = 0; i < userIds.length; i += chunkSize) {
          const chunk = userIds.slice(i, i + chunkSize);
          const rows = chunk.map(userId => ({
            user_id: userId, // public.users.id
            type: normalizedType,
            priority: priority || 'medium',
            title,
            message,
            is_banner: !!is_banner,
            cta_url: cta_url ?? null,
            expiry_date: expiry_date ?? null,
            created_at: new Date().toISOString(),
            is_read: false,
          }));

          const { error: insertErr } = await supabaseAdmin.from('notifications').insert(rows);
          if (insertErr) {
            console.error('❌ Failed inserting notification chunk:', insertErr);
          } else {
            totalInserted += rows.length;
            console.log(`✅ Inserted ${rows.length} in-app notifications (Total: ${totalInserted}/${userIds.length})`);
          }
        }

        // Send emails if requested
        if (shouldSendEmail && recipientsList.length > 0) {
          console.log(`📧 Sending ${recipientsList.length} emails via Brevo...`);
          let emailsSent = 0;
          let emailsFailed = 0;

          for (const recipient of recipientsList) {
            try {
              await sendEmail({
                to: recipient.email,
                subject: title,
                html: generateNotificationEmailHTML({
                  name: recipient.full_name,
                  title,
                  message,
                  type: normalizedType,
                  ctaUrl: cta_url,
                }),
              });
              emailsSent++;
            } catch (emailErr) {
              console.error(`Failed to send email to ${recipient.email}:`, emailErr);
              emailsFailed++;
            }
          }

          console.log(`✅ Emails sent: ${emailsSent}, Failed: ${emailsFailed}`);
        }

        // Log SMS if requested (placeholder for future implementation)
        if (shouldSendSMS) {
          console.log('📱 SMS delivery requested but not yet implemented');
        }

      } catch (broadcastErr: any) {
        console.error('Broadcast error:', broadcastErr);
        return NextResponse.json({ error: broadcastErr.message || 'Broadcast failed' }, { status: 500 });
      }

      // mark broadcast as sent when either path succeeded
      if (broadcast && await tableExists(supabaseAdmin, 'broadcasts')) {
        await supabaseAdmin.from('broadcasts').update({ status: 'sent' }).eq('id', (broadcast as any).id);
        if (await tableExists(supabaseAdmin, 'broadcast_logs')) {
          await supabaseAdmin.from('broadcast_logs').insert([{ broadcast_id: (broadcast as any).id, action: 'sent', actor_id: userData.user.id }]);
        }
      }
    }

    return NextResponse.json({ ok: true, broadcast: broadcast ?? null }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = authHeader.split(' ')[1];

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token as string);
  if (userError || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check admin role in public.users table using email
  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('id, email, role')
    .eq('email', userData.user.email)
    .single();
  
  if (!dbUser || (dbUser as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  // If RPC exists, call it; otherwise try to list broadcasts
  try {
    if (await functionExists(supabaseAdmin, 'get_broadcasts_with_metrics')) {
      const { data } = await supabaseAdmin.rpc('get_broadcasts_with_metrics');
      return NextResponse.json({ broadcasts: data || [] }, { status: 200 });
    }

    if (await tableExists(supabaseAdmin, 'broadcasts')) {
      const { data } = await supabaseAdmin.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(100);
      return NextResponse.json({ broadcasts: data || [] }, { status: 200 });
    }

    return NextResponse.json({ broadcasts: [] }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

async function tableExists(supabaseAdmin: any, tableName: string) {
  try {
    const { data } = await supabaseAdmin.rpc('pg_table_exists', { p_table_name: tableName }).limit(1).maybeSingle();
    return !!data;
  } catch (_) {
    // Fallback: try selecting 0 rows
    try {
      const { error } = await supabaseAdmin.from(tableName).select('1').limit(1);
      return !error;
    } catch (_) {
      return false;
    }
  }
}

async function functionExists(supabaseAdmin: any, fnName: string) {
  try {
    const { data } = await supabaseAdmin.rpc('pg_function_exists', { p_function_name: fnName }).limit(1).maybeSingle();
    return !!data;
  } catch (_) {
    return false;
  }
}

// Helper function to generate email HTML
function generateNotificationEmailHTML(data: {
  name?: string;
  title: string;
  message: string;
  type: string;
  ctaUrl?: string | null;
}) {
  const typeConfig: Record<string, { color: string; icon: string }> = {
    Info: { color: '#3b82f6', icon: '🔔' },
    Marketing: { color: '#ec4899', icon: '📢' },
    Support: { color: '#f59e0b', icon: '🤝' },
    Wallet: { color: '#10b981', icon: '💰' },
    Game: { color: '#8b5cf6', icon: '🎮' },
    Alert: { color: '#ef4444', icon: '⚠️' },
    Referral: { color: '#6366f1', icon: '👥' },
    System: { color: '#06b6d4', icon: '⚙️' },
  };

  const config = typeConfig[data.type] || typeConfig.Info;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
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
            <div style="display: inline-block; background: ${config.color}; border-radius: 50%; width: 80px; height: 80px; line-height: 80px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.4); margin-bottom: 16px;">
              <span style="font-size: 40px;">${config.icon}</span>
            </div>
            <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
              ${data.title}
            </h2>
            ${data.name ? `<p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">Hi ${data.name},</p>` : ''}
          </div>

          <!-- Message Box -->
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid ${config.color}; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="color: #1e293b; font-size: 15px; line-height: 1.8; margin: 0; white-space: pre-wrap;">${data.message}</p>
          </div>

          ${data.ctaUrl ? `
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.ctaUrl}" style="display: inline-block; background: ${config.color}; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);">
              View Details
            </a>
          </div>
          ` : ''}

          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
            This is an automated notification from KickExpert.<br />
            Manage your notification preferences in your <a href="https://www.kickexpert.com/profile" style="color: #84cc16; text-decoration: none;">account settings</a>.
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
}

