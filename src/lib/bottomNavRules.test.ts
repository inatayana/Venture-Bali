import { getBottomNavVisibility } from './bottomNavRules';
import { BOTTOM_NAV_ITEMS } from './navigationConfig';

describe('mobile bottom navigation on product pages', () => {
  it.each([
    '/experiences/cmw3lypxy006oq2sj6sue62cn/mount-batur-sunrise-trekking',
    '/experiences/cmw3lznmb00amq2sjoujrmcb1/ubud-atv-ayung-rafting-combo',
    '/experiences',
  ])('is visible on %s', (pathname) => {
    expect(getBottomNavVisibility(pathname)).toBe('VISIBLE');
    expect(BOTTOM_NAV_ITEMS.every((item) => !item.hideOnMatch?.(pathname))).toBe(true);
  });

  it('stays hidden on transactional routes', () => {
    expect(getBottomNavVisibility('/checkout/order-1')).toBe('HIDDEN');
    expect(getBottomNavVisibility('/booking/order-1')).toBe('HIDDEN');
    expect(getBottomNavVisibility('/admin/bookings')).toBe('HIDDEN');
  });

  it('keeps the four primary destinations on a product detail page', () => {
    expect(BOTTOM_NAV_ITEMS.map((item) => item.key)).toEqual([
      'explore',
      'wishlists',
      'trips',
      'profile',
    ]);
  });
});
