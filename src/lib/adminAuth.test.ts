import { scryptSync } from 'node:crypto';
import { hashPassword, verifyPassword } from './adminAuth';

describe('password hashing (shared by admin and customer)', () => {
  it('produces an OWASP scrypt hash with parameters and a salt', () => {
    const hash = hashPassword('correct horse battery staple');
    const [scheme, n, r, p, salt, derived] = hash.split('$');

    expect(scheme).toBe('scrypt');
    expect(n).toBe('131072'); // 2^17
    expect(r).toBe('8');
    expect(p).toBe('1');
    expect(salt).toHaveLength(32);
    expect(derived).toHaveLength(128);
  });

  it('never stores the plain password', () => {
    const hash = hashPassword('SuperSecret123');
    expect(hash).not.toContain('SuperSecret123');
  });

  it('salts every hash, so the same password hashes differently', () => {
    const a = hashPassword('SuperSecret123');
    const b = hashPassword('SuperSecret123');

    expect(a).not.toBe(b);
    expect(a.split('$')[4]).not.toBe(b.split('$')[4]);
  });

  it('verifies the correct password', () => {
    const hash = hashPassword('SuperSecret123');
    expect(verifyPassword('SuperSecret123', hash)).toBe(true);
  });

  it('rejects the wrong password', () => {
    const hash = hashPassword('SuperSecret123');
    expect(verifyPassword('SuperSecret124', hash)).toBe(false);
    expect(verifyPassword('', hash)).toBe(false);
    expect(verifyPassword('super secret 123', hash)).toBe(false);
  });

  it('still verifies legacy 3-part admin hashes (N=2^14)', () => {
    const salt = 'a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4';
    const derived = scryptSync('LegacyPassword', salt, 64).toString('hex');
    const legacyHash = `scrypt$${salt}$${derived}`;

    expect(verifyPassword('LegacyPassword', legacyHash)).toBe(true);
    expect(verifyPassword('WrongPassword', legacyHash)).toBe(false);
  });

  it('rejects malformed or forged parameters instead of throwing', () => {
    expect(verifyPassword('anything', '')).toBe(false);
    expect(verifyPassword('anything', 'not-a-hash')).toBe(false);
    expect(verifyPassword('anything', 'bcrypt$00$00')).toBe(false);
    expect(verifyPassword('anything', 'scrypt$$')).toBe(false);
    expect(verifyPassword('anything', 'scrypt$00$')).toBe(false);
    expect(verifyPassword('anything', 'scrypt$00$00')).toBe(false);
    // Forged cheap parameters must not be honoured.
    expect(verifyPassword('anything', 'scrypt$1$1$1$00$00')).toBe(false);
    expect(verifyPassword('anything', 'scrypt$notanumber$8$1$00$00')).toBe(false);
  });
});
