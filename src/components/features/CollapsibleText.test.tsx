import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsibleText } from './CollapsibleText';

const LONG = `${'Sunrise over the rice terraces. '.repeat(12)}Done.`;

describe('CollapsibleText', () => {
  it('renders short copy without a toggle', () => {
    render(<CollapsibleText text="Short description." />);

    expect(screen.getByText('Short description.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('collapses long copy to the limit with an ellipsis', () => {
    render(<CollapsibleText text={LONG} limit={225} />);

    const paragraph = screen.getByText(/Sunrise over the rice terraces/);
    expect(paragraph.textContent?.length).toBeLessThanOrEqual(226);
    expect(paragraph.textContent?.endsWith('…')).toBe(true);
    expect(screen.getByRole('button', { name: /read more/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('expands and collapses in place', async () => {
    const user = userEvent.setup();
    render(<CollapsibleText text={LONG} limit={225} />);

    await user.click(screen.getByRole('button', { name: /read more/i }));
    expect(screen.getByText(LONG.trim())).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /read less/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await user.click(screen.getByRole('button', { name: /read less/i }));
    expect(screen.getByText(/…/)).toBeInTheDocument();
  });
});
