import { render, fireEvent, waitFor } from '@testing-library/react';
import MessagesPage from './page';

jest.mock('@/components/layout/AppShellHeader', () => ({
  AppShellHeader: ({ title }: { title: string }) => <header>{title}</header>,
}));

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    json: async () => ({
      success: true,
      sessionId: 'web_test_session',
      data: { reply: '80% refund when you cancel at least 24 hours before.' },
    }),
  });
  (global as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  window.localStorage.clear();
});

describe('Messages page', () => {
  it('renders the full-page chat with suggested topics', () => {
    const { getByText, getAllByRole } = render(<MessagesPage />);
    expect(getByText('BaliWild Assistant')).toBeTruthy();
    expect(getByText('Suggested questions')).toBeTruthy();
    expect(getAllByRole('button').length).toBeGreaterThan(3);
  });

  it('sends a suggested question to the real agent endpoint and shows the reply', async () => {
    const { getByText, getByLabelText } = render(<MessagesPage />);
    fireEvent.click(getByText('What is the refund policy?'));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ channel: 'web' });
    await waitFor(() =>
      expect(getByText('80% refund when you cancel at least 24 hours before.')).toBeTruthy()
    );
    expect(getByLabelText('Your message')).toBeTruthy();
  });
});
