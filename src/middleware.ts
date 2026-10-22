import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/adminSession';

/**
 * Protect the operator panel.
 *
 * Requests to /admin (except the login page and the auth endpoints) must
 * carry a valid, signed session cookie. The role check itself happens in
 * the admin pages and API routes, because the middleware only verifies the
 * signature and the expiry.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicAdminPath =
    pathname === '/admin/login' ||
    pathname.startsWith('/api/admin/login') ||
    pathname.startsWith('/api/admin/logout');

  if (isPublicAdminPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Operator sign-in required' },
        },
        { status: 401 }
      );
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
