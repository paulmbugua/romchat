// apps/backend/utils/sendNotification.js
import nodemailer from 'nodemailer';
import crypto from 'node:crypto';
import pool from '../config/db.js';

function env(name, fallback = '') {
  return String(process.env[name] || fallback || '').trim();
}

function maskEmail(email) {
  return String(email || '').replace(/^(.{2}).*(@.*)$/, '$1***$2');
}

/* ─────────────────────────────────────────────────────────
 * Settings helper (Option B)
 *  - Reads from app_settings/site_settings/settings (key,value)
 *  - Caches in-memory per-process
 *  - Fallback to ENV if DB not available or key missing
 * ───────────────────────────────────────────────────────── */
const SETTINGS_TABLE_CANDIDATES = ['app_settings', 'site_settings', 'settings'];
const settingsCache = new Map();

/** Detect the first existing settings table (once per process). */
let detectedSettingsTable = null;
async function detectSettingsTable() {
  if (detectedSettingsTable !== null) return detectedSettingsTable;
  try {
    const { rows } = await pool.query(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1)`,
      [SETTINGS_TABLE_CANDIDATES]
    );
    const names = rows.map(r => r.table_name);
    detectedSettingsTable = SETTINGS_TABLE_CANDIDATES.find(t => names.includes(t)) || null;
  } catch {
    detectedSettingsTable = null;
  }
  return detectedSettingsTable;
}

/** Get a setting from DB (with cache) or fallback. */
async function getSetting(key, fallback = process.env[key.toUpperCase()] ?? null) {
  if (settingsCache.has(key)) return settingsCache.get(key);

  try {
    const table = await detectSettingsTable();
    if (table) {
      const { rows } = await pool.query(
        `SELECT value FROM ${table} WHERE key = $1 LIMIT 1`,
        [key]
      );
      const val = rows[0]?.value ?? fallback ?? null;
      settingsCache.set(key, val);
      return val;
    }
  } catch {
    // ignore DB errors; use fallback
  }

  const val = fallback ?? null;
  settingsCache.set(key, val);
  return val;
}

/** Pick a public base URL for rare fallback to /uploads/logo.png. */
function getPublicBaseUrl() {
  return (
    process.env.PUBLIC_BACKEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? process.env.PROD_BACKEND_URL
      : process.env.BACKEND_URL) ||
    null
  );
}

/* ─────────────────────────────────────────────────────────
 * Unsubscribe helpers
 * ───────────────────────────────────────────────────────── */
function sign(email) {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'change-me';
  return crypto
    .createHmac('sha256', secret)
    .update(String(email || '').toLowerCase())
    .digest('base64url');
}

function publicWebUrl() {
  // Your public SPA domain
  return process.env.PUBLIC_WEB_URL || 'https://www.daybreaklearner.com';
}

function publicApiUrl() {
  // Prefer a public API base if available; else fall back to backend URL(s)
  return (
    process.env.PUBLIC_API_URL ||
    process.env.PUBLIC_BACKEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? process.env.PROD_BACKEND_URL
      : process.env.BACKEND_URL)
  );
}

/* ─────────────────────────────────────────────────────────
 * Mailer
 * ───────────────────────────────────────────────────────── */
/**
 * Send a branded HTML email notification.
 *
 * @param {Object} options
 * @param {string} options.to       – Recipient email address
 * @param {string} options.subject  – Email subject line
 * @param {string} [options.body]   – Plain-text body only
 * @param {Object} [options.details] – Structured content for the template
 * @param {string} [options.details.intro]    – Introductory text
 * @param {Object} [options.details.items]    – Key/value pairs to render in a table
 * @param {string} [options.details.ctaUrl]   – URL for a call-to-action button
 * @param {string} [options.details.ctaText]  – Text for the button
 * @param {string} [options.details.plainText]– Override plain-text body
 */
export const sendNotification = async ({ to, subject, body, details, suppressErrorLog = false }) => {
  try {
    // require to & subject, and either body or a valid details.items
    if (!to || !subject || (!body && !(details && details.items))) {
      throw new Error('❌ Missing required email parameters.');
    }

    const smtpHost = env('SMTP_HOST', process.env.EMAIL_HOST || process.env.MAIL_HOST || 'smtp.zoho.com');
    const smtpPort = Number(env('SMTP_PORT', process.env.EMAIL_PORT || process.env.MAIL_PORT || '587')) || 587;
    const smtpUser = env('SMTP_USER', process.env.EMAIL_AUTH_USER || process.env.EMAIL_USER || process.env.MAIL_USER);
    const smtpPass = env('SMTP_PASS', process.env.EMAIL_AUTH_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS);
    const secureValue = env('SMTP_SECURE', process.env.EMAIL_SECURE || process.env.MAIL_SECURE || 'false').toLowerCase();
    const smtpEnvSource = {
      host: process.env.SMTP_HOST ? 'SMTP_HOST' : process.env.EMAIL_HOST ? 'EMAIL_HOST' : process.env.MAIL_HOST ? 'MAIL_HOST' : 'default',
      user: process.env.SMTP_USER ? 'SMTP_USER' : process.env.EMAIL_AUTH_USER ? 'EMAIL_AUTH_USER' : process.env.EMAIL_USER ? 'EMAIL_USER' : process.env.MAIL_USER ? 'MAIL_USER' : 'missing',
      pass: process.env.SMTP_PASS ? 'SMTP_PASS' : process.env.EMAIL_AUTH_PASS ? 'EMAIL_AUTH_PASS' : process.env.EMAIL_PASS ? 'EMAIL_PASS' : process.env.MAIL_PASS ? 'MAIL_PASS' : 'missing',
    };
    const isSecure = secureValue === 'true' || smtpPort === 465;
    if (!smtpHost || !smtpUser || !smtpPass) {
      const error = new Error('Email is not configured. Set SMTP_HOST plus SMTP_USER/SMTP_PASS, or EMAIL_HOST plus EMAIL_AUTH_USER/EMAIL_AUTH_PASS.');
      error.code = 'EMAIL_CONFIG_MISSING';
      throw error;
    }
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure, // true = SSL (465), false = STARTTLS (587)
      requireTLS: !isSecure,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
      tls: {
        servername: smtpHost,
        minVersion: 'TLSv1.2',
      },
    });

    // Prefer DB setting -> ENV -> rare fallback to /uploads/logo.png
    const emailLogoUrl = await getSetting('email_logo_url', process.env.EMAIL_LOGO_URL);
    const baseUrl = getPublicBaseUrl();
    let logoUrl = emailLogoUrl || (baseUrl ? `${baseUrl}/uploads/logo.png` : null);

    // Light cache-buster in non-prod to dodge stubborn image caches during dev
    if (logoUrl && process.env.NODE_ENV !== 'production') {
      logoUrl += (logoUrl.includes('?') ? '&' : '?') + `v=${Date.now()}`;
    }

    // If the caller only passed `body`, wrap it in a minimal details object
    const tpl = details && details.items
      ? details
      : { intro: '', items: {}, plainText: body };

    const brandName = tpl.brandName || process.env.EMAIL_BRAND_NAME || 'DayBreak';
    const brandColor = tpl.brandColor || process.env.EMAIL_BRAND_COLOR || '#1d4ed8';
    const brandEmoji = tpl.brandEmoji || process.env.EMAIL_BRAND_EMOJI || 'Books';

    const itemsHtml = Object.keys(tpl.items).length
      ? `<table cellpadding="5" cellspacing="0" style="width:100%;margin:20px 0;border:1px solid #ddd;">
           ${Object.entries(tpl.items).map(([label, value]) => `
             <tr>
               <td style="font-weight:bold;width:30%;background:#f9f9f9;">${label}</td>
               <td>${String(value ?? '')}</td>
             </tr>`).join('')}
         </table>`
      : `<p style="font-size:16px;line-height:1.5;">${body ?? ''}</p>`;

    // Unsubscribe links (visible + headers)
    const token = sign(to);
    const webUnsub = `${publicWebUrl()}/unsubscribe?e=${encodeURIComponent(to)}&t=${token}`;
    const apiOneClick = `${publicApiUrl()}/api/email/unsubscribe/one-click?e=${encodeURIComponent(to)}&t=${token}`;
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.MAIL_REPLY_TO || process.env.EMAIL_REPLY_TO || 'support@daybreaklearner.com';
    const fromName = env('EMAIL_FROM_NAME', process.env.MAIL_FROM_NAME || process.env.SMTP_FROM_NAME || brandName);
    const fromAddress = env('EMAIL_FROM', process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM || process.env.MAIL_FROM || smtpUser);
    const replyTo = env('EMAIL_REPLY_TO', process.env.MAIL_REPLY_TO || fromAddress);
    const formattedFrom = fromAddress.includes('<') ? fromAddress : `"${fromName}" <${fromAddress}>`;

    // Build the inline-CSS HTML template
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>${subject}</title></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation"
                 style="background:#fff;margin:20px 0;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:${brandColor};padding:20px;text-align:center;">
                ${logoUrl ? `<img src="${logoUrl}" alt="${brandName}" width="150" style="display:block;margin:0 auto;">` : `<div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:.5px;">${brandName}</div>`}
              </td>
            </tr>
            <tr>
              <td style="padding:30px;color:#333;">
                <h1 style="font-size:24px;margin-top:0;">${subject}</h1>
                <p style="font-size:16px;line-height:1.5;">
                  ${tpl.intro || 'Hello,'}
                </p>
                ${itemsHtml}
                ${tpl.ctaUrl ? `
                <p style="text-align:center;margin:30px 0;">
                  <a href="${tpl.ctaUrl}"
                     style="background:${brandColor};color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;display:inline-block;font-weight:bold;">
                    ${tpl.ctaText || 'Take Action'}
                  </a>
                </p>` : ''}
                <p style="font-size:14px;color:#666;">
                  If you have any questions, reply to this email or contact ${supportEmail}.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f4f4f4;padding:20px;text-align:center;font-size:12px;color:#999;">                &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.<br>
                1830-01000, Thika, Kenya<br>
                <a href="${webUnsub}" style="color:#999;text-decoration:underline;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    `;

    console.info('[email] send:start', { to: maskEmail(to), from: fromAddress, authUser: maskEmail(smtpUser), host: smtpHost, port: smtpPort, secure: isSecure, envSource: smtpEnvSource });
    const info = await transporter.sendMail({
      from: formattedFrom,
      to,
      subject,
      html,
      text: (tpl.plainText || [
        subject,
        ...Object.entries(tpl.items).map(([k, v]) => `${k}: ${v}`)
      ].join('\n\n')) + `

Unsubscribe: ${webUnsub}
`,
      replyTo,
      envelope: { from: fromAddress.includes('<') ? smtpUser : fromAddress, to },
      headers: {
        // Include One-Click + mailto option for mailbox providers
        'List-Unsubscribe': `<${apiOneClick}>, <mailto:${supportEmail}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    if (!suppressErrorLog) {
      console.error(`❌ Error sending email to ${to}:`, err.message);
    }
    throw err;
  }
};
