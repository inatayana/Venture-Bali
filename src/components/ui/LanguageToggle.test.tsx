import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageToggle } from './LanguageToggle';

describe('LanguageToggle', () => {
  it('renders exactly one button showing the active language', () => {
    render(<LanguageToggle locale="en" onLocaleChange={jest.fn()} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('EN');
    expect(buttons[0]).toHaveAccessibleName(/switch to bahasa indonesia/i);
  });

  it('flips to Indonesian when English is active', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<LanguageToggle locale="en" onLocaleChange={onChange} />);

    await user.click(screen.getByRole('button'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('id');
  });

  it('offers English when Indonesian is active', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<LanguageToggle locale="id" onLocaleChange={onChange} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('ID');
    expect(button).toHaveAccessibleName(/switch to english/i);

    await user.click(button);

    expect(onChange).toHaveBeenCalledWith('en');
  });
});
