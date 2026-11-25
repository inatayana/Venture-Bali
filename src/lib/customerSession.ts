/**
 * BaliWild — Customer session tokens (EDGE SAFE)
 * ------------------------------------------------
 * Stateless verification of the customer cookie. The cookie contains ONLY an
 * opaque 256-bit session id plus an HMAC signature — never an email, name or
 * any other PII (unlike the old base64 cookie decoded by the client).
 *
 * The id is also stored (as a SHA-256 hash) in `CustomerSession`, which makes
 * logout a real server-side revocation. This module uses Web Crypto only, so
 * it also runs in Next.js middleware.
 *
 * Docs: docs/CUSTOMER_ACCOUNT_DESIGN.md
 */

const SESSION_SCHEME = 'cs1';
const SECRET_ENV = 'CUSTOMER_SESSION_SECRET';
const MIN_SECRET_LENGTH = 16;
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export const CUSTOMER_SESSION_TTL_SECONDS = THIRTY_DAYS_SECONDS;

/** `__Host-` is only valid over HTTPS; local HTTP development uses a plain name. */
export function customerCookieName(isProduction: boolean): string {
  return isProduction ? '__Host-bw_customer' : 'bw_customer';
}

export function getCustomerSessionCookieName(): string {
  return customerCookieName(process.env.NODE_ENV === 'production');
}

export function getCustomerSessionSecret(): string | null {
  const secret = process.env[SECRET_ENV];
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

/** Cookie attributes shared by every endpoint that sets the session. */
export function customerCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: CUSTOMER_SESSION_TTL_SECONDS,
  };
}

export function getCustomerSessionCookieOptions() {
  return customerCookieOptions(process.env.NODE_ENV === 'production');
}

// ============ BASE64URL (no Buffer, no btoa assumptions) ============

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function importHmacKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const secret = getCustomerSessionSecret();
  if (!secret) throw new Error(`${SECRET_ENV} is not configured`);
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}

/** Build the signed cookie value from an opaque session id. */
export async function createCustomerSessionToken(sessionId: string): Promise<string> {
  if (!/^[A-Za-z0-9_-]{32,}$/.test(sessionId)) {
    throw new Error('Invalid session id');
  }

  const key = await importHmacKey('sign');
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${SESSION_SCHEME}.${sessionId}`),
  );

  return `${SESSION_SCHEME}.${sessionId}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

/**
 * Verify a cookie value and return its opaque session id, or null when it is
 * missing, malformed, tampered with, or no secret is configured (fail-closed).
 */
export async function verifyCustomerSessionToken(
  token: string | undefined | null,
): Promise<string | null> {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [scheme, sessionId, signature] = parts;
  if (scheme !== SESSION_SCHEME || !/^[A-Za-z0-9_-]{32,}$/.test(sessionId)) return null;

  let key: CryptoKey;
  try {
    key = await importHmacKey('verify');
  } catch {
    return null;
  }

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = base64UrlToBytes(signature);
  } catch {
    return null;
  }

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    new TextEncoder().encode(`${scheme}.${sessionId}`),
  );

  return isValid ? sessionId : null;
}

/** SHA-256 digest used to look up the session without ever storing the raw id. */
export async function hashSessionId(sessionId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sessionId));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
