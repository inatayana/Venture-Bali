import { createHmac, timingSafeEqual } from 'node:crypto';
import { getBaseUrl } from './seo';

/**
 * Founding-guest review invites.
 *
 * The URL carries an HMAC of the invite id, so the admin can regenerate the
 * link/QR at any time without storing a raw token. Single-use is enforced by
 * `ReviewInvite.status` in the database.
 */

const SCHEME = 'ri1';

interface InvitePayload {
  iid: string;
  exp: number;
}

function getSecret(): string | null {
  const secret = process.env.CUSTOMER_LINK_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

export function createInviteToken(inviteId: string, expiresAt: Date): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({
      iid: inviteId,
      exp: Math.floor(expiresAt.getTime() / 1000),
    } satisfies InvitePayload),
  ).toString('base64url');

  const signature = createHmac('sha256', secret)
    .update(`${SCHEME}.${payload}`)
    .digest('base64url');

  return `${SCHEME}.${payload}.${signature}`;
}

export function verifyInviteToken(
  inviteId: string,
  token: string | null | undefined,
): { inviteId: string } | null {
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
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<InvitePayload>;
    if (typeof data.iid !== 'string' || typeof data.exp !== 'number') return null;
    if (data.iid !== inviteId) return null;
    if (data.exp * 1000 <= Date.now()) return null;
    return { inviteId: data.iid };
  } catch {
    return null;
  }
}

export function buildInviteUrl(inviteId: string, token: string): string {
  return `${getBaseUrl()}/review/invite/${encodeURIComponent(inviteId)}?token=${encodeURIComponent(token)}`;
}

export function buildInviteQrUrl(inviteId: string, token: string): string {
  return `${getBaseUrl()}/api/reviews/invite/qr?inviteId=${encodeURIComponent(
    inviteId
  )}&token=${encodeURIComponent(token)}`;
}
