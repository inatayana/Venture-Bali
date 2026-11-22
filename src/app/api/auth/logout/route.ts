/**
 * BaliWild — POST /api/auth/logout
 *
 * Clear session and revoke server-side.
 */

import { NextResponse } from 'next/server';
import { clearSession, getSession } from '@/lib/auth/cookies';
import { prisma } from '@/lib/prisma';
import { createServerLogger } from '@/lib/logger';

const logger = createServerLogger('api:auth:logout');

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      // Log auth attempt
      await prisma.authAttempt.create({
        data: {
          customerId: session.customerId,
          email: session.email,
          type: 'LOGOUT',
          success: true,
        },
      });

      logger.info({ customerId: session.customerId }, 'User logged out');
    }

    // Clear session (cookie + server-side revocation)
    await clearSession();

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ error }, 'Logout failed');
    // Even on error, try to clear cookie
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      cookieStore.delete('bw_session');
    } catch { /* ignore */ }

    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}