/**
 * BaliWild — Secure Token Hashing
 *
 * Uses bcrypt for token hashing (slow, salted, resistant to rainbow tables).
 * Tokens are stored as hashes, verified on use, then invalidated.
 */

import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

/**
 * Hash a token for secure storage.
 */
export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, BCRYPT_ROUNDS);
}

/**
 * Verify a token against its hash.
 */
export async function verifyToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

/**
 * Generate a cryptographically secure random token.
 */
export function generateToken(length = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}