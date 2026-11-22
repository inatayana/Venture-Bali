/**
 * BaliWild — Magic Link Authentication
 *
 * Token format: JWT signed with HS256
 * Payload: { email, type, iat, exp, jti }
 * Stored in DB: AuthAttempt (audit), Customer.magicLinkToken (hashed), Customer.magicLinkExpires
 */

import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hashToken, verifyToken } from '@/lib/auth/tokenHash';
import { createRateLimit, checkRateLimit } from '@/lib/auth/rateLimit';

const MAGIC_LINK_TTL_MINUTES = 30;
const MAGIC_LINK_SECRET = new TextEncoder().encode(
  process.env.MAGIC_LINK_SECRET ?? 'dev-secret-change-in-production-min-32-chars'
);

export type MagicLinkPayload = {
  email: string;
  type: 'LOGIN' | 'REGISTER' | 'VERIFY_EMAIL';
  iat: number;
  exp: number;
  jti: string; // unique token ID for replay protection
};

export type MagicLinkResult =
  | { success: true; token: string; expiresAt: Date }
  | { success: false; error: string; retryAfter?: number };

/**
 * Create a magic link token for the given email.
 * Rate limited: 3 requests per hour per email.
 */
export async function createMagicLink(
  email: string,
  type: MagicLinkPayload['type'] = 'LOGIN'
): Promise<MagicLinkResult> {
  const normalizedEmail = email.toLowerCase().trim();

  // Rate limit check
  const rateLimit = await checkRateLimit(`magic-link:${normalizedEmail}`, 3, 60 * 60); // 3 per hour
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: 'Too many requests. Please wait before requesting another link.',
      retryAfter: rateLimit.resetAt,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + MAGIC_LINK_TTL_MINUTES * 60;
  const jti = crypto.randomUUID();

  const payload: MagicLinkPayload = {
    email: normalizedEmail,
    type,
    iat: now,
    exp,
    jti,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(jti)
    .sign(MAGIC_LINK_SECRET);

  const tokenHash = await hashToken(token);
  const expiresAt = new Date(exp * 1000);

  // Store hashed token in DB for verification (single-use)
  await prisma.customer.upsert({
    where: { email: normalizedEmail },
    create: {
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0], // placeholder, will be updated on first login
      countryCode: 'ID',
      whatsapp: '',
      magicLinkToken: tokenHash,
      magicLinkExpires: expiresAt,
      magicLinkJti: jti,
    },
    update: {
      magicLinkToken: tokenHash,
      magicLinkExpires: expiresAt,
      magicLinkJti: jti,
    },
  });

  // Log auth attempt
  await prisma.authAttempt.create({
    data: {
      email: normalizedEmail,
      type: 'MAGIC_LINK_REQUEST',
      success: true,
    },
  });

  return { success: true, token, expiresAt };
}

/**
 * Verify a magic link token and return the customer if valid.
 * Consumes the token (single-use).
 */
export async function verifyMagicLink(token: string): Promise<{
  success: boolean;
  customer?: { id: string; email: string; name: string };
  error?: string;
}> {
  let payload: MagicLinkPayload;

  try {
    const { payload: verified } = await jwtVerify(token, MAGIC_LINK_SECRET);
    payload = verified as unknown as MagicLinkPayload;
  } catch (err) {
    await logFailedAttempt(token, 'Invalid or expired token');
    return { success: false, error: 'Invalid or expired magic link' };
  }

  const customer = await prisma.customer.findUnique({
    where: { email: payload.email },
    select: { id: true, email: true, name: true, magicLinkToken: true, magicLinkExpires: true, magicLinkJti: true },
  });

  if (!customer) {
    await logFailedAttempt(token, 'Customer not found');
    return { success: false, error: 'Invalid magic link' };
  }

  // Check token matches (hashed), not expired, and JTI matches (replay protection)
  if (
    !customer.magicLinkToken ||
    !customer.magicLinkExpires ||
    !customer.magicLinkJti ||
    customer.magicLinkJti !== payload.jti ||
    new Date() > customer.magicLinkExpires ||
    !(await verifyToken(token, customer.magicLinkToken))
  ) {
    await logFailedAttempt(token, 'Token mismatch or expired');
    return { success: false, error: 'Invalid or expired magic link' };
  }

  // Token valid — consume it (invalidate)
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      magicLinkToken: null,
      magicLinkExpires: null,
      magicLinkJti: null,
      emailVerified: new Date(), // mark email as verified on first successful login
      lastLoginAt: new Date(),
    },
  });

  await prisma.authAttempt.create({
    data: {
      customerId: customer.id,
      email: customer.email,
      type: 'MAGIC_LINK_VERIFY',
      success: true,
    },
  });

  return {
    success: true,
    customer: { id: customer.id, email: customer.email, name: customer.name },
  };
}

/**
 * Generate the magic link URL for email/WhatsApp.
 */
export function getMagicLinkUrl(token: string, redirectTo = '/'): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002';
  const params = new URLSearchParams({ token, redirect: redirectTo });
  return `${base}/auth/verify?${params.toString()}`;
}

/**
 * Send magic link via email (placeholder - integrate with your email provider).
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  redirectTo?: string
): Promise<{ success: boolean; error?: string }> {
  const url = getMagicLinkUrl(token, redirectTo);

  // TODO: Integrate with Resend/SendGrid/nodemailer
  // Example with Resend:
  // await resend.emails.send({
  //   from: 'BaliWild <noreply@baliwild.com>',
  //   to: email,
  //   subject: 'Your BaliWild Magic Link',
  //   html: `<p>Click <a href="${url}">here</a> to sign in. Link expires in ${MAGIC_LINK_TTL_MINUTES} minutes.</p>`,
  // });

  console.log(`[MAGIC LINK] Email to ${email}: ${url}`);
  return { success: true };
}

/**
 * Send magic link via WhatsApp (placeholder - integrate with WABA).
 */
export async function sendMagicLinkWhatsApp(
  whatsapp: string,
  token: string,
  redirectTo?: string
): Promise<{ success: boolean; error?: string }> {
  const url = getMagicLinkUrl(token, redirectTo);

  // TODO: Integrate with WhatsApp Business API
  console.log(`[MAGIC LINK] WhatsApp to ${whatsapp}: ${url}`);
  return { success: true };
}

async function logFailedAttempt(token: string, reason: string) {
  try {
    // Try to extract email from token for logging
    let email = 'unknown';
    try {
      const { payload } = await jwtVerify(token, MAGIC_LINK_SECRET);
      email = (payload as MagicLinkPayload).email;
    } catch { /* ignore */ }

    await prisma.authAttempt.create({
      data: { email, type: 'MAGIC_LINK_VERIFY', success: false, metadata: { reason } },
    });
  } catch { /* ignore logging errors */ }
}