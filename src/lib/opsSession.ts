/**
 * BaliWild — Field Ops session tokens (EDGE SAFE, ADR/RFC v1.2.0)
 * ------------------------------------------------------------------
 * Separate actor domain from customer and admin. Cookie carries only an opaque
 * signed id; the id hash is stored in `FieldOpsSession` for real revocation.
 */

import { hashSessionId } from './customerSession';

const SESSION_SCHEME = 'os1';
export const OPS_SESSION_TTL_SECONDS = 60 * 60 * 12;

export function opsCookieName(isProduction: boolean): string {
  return isProduction ? '__Host-vb_ops_session' : 'vb_ops_session';
}

export function getOpsSessionCookieName(): string {
  return opsCookieName(process.env.NODE_ENV === 'production');
}

export function getOpsSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: OPS_SESSION_TTL_SECONDS,
  };
}

function getSecret(): string | null {
  const secret = process.env.OPS_SESSION_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

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

async function importKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const secret = getSecret();
  if (!secret) throw new Error('OPS_SESSION_SECRET is not configured');
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}

export async function createOpsSessionToken(sessionId: string): Promise<string> {
  if (!/^[A-Za-z0-9_-]{32,}$/.test(sessionId)) throw new Error('Invalid session id');
  const key = await importKey('sign');
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${SESSION_SCHEME}.${sessionId}`),
  );
  return `${SESSION_SCHEME}.${sessionId}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyOpsSessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [scheme, sessionId, signature] = parts;
  if (scheme !== SESSION_SCHEME || !/^[A-Za-z0-9_-]{32,}$/.test(sessionId)) return null;

  let key: CryptoKey;
  try {
    key = await importKey('verify');
  } catch {
    return null;
  }

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = base64UrlToBytes(signature);
  } catch {
    return null;
  }

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    new TextEncoder().encode(`${scheme}.${sessionId}`),
  );
  return valid ? sessionId : null;
}

export { hashSessionId };
