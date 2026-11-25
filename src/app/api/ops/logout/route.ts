import { NextResponse } from 'next/server';
import { revokeCurrentOpsSession } from '@/lib/opsGuard';
import { getOpsSessionCookieName } from '@/lib/opsSession';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await revokeCurrentOpsSession();
  } catch {
    console.error('Field Ops session revocation failed');
  }

  const response = NextResponse.json({ success: true, data: { signedOut: true }, error: null });
  response.cookies.set(getOpsSessionCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
