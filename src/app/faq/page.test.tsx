import { render, screen } from '@testing-library/react';
import FaqPage from './page';
import { PUBLIC_FAQS } from '@/lib/publicFacts';

describe('FAQ page', () => {
  it('renders every authoritative answer', () => {
    render(<FaqPage />);

    expect(screen.getByRole('heading', { level: 1, name: /adventure booking FAQ/i })).toBeInTheDocument();
    for (const { question } of PUBLIC_FAQS) {
      expect(screen.getByRole('heading', { level: 2, name: question })).toBeInTheDocument();
    }
  });

  it('links to the explore catalogue', () => {
    render(<FaqPage />);
    expect(screen.getByRole('link', { name: /Explore Guided Adventures/i })).toHaveAttribute(
      'href',
      '/explore'
    );
  });
});
