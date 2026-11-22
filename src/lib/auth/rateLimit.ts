/**
 * BaliWild — Rate Limiting for Auth Endpoints
 *
 * Uses in-memory store with sliding window.
 * For production, replace with Redis (ioredis + rate-limiter-flexible).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (seconds)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Periodic cleanup of expired entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Check and increment rate limit for a key.
 * @param key Unique identifier (e.g., "magic-link:user@example.com")
 * @param maxRequests Maximum requests allowed in the window
 * @param windowSeconds Time window in seconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): RateLimitResult {
  const now = Math.floor(Date.now() / 1000);
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // First request or window expired
    store.set(key, { count: 1, resetAt: now + windowSeconds });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowSeconds,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Create a rate limiter middleware for Next.js API routes.
 */
export function createRateLimit(
  maxRequests: number,
  windowSeconds: number,
  keyPrefix = 'api'
) {
  return async function rateLimit(
    request: Request,
    getKey: (req: Request) => string
  ): Promise<RateLimitResult> {
    const key = `${keyPrefix}:${getKey(request)}`;
    return checkRateLimit(key, maxRequests, windowSeconds);
  };
}

/**
 * Get client IP from request (for rate limiting by IP).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Get rate limit key for magic link (by email).
 */
export function getMagicLinkKey(email: string): string {
  return `magic-link:${email.toLowerCase().trim()}`;
}

/**
 * Get rate limit key for login attempts (by IP + email).
 */
export function getLoginKey(request: Request, email?: string): string {
  const ip = getClientIp(request);
  return email ? `login:${ip}:${email.toLowerCase()}` : `login:${ip}`;
}