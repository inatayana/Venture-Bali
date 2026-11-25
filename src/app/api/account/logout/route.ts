import { NextResponse } from 'next/server';
import { revokeCurrentCustomerSession } from '@/lib/customerGuard';
import { getCustomerSessionCookieName } from '@/lib/customerSession';

export const dynamic = 'force-dynamic';

/** Revoke the session server-side, then clear the browser cookie. */
export async function POST() {
  try {
    await revokeCurrentCustomerSession();
  } catch {
    console.error('Customer session revocation failed');
  }

  const response = NextResponse.json({ success: true, data: { signedOut: true }, error: null });
  response.cookies.set(getCustomerSessionCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
