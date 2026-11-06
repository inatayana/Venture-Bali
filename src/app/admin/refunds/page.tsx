import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { RefundActions } from '@/components/admin/RefundActions';
import { formatPrice } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

/** Refund rows with the booking context the cards render. */
const refundInclude = {
  booking: {
    include: {
      customer: { select: { name: true, email: true } },
      variant: { select: { title: true, venture: { select: { title: true } } } },
      payment: { select: { midtransOrderId: true } },
    },
  },
} satisfies Prisma.RefundInclude;

type AdminRefundRow = Prisma.RefundGetPayload<{ include: typeof refundInclude }>;

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400',
  FAILED: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  PROCESSED: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

export default async function AdminRefundsPage() {
  let refunds: AdminRefundRow[] = [];

  try {
    refunds = await prisma.refund.findMany({
      orderBy: { requestedAt: 'desc' },
      take: 100,
      include: refundInclude,
    });
  } catch (error) {
    console.warn('Database unavailable for refunds page:', error);
  }

  const pending = refunds.filter((refund) => refund.status !== 'PROCESSED');
  const processed = refunds.filter((refund) => refund.status === 'PROCESSED');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Refunds</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {pending.length} waiting · {processed.length} processed recently
        </p>
      </header>

      {pending.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-sm text-gray-500 dark:text-gray-400">
          No refunds waiting. Customer cancellations appear here automatically.
        </p>
      ) : (
        <section className="space-y-3">
          {pending.map((refund) => (
            <article key={refund.id} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {refund.booking.variant.venture.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {refund.booking.bookingCode} · {refund.booking.customer.name} ·{' '}
                    {refund.booking.customer.email}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Trip {refund.booking.bookingDate} · paid {formatPrice(refund.booking.totalPrice)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    STATUS_STYLES[refund.status] ?? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {refund.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 px-3 py-2">
                <div className="text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Refund </span>
                  <strong className="font-semibold text-gray-900 dark:text-white">{formatPrice(refund.amountIdr)}</strong>
                  <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                    fee {formatPrice(refund.feeIdr)}
                  </span>
                </div>
                <RefundActions
                  refundId={refund.id}
                  hasPayment={Boolean(refund.booking.payment?.midtransOrderId)}
                  status={refund.status}
                />
              </div>

              {refund.reason && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Reason: {refund.reason}
                </p>
              )}
              {refund.notes && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{refund.notes}</p>
              )}
            </article>
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Recently processed
        </h2>
        <ul className="space-y-2">
          {processed.length === 0 && (
            <li className="text-sm text-gray-500 dark:text-gray-400">No processed refunds yet.</li>
          )}
          {processed.slice(0, 10).map((refund) => (
            <li
              key={refund.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <span>
                <strong className="text-gray-900 dark:text-white">{refund.booking.bookingCode}</strong>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {refund.method} · {formatPrice(refund.amountIdr)}
                </span>
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {refund.processedAt?.toISOString().slice(0, 10) ?? '—'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
