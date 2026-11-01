/**
 * BaliWild — customer magic link
 * -----------------------------------
 * Hybrid checkout never asks for a password. After payment settles, the guest
 * receives a signed, expiring link that opens their booking history.
 *
 * Node-only (HMAC via node:crypto). Never import this from a client component.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { getBaseUrl } from './seo';

const SCHEME = 'cl1';
const DEFAULT_TTL_DAYS = 30;

interface CustomerLinkPayload {
  cid: string;
  exp: number;
}

function getSecret(): string | null {
  const secret = process.env.CUSTOMER_LINK_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

export function createCustomerLinkToken(
  customerId: string,
  days: number = DEFAULT_TTL_DAYS,
): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({
      cid: customerId,
      exp: Math.floor(Date.now() / 1000) + days * 24 * 60 * 60,
    } satisfies CustomerLinkPayload),
  ).toString('base64url');

  const signature = createHmac('sha256', secret)
    .update(`${SCHEME}.${payload}`)
    .digest('base64url');

  return `${SCHEME}.${payload}.${signature}`;
}

export function verifyCustomerLinkToken(
  token: string | null | undefined,
): { customerId: string } | null {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [scheme, payload, signature] = parts;
  if (scheme !== SCHEME) return null;

  const expected = createHmac('sha256', secret)
    .update(`${SCHEME}.${payload}`)
    .digest('base64url');

  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<CustomerLinkPayload>;
    if (typeof data.cid !== 'string' || typeof data.exp !== 'number') return null;
    if (data.exp * 1000 <= Date.now()) return null;
    return { customerId: data.cid };
  } catch {
    return null;
  }
}

/** Public URL for the guest's booking history, or null when no secret is configured. */
export function buildCustomerBookingsUrl(
  customerId: string,
  days: number = DEFAULT_TTL_DAYS,
): string | null {
  const token = createCustomerLinkToken(customerId, days);
  return token ? `${getBaseUrl()}/my/bookings?token=${encodeURIComponent(token)}` : null;
}
