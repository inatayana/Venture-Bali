import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductLightbox } from './ProductLightbox';

const images = ['/images/rafting.svg', '/images/rafting-2.svg', '/images/rafting-3.svg'];

function renderLightbox(
  overrides: Partial<React.ComponentProps<typeof ProductLightbox>> = {}
) {
  const props = {
    images,
    index: 0,
    title: 'Ayung Rafting',
    onClose: jest.fn(),
    onChange: jest.fn(),
    ...overrides,
  };
  render(<ProductLightbox {...props} />);
  return props;
}

describe('ProductLightbox', () => {
  it('renders nothing while closed', () => {
    renderLightbox({ index: null });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the photo counter without a thumbnail strip', () => {
    renderLightbox();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    // The thumbnail strip was removed: only the arrows navigate photos now.
    expect(screen.queryByRole('button', { name: /^View photo/ })).not.toBeInTheDocument();
  });

  it('moves to the next photo with the arrow keys', async () => {
    const user = userEvent.setup();
    const props = renderLightbox();

    await user.keyboard('{ArrowRight}');

    expect(props.onChange).toHaveBeenCalledWith(1);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const props = renderLightbox();

    await user.keyboard('{Escape}');

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
