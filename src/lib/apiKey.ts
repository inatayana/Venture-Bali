/**
 * Public API key auth for `/api/v1` (server-to-server).
 *
 * Clients send the key in the `X-API-Key` header; keys live in the
 * `BALIWILD_PUBLIC_API_KEYS` env var as a comma-separated list. Comparison is
 * length-checked and constant-time per character (no early exit on mismatch).
 *
 * Edge-safe: uses plain string comparison only, so it can run inside the
 * Next.js middleware (which executes on the Edge runtime).
 */

/** Env var holding the comma-separated public API key list. */
export const PUBLIC_API_KEYS_ENV = 'BALIWILD_PUBLIC_API_KEYS';

/** Prefix of the public API namespace. */
export const API_V1_PREFIX = '/api/v1';

export function getApiKeyCandidates(): string[] {
  const raw = process.env.BALIWILD_PUBLIC_API_KEYS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verify the `X-API-Key` provided by a caller against the configured keys.
 * Returns false when no key is provided or none match.
 */
export function verifyApiKey(provided: string | null | undefined): boolean {
  const candidates = getApiKeyCandidates();
  if (!provided || candidates.length === 0) return false;
  return candidates.some((candidate) => safeEqual(provided, candidate));
}

/**
 * `/api/v1/health` and `/api/v1/openapi` are public; every other `/api/v1/*`
 * route requires a valid API key.
 */
export function isPublicApiV1Path(pathname: string): boolean {
  const subPath = pathname.slice(API_V1_PREFIX.length);
  const normalized = subPath.startsWith('/') ? subPath : `/${subPath}`;
  return normalized === '/health' || normalized === '/openapi';
}
