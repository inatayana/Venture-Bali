import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorPage from './error';

describe('ErrorPage', () => {
  it('hides the raw error, shows the digest and retries', async () => {
    const reset = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorPage
        error={Object.assign(new Error('database password leaked'), {
          digest: 'digest-123',
        })}
        reset={reset}
      />,
    );

    expect(screen.queryByText(/database password leaked/i)).not.toBeInTheDocument();
    expect(screen.getByText('digest-123')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
