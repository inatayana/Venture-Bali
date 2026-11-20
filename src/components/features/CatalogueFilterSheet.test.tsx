import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CatalogueFilterSheet } from './CatalogueFilterSheet';
import { ExploreFiltersProvider } from './ExploreFiltersProvider';

function Harness({ startOpen = true }: { startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open sheet
      </button>
      <CatalogueFilterSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function renderSheet() {
  render(
    <ExploreFiltersProvider>
      <Harness />
    </ExploreFiltersProvider>
  );
}

describe('CatalogueFilterSheet', () => {
  it('renders the shared filter modal with both sections', () => {
    renderSheet();

    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByText(/logistics & featured/i)).toBeInTheDocument();
    expect(screen.getByText(/adventure type/i)).toBeInTheDocument();
  });

  it('wires selections to the shared filter state', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole('button', { name: /transfer included/i }));
    expect(screen.getByRole('button', { name: /transfer included/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await user.click(screen.getByRole('radio', { name: /^ATV/ }));
    expect(screen.getByRole('radio', { name: /^ATV/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('Clear all resets the sheet without closing it', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole('button', { name: /self-drive/i }));
    await user.click(screen.getByRole('button', { name: /clear all/i }));

    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /self-drive/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('closes through the live-results CTA', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole('button', { name: /show 0 results/i }));
    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument();
  });
});
