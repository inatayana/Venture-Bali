/**
 * BaliWild — Field Ops DAL (SERVER ONLY)
 * ---------------------------------------
 * Authorises the Field Ops actor. Never reads admin or customer cookies.
 */

import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import {
  OPS_SESSION_TTL_SECONDS,
  createOpsSessionToken,
  getOpsSessionCookieName,
  hashSessionId,
  verifyOpsSessionToken,
} from './opsSession';

export interface FieldOpsUser {
  id: string;
  name: string;
  email: string;
  role: 'DRIVER' | 'GUIDE' | 'SUPERVISOR';
  tenantId: string;
}

export async function issueOpsSession(userId: string): Promise<string> {
  const sessionId = randomBytes(32).toString('base64url');
  const sessionHash = await hashSessionId(sessionId);
  await prisma.fieldOpsSession.create({
    data: {
      userId,
      sessionHash,
      expiresAt: new Date(Date.now() + OPS_SESSION_TTL_SECONDS * 1000),
    },
  });
  return createOpsSessionToken(sessionId);
}

/** Verify the current Field Ops session, or return null (deny). */
export async function requireFieldOps(): Promise<FieldOpsUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getOpsSessionCookieName())?.value;
  const sessionId = await verifyOpsSessionToken(token);
  if (!sessionId) return null;

  try {
    const sessionHash = await hashSessionId(sessionId);
    const row = await prisma.fieldOpsSession.findUnique({
      where: { sessionHash },
      include: { user: true },
    });
    const now = new Date();
    if (!row || row.revokedAt !== null || row.expiresAt <= now || !row.user.isActive) return null;

    return {
      id: row.user.id,
      name: row.user.name,
      email: row.user.email,
      role: row.user.role,
      tenantId: row.user.tenantId,
    };
  } catch {
    console.error('Field Ops session lookup failed');
    return null;
  }
}

export function isSupervisor(user: FieldOpsUser): boolean {
  return user.role === 'SUPERVISOR';
}

export async function revokeCurrentOpsSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getOpsSessionCookieName())?.value;
  const sessionId = await verifyOpsSessionToken(token);
  if (!sessionId) return;

  const sessionHash = await hashSessionId(sessionId);
  await prisma.fieldOpsSession.updateMany({
    where: { sessionHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
