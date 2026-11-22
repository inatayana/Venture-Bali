/**
 * BaliWild — GET /api/auth/verify
 *
 * Verify magic link token and establish session.
 * Redirects to the intended page on success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink } from '@/lib/auth/magicLink';
import { createSession, setSessionCookie } from '@/lib/auth/cookies';
import { createServerLogger } from '@/lib/logger';

const logger = createServerLogger('api:auth:verify');

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const redirectTo = searchParams.get('redirect') ?? '/';

  if (!token) {
    logger.warn('Verify attempt without token');
    return NextResponse.redirect(
      new URL(`/auth/error?code=missing_token&redirect=${encodeURIComponent(redirectTo)}`, request.url)
    );
  }

  // Verify the magic link
  const result = await verifyMagicLink(token);

  if (!result.success || !result.customer) {
    logger.warn({ error: result.error }, 'Magic link verification failed');
    return NextResponse.redirect(
      new URL(
        `/auth/error?code=${encodeURIComponent(result.error ?? 'invalid_token')}&redirect=${encodeURIComponent(redirectTo)}`,
        request.url
      )
    );
  }

  const { customer } = result;

  // Create session
  const sessionToken = await createSession(customer.id, customer.email);

  // Set session cookie
  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  await setSessionCookie(sessionToken);

  logger.info({ customerId: customer.id, email: customer.email }, 'Session created via magic link');

  return response;
}