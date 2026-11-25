import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { hashPassword, validatePassword, verifyPassword } from '@/lib/customerAuth';
import { requireCustomer, revokeOtherCustomerSessions } from '@/lib/customerGuard';
import { prisma } from '@/lib/prisma';
import { clientIp, rateLimit } from '@/lib/rateLimit.distributed';

export const dynamic = 'force-dynamic';

const setSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(1),
});

const WINDOW_MS = 15 * 60_000;

/** Opt in to password sign-in, or change an existing password. Re-authenticates other sessions. */
export async function POST(request: NextRequest) {
  const user = await requireCustomer();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Customer sign-in required' } },
      { status: 401 },
    );
  }

  const limit = await rateLimit(`account-password:${clientIp(request)}`, 5, WINDOW_MS);
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

  const parsed = setSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Enter a new password' } },
      { status: 400 },
    );
  }

  const policyError = validatePassword(parsed.data.newPassword);
  if (policyError) {
    return NextResponse.json(
      { success: false, error: { code: 'WEAK_PASSWORD', message: policyError } },
      { status: 400 },
    );
  }

  try {
    const account = await prisma.customerAccount.findUnique({
      where: { id: user.accountId },
      select: { passwordHash: true },
    });
    if (!account) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 },
      );
    }

    if (account.passwordHash) {
      const matches = verifyPassword(parsed.data.currentPassword ?? '', account.passwordHash);
      if (!matches) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' } },
          { status: 401 },
        );
      }
    }

    await prisma.customerAccount.update({
      where: { id: user.accountId },
      data: { passwordHash: hashPassword(parsed.data.newPassword) },
    });
    await revokeOtherCustomerSessions(user.accountId);

    return NextResponse.json({ success: true, data: { hasPassword: true }, error: null });
  } catch {
    console.error('Password update failed');
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_FAILED', message: 'Could not save your password' } },
      { status: 500 },
    );
  }
}

/** Remove the optional password; OTP sign-in remains available. */
export async function DELETE(request: NextRequest) {
  const user = await requireCustomer();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Customer sign-in required' } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = z.object({ currentPassword: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Current password is required' } },
      { status: 400 },
    );
  }

  try {
    const account = await prisma.customerAccount.findUnique({
      where: { id: user.accountId },
      select: { passwordHash: true },
    });
    if (!account?.passwordHash || !verifyPassword(parsed.data.currentPassword, account.passwordHash)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' } },
        { status: 401 },
      );
    }

    await prisma.customerAccount.update({
      where: { id: user.accountId },
      data: { passwordHash: null },
    });
    await revokeOtherCustomerSessions(user.accountId);

    return NextResponse.json({ success: true, data: { hasPassword: false }, error: null });
  } catch {
    console.error('Password removal failed');
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_FAILED', message: 'Could not remove your password' } },
      { status: 500 },
    );
  }
}
