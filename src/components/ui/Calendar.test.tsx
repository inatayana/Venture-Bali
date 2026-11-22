import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { endOfMonth, format } from 'date-fns';
import { Calendar } from './Calendar';
import { formatPrice } from '@/lib/i18n';

describe('Calendar sold-out dates', () => {
  it('flags unavailable days as sold out and disables them', () => {
    const soldOutDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    render(
      <Calendar
        selectedDate={null}
        onDateSelect={jest.fn()}
        unavailableDates={[soldOutDate]}
      />
    );

    const soldOutButtons = screen
      .getAllByRole('button')
      .filter((button) => (button.getAttribute('aria-label') ?? '').includes('— sold out'));
    expect(soldOutButtons.length).toBeGreaterThan(0);
    soldOutButtons.forEach((button) => expect(button).toBeDisabled());
    expect(soldOutButtons[0]).toHaveAttribute('aria-label', `${format(endOfMonth(new Date()), 'MMMM d, yyyy')} — sold out`);
  });

  it('notifies the parent when the visible month changes, including on mount', async () => {
    const user = userEvent.setup();
    const onMonthChange = jest.fn();

    render(
      <Calendar
        selectedDate={null}
        onDateSelect={jest.fn()}
        onMonthChange={onMonthChange}
      />
    );
    expect(onMonthChange).toHaveBeenCalledWith(expect.any(Date));

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    const months = onMonthChange.mock.calls.map(([month]) => format(month, 'MMMM yyyy'));
    expect(months[months.length - 1]).not.toBe(months[0]);
  });
});

describe('Calendar per-date prices', () => {
  it('renders the from-price under an available day', () => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');

    render(
      <Calendar
        selectedDate={null}
        onDateSelect={jest.fn()}
        dayPrices={{ [todayKey]: 200_000 }}
      />
    );

    const pricedDay = screen.getByRole('button', {
      name: new RegExp(`from ${formatPrice(200_000)}`),
    });
    expect(pricedDay).toBeEnabled();
    // formatPrice uses a non-breaking space; compare the digits only.
    expect(pricedDay.textContent).toContain('200.000');
  });
});
