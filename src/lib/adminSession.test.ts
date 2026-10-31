import {
  ADMIN_SESSION_TTL_SECONDS,
  createSessionToken,
  hasRole,
  verifySessionToken,
  type AdminSession,
} from './adminSession';

const ORIGINAL_SECRET = process.env.ADMIN_SESSION_SECRET;

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = 'test-secret-value-that-is-long-enough';
});

afterAll(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.ADMIN_SESSION_SECRET;
  } else {
    process.env.ADMIN_SESSION_SECRET = ORIGINAL_SECRET;
  }
});

function makeSession(overrides: Partial<AdminSession> = {}): AdminSession {
  return {
    adminId: 'admin-1',
    email: 'operator@venturebali.com',
    role: 'ADMIN',
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
    ...overrides,
  };
}

describe('admin session tokens', () => {
  it('round-trips a valid session', async () => {
    const token = await createSessionToken(makeSession());
    const session = await verifySessionToken(token);

    expect(session).not.toBeNull();
    expect(session?.adminId).toBe('admin-1');
    expect(session?.email).toBe('operator@venturebali.com');
    expect(session?.role).toBe('ADMIN');
  });

  it('rejects a missing token', async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken('')).toBeNull();
  });

  it('rejects a tampered payload', async () => {
    const token = await createSessionToken(makeSession());
    const [scheme, , signature] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify(makeSession({ role: 'SUPER_ADMIN' })),
      'utf8'
    ).toString('base64url');

    expect(await verifySessionToken(`${scheme}.${forged}.${signature}`)).toBeNull();
  });

  it('rejects a tampered signature', async () => {
    const token = await createSessionToken(makeSession());
    const tampered = `${token.slice(0, -4)}AAAA`;

    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await createSessionToken(makeSession());

    process.env.ADMIN_SESSION_SECRET = 'a-completely-different-secret-value';
    expect(await verifySessionToken(token)).toBeNull();

    process.env.ADMIN_SESSION_SECRET = 'test-secret-value-that-is-long-enough';
  });

  it('rejects an expired session', async () => {
    const token = await createSessionToken(
      makeSession({ exp: Math.floor(Date.now() / 1000) - 60 })
    );

    expect(await verifySessionToken(token)).toBeNull();
  });

  it('rejects a structurally broken token', async () => {
    expect(await verifySessionToken('garbage')).toBeNull();
    expect(await verifySessionToken('v1.only-two-parts')).toBeNull();
    expect(await verifySessionToken('v2.a.b')).toBeNull();
  });

  it('rejects every session when the secret is not configured', async () => {
    delete process.env.ADMIN_SESSION_SECRET;

    expect(await verifySessionToken('v1.payload.signature')).toBeNull();

    process.env.ADMIN_SESSION_SECRET = 'test-secret-value-that-is-long-enough';
  });
});

describe('hasRole', () => {
  it('ranks the roles', () => {
    const viewer = makeSession({ role: 'VIEWER' });
    const editor = makeSession({ role: 'EDITOR' });
    const admin = makeSession({ role: 'ADMIN' });
    const superAdmin = makeSession({ role: 'SUPER_ADMIN' });

    expect(hasRole(viewer, 'VIEWER')).toBe(true);
    expect(hasRole(viewer, 'EDITOR')).toBe(false);
    expect(hasRole(editor, 'VIEWER')).toBe(true);
    expect(hasRole(admin, 'EDITOR')).toBe(true);
    expect(hasRole(superAdmin, 'ADMIN')).toBe(true);
    expect(hasRole(admin, 'SUPER_ADMIN')).toBe(false);
  });

  it('treats a missing session as having no role', () => {
    expect(hasRole(null, 'VIEWER')).toBe(false);
  });
});
