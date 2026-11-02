import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/i18n';
import { summariseRevenue, type RevenueBooking } from '@/lib/revenue';

export const dynamic = 'force-dynamic';

const WINDOW_DAYS = 30;

function witaDateKey(daysAgo: number): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000 - daysAgo * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
}

export default async function RevenueReportPage() {
  const from = witaDateKey(WINDOW_DAYS);

  const bookings = await prisma.booking.findMany({
    where: { paymentStatus: 'PAID', bookingDate: { gte: from } },
    select: {
      bookingDate: true,
      totalPrice: true,
      paxCount: true,
      fulfillmentMode: true,
      variant: { select: { venture: { select: { title: true } } } },
    },
    take: 5000,
  });

  const rows: RevenueBooking[] = bookings.map((booking) => ({
    bookingDate: booking.bookingDate,
    totalPrice: booking.totalPrice,
    paxCount: booking.paxCount,
    fulfillmentMode: booking.fulfillmentMode,
    productTitle: booking.variant.venture.title,
  }));

  const summary = summariseRevenue(rows);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Revenue</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Last {WINDOW_DAYS} days · paid bookings only · since {from}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Revenue', value: formatPrice(summary.totalRevenue) },
          { label: 'Bookings', value: String(summary.bookingCount) },
          { label: 'Guests', value: String(summary.guestCount) },
          { label: 'Average booking', value: formatPrice(summary.averageBookingValue) },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-foreground-secondary">{card.label}</p>
            <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {summary.bookingCount === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-foreground-muted">
          No paid bookings in this window yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground-secondary">
              By product
            </h2>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {summary.byProduct.map((bucket) => (
                  <tr key={bucket.key} className="border-b border-line last:border-0">
                    <td className="py-2 pr-2 text-foreground-secondary">{bucket.label}</td>
                    <td className="py-2 text-right tabular-nums text-foreground-muted">{bucket.bookings}</td>
                    <td className="py-2 text-right font-semibold tabular-nums text-foreground">
                      {formatPrice(bucket.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground-secondary">
              By booking mode
            </h2>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {summary.byMode.map((bucket) => (
                  <tr key={bucket.key} className="border-b border-line last:border-0">
                    <td className="py-2 pr-2 text-foreground-secondary">{bucket.label}</td>
                    <td className="py-2 text-right tabular-nums text-foreground-muted">{bucket.bookings}</td>
                    <td className="py-2 text-right font-semibold tabular-nums text-foreground">
                      {formatPrice(bucket.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-xl border border-line bg-surface p-4 lg:col-span-2">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground-secondary">
              Daily revenue
            </h2>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {summary.byDate.slice(0, 14).map((bucket) => (
                  <tr key={bucket.key} className="border-b border-line last:border-0">
                    <td className="py-2 pr-2 tabular-nums text-foreground-secondary">{bucket.key}</td>
                    <td className="py-2 text-right tabular-nums text-foreground-muted">
                      {bucket.bookings} bookings
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums text-foreground">
                      {formatPrice(bucket.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
