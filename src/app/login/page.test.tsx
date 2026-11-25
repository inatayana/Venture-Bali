import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';

const replace = jest.fn();
const refresh = jest.fn();

jest.mock('@/components/layout/GlobalDesktopHeader', () => ({
  GlobalDesktopHeader: () => <div />,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh, push: jest.fn() }),
  useSearchParams: () => new URLSearchParams('?next=/profile'),
}));

describe('LoginPage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { sent: true } }),
    }) as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('offers a passwordless sign-in and an explicit sign-up path', async () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /sign in to baliwild/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^sign up$/i }));

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/whatsapp/i)).toBeInTheDocument();
  });

  it('requests a code, verifies it via POST and returns to the requested page', async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'guest@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send sign-in code/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/account/otp/request',
      expect.objectContaining({ method: 'POST' }),
    );

    await userEvent.type(screen.getByLabelText(/6-digit code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /verify and continue/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/account/otp/verify',
        expect.objectContaining({
          body: JSON.stringify({ email: 'guest@example.com', code: '123456' }),
        }),
      );
      expect(replace).toHaveBeenCalledWith('/profile');
    });
  });

  it('shows a server error instead of navigating when the code is rejected', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Invalid or expired code' } }),
      }) as unknown as typeof fetch;

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'guest@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send sign-in code/i }));
    await waitFor(() => expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText(/6-digit code/i), '000000');
    await userEvent.click(screen.getByRole('button', { name: /verify and continue/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid or expired code');
      expect(replace).not.toHaveBeenCalled();
    });
  });
});
