import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

describe('NotFound', () => {
  it('renders a branded recovery path', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('heading', { name: /lost in the wild/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /browse adventures/i }),
    ).toHaveAttribute('href', '/experiences');
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
