/**
 * BaliWild — GET /api/auth/me
 *
 * Get current authenticated user.
 * Returns 401 if not authenticated.
 */

import { NextResponse } from 'next/server';
import { getSession, getCurrentCustomer } from '@/lib/auth/cookies';
import { createServerLogger } from '@/lib/logger';

const logger = createServerLogger('api:auth:me');

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const customer = await getCurrentCustomer();

    if (!customer) {
      logger.warn({ sessionCustomerId: session.customerId }, 'Session exists but customer not found');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Auth me failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}