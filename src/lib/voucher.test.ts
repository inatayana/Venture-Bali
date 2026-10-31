import { generateQRCodeData, generateQRCodeDataURL } from './voucher';

describe('voucher QR code', () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = previous;
  });

  it('encodes the public verification URL instead of internal ids', () => {
    expect(generateQRCodeData('BK-TEST-001')).toBe(
      'https://app.example.com/voucher/verify/BK-TEST-001',
    );
  });

  it('escapes the booking code so the URL stays valid', () => {
    expect(generateQRCodeData('BK 1/2')).toBe(
      'https://app.example.com/voucher/verify/BK%201%2F2',
    );
  });

  it('renders a scannable SVG data URL', async () => {
    const dataUrl = await generateQRCodeDataURL(
      'https://app.example.com/voucher/verify/BK-TEST-001',
      { width: 200 },
    );

    expect(dataUrl.startsWith('data:image/svg+xml;base64,')).toBe(true);

    const svg = Buffer.from(dataUrl.split(',')[1], 'base64').toString('utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox');
    expect(svg.length).toBeGreaterThan(500);
  });
});
