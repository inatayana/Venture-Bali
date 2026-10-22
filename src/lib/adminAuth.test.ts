import { hashPassword, verifyPassword } from './adminAuth';

describe('admin password hashing', () => {
  it('produces a scrypt hash with a salt', () => {
    const hash = hashPassword('correct horse battery staple');

    expect(hash.startsWith('scrypt$')).toBe(true);
    const [, salt, derived] = hash.split('$');
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
    expect(a.split('$')[1]).not.toBe(b.split('$')[1]);
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

  it('rejects malformed stored hashes instead of throwing', () => {
    expect(verifyPassword('anything', '')).toBe(false);
    expect(verifyPassword('anything', 'not-a-hash')).toBe(false);
    expect(verifyPassword('anything', 'bcrypt$00$00')).toBe(false);
    expect(verifyPassword('anything', 'scrypt$$')).toBe(false);
    expect(verifyPassword('anything', 'scrypt$00$')).toBe(false);
  });
});
