import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

describe('NotFound', () => {
  it('renders a branded recovery path', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('heading', { name: /halaman tidak ditemukan/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /kembali ke beranda/i }),
    ).toHaveAttribute('href', '/');
    expect(
      screen.getByRole('link', { name: /cari petualangan lain/i }),
    ).toHaveAttribute('href', '/#adventures');
  });
});
