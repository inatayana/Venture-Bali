/**
 * BaliWild — Customer Data Access Layer (SERVER ONLY)
 * -----------------------------------------------------
 * Centralises customer authentication for pages, route handlers and Server
 * Actions. Never reads `vb_admin_session`; admin identity is a separate actor.
 *
 * The cookie is verified (HMAC) and then looked up in `CustomerSession` by the
 * SHA-256 hash of its opaque id, so logout revokes the server-side record.
 *
 * Docs: docs/CUSTOMER_ACCOUNT_DESIGN.md
 */

import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import {
  CUSTOMER_SESSION_TTL_SECONDS,
  createCustomerSessionToken,
  getCustomerSessionCookieName,
  hashSessionId,
  verifyCustomerSessionToken,
} from './customerSession';

const ROLLING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface CustomerSessionUser {
  accountId: string;
  customerId: string;
  name: string;
  email: string;
  tenantId: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  joinedAt: string;
  whatsapp: string;
  countryCode: string;
  /** True when the customer has opted into password sign-in (Phase 4). */
  hasPassword: boolean;
}

/** Create a revocable session row and return the signed cookie value. */
export async function issueCustomerSession(accountId: string): Promise<string> {
  const sessionId = randomBytes(32).toString('base64url');
  const sessionHash = await hashSessionId(sessionId);

  await prisma.customerSession.create({
    data: {
      accountId,
      sessionHash,
      expiresAt: new Date(Date.now() + CUSTOMER_SESSION_TTL_SECONDS * 1000),
    },
  });

  return createCustomerSessionToken(sessionId);
}

/** Verify the current request's customer session, or return null (guest). */
export async function getCustomerSession(): Promise<CustomerSessionUser | null> {
  const cookie = cookies().get(getCustomerSessionCookieName())?.value;
  const sessionId = await verifyCustomerSessionToken(cookie);
  if (!sessionId) return null;

  try {
    const sessionHash = await hashSessionId(sessionId);
    const row = await prisma.customerSession.findUnique({
      where: { sessionHash },
      include: {
        account: {
          include: { customer: { select: { name: true, whatsapp: true, countryCode: true } } },
        },
      },
    });

    const now = new Date();
    if (
      !row ||
      row.revokedAt !== null ||
      row.expiresAt <= now ||
      row.account.status !== 'ACTIVE'
    ) {
      return null;
    }

    // Extend only inside the rolling window — no DB write on the common path.
    if (row.expiresAt.getTime() - now.getTime() < ROLLING_WINDOW_MS) {
      await prisma.customerSession.update({
        where: { id: row.id },
        data: {
          expiresAt: new Date(now.getTime() + CUSTOMER_SESSION_TTL_SECONDS * 1000),
          lastSeenAt: now,
        },
      });
    }

    return {
      accountId: row.accountId,
      customerId: row.account.customerId,
      name: row.account.customer.name,
      email: row.account.email,
      tenantId: row.account.tenantId,
      status: row.account.status,
      joinedAt: row.account.createdAt.toISOString(),
      whatsapp: row.account.customer.whatsapp,
      countryCode: row.account.customer.countryCode,
      hasPassword: row.account.passwordHash !== null,
    };
  } catch {
    // Fail closed: a database problem must never authenticate a visitor.
    console.error('Customer session lookup failed');
    return null;
  }
}

/** Alias used by route handlers and Server Actions that require a customer. */
export async function requireCustomer(): Promise<CustomerSessionUser | null> {
  return getCustomerSession();
}

/** Revoke every other session for this account after a credential change. */
export async function revokeOtherCustomerSessions(accountId: string): Promise<void> {
  const cookie = cookies().get(getCustomerSessionCookieName())?.value;
  const sessionId = await verifyCustomerSessionToken(cookie);
  const currentHash = sessionId ? await hashSessionId(sessionId) : null;

  await prisma.customerSession.updateMany({
    where: {
      accountId,
      revokedAt: null,
      ...(currentHash ? { sessionHash: { not: currentHash } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}

/** Revoke the current session in the database (not just in the browser). */
export async function revokeCurrentCustomerSession(): Promise<void> {
  const cookie = cookies().get(getCustomerSessionCookieName())?.value;
  const sessionId = await verifyCustomerSessionToken(cookie);
  if (!sessionId) return;

  const sessionHash = await hashSessionId(sessionId);
  await prisma.customerSession.updateMany({
    where: { sessionHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
