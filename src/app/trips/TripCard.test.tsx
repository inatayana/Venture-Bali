import { render, screen } from '@testing-library/react';
import { TripCard } from './TripCard';

jest.mock('@/components/features/BookingActions', () => ({
  BookingActions: () => null,
}));

const baseBooking = {
  id: 'bk-1',
  bookingCode: 'BW-2026-8842',
  bookingDate: '2026-12-01',
  slotTime: { time: '09:00 AM' },
  paxCount: 2,
  totalPrice: 900000,
  paymentStatus: 'PAID' as const,
  lifecycleStatus: 'CONFIRMED' as const,
  variant: {
    title: 'Self Drive Adventure',
    venture: {
      title: 'Ayung River Rafting',
      imageUrl: '/images/rafting.svg',
      location: { name: 'Ubud, Gianyar' },
      meetingPoint: 'Tegallalang|107.6|-8.4',
    },
    slotTimes: [],
  },
  vouchers: { id: 'vch-1', qrCodeData: 'QRDATA', status: 'ACTIVE' },
  waiverAcceptedAt: null as Date | null,
};

const baseProps = {
  booking: baseBooking,
  token: 'tok',
  voucherToken: 'vtok',
  isUpcoming: true,
  countdown: { label: '2d 3h', days: 2, hours: 3, minutes: 10, isPast: false },
};

describe('TripCard — upcoming trip', () => {
  it('renders the boarding pass with booking code and QR', () => {
    render(<TripCard {...baseProps} />);
    expect(screen.getByAltText('Boarding pass QR for BW-2026-8842')).toBeInTheDocument();
    expect(screen.getAllByText('BW-2026-8842').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the action-required waiver banner while unsigned', () => {
    render(<TripCard {...baseProps} />);
    expect(screen.getByText(/action required/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign waiver now/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/waiver?booking=bk-1')
    );
  });

  it('hides the waiver banner and shows signed state once signed', () => {
    render(
      <TripCard {...baseProps} booking={{ ...baseBooking, waiverAcceptedAt: new Date() }} />
    );
    expect(screen.queryByText(/action required/i)).not.toBeInTheDocument();
    expect(screen.getByText('Waiver signed')).toBeInTheDocument();
  });

  it('renders a 24/7 concierge link with the booking code prefilled', () => {
    const { container } = render(<TripCard {...baseProps} />);
    const concierge = container.querySelector('a[href^="https://wa.me/6285117321388"]');
    expect(concierge).not.toBeNull();
    expect(decodeURIComponent(concierge?.getAttribute('href') ?? '')).toContain('BW-2026-8842');
  });

  it('shows a real-signal stepper and never fabricates a driver step', () => {
    render(<TripCard {...baseProps} />);
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Check-in')).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/driver assigned/i)).not.toBeInTheDocument();
  });

  it('does not render the boarding pass for past trips', () => {
    render(<TripCard {...baseProps} isUpcoming={false} />);
    expect(screen.queryByText('BaliWild Boarding Pass')).not.toBeInTheDocument();
  });

  it('shows past-trip self-serve actions once expanded', () => {
    const { getByRole } = render(
      <TripCard
        {...baseProps}
        isUpcoming={false}
        booking={{
          ...baseBooking,
          waiverAcceptedAt: new Date(),
          variant: {
            ...baseBooking.variant,
            venture: {
              ...baseBooking.variant.venture,
              id: 'vtr-9',
              slug: 'ayung-river-rafting',
            },
          },
        }}
      />
    );
    // Expand the card to reveal actions.
    getByRole('button', { name: /expand trip details/i }).click();

    expect(getByRole('link', { name: /download invoice/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/trips/invoice/bk-1?token=tok')
    );
    expect(getByRole('link', { name: /view signed waiver/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/waiver/bk-1?token=tok')
    );
    expect(getByRole('link', { name: /book again/i })).toHaveAttribute(
      'href',
      '/experiences/vtr-9/ayung-river-rafting'
    );
  });
});
