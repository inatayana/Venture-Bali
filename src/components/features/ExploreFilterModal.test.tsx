import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExploreFilterModal } from './ExploreFilterModal';

function renderModal(overrides: Partial<Parameters<typeof ExploreFilterModal>[0]> = {}) {
  const props: Parameters<typeof ExploreFilterModal>[0] = {
    open: true,
    onClose: jest.fn(),
    transferIncluded: false,
    onTransferIncludedChange: jest.fn(),
    selfDriveOnly: false,
    onSelfDriveChange: jest.fn(),
    bestSeller: false,
    onBestSellerChange: jest.fn(),
    selectedCategory: null,
    onCategorySelect: jest.fn(),
    location: null,
    onLocationChange: jest.fn(),
    resultCount: 42,
    onClearAll: jest.fn(),
    ...overrides,
  };
  render(<ExploreFilterModal {...props} />);
  return props;
}

describe('ExploreFilterModal', () => {
  it('renders the two sections and the category grid from the taxonomy', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByText(/logistics & featured/i)).toBeInTheDocument();
    expect(screen.getByText(/adventure type/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /rafting/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /combo/i })).toBeInTheDocument();
  });

  it('shows the live result count on the primary CTA and closes on press', async () => {
    const user = userEvent.setup();
    const props = renderModal({ resultCount: 42 });

    const cta = screen.getByRole('button', { name: /show 42 results/i });
    await user.click(cta);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('singularizes the CTA label for a single result', () => {
    renderModal({ resultCount: 1 });
    expect(screen.getByRole('button', { name: /show 1 result$/i })).toBeInTheDocument();
  });

  it('toggles logistics pills via their handlers', async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: /transfer included/i }));
    expect(props.onTransferIncludedChange).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('button', { name: /self-drive/i }));
    expect(props.onSelfDriveChange).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('button', { name: /best seller/i }));
    expect(props.onBestSellerChange).toHaveBeenCalledWith(true);
  });

  it('selects an adventure type and deselects on second tap', async () => {
    const user = userEvent.setup();
    const onCategorySelect = jest.fn();
    renderModal({ selectedCategory: 'Rafting', onCategorySelect });

    await user.click(screen.getByRole('radio', { name: /rafting/i }));
    expect(onCategorySelect).toHaveBeenCalledWith(null);
  });

  it('Clear all does not close the modal', async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: /clear all/i }));
    expect(props.onClearAll).toHaveBeenCalledTimes(1);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('renders the location input and reports trimmed values', async () => {
    const onLocationChange = jest.fn();
    renderModal({ location: null, onLocationChange });

    const input = screen.getByLabelText('Location', { selector: 'input' });
    expect(input).toHaveValue('');

    fireEvent.change(input, { target: { value: '  Ubud  ' } });
    expect(onLocationChange).toHaveBeenLastCalledWith('Ubud');
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ExploreFilterModal open={false} onClose={jest.fn()} transferIncluded={false} onTransferIncludedChange={jest.fn()} selfDriveOnly={false} onSelfDriveChange={jest.fn()} bestSeller={false} onBestSellerChange={jest.fn()} selectedCategory={null} onCategorySelect={jest.fn()} location={null} onLocationChange={jest.fn()} resultCount={0} onClearAll={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
