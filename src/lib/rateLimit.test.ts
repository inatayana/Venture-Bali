import { clientIp, rateLimit, resetRateLimits } from './rateLimit';

describe('rateLimit', () => {
  beforeEach(() => resetRateLimits());

  it('allows requests inside the window and blocks the overflow', () => {
    expect(rateLimit('ip-1', 2, 60_000).allowed).toBe(true);
    expect(rateLimit('ip-1', 2, 60_000).allowed).toBe(true);
    const blocked = rateLimit('ip-1', 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('keeps buckets separate per key', () => {
    rateLimit('ip-1', 1, 60_000);
    expect(rateLimit('ip-2', 1, 60_000).allowed).toBe(true);
  });

  it('reads the forwarded client IP', () => {
    const request = {
      headers: {
        get: (name: string) =>
          name === 'x-forwarded-for' ? '203.0.113.7, 10.0.0.1' : null,
      },
    } as unknown as Request;
    expect(clientIp(request)).toBe('203.0.113.7');
  });
});
