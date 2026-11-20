import { buildHoldRecoveryText, buildWishlistEnquiryUrl } from './growthMessages';

describe('buildWishlistEnquiryUrl', () => {
  it('prefills WhatsApp with the real product URL and no invented urgency', () => {
    const url = buildWishlistEnquiryUrl({
      title: 'Ubud River Tubing Adventure',
      id: 'vtr-001',
      slug: 'ubud-river-tubing',
      baseUrl: 'https://baliwild.com',
    });

    expect(url).toContain('https://wa.me/6285117321388?text=');
    expect(decodeURIComponent(url)).toContain('https://baliwild.com/experiences/vtr-001/ubud-river-tubing');
    expect(decodeURIComponent(url)).toContain('Is it available for my dates?');
    expect(url.toLowerCase()).not.toContain('only');
    expect(url.toLowerCase()).not.toContain('last chance');
  });
});

describe('buildHoldRecoveryText', () => {
  it('points the guest back to checkout with factual details only', () => {
    const text = buildHoldRecoveryText({
      bookingCode: 'BK-123',
      title: 'Ubud ATV Ride',
      dateLabel: '21 Nov 2026',
      checkoutUrl: 'https://baliwild.com/checkout/BK-123',
    });

    expect(text).toContain('BK-123');
    expect(text).toContain('21 Nov 2026');
    expect(text).toContain('https://baliwild.com/checkout/BK-123');
    expect(text).not.toContain('expires in');
  });
});
