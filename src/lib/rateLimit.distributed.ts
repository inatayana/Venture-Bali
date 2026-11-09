/**
 * Distributed rate limiter using Upstash Redis.
 * Falls back to in-memory if Redis not configured (local dev).
 *
 * Same interface as the legacy in-memory limiter for drop-in replacement.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { rateLimit as memoryRateLimit, clientIp } from './rateLimit';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Upstash client if credentials are available
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Distributed rate limit with in-memory fallback.
 * - In production (Vercel): uses Upstash Redis (shared across instances)
 * - In local dev: uses in-memory Map (no external deps needed)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (redis) {
    // Upstash uses sliding window with fixed limit/window per instance.
    // We create a limiter with the exact params for this call.
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs / 1000} s`),
      prefix: 'baliwild:ratelimit',
    });
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: Math.max(0, result.remaining),
      retryAfterSeconds: result.success ? 0 : Math.ceil((result.reset - Date.now()) / 1000),
    };
  }

  // Local dev fallback
  return memoryRateLimit(key, limit, windowMs);
}

// Re-export clientIp helper
export { clientIp };

/** Test helper; clears in-memory map. */
export async function resetRateLimits(): Promise<void> {
  // The in-memory reset is from the legacy module
  const { resetRateLimits: resetMemory } = await import('./rateLimit');
  resetMemory();
}