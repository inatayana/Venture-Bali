import {
  createOpsSessionToken,
  getOpsSessionCookieName,
  opsCookieName,
  verifyOpsSessionToken,
} from './opsSession';

const SECRET = 'ops-session-secret-at-least-16';
const SID = 'b'.repeat(43);

describe('Field Ops session tokens', () => {
  const originalSecret = process.env.OPS_SESSION_SECRET;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.OPS_SESSION_SECRET = SECRET;
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.OPS_SESSION_SECRET;
    else process.env.OPS_SESSION_SECRET = originalSecret;
    if (originalEnv !== undefined) Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, configurable: true, writable: true });
  });

  it('signs and verifies an opaque ops session id', async () => {
    const token = await createOpsSessionToken(SID);
    expect(token.startsWith('os1.')).toBe(true);
    expect(await verifyOpsSessionToken(token)).toBe(SID);
    expect(token).not.toContain('@');
  });

  it('rejects tampering and fails closed without a secret', async () => {
    const token = await createOpsSessionToken(SID);
    expect(await verifyOpsSessionToken(`${token.slice(0, -1)}X`)).toBeNull();
    expect(await verifyOpsSessionToken('os1.short.sig')).toBeNull();

    delete process.env.OPS_SESSION_SECRET;
    expect(await verifyOpsSessionToken(token)).toBeNull();
    await expect(createOpsSessionToken(SID)).rejects.toThrow(/OPS_SESSION_SECRET/);
  });

  it('uses a separate __Host- cookie only in production HTTPS', () => {
    expect(opsCookieName(true)).toBe('__Host-vb_ops_session');
    expect(opsCookieName(false)).toBe('vb_ops_session');
    expect(getOpsSessionCookieName()).toBe('vb_ops_session');
  });
});
