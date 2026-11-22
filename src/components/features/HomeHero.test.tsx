import { render, screen } from '@testing-library/react';

jest.mock('@/components/features/HeroVideo', () => ({
  HeroVideo: () => <div data-testid="hero-video" />,
}));

import { HomeHero } from './HomeHero';
import { LocaleProvider } from '@/components/locale/LocaleProvider';
import { translate } from '@/lib/i18n';

describe('HomeHero', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the umbrella headline and a CTA targeting the results anchor', () => {
    render(<HomeHero />, { wrapper: LocaleProvider });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Discover Bali. Book Direct.'
    );
    expect(screen.getByRole('link', { name: /explore adventures/i })).toHaveAttribute(
      'href',
      '#results'
    );
  });

  it('localizes the trust promises', async () => {
    window.localStorage.setItem('baliwild_locale', 'id');
    render(<HomeHero />, { wrapper: LocaleProvider });

    expect(await screen.findByText('Ramah Pemula & Keluarga')).toBeInTheDocument();
    expect(screen.getByText('Konfirmasi instan')).toBeInTheDocument();
    expect(screen.getByText('Reschedule gratis ≥24 jam')).toBeInTheDocument();
  });
});

describe('hero copy guardrails', () => {
  it('uses own-brand identity without competitor framing', () => {
    expect(translate('en', 'heroBadge')).toBe('100% BALI-OWNED & OPERATED · BUILT FOR BALI');
    expect(translate('en', 'heroBook')).toBe('Discover Bali. Book Direct.');
    expect(translate('id', 'heroBook')).toBe('Jelajahi Bali. Pesan Langsung.');
    expect(translate('en', 'heroSub')).not.toMatch(/OTA|commission/i);
    expect(translate('id', 'heroSub')).not.toMatch(/OTA|komisi/i);
  });

  it('keeps tier-2 category tone available for adventure pages', () => {
    // Hero speaks in umbrella terms, but taxonomy copy stays product-specific.
    expect(translate('en', 'heroSub')).not.toContain('Race through Bali');
  });
});
