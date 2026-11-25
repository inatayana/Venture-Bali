/**
 * BaliWild — Customer authentication helpers (NODE ONLY)
 * -------------------------------------------------------
 * Password hashing (shared with admin) and one-time email code utilities.
 * The raw OTP is never persisted: only a keyed HMAC-SHA256 digest is stored.
 *
 * Phase 1 is passwordless; password helpers are exposed for Phase 4 and for
 * the shared admin hardening. Never import this module from Edge middleware.
 */

import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { getCustomerSessionSecret } from './customerSession';

export { hashPassword, verifyPassword } from './passwordHash';

export type AuthTokenPurposeValue = 'ACTIVATE' | 'SIGN_IN' | 'RESET_PASSWORD';

const DEFAULT_OTP_TTL_MINUTES = 10;

/** Generate a 6-digit code using a CSPRNG. */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/** Keyed digest of a one-time code, bound to its purpose. Never store the code itself. */
export function hashOtpCode(code: string, purpose: AuthTokenPurposeValue): string | null {
  const secret = getCustomerSessionSecret();
  if (!secret) return null;

  return createHmac('sha256', secret)
    .update(`otp:${purpose}:${code}`)
    .digest('hex');
}

/** Constant-time verification of a submitted code against a stored digest. */
export function verifyOtpCode(
  code: string,
  storedHash: string,
  purpose: AuthTokenPurposeValue,
): boolean {
  if (!/^\d{6}$/.test(code)) return false;

  const expected = hashOtpCode(code, purpose);
  if (!expected || !storedHash || storedHash.length !== expected.length) return false;

  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Expiry for a newly issued OTP, clamped to 1–60 minutes. */
export function otpExpiresAt(now: Date = new Date()): Date {
  const parsed = Number(process.env.CUSTOMER_OTP_TTL_MINUTES ?? DEFAULT_OTP_TTL_MINUTES);
  const minutes = Number.isFinite(parsed) ? Math.min(60, Math.max(1, parsed)) : DEFAULT_OTP_TTL_MINUTES;
  return new Date(now.getTime() + minutes * 60_000);
}

/** Normalise an email address for lookup and account creation. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** A small blocklist; OWASP recommends screening common/breached passwords. */
const BLOCKED_PASSWORDS = new Set([
  'password', 'password123', '12345678', '123456789', 'qwerty123', 'qwertyuiop',
  'baliwild', 'baliwild123', 'letmein', 'welcome123', 'admin123', 'iloveyou',
]);

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters';
  if (password.length > 1024) return 'Password is too long';
  if (BLOCKED_PASSWORDS.has(password.toLowerCase())) return 'Choose a less common password';
  return null;
}
