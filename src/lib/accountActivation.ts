/**
 * BaliWild — Account activation service (SERVER ONLY)
 * -----------------------------------------------------
 * Issues single-use email OTPs for PENDING accounts created at checkout and
 * for ACTIVE accounts signing in. Shared by the OTP request endpoint and the
 * payment webhook, so there is one place that handles invalidation and TTL.
 */

import { prisma } from '@/lib/prisma';
import { sendAccountOtpEmail } from './accountEmail';
import {
  generateOtpCode,
  hashOtpCode,
  otpExpiresAt,
  type AuthTokenPurposeValue,
} from './customerAuth';

const DUPLICATE_EMAIL_WINDOW_MS = 5 * 60_000;

export async function issueAccountOtp(input: {
  accountId: string;
  email: string;
  purpose: AuthTokenPurposeValue;
}): Promise<boolean> {
  const code = generateOtpCode();
  const tokenHash = hashOtpCode(code, input.purpose);
  if (!tokenHash) return false; // fail closed when the secret is missing

  // A new code makes every earlier unconsumed code for this purpose useless.
  await prisma.$transaction([
    prisma.authToken.updateMany({
      where: { accountId: input.accountId, purpose: input.purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.authToken.create({
      data: {
        accountId: input.accountId,
        tokenHash,
        purpose: input.purpose,
        expiresAt: otpExpiresAt(),
      },
    }),
  ]);

  return sendAccountOtpEmail(input.email, code, input.purpose);
}

/**
 * Called after a booking becomes PAID. Sends the activation code once; webhook
 * retries within the dedupe window do not send another email.
 */
export async function sendAccountActivationOtp(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { customer: { select: { account: true } } },
  });

  const account = booking?.customer.account;
  if (!account || account.status !== 'PENDING') return;

  const recent = await prisma.authToken.findFirst({
    where: {
      accountId: account.id,
      purpose: 'ACTIVATE',
      createdAt: { gte: new Date(Date.now() - DUPLICATE_EMAIL_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (recent) return;

  await issueAccountOtp({ accountId: account.id, email: account.email, purpose: 'ACTIVATE' });
}
