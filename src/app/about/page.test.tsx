import { render, screen, within } from '@testing-library/react';
import AboutPage from './page';
import { SiteFooter } from '@/components/layout/SiteFooter';

describe('AboutPage — Our Local Story & Impact', () => {
  it('renders the hero headline and local-ownership subheadline', () => {
    render(<AboutPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Bali-Owned & Operated\. Built by Locals, Guided with Heart\./i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/GetYourGuide & Klook 30%, Viator 25%, Airbnb Experiences 20%/i)).toBeInTheDocument();
    expect(screen.getAllByText(/baliwild\.com/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the three impact pillars', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { name: /Direct Local Livelihoods/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Safety-First Local Standards/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Preserving Bali.s Nature & Cultural Heritage/i })).toBeInTheDocument();

    expect(screen.getByText(/Tri Hita Karana/i)).toBeInTheDocument();
    expect(screen.getByText(/Digital Waiver/i)).toBeInTheDocument();
  });

  it('renders the transparent BaliWild vs foreign OTA comparison', () => {
    render(<AboutPage />);

    expect(screen.getByText(/Book direct with BaliWild vs\. foreign OTA platforms/i)).toBeInTheDocument();

    for (const aspect of ['Harga', 'Dukungan Operasional', 'Fleksibilitas Logistik']) {
      expect(screen.getByRole('heading', { name: aspect })).toBeInTheDocument();
    }

    expect(screen.getAllByText(/BaliWild · Direct/i).length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText(/Foreign OTA/i).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/Self-Drive/i)).toBeInTheDocument();
  });

  it('renders the closing CTA to /explore', () => {
    render(<AboutPage />);

    const cta = screen.getByRole('link', { name: /Explore Guided Adventures/i });
    expect(cta).toHaveAttribute('href', '/explore');
  });
});

describe('SiteFooter — Company navigation', () => {
  it('links to the About page', () => {
    render(<SiteFooter />);

    expect(screen.getByRole('heading', { name: /^Company$/i })).toBeInTheDocument();

    const company = screen.getByRole('heading', { name: /^Company$/i }).parentElement;
    expect(company).not.toBeNull();

    const link = within(company as HTMLElement).getByRole('link', { name: /Our Story & Local Impact/i });
    expect(link).toHaveAttribute('href', '/about');
  });
});