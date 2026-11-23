import { PUBLIC_API_KEYS_ENV, verifyApiKey } from '@/lib/apiKey';

describe('verifyApiKey', () => {
  const originalKeys = process.env[PUBLIC_API_KEYS_ENV];

  afterEach(() => {
    if (originalKeys === undefined) {
      delete process.env[PUBLIC_API_KEYS_ENV];
    } else {
      process.env[PUBLIC_API_KEYS_ENV] = originalKeys;
    }
  });

  beforeEach(() => {
    process.env[PUBLIC_API_KEYS_ENV] = 'bw_test_key_one,bw_test_key_two';
  });

  it('accepts a configured key', () => {
    expect(verifyApiKey('bw_test_key_one')).toBe(true);
  });

  it('accepts the second of several configured keys', () => {
    expect(verifyApiKey('bw_test_key_two')).toBe(true);
  });

  it('rejects an unknown key', () => {
    expect(verifyApiKey('bw_wrong_key')).toBe(false);
  });

  it('rejects when no key is provided', () => {
    expect(verifyApiKey(null)).toBe(false);
    expect(verifyApiKey('')).toBe(false);
  });

  it('rejects when no key is configured', () => {
    delete process.env[PUBLIC_API_KEYS_ENV];
    expect(verifyApiKey('bw_test_key_one')).toBe(false);
  });
});
