/**
 * BaliWild — Admin Session
 * ----------------------------
 * Signed, stateless session tokens for the operator panel.
 *
 * EDGE SAFE: this module uses only Web Crypto, so it can run inside the
 * Next.js middleware (Edge runtime) as well as in Node route handlers.
 * Password hashing lives in `src/lib/adminAuth.ts`, which is Node only.
 *
 * Docs: docs/SECURITY_PROTOCOL.md
 */

export const ADMIN_SESSION_COOKIE = 'vb_admin_session';

/** Operator sessions last eight hours. */
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface AdminSession {
  adminId: string;
  email: string;
  role: AdminRole;
  /** Expiry as a unix timestamp in seconds. */
  exp: number;
}

const SESSION_SCHEME = 'v1';

// ============ BASE64URL (no Buffer, no btoa — Edge safe) ============

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

// ============ HMAC ============

async function importHmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'ADMIN_SESSION_SECRET is not configured. Use at least 16 random characters.'
    );
  }
  return secret;
}

/**
 * Create a signed session token.
 * Format: `v1.<base64url payload>.<base64url signature>`
 */
export async function createSessionToken(session: AdminSession): Promise<string> {
  const secret = getSessionSecret();
  const payload = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(session))
  );
  const key = await importHmacKey(secret, 'sign');
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${SESSION_SCHEME}.${payload}`)
  );
  return `${SESSION_SCHEME}.${payload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

/**
 * Verify a session token and return its payload, or null when the token is
 * missing, tampered with or expired.
 *
 * The signature comparison runs inside Web Crypto, so it is constant time.
 */
export async function verifySessionToken(
  token: string | undefined
): Promise<AdminSession | null> {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [scheme, payload, signature] = parts;
  if (scheme !== SESSION_SCHEME) return null;

  let key: CryptoKey;
  try {
    key = await importHmacKey(getSessionSecret(), 'verify');
  } catch {
    // The secret is not configured — nobody can be authenticated.
    return null;
  }

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = base64UrlToBytes(signature);
  } catch {
    return null;
  }

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    new TextEncoder().encode(`${scheme}.${payload}`)
  );

  if (!isValid) return null;

  try {
    const session = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payload))
    ) as AdminSession;

    if (typeof session.exp !== 'number' || session.exp * 1000 <= Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

// ============ ROLE HELPERS ============

const ROLE_RANK: Record<AdminRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/**
 * True when the session role is at least as powerful as the required role.
 */
export function hasRole(session: AdminSession | null, required: AdminRole): boolean {
  if (!session) return false;
  return ROLE_RANK[session.role] >= ROLE_RANK[required];
}
