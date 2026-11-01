import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewsSection } from './ReviewsSection';
import type { ReviewSummary } from '@/types/venture';

function review(overrides: Partial<ReviewSummary> = {}): ReviewSummary {
  return {
    id: 'rev-1',
    rating: 5,
    comment: 'The guide was brilliant and the river was perfect.',
    author: 'Made',
    country: 'Indonesia',
    isVerified: true,
    createdAt: new Date(),
    ...overrides,
  };
}

const REVIEWS: ReviewSummary[] = [
  review({ id: 'r1', author: 'Made', rating: 5 }),
  review({ id: 'r2', author: 'Anna', country: 'Germany', rating: 3, comment: 'Nice but crowded on weekends.' }),
  review({ id: 'r3', author: 'Liam', country: 'Australia', rating: 4 }),
  review({ id: 'r4', author: 'Siti', rating: 5 }),
  review({ id: 'r5', author: 'Noah', country: 'France', rating: 4 }),
];

describe('ReviewsSection', () => {
  it('shows an empty state without reviews', () => {
    render(<ReviewsSection reviews={[]} average={0} count={0} />);

    expect(screen.getByText('No verified reviews yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /read all/i })).not.toBeInTheDocument();
  });

  it('renders a clickable summary with the average and count', () => {
    render(<ReviewsSection reviews={REVIEWS} average={4.2} count={1266} />);

    expect(screen.getByText('4.2')).toBeInTheDocument();
    expect(screen.getByText('1,266 reviews')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /read all/i })).toBeInTheDocument();
  });

  it('opens the review modal with search and sort', async () => {
    const user = userEvent.setup();
    render(<ReviewsSection reviews={REVIEWS} average={4.2} count={5} />);

    await user.click(screen.getByRole('button', { name: /read all/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Search all reviews')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Newest' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('filters reviews by the search box', async () => {
    const user = userEvent.setup();
    render(<ReviewsSection reviews={REVIEWS} average={4.2} count={5} />);

    await user.click(screen.getByRole('button', { name: /read all/i }));
    await user.type(screen.getByLabelText('Search all reviews'), 'crowded');

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Nice but crowded on weekends.')).toBeInTheDocument();
    expect(within(dialog).queryByText(/The guide was brilliant/)).not.toBeInTheDocument();
  });

  it('sorts reviews by lowest rating', async () => {
    const user = userEvent.setup();
    render(<ReviewsSection reviews={REVIEWS} average={4.2} count={5} />);

    await user.click(screen.getByRole('button', { name: /read all/i }));
    await user.click(screen.getByRole('button', { name: 'Lowest rating' }));

    const dialog = screen.getByRole('dialog');
    const authors = within(dialog)
      .getAllByText(/^(Made|Anna|Liam|Siti|Noah)$/)
      .map((node) => node.textContent);
    expect(authors[0]).toBe('Anna');
  });

  it('expands a long review in place', async () => {
    const user = userEvent.setup();
    const longComment = `${'Great adventure with a very attentive crew. '.repeat(8)}`;
    render(<ReviewsSection reviews={[review({ id: 'long', comment: longComment })]} average={5} count={1} />);

    const toggle = screen.getByRole('button', { name: 'Read more' });
    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
  });
});
