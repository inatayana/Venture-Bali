/**
 * Venture Bali — Admin Password Hashing
 * -------------------------------------
 * Password hashing for the operator panel, using scrypt from `node:crypto`.
 *
 * NODE ONLY: this module must never be imported from the Edge middleware.
 * Session handling lives in `src/lib/adminSession.ts`, which is Edge safe.
 *
 * Docs: docs/SECURITY_PROTOCOL.md
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Hash a password with scrypt.
 * Format: `scrypt$<salt hex>$<derived key hex>`
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * Verify a password against a stored hash, in constant time.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, expectedHex] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  if (expected.length === 0) return false;

  const derived = scryptSync(password, salt, expected.length);

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
