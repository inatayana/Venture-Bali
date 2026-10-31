/**
 * Venture Bali — Midtrans line items & billing address
 * ----------------------------------------------------
 * Snap receipts should match what the guest saw at checkout: package, evening
 * surcharge, transfer and add-ons each get their own line. The sum always
 * equals `Booking.totalPrice`; if a legacy row cannot be decomposed we fall
 * back to a single line so the gateway never receives a mismatched amount.
 */

import type { BillingAddress } from '@/types/venture';

export interface SnapItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface SnapBillingAddress {
  first_name: string;
  address: string;
  city: string;
  postal_code: string;
  country_code: string;
}

export interface BookingPriceParts {
  id: string;
  variantTitle: string;
  paxCount: number;
  totalPrice: number;
  nightSurchargeIdr: number;
  zoneSurchargeIdr: number;
  selectedAddons: Array<{ id: string; name: string; price: number }>;
}

export function buildSnapItems(booking: BookingPriceParts): SnapItem[] {
  const addonsTotal =
    booking.selectedAddons.reduce((sum, addon) => sum + addon.price, 0) * booking.paxCount;
  const packagePrice = booking.totalPrice - booking.nightSurchargeIdr - booking.zoneSurchargeIdr - addonsTotal;

  if (packagePrice <= 0) {
    // Legacy or inconsistent row: one truthful line beats a guessed breakdown.
    return [
      {
        id: booking.id,
        price: booking.totalPrice,
        quantity: 1,
        name: booking.variantTitle,
      },
    ];
  }

  const items: SnapItem[] = [
    {
      id: `${booking.id}-package`,
      price: packagePrice,
      quantity: 1,
      name: `${booking.variantTitle} · ${booking.paxCount} guest${booking.paxCount > 1 ? 's' : ''}`,
    },
  ];

  if (booking.nightSurchargeIdr > 0) {
    items.push({
      id: `${booking.id}-night`,
      price: booking.nightSurchargeIdr,
      quantity: 1,
      name: 'Evening departure surcharge',
    });
  }

  if (booking.zoneSurchargeIdr > 0) {
    items.push({
      id: `${booking.id}-transfer`,
      price: booking.zoneSurchargeIdr,
      quantity: 1,
      name: 'Transfer / pickup surcharge',
    });
  }

  for (const addon of booking.selectedAddons) {
    items.push({
      id: addon.id,
      price: addon.price,
      quantity: booking.paxCount,
      name: addon.name,
    });
  }

  const sum = items.reduce((total, item) => total + item.price * item.quantity, 0);
  if (sum !== booking.totalPrice) {
    return [
      {
        id: booking.id,
        price: booking.totalPrice,
        quantity: 1,
        name: booking.variantTitle,
      },
    ];
  }

  return items;
}

export function toSnapBillingAddress(billing: BillingAddress): SnapBillingAddress {
  return {
    first_name: billing.name,
    address: billing.street,
    city: billing.city,
    postal_code: billing.postalCode,
    country_code: billing.countryCode,
  };
}
