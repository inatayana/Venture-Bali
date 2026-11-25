import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/customerGuard';

export const dynamic = 'force-dynamic';

/** Verified session for the client hook. Never trusts a client-decoded cookie. */
export async function GET() {
  const user = await requireCustomer();
  const headers = { 'Cache-Control': 'no-store' };

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Customer sign-in required' },
      },
      { status: 401, headers },
    );
  }

  return NextResponse.json({ success: true, data: user, error: null }, { headers });
}
