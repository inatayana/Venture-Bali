/**
 * BaliWild — Account emails (Resend, no new dependency)
 * -----------------------------------------------------
 * Sends one-time sign-in / activation codes. The code is shown in the email
 * body only; no GET endpoint consumes it (email scanners prefetch links).
 */

import { BRAND_EMAIL_BOOKING, BRAND_EMAIL_SUPPORT } from './brand';
import { getBaseUrl } from './seo';
import type { AuthTokenPurposeValue } from './customerAuth';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_OTP_TTL_MINUTES = 10;

function ttlMinutes(): number {
  const parsed = Number(process.env.CUSTOMER_OTP_TTL_MINUTES ?? DEFAULT_OTP_TTL_MINUTES);
  return Number.isFinite(parsed) ? Math.min(60, Math.max(1, parsed)) : DEFAULT_OTP_TTL_MINUTES;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Returns false when delivery fails; callers never expose the reason to the client. */
export async function sendAccountOtpEmail(
  to: string,
  code: string,
  purpose: AuthTokenPurposeValue,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Account OTP email not sent: RESEND_API_KEY is not configured');
    return false;
  }

  const activation = purpose === 'ACTIVATE';
  const subject = activation ? 'Activate your BaliWild account' : 'Your BaliWild sign-in code';
  const title = activation ? 'Activate your account' : 'Your sign-in code';
  const intro = activation
    ? 'Thanks for booking with BaliWild. Use this code to activate your account and manage your trips.'
    : 'Use this code to sign in to your BaliWild account.';
  const cta = `${getBaseUrl()}/profile`;
  const minutes = ttlMinutes();
  const displayCode = escapeHtml(code);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#171717">
      <h1 style="font-size:22px">${title}</h1>
      <p>${intro}</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:24px 0">${displayCode}</p>
      <p style="font-size:13px;color:#666">This code expires in ${minutes} minutes and can be used once.</p>
      <p><a href="${cta}" style="background:#171717;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;display:inline-block">${activation ? 'Activate my account' : 'Go to my profile'}</a></p>
      <p style="font-size:12px;color:#666">If you did not request this code, you can ignore this email.</p>
    </div>
  `;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? `BaliWild <${BRAND_EMAIL_BOOKING}>`,
        to: [to],
        subject,
        html,
        reply_to: BRAND_EMAIL_SUPPORT,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
