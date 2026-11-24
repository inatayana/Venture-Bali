import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Sentry from '@sentry/nextjs';
import ErrorPage from './error';

describe('ErrorPage', () => {
  it('hides the raw error, reports to Sentry and retries', async () => {
    const reset = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const sentrySpy = jest
      .spyOn(Sentry, 'captureException')
      .mockImplementation(() => '');

    render(
      <ErrorPage
        error={new Error('database password leaked')}
        reset={reset}
      />,
    );

    // The raw error message never reaches the guest-facing UI.
    expect(screen.queryByText(/database password leaked/i)).not.toBeInTheDocument();
    // The failure is reported to the operator through Sentry.
    expect(sentrySpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'database password leaked' }),
    );

    await userEvent.click(screen.getByRole('button', { name: /coba lagi/i }));
    expect(reset).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
