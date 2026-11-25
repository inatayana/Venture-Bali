import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { issueAccountOtp } from '@/lib/accountActivation';
import { normaliseEmail } from '@/lib/customerAuth';
import { prisma } from '@/lib/prisma';
import { clientIp, rateLimit } from '@/lib/rateLimit.distributed';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(320),
});

const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;

/** Request a one-time code. Always returns the same generic response. */
export async function POST(request: NextRequest) {
  const limit = await rateLimit(`account-otp:${clientIp(request)}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again in 15 minutes.' },
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

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Enter a valid email address',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const email = normaliseEmail(parsed.data.email);
  const emailLimit = await rateLimit(`account-otp:${email}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!emailLimit.allowed) {
    // Still generic: the caller must not learn whether the address has an account.
    return NextResponse.json({
      success: true,
      data: { sent: true },
      error: null,
    });
  }

  try {
    const account = await prisma.customerAccount.findUnique({
      where: { email },
      select: { id: true, email: true, status: true },
    });

    if (account && account.status !== 'SUSPENDED') {
      const purpose = account.status === 'PENDING' ? 'ACTIVATE' : 'SIGN_IN';
      await issueAccountOtp({ accountId: account.id, email: account.email, purpose });
    }
  } catch {
    // Never leak delivery or database failures to the client.
    console.error('Account OTP request failed');
  }

  return NextResponse.json({ success: true, data: { sent: true }, error: null });
}
