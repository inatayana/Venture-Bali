import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ExperienceBookingWidget,
  formatTripDate,
  type BookingConfig,
} from './ExperienceBookingWidget';
import type { PickupZone, VentureItem } from '@/types/venture';

jest.mock('@/lib/analytics', () => ({ track: jest.fn() }));

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeVenture(fulfillmentMode: 'SELF_DRIVE' | 'SHARED_TRANSFER' = 'SELF_DRIVE'): VentureItem {
  return {
    id: 'venture-1',
    slug: 'river-tubing',
    tenantId: 'tenant-1',
    title: 'Ubud River Tubing',
    hook3Sec: 'A calm river, a big day out.',
    description: 'A gentle river tubing adventure near Ubud.',
    duration: '4 hrs',
    durationHours: 4,
    priceIdr: 450_000,
    minParticipants: 1,
    maxParticipants: 10,
    reviewCount: 0,
    isAvailable: true,
    location: 'Ubud',
    highlights: ['River tubing'],
    inclusions: ['Guide'],
    exclusions: ['Personal expenses'],
    itinerary: [],
    essentialInfo: { perfectFor: [], whatToBring: [], knowBeforeYouGo: [] },
    languages: ['English'],
    category: 'water-adventure',
    difficulty: 'EASY',
    imageUrl: '/images/tubing.svg',
    gallery: [],
    rating: 4.8,
    createdAt: NOW,
    updatedAt: NOW,
    variants: [
      {
        id: 'variant-1',
        ventureId: 'venture-1',
        title: 'Self Drive',
        shortDescription: 'Meet us at base camp.',
        fulfillmentMode,
        sortOrder: 1,
        priceTiers: [{ minPax: 1, maxPax: 10, pricePerPax: 450_000 }],
        blackoutDates: [],
        slotTimes: [
          {
            id: 'slot-1',
            variantId: 'variant-1',
            time: '08:00',
            maxCapacity: 10,
            currentBookings: 0,
            isAvailable: true,
            createdAt: NOW,
            updatedAt: NOW,
          },
        ],
        addons: [],
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
  };
}

const ZONES: PickupZone[] = [
  {
    id: 'zone-1',
    name: 'Ubud & central',
    areaType: 'ZONE_1',
    surchargeIdr: 0,
    isCustomQuote: false,
    vehicleMaxPax: 4,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'zone-4',
    name: 'Outer Bali',
    areaType: 'ZONE_4',
    surchargeIdr: 0,
    isCustomQuote: true,
    vehicleMaxPax: 4,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

function futureDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(0, 0, 0, 0);
  return date;
}

const PLAN_READY: BookingConfig = {
  variantId: 'variant-1',
  date: futureDate(),
  slot: {
    id: 'slot-1',
    variantId: 'variant-1',
    time: '08:00',
    maxCapacity: 10,
    currentBookings: 0,
    isAvailable: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  adults: 2,
  vehicleClassType: null,
  zoneId: null,
  hotelAddress: '',
  isTba: false,
  couponCode: '',
  addonIds: [],
  customerName: '',
  customerEmail: '',
  customerWhatsApp: '',
  countryCode: 'ID',
  termsAccepted: false,
  waiverAccepted: false,
};

const EMPTY_PLAN: BookingConfig = {
  ...PLAN_READY,
  date: null,
  slot: null,
};

const DETAILS_READY: BookingConfig = {
  ...PLAN_READY,
  customerName: 'Made',
  customerEmail: 'made@example.com',
  customerWhatsApp: '81234567890',
  termsAccepted: true,
  waiverAccepted: true,
};

function renderWidget(config: BookingConfig, options: { venture?: VentureItem } = {}) {
  const props = {
    venture: options.venture ?? makeVenture(),
    config,
    zones: ZONES,
    vehicleClasses: [],
    appliedCoupon: null,
    onCouponChange: jest.fn(),
    onChange: jest.fn(),
    onBook: jest.fn(),
    isBooking: false,
  };
  const view = render(<ExperienceBookingWidget {...props} />);
  return { ...view, props };
}

describe('ExperienceBookingWidget two-step checkout', () => {
  it('opens on the plan step with an empty plan', () => {
    renderWidget(EMPTY_PLAN);

    expect(screen.getByRole('heading', { name: 'Plan your trip' })).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    expect(screen.getByText('Pick an adventure date')).toBeInTheDocument();
    expect(screen.queryByText('Lead traveller')).not.toBeInTheDocument();
  });

  it('moves to guest details only when the plan is complete', async () => {
    const user = userEvent.setup();
    renderWidget(PLAN_READY);

    const continueButton = screen.getByRole('button', { name: 'Continue' });
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);

    expect(screen.getByRole('heading', { name: 'Guest details & pay' })).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(formatTripDate(PLAN_READY.date as Date)))).toBeInTheDocument();
    expect(screen.getByText(/08:00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to payment' })).toBeDisabled();
    expect(screen.getByText('Enter the lead guest name')).toBeInTheDocument();
  });

  it('returns to the plan step from the recap Edit action', async () => {
    const user = userEvent.setup();
    renderWidget(PLAN_READY);

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('heading', { name: 'Plan your trip' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    expect(screen.queryByText('Lead traveller')).not.toBeInTheDocument();
  });

  it('submits the booking once guest details and consents are complete', async () => {
    const user = userEvent.setup();
    const { rerender, props } = renderWidget(PLAN_READY);

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    rerender(<ExperienceBookingWidget {...props} config={DETAILS_READY} />);

    const payButton = screen.getByRole('button', { name: 'Continue to payment' });
    expect(payButton).toBeEnabled();

    await user.click(payButton);
    expect(props.onBook).toHaveBeenCalledTimes(1);
  });

  it('blocks online payment for a custom-quote pickup area', () => {
    renderWidget(
      {
        ...PLAN_READY,
        variantId: 'variant-1',
        zoneId: 'zone-4',
        isTba: true,
      },
      { venture: makeVenture('SHARED_TRANSFER') }
    );

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    expect(
      screen.getByText(/Outer areas are quoted manually/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Outer areas need a custom quote/i)
    ).toBeInTheDocument();
  });
});
