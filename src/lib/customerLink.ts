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
const REVIEW_SCHEME = 'rl1';
/**
 * Booking-scoped read token (`bl1`): unlocks GET /api/booking/[id] and payment
 * initiation for exactly one booking, nothing else — not /my/bookings.
 */
const VIEW_SCHEME = 'bl1';
const DEFAULT_TTL_DAYS = 30;
/** Review links live longer than account links but stay scoped to one booking. */
export const REVIEW_LINK_TTL_DAYS = 180;
/** Voucher/checkout links must survive a browser session and sharing. */
export const BOOKING_VIEW_TTL_DAYS = 30;

interface CustomerLinkPayload {
  cid: string;
  exp: number;
}

interface ReviewTokenPayload {
  cid: string;
  bid: string;
  scp: 'review';
  exp: number;
}

interface BookingViewTokenPayload {
  bid: string;
  scp: 'view';
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

/**
 * Review token: proves one booking belongs to the customer and nothing else.
 * It never unlocks /my/bookings, so a longer TTL is safe.
 */
export function createReviewToken(
  customerId: string,
  bookingId: string,
  days: number = REVIEW_LINK_TTL_DAYS,
): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({
      cid: customerId,
      bid: bookingId,
      scp: 'review',
      exp: Math.floor(Date.now() / 1000) + days * 24 * 60 * 60,
    } satisfies ReviewTokenPayload),
  ).toString('base64url');

  const signature = createHmac('sha256', secret)
    .update(`${REVIEW_SCHEME}.${payload}`)
    .digest('base64url');

  return `${REVIEW_SCHEME}.${payload}.${signature}`;
}

export function verifyReviewToken(
  token: string | null | undefined,
  bookingId: string,
): { customerId: string; bookingId: string } | null {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [scheme, payload, signature] = parts;
  if (scheme !== REVIEW_SCHEME) return null;

  const expected = createHmac('sha256', secret)
    .update(`${REVIEW_SCHEME}.${payload}`)
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
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<ReviewTokenPayload>;
    if (typeof data.cid !== 'string' || typeof data.bid !== 'string') return null;
    if (data.scp !== 'review' || data.bid !== bookingId) return null;
    if (typeof data.exp !== 'number' || data.exp * 1000 <= Date.now()) return null;
    return { customerId: data.cid, bookingId: data.bid };
  } catch {
    return null;
  }
}

/**
 * Accepts a scoped review token or the legacy account token. The legacy path
 * keeps existing 30-day links working until they expire.
 */
export function verifyReviewAccess(
  token: string | null | undefined,
  bookingId: string,
): { customerId: string } | null {
  const scoped = verifyReviewToken(token, bookingId);
  if (scoped) return { customerId: scoped.customerId };
  return verifyCustomerLinkToken(token);
}

/**
 * Booking view token: proves the holder may read one booking (and start its
 * payment). It never unlocks /my/bookings.
 */
export function createBookingViewToken(
  bookingId: string,
  days: number = BOOKING_VIEW_TTL_DAYS,
): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({
      bid: bookingId,
      scp: 'view',
      exp: Math.floor(Date.now() / 1000) + days * 24 * 60 * 60,
    } satisfies BookingViewTokenPayload),
  ).toString('base64url');

  const signature = createHmac('sha256', secret)
    .update(`${VIEW_SCHEME}.${payload}`)
    .digest('base64url');

  return `${VIEW_SCHEME}.${payload}.${signature}`;
}

export function verifyBookingViewToken(
  token: string | null | undefined,
  bookingId: string,
): { bookingId: string } | null {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [scheme, payload, signature] = parts;
  if (scheme !== VIEW_SCHEME) return null;

  const expected = createHmac('sha256', secret)
    .update(`${VIEW_SCHEME}.${payload}`)
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
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<BookingViewTokenPayload>;
    if (typeof data.bid !== 'string' || typeof data.exp !== 'number') return null;
    if (data.scp !== 'view' || data.bid !== bookingId) return null;
    if (data.exp * 1000 <= Date.now()) return null;
    return { bookingId: data.bid };
  } catch {
    return null;
  }
}

/**
 * Read access for a booking: either a scoped `bl1` view token or an account
 * `cl1` link owned by the same customer. Runs after the booking is loaded so
 * ownership can be checked against booking.customerId.
 */
export function verifyBookingReadAccess(
  token: string | null | undefined,
  booking: { id: string; customerId: string },
): { allowed: boolean } {
  if (verifyBookingViewToken(token, booking.id)) return { allowed: true };
  const account = verifyCustomerLinkToken(token);
  return { allowed: account?.customerId === booking.customerId };
}

/** Public URL for the guest's booking history, or null when no secret is configured. */
export function buildCustomerBookingsUrl(
  customerId: string,
  days: number = DEFAULT_TTL_DAYS,
): string | null {
  const token = createCustomerLinkToken(customerId, days);
  return token ? `${getBaseUrl()}/my/bookings?token=${encodeURIComponent(token)}` : null;
}
