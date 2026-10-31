import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryQuickMenu } from './CategoryQuickMenu';

describe('CategoryQuickMenu', () => {
  it('shows the current category on the trigger', () => {
    render(<CategoryQuickMenu currentCategory="River Tubing" />);

    expect(screen.getByRole('button', { name: /change category/i })).toHaveTextContent(
      'River Tubing'
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('lists the nine adventure categories with links to the filtered catalogue', async () => {
    const user = userEvent.setup();
    render(<CategoryQuickMenu currentCategory="River Tubing" />);

    await user.click(screen.getByRole('button', { name: /change category/i }));

    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(9);
    expect(items.map((item) => item.textContent)).toEqual([
      '🏍️ATV',
      '🛶Rafting',
      '🛝Tubing',
      '🚴Cycling',
      '🥾Trekking',
      '🏄Water Sports',
      '🤿Snorkeling',
      '⚡Extreme',
      '🎯Combo',
    ]);

    expect(screen.getByRole('menuitem', { name: /Tubing/ })).toHaveAttribute(
      'href',
      '/?category=tubing'
    );
    expect(screen.getByRole('menuitem', { name: /Snorkeling/ })).toHaveAttribute(
      'href',
      '/?category=snorkeling'
    );
  });

  it('marks the category of the current product', async () => {
    const user = userEvent.setup();
    render(<CategoryQuickMenu currentCategory="River Tubing" />);

    await user.click(screen.getByRole('button', { name: /change category/i }));

    expect(screen.getByRole('menuitem', { name: /Tubing/ })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('menuitem', { name: /Rafting/ })).not.toHaveAttribute('aria-current');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<CategoryQuickMenu currentCategory="Tubing" />);

    await user.click(screen.getByRole('button', { name: /change category/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
