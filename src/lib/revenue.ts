/**
 * Revenue aggregation for the operator report.
 * Pure so it can be unit tested without a database.
 */

export interface RevenueBooking {
  bookingDate: string;
  totalPrice: number;
  paxCount: number;
  fulfillmentMode: string;
  productTitle: string;
}

export interface RevenueBucket {
  key: string;
  label: string;
  revenue: number;
  bookings: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  bookingCount: number;
  guestCount: number;
  averageBookingValue: number;
  byDate: RevenueBucket[];
  byProduct: RevenueBucket[];
  byMode: RevenueBucket[];
}

const MODE_LABELS: Record<string, string> = {
  SELF_DRIVE: 'Self drive',
  SHARED_TRANSFER: 'Shared transfer',
  PRIVATE_TRANSFER: 'Private transfer',
};

function bucketise(
  bookings: RevenueBooking[],
  keyOf: (booking: RevenueBooking) => string,
  labelOf: (key: string) => string,
): RevenueBucket[] {
  const map = new Map<string, RevenueBucket>();
  for (const booking of bookings) {
    const key = keyOf(booking);
    const bucket = map.get(key) ?? { key, label: labelOf(key), revenue: 0, bookings: 0 };
    bucket.revenue += booking.totalPrice;
    bucket.bookings += 1;
    map.set(key, bucket);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export function summariseRevenue(bookings: RevenueBooking[]): RevenueSummary {
  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const guestCount = bookings.reduce((sum, booking) => sum + booking.paxCount, 0);

  const byDate = bucketise(bookings, (booking) => booking.bookingDate, (key) => key).sort((a, b) =>
    a.key < b.key ? 1 : -1,
  );

  return {
    totalRevenue,
    bookingCount: bookings.length,
    guestCount,
    averageBookingValue: bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0,
    byDate,
    byProduct: bucketise(bookings, (booking) => booking.productTitle, (key) => key),
    byMode: bucketise(bookings, (booking) => booking.fulfillmentMode, (key) => MODE_LABELS[key] ?? key),
  };
}
