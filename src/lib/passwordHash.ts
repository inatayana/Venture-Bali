/**
 * BaliWild — Password hashing (OWASP 2026)
 * -----------------------------------------
 * Shared, NODE-ONLY password hashing used by both customer and admin accounts.
 *
 * Format: `scrypt$<N>$<r>$<p>$<saltHex>$<derivedHex>`
 * Legacy format `scrypt$<saltHex>$<derivedHex>` (N=2^14) is still verified so
 * existing operator passwords keep working after the hardening upgrade.
 *
 * OWASP Password Storage Cheat Sheet: scrypt N=2^17, r=8, p=1. Node's default
 * `maxmem` (32 MiB) is too small for N=2^17 (~128 MiB), so it is set explicitly.
 *
 * Never import this module from Edge middleware.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_N = 131_072; // 2^17
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const MAX_MEMORY_BYTES = 256 * 1024 * 1024;
const LEGACY_SCRYPT_N = 16_384; // 2^14 — pre-hardening admin hashes
const MAX_PASSWORD_LENGTH = 1024;

export function hashPassword(password: string): string {
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error('Password exceeds the maximum supported length');
  }

  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEMORY_BYTES,
  }).toString('hex');

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (password.length > MAX_PASSWORD_LENGTH || !stored) return false;

  const parts = stored.split('$');
  const isLegacy = parts.length === 3;
  if (!isLegacy && parts.length !== 6) return false;
  if (parts[0] !== 'scrypt') return false;

  const n = isLegacy ? LEGACY_SCRYPT_N : Number(parts[1]);
  const r = isLegacy ? 8 : Number(parts[2]);
  const p = isLegacy ? 1 : Number(parts[3]);
  const salt = isLegacy ? parts[1] : parts[4];
  const expectedHex = isLegacy ? parts[2] : parts[5];

  if (!Number.isInteger(n) || n < 16_384 || n > 1_048_576 || n & (n - 1)) return false;
  if (!Number.isInteger(r) || r < 1 || r > 64) return false;
  if (!Number.isInteger(p) || p < 1 || p > 16) return false;
  if (!salt || !expectedHex || expectedHex.length % 2 !== 0) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  if (expected.length === 0) return false;

  let derived: Buffer;
  try {
    derived = scryptSync(password, salt, expected.length, {
      N: n,
      r,
      p,
      maxmem: Math.max(MAX_MEMORY_BYTES, 128 * n * r * 2),
    });
  } catch {
    return false;
  }

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
