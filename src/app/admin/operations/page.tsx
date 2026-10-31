import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/i18n';
import { LIFECYCLE_LABELS } from '@/lib/bookingLifecycle';
import { OperationActions } from '@/components/admin/OperationActions';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Phone, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface OperationsPageProps {
  searchParams: { date?: string };
}

function witaTodayKey(): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function shiftDate(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().split('T')[0];
}

function isValidDateKey(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function waLink(whatsapp: string): string {
  const digits = whatsapp.replace(/[^\d]/g, '');
  return `https://wa.me/${digits.startsWith('0') ? `62${digits.slice(1)}` : digits}`;
}

export default async function OperationsPage({ searchParams }: OperationsPageProps) {
  const date = isValidDateKey(searchParams.date) ? searchParams.date : witaTodayKey();

  const bookings = await prisma.booking.findMany({
    where: { bookingDate: date, paymentStatus: 'PAID' },
    orderBy: [{ slotTime: { time: 'asc' } }, { createdAt: 'asc' }],
    include: {
      customer: { select: { name: true, whatsapp: true } },
      variant: {
        select: {
          title: true,
          venture: { select: { title: true } },
        },
      },
      slotTime: { select: { time: true } },
      vehicleClass: { select: { label: true } },
      pickupZone: { select: { name: true } },
    },
  });

  const groups = new Map<string, typeof bookings>();
  for (const booking of bookings) {
    const key = booking.slotTime?.time ?? 'TBA';
    const list = groups.get(key) ?? [];
    list.push(booking);
    groups.set(key, list);
  }

  const totalGuests = bookings.reduce((sum, booking) => sum + booking.paxCount, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Operations · job orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Field manifest for {date} · {bookings.length} job orders · {totalGuests} guests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/operations?date=${shiftDate(date, -1)}`}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-gray-200 px-3 text-sm text-gray-600"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Link>
          <Link
            href="/admin/operations"
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-gray-200 px-3 text-sm text-gray-600"
          >
            <CalendarDays className="h-4 w-4" /> Today
          </Link>
          <Link
            href={`/admin/operations?date=${shiftDate(date, 1)}`}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-gray-200 px-3 text-sm text-gray-600"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-10 text-center">
          <p className="text-gray-500">No paid job orders for this date.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([time, list]) => (
            <section key={time} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-gray-700">
                  {time}
                </h2>
                <span className="text-xs text-gray-500">
                  {list.length} jobs · {list.reduce((sum, booking) => sum + booking.paxCount, 0)} guests
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {list.map((booking) => {
                  const isTransfer = booking.fulfillmentMode !== 'SELF_DRIVE';
                  const pickup = !isTransfer
                    ? 'Meeting point'
                    : booking.isTba
                      ? 'Address TBA by H-1'
                      : (booking.hotelAddress ?? 'Hotel pickup');
                  const equipment =
                    booking.fulfillmentMode === 'SHARED_TRANSFER'
                      ? 'Shared shuttle'
                      : booking.fulfillmentMode === 'PRIVATE_TRANSFER'
                        ? (booking.vehicleClass?.label ?? 'Private car')
                        : 'Self drive';

                  return (
                    <div key={booking.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.4fr_1fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-gray-500">{booking.bookingCode}</span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                            {LIFECYCLE_LABELS[booking.lifecycleStatus]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {booking.variant.venture.title}
                        </p>
                        <p className="text-xs text-gray-500">{booking.variant.title}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {booking.paxCount} guests
                          </span>
                          <span>{equipment}</span>
                          <span>{formatPrice(booking.totalPrice)}</span>
                        </p>
                      </div>

                      <div className="text-xs text-gray-600">
                        <p className="flex items-start gap-1">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            {pickup}
                            {booking.pickupZone ? ` · ${booking.pickupZone.name}` : ''}
                          </span>
                        </p>
                        <p className="mt-1">
                          {booking.customer?.name}
                          {booking.customer?.whatsapp && (
                            <a
                              href={waLink(booking.customer.whatsapp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 inline-flex items-center gap-1 font-medium text-green-700 underline"
                            >
                              <Phone className="h-3.5 w-3.5" /> WhatsApp
                            </a>
                          )}
                        </p>
                      </div>

                      <div className="flex items-start justify-end">
                        <OperationActions
                          bookingId={booking.id}
                          lifecycleStatus={booking.lifecycleStatus}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
