import { render, waitFor } from '@testing-library/react';
import { GoogleTagManager } from './GoogleTagManager';
import { setStoredConsent } from '@/lib/consent';

function hasInjectedScript(): boolean {
  return document.head.querySelector('script[src*="googletagmanager"]') !== null;
}

describe('GoogleTagManager', () => {
  const originalId = process.env.NEXT_PUBLIC_GTM_ID;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';
    window.localStorage.removeItem('baliwild_cookie_consent');
  });

  afterEach(() => {
    document.head.querySelectorAll('script').forEach((script) => script.remove());
    window.localStorage.removeItem('baliwild_cookie_consent');
    if (originalId === undefined) {
      delete process.env.NEXT_PUBLIC_GTM_ID;
    } else {
      process.env.NEXT_PUBLIC_GTM_ID = originalId;
    }
  });

  it('renders nothing', () => {
    const { container } = render(<GoogleTagManager />);

    expect(container).toBeEmptyDOMElement();
  });

  it('does not inject before analytics consent is granted', () => {
    render(<GoogleTagManager />);

    expect(hasInjectedScript()).toBe(false);
  });

  it('injects the GTM script once consent is granted', async () => {
    render(<GoogleTagManager />);

    expect(hasInjectedScript()).toBe(false);

    setStoredConsent('all');
    await waitFor(() => expect(hasInjectedScript()).toBe(true));
  });

  it('does not inject when no container id is configured', () => {
    delete process.env.NEXT_PUBLIC_GTM_ID;
    setStoredConsent('all');

    render(<GoogleTagManager />);

    expect(hasInjectedScript()).toBe(false);
  });

  it('removes the GTM script when consent is revoked', async () => {
    setStoredConsent('all');
    render(<GoogleTagManager />);

    await waitFor(() => expect(hasInjectedScript()).toBe(true));

    setStoredConsent('essential');
    await waitFor(() => expect(hasInjectedScript()).toBe(false));
  });
});
