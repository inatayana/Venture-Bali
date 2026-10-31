import { createHmac } from 'node:crypto';
import { verifyMetaSignature } from './webhookSignature';

const SECRET = 'meta-app-secret-for-tests';
const BODY = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
const VALID = `sha256=${createHmac('sha256', SECRET).update(BODY, 'utf8').digest('hex')}`;

describe('Meta webhook signature', () => {
  it('accepts a signature computed over the raw body', () => {
    expect(verifyMetaSignature(BODY, VALID, SECRET)).toBe(true);
  });

  it('rejects a tampered body or signature', () => {
    expect(verifyMetaSignature(`${BODY} `, VALID, SECRET)).toBe(false);
    expect(verifyMetaSignature(BODY, `${VALID}0`, SECRET)).toBe(false);
    expect(verifyMetaSignature(BODY, 'sha256=deadbeef', SECRET)).toBe(false);
  });

  it('fails closed when the secret or header is missing', () => {
    expect(verifyMetaSignature(BODY, VALID, undefined)).toBe(false);
    expect(verifyMetaSignature(BODY, null, SECRET)).toBe(false);
  });
});
