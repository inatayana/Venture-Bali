import { fireEvent, render, screen } from '@testing-library/react';
import { EmailCaptureSection } from './EmailCaptureSection';

describe('EmailCaptureSection', () => {
  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the heading and the email form', () => {
    render(<EmailCaptureSection />);

    expect(screen.getByRole('heading', { name: /stay in the loop/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join the list/i })).toBeInTheDocument();
  });

  it('posts the email and shows the success state', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { email: 'guest@example.com' } }),
    });

    render(<EmailCaptureSection />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'guest@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /join the list/i }));

    expect(await screen.findByRole('heading', { name: /you are on the list/i })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/subscribe',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows the server message when the request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({
        success: false,
        error: { message: 'Could not save your email. Please try again.' },
      }),
    });

    render(<EmailCaptureSection />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'guest@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /join the list/i }));

    expect(await screen.findByText(/could not save your email/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /stay in the loop/i })).toBeInTheDocument();
  });

  it('shows a validation message for an empty submit', async () => {
    render(<EmailCaptureSection />);
    fireEvent.click(screen.getByRole('button', { name: /join the list/i }));

    expect(await screen.findByText(/please enter your email address/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
