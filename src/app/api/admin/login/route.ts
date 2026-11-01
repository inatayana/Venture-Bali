import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createSessionToken,
  type AdminRole,
} from '@/lib/adminSession';
import { verifyPassword } from '@/lib/adminAuth';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export async function POST(request: NextRequest) {
  const limit = rateLimit(`admin-login:${clientIp(request)}`, 5, 15 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Try again in 15 minutes.' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const admin = await prisma.adminUser.findUnique({ where: { email } });

    // Always run a hash comparison so a missing account and a wrong
    // password take the same amount of time.
    const storedHash = admin?.passwordHash ?? 'scrypt$00$00';
    const passwordMatches = verifyPassword(parsed.data.password, storedHash);

    if (!admin || !admin.isActive || !passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' },
        },
        { status: 401 }
      );
    }

    const role = admin.role as AdminRole;

    const token = await createSessionToken({
      adminId: admin.id,
      email: admin.email,
      role,
      exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
    });

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const response = NextResponse.json({
      success: true,
      data: { email: admin.email, name: admin.name, role },
      error: null,
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Admin login failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'LOGIN_FAILED', message: 'Sign-in is temporarily unavailable' },
      },
      { status: 500 }
    );
  }
}
