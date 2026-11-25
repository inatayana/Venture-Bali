import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { issueAccountOtp } from '@/lib/accountActivation';
import { normaliseEmail } from '@/lib/customerAuth';
import { prisma } from '@/lib/prisma';
import { clientIp, rateLimit } from '@/lib/rateLimit.distributed';
import { getTenantContext } from '@/lib/tenant/context';

export const dynamic = 'force-dynamic';

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().email('Enter a valid email address').max(320),
  whatsapp: z.string().trim().min(10, 'WhatsApp number required').max(32),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/, 'Country code must be two letters').default('ID'),
});

const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;

/**
 * Explicit sign-up for customers without a booking. Creates a PENDING account
 * and emails a code; the account becomes ACTIVE only after POST verification.
 * Existing accounts receive a sign-in code instead (no auto-login, no takeover).
 */
export async function POST(request: NextRequest) {
  const limit = await rateLimit(`account-signup:${clientIp(request)}`, MAX_ATTEMPTS, WINDOW_MS);
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

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Check the information you entered',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const email = normaliseEmail(parsed.data.email);
  const emailLimit = await rateLimit(`account-signup:${email}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!emailLimit.allowed) {
    return NextResponse.json({ success: true, data: { sent: true }, error: null });
  }

  try {
    const tenant = await getTenantContext();

    const customer = await prisma.customer.upsert({
      where: { email },
      create: {
        email,
        name: parsed.data.name,
        countryCode: parsed.data.countryCode,
        whatsapp: parsed.data.whatsapp,
      },
      update: {},
    });

    const account = await prisma.customerAccount.upsert({
      where: { email },
      create: {
        customerId: customer.id,
        tenantId: tenant.id,
        email,
        status: 'PENDING',
      },
      update: {},
    });

    const purpose = account.status === 'PENDING' ? 'ACTIVATE' : 'SIGN_IN';
    await issueAccountOtp({ accountId: account.id, email: account.email, purpose });
  } catch {
    console.error('Account sign-up failed');
  }

  return NextResponse.json({ success: true, data: { sent: true }, error: null });
}
