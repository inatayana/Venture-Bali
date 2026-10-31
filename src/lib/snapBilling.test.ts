import { buildSnapItems, toSnapBillingAddress } from './snapBilling';

const baseBooking = {
  id: 'booking-1',
  variantTitle: 'River Tubing with Shared Transfer',
  paxCount: 3,
  totalPrice: 1992000,
  nightSurchargeIdr: 0,
  zoneSurchargeIdr: 672000,
  selectedAddons: [{ id: 'addon-1', name: 'Professional Photography', price: 150000 }],
};

describe('Midtrans line items', () => {
  it('splits package, transfer and add-ons so the sum matches the total', () => {
    const items = buildSnapItems(baseBooking);
    const sum = items.reduce((total, item) => total + item.price * item.quantity, 0);

    expect(sum).toBe(1992000);
    expect(items.some((item) => item.name.includes('River Tubing'))).toBe(true);
    expect(items.some((item) => item.name.includes('Transfer'))).toBe(true);
    expect(items.find((item) => item.id === 'addon-1')?.quantity).toBe(3);
  });

  it('adds the evening surcharge line when present', () => {
    const items = buildSnapItems({
      ...baseBooking,
      totalPrice: 350000,
      zoneSurchargeIdr: 0,
      selectedAddons: [],
      nightSurchargeIdr: 50000,
    });
    const sum = items.reduce((total, item) => total + item.price * item.quantity, 0);

    expect(sum).toBe(350000);
    expect(items.some((item) => item.name.includes('Evening'))).toBe(true);
  });

  it('falls back to one truthful line when the row cannot be decomposed', () => {
    const items = buildSnapItems({
      ...baseBooking,
      totalPrice: 100000,
      zoneSurchargeIdr: 672000,
      selectedAddons: [],
    });

    expect(items).toHaveLength(1);
    expect(items[0].price).toBe(100000);
  });
});

describe('Midtrans billing address', () => {
  it('maps the stored address to the Snap shape', () => {
    expect(
      toSnapBillingAddress({
        name: 'Made Wijaya',
        street: 'Jl. Raya Seminyak 12',
        city: 'Badung',
        province: 'Bali',
        postalCode: '80361',
        countryCode: 'ID',
      }),
    ).toEqual({
      first_name: 'Made Wijaya',
      address: 'Jl. Raya Seminyak 12',
      city: 'Badung',
      postal_code: '80361',
      country_code: 'ID',
    });
  });
});
