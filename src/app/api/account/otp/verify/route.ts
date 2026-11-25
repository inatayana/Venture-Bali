import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { hashOtpCode, normaliseEmail, type AuthTokenPurposeValue } from '@/lib/customerAuth';
import { issueCustomerSession } from '@/lib/customerGuard';
import {
  getCustomerSessionCookieName,
  getCustomerSessionCookieOptions,
} from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { clientIp, rateLimit } from '@/lib/rateLimit.distributed';

export const dynamic = 'force-dynamic';

const verifySchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(320),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60_000;
const GENERIC_ERROR = { code: 'INVALID_OR_EXPIRED_CODE', message: 'Invalid or expired code' };

async function registerFailure(accountId: string, now: Date): Promise<void> {
  const updated = await prisma.customerAccount.update({
    where: { id: accountId },
    data: { failedLoginCount: { increment: 1 } },
    select: { failedLoginCount: true },
  });

  if (updated.failedLoginCount >= MAX_ATTEMPTS) {
    await prisma.customerAccount.update({
      where: { id: accountId },
      data: { failedLoginCount: 0, lockedUntil: new Date(now.getTime() + LOCK_MS) },
    });
  }
}

/** Consume a single-use OTP via POST, activate the account and start a session. */
export async function POST(request: NextRequest) {
  const limit = await rateLimit(`account-verify:${clientIp(request)}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' },
      },
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

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and 6-digit code are required' } },
      { status: 400 },
    );
  }

  const now = new Date();
  const email = normaliseEmail(parsed.data.email);

  try {
    const account = await prisma.customerAccount.findUnique({
      where: { email },
      include: { customer: { select: { id: true, name: true } } },
    });

    if (!account || account.status === 'SUSPENDED') {
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 401 });
    }

    if (account.lockedUntil && account.lockedUntil > now) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' },
        },
        { status: 429 },
      );
    }

    const purpose: AuthTokenPurposeValue = account.status === 'PENDING' ? 'ACTIVATE' : 'SIGN_IN';
    const tokenHash = hashOtpCode(parsed.data.code, purpose);
    if (!tokenHash) {
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 401 });
    }

    const token = await prisma.authToken.findFirst({
      where: {
        accountId: account.id,
        tokenHash,
        purpose,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true },
    });

    if (!token) {
      await registerFailure(account.id, now);
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 401 });
    }

    const claimed = await prisma.authToken.updateMany({
      where: { id: token.id, consumedAt: null },
      data: { consumedAt: now },
    });
    if (claimed.count !== 1) {
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 401 });
    }

    await prisma.customerAccount.update({
      where: { id: account.id },
      data: {
        status: 'ACTIVE',
        emailVerifiedAt: account.emailVerifiedAt ?? now,
        lastLoginAt: now,
        failedLoginCount: 0,
        lockedUntil: null,
      },
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
    console.error('Account OTP verification failed');
    return NextResponse.json(
      { success: false, error: { code: 'VERIFY_FAILED', message: 'Sign-in is temporarily unavailable' } },
      { status: 500 },
    );
  }
}
