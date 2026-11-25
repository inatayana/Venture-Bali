import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyPassword } from '@/lib/passwordHash';
import { issueOpsSession } from '@/lib/opsGuard';
import { getOpsSessionCookieName, getOpsSessionCookieOptions } from '@/lib/opsSession';
import { prisma } from '@/lib/prisma';
import { clientIp, rateLimit } from '@/lib/rateLimit.distributed';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1),
});

const WINDOW_MS = 15 * 60_000;
const GENERIC = { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' };

export async function POST(request: NextRequest) {
  const limit = await rateLimit(`ops-login:${clientIp(request)}`, 5, WINDOW_MS);
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

  const email = parsed.data.email.toLowerCase();
  try {
    const user = await prisma.fieldOpsUser.findUnique({ where: { email } });
    const matches = verifyPassword(parsed.data.password, user?.passwordHash ?? 'scrypt$00$00');
    if (!user || !user.isActive || !matches) {
      return NextResponse.json({ success: false, error: GENERIC }, { status: 401 });
    }

    await prisma.fieldOpsUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = await issueOpsSession(user.id);

    const response = NextResponse.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
      error: null,
    });
    response.cookies.set(getOpsSessionCookieName(), token, getOpsSessionCookieOptions());
    return response;
  } catch {
    console.error('Field Ops login failed');
    return NextResponse.json(
      { success: false, error: { code: 'LOGIN_FAILED', message: 'Sign-in is temporarily unavailable' } },
      { status: 500 },
    );
  }
}
