/**
 * BaliWild — Secure Cookie Management for Auth
 *
 * Uses HttpOnly, Secure, SameSite=Lax cookies for session management.
 * Session data stored server-side (Customer ID), cookie only holds session ID.
 */

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'dev-session-secret-change-in-production-min-32-chars'
);

const SESSION_COOKIE_NAME = 'bw_session';
const SESSION_TTL_DAYS = 30;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

export type SessionPayload = {
  customerId: string;
  email: string;
  iat: number;
  exp: number;
  jti: string;
};

/**
 * Create a new session cookie for the customer.
 */
export async function createSession(customerId: string, email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + SESSION_TTL_SECONDS;
  const jti = crypto.randomUUID();

  const payload: SessionPayload = {
    customerId,
    email,
    iat: now,
    exp,
    jti,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(jti)
    .sign(SESSION_SECRET);

  // Store session in DB for revocation support
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      sessionToken: token, // In production, store hash only
      sessionExpires: new Date(exp * 1000),
      sessionJti: jti,
    },
  });

  return token;
}

/**
 * Set the session cookie in the response.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

/**
 * Get and verify the current session from cookie.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    const session = payload as unknown as SessionPayload;

    // Verify session exists in DB and not revoked
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { id: true, sessionJti: true, sessionExpires: true },
    });

    if (!customer || !customer.sessionJti || customer.sessionJti !== session.jti) {
      return null; // Session revoked or invalid
    }

    if (customer.sessionExpires && new Date() > customer.sessionExpires) {
      return null; // Expired
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Clear the session cookie and revoke server-side.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SESSION_SECRET);
      const session = payload as unknown as SessionPayload;

      // Revoke server-side
      await prisma.customer.update({
        where: { id: session.customerId },
        data: {
          sessionToken: null,
          sessionExpires: null,
          sessionJti: null,
        },
      });
    } catch {
      // Ignore verification errors on logout
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Refresh session expiry (sliding window).
 */
export async function refreshSession(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  // Extend expiry
  await createSession(session.customerId, session.email);
  return true;
}

/**
 * Get current customer from session (convenience helper).
 */
export async function getCurrentCustomer(): Promise<{
  id: string;
  email: string;
  name: string;
} | null> {
  const session = await getSession();
  if (!session) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { id: true, email: true, name: true },
  });

  return customer;
}

/**
 * Require authentication (throw if not authenticated).
 * Use in API routes that require auth.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}