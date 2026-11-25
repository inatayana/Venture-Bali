/**
 * BaliWild — signed QR boarding pass (NODE ONLY)
 * ------------------------------------------------
 * Payload format: `ci1.<base64url JSON>.<HMAC-SHA256 signature>`.
 * The token is scoped to a booking (optionally one participant), expires, and
 * carries a nonce. Replays are harmless because check-in transitions are
 * idempotent (`checkedInAt` / lifecycle set once), never additive.
 *
 * QR_SIGNING_SECRET is independent from all session secrets.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SCHEME = 'ci1';

interface CheckInPayload {
  bid: string;
  pid?: string;
  exp: number;
  scp: 'checkin';
  nonce: string;
}

function getSecret(): string | null {
  const secret = process.env.QR_SIGNING_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

export function createCheckInToken(input: {
  bookingId: string;
  participantId?: string;
  expiresAt: Date;
}): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const payload: CheckInPayload = {
    bid: input.bookingId,
    ...(input.participantId ? { pid: input.participantId } : {}),
    exp: Math.floor(input.expiresAt.getTime() / 1000),
    scp: 'checkin',
    nonce: randomBytes(12).toString('base64url'),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(`${SCHEME}.${encoded}`)
    .digest('base64url');

  return `${SCHEME}.${encoded}.${signature}`;
}

export function verifyCheckInToken(
  token: string | null | undefined,
): { bookingId: string; participantId?: string; nonce: string } | null {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [scheme, encoded, signature] = parts;
  if (scheme !== SCHEME) return null;

  const expected = createHmac('sha256', secret).update(`${SCHEME}.${encoded}`).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<CheckInPayload>;
    if (typeof payload.bid !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.scp !== 'checkin' || payload.exp * 1000 <= Date.now()) return null;
    if (payload.pid !== undefined && typeof payload.pid !== 'string') return null;
    if (typeof payload.nonce !== 'string') return null;

    return {
      bookingId: payload.bid,
      ...(payload.pid ? { participantId: payload.pid } : {}),
      nonce: payload.nonce,
    };
  } catch {
    return null;
  }
}
