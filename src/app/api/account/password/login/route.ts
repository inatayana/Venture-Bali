import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { normaliseEmail, verifyPassword } from '@/lib/customerAuth';
import { issueCustomerSession } from '@/lib/customerGuard';
import {
  getCustomerSessionCookieName,
  getCustomerSessionCookieOptions,
} from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { clientIp, rateLimit } from '@/lib/rateLimit.distributed';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(320),
  password: z.string().min(1),
});

const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60_000;
const GENERIC = { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' };

/** Optional alternative to the OTP flow. Never reveals whether a password exists. */
export async function POST(request: NextRequest) {
  const limit = await rateLimit(`account-password-login:${clientIp(request)}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } },
      { status: 400 },
    );
  }

  const email = normaliseEmail(parsed.data.email);
  const now = new Date();

  try {
    const account = await prisma.customerAccount.findUnique({
      where: { email },
      include: { customer: { select: { id: true, name: true } } },
    });

    // Same work for a missing account / missing password to avoid timing leaks.
    const storedHash = account?.passwordHash ?? 'scrypt$00$00';
    const matches = verifyPassword(parsed.data.password, storedHash);

    if (!account || account.status !== 'ACTIVE' || !account.passwordHash || !matches) {
      if (account && (account.lockedUntil ?? new Date(0)) <= now) {
        const updated = await prisma.customerAccount.update({
          where: { id: account.id },
          data: { failedLoginCount: { increment: 1 } },
          select: { failedLoginCount: true },
        });
        if (updated.failedLoginCount >= MAX_ATTEMPTS) {
          await prisma.customerAccount.update({
            where: { id: account.id },
            data: { failedLoginCount: 0, lockedUntil: new Date(now.getTime() + LOCK_MS) },
          });
        }
      }
      return NextResponse.json({ success: false, error: GENERIC }, { status: 401 });
    }

    if (account.lockedUntil && account.lockedUntil > now) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' } },
        { status: 429 },
      );
    }

    await prisma.customerAccount.update({
      where: { id: account.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now },
    });

    const sessionToken = await issueCustomerSession(account.id);
    const response = NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        customerId: account.customer.id,
        name: account.customer.name,
        email: account.email,
        status: 'ACTIVE',
      },
      error: null,
    });
    response.cookies.set(getCustomerSessionCookieName(), sessionToken, getCustomerSessionCookieOptions());
    return response;
  } catch {
    console.error('Password sign-in failed');
    return NextResponse.json(
      { success: false, error: { code: 'LOGIN_FAILED', message: 'Sign-in is temporarily unavailable' } },
      { status: 500 },
    );
  }
}
