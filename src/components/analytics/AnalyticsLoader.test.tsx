import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { AnalyticsLoader } from './AnalyticsLoader';

jest.mock('next/script', () => ({
  __esModule: true,
  default: function MockScript({
    id,
    src,
    children,
  }: {
    id?: string;
    src?: string;
    children?: ReactNode;
  }) {
    return (
      <div data-script-id={id} data-script-src={src}>
        {children}
      </div>
    );
  },
}));

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

const originalGtm = process.env.NEXT_PUBLIC_GTM_ID;
const originalGa = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function setConsent(value: 'all' | 'essential'): void {
  window.localStorage.setItem('baliwild_cookie_consent', value);
}

afterEach(() => {
  window.localStorage.removeItem('baliwild_cookie_consent');
  delete (window as GtagWindow).gtag;
  if (originalGtm === undefined) delete process.env.NEXT_PUBLIC_GTM_ID;
  else process.env.NEXT_PUBLIC_GTM_ID = originalGtm;
  if (originalGa === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = originalGa;
});

describe('AnalyticsLoader', () => {
  it('renders nothing without a configured destination', () => {
    delete process.env.NEXT_PUBLIC_GTM_ID;
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    setConsent('all');

    const { container } = render(<AnalyticsLoader />);
    expect(container.querySelectorAll('[data-script-id]')).toHaveLength(0);
  });

  it('does not load analytics before consent', () => {
    process.env.NEXT_PUBLIC_GTM_ID = 'GTM-ABC123';
    setConsent('essential');

    const { container } = render(<AnalyticsLoader />);
    expect(container.querySelectorAll('[data-script-id]')).toHaveLength(0);
  });

  it('loads GTM after consent', () => {
    process.env.NEXT_PUBLIC_GTM_ID = 'GTM-ABC123';
    setConsent('all');

    render(<AnalyticsLoader />);
    const gtm = document.querySelector('[data-script-id="baliwild-gtm"]');
    expect(gtm).not.toBeNull();
    expect(gtm?.textContent).toContain('GTM-ABC123');
  });

  it('forwards baliwild:analytics events to GA4 when GTM is absent', () => {
    delete process.env.NEXT_PUBLIC_GTM_ID;
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-XYZ789';
    setConsent('all');
    const gtag = jest.fn();
    (window as GtagWindow).gtag = gtag;

    render(<AnalyticsLoader />);
    expect(document.querySelector('[data-script-id="baliwild-gtag-js"]')).not.toBeNull();

    window.dispatchEvent(
      new CustomEvent('baliwild:analytics', {
        detail: { event: 'view_item', item_id: 'vtr-1' },
      })
    );

    expect(gtag).toHaveBeenCalledWith('event', 'view_item', { item_id: 'vtr-1' });
  });
});
