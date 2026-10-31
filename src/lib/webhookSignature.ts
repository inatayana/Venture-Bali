/**
 * Meta (WhatsApp / Messenger) webhook signature verification.
 *
 * Meta signs every POST with `X-Hub-Signature-256: sha256=<hex>` computed over
 * the raw request body using the app secret. The raw body is required — parsing
 * and re-serialising JSON would break the digest.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string | undefined,
): boolean {
  if (!appSecret || !signatureHeader) return false;

  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')}`;
  const providedBuffer = Buffer.from(signatureHeader, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}
