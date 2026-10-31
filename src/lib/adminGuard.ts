import { cookies } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  hasRole,
  verifySessionToken,
  type AdminRole,
  type AdminSession,
} from './adminSession';

/**
 * Shared guard for admin route handlers.
 * The middleware already blocks anonymous calls; this also enforces the role,
 * which the middleware deliberately does not do.
 */
export async function requireAdminRole(role: AdminRole = 'EDITOR'): Promise<AdminSession | null> {
  const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || !hasRole(session, role)) return null;
  return session;
}
