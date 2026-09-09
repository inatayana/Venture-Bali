import { generateVoucherId, generateQRCodeData } from '@/lib/voucher';

describe('voucher utilities', () => {
  it('generates voucher id with VR prefix', () => {
    const id = generateVoucherId('booking-001');
    expect(id).toMatch(/^VR-[A-Z0-9]+-[A-F0-9]{8}$/);
  });

  it('generates different ids for different bookings', () => {
    const id1 = generateVoucherId('booking-001');
    const id2 = generateVoucherId('booking-002');
    expect(id1).not.toBe(id2);
  });

  it('QR data points to redemption URL with voucher id and booking code', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://venturebali.com';
    const qr = generateQRCodeData('VR-ABC-12345678', 'BK-TEST-001');
    expect(qr).toBe('https://venturebali.com/redeem/VR-ABC-12345678?code=BK-TEST-001');
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('falls back to default base URL when env not set', () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    const qr = generateQRCodeData('VR-ABC-12345678', 'BK-TEST-001');
    expect(qr).toContain('/redeem/VR-ABC-12345678');
    expect(qr).toContain('code=BK-TEST-001');
    if (previous !== undefined) process.env.NEXT_PUBLIC_APP_URL = previous;
  });
});
