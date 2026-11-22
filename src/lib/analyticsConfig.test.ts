import { getAnalyticsConfig } from './analyticsConfig';

const originalGtm = process.env.NEXT_PUBLIC_GTM_ID;
const originalGa = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

afterEach(() => {
  if (originalGtm === undefined) delete process.env.NEXT_PUBLIC_GTM_ID;
  else process.env.NEXT_PUBLIC_GTM_ID = originalGtm;
  if (originalGa === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = originalGa;
});

describe('getAnalyticsConfig', () => {
  it('returns no destination when neither id is configured', () => {
    delete process.env.NEXT_PUBLIC_GTM_ID;
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    expect(getAnalyticsConfig()).toEqual({ gtmId: null, gaId: null });
  });

  it('prefers GTM and suppresses direct GA4 to avoid double page views', () => {
    process.env.NEXT_PUBLIC_GTM_ID = ' GTM-ABC123 ';
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-XYZ789';
    expect(getAnalyticsConfig()).toEqual({ gtmId: 'GTM-ABC123', gaId: null });
  });

  it('uses GA4 directly when GTM is absent', () => {
    delete process.env.NEXT_PUBLIC_GTM_ID;
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = ' G-XYZ789 ';
    expect(getAnalyticsConfig()).toEqual({ gtmId: null, gaId: 'G-XYZ789' });
  });
});
