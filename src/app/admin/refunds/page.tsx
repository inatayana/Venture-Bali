import { prisma } from '@/lib/prisma';
import { RefundActions } from '@/components/admin/RefundActions';
import { formatPrice } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning',
  FAILED: 'bg-danger/10 text-danger',
  PROCESSED: 'bg-success/10 text-success',
};

export default async function AdminRefundsPage() {
  const refunds = await prisma.refund.findMany({
    orderBy: { requestedAt: 'desc' },
    take: 100,
    include: {
      booking: {
        include: {
          customer: { select: { name: true, email: true } },
          variant: { select: { title: true, venture: { select: { title: true } } } },
          payment: { select: { midtransOrderId: true } },
        },
      },
    },
  });

  const pending = refunds.filter((refund) => refund.status !== 'PROCESSED');
  const processed = refunds.filter((refund) => refund.status === 'PROCESSED');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Refunds</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {pending.length} waiting · {processed.length} processed recently
        </p>
      </header>

      {pending.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-foreground-muted">
          No refunds waiting. Customer cancellations appear here automatically.
        </p>
      ) : (
        <section className="space-y-3">
          {pending.map((refund) => (
            <article key={refund.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {refund.booking.variant.venture.title}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {refund.booking.bookingCode} · {refund.booking.customer.name} ·{' '}
                    {refund.booking.customer.email}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    Trip {refund.booking.bookingDate} · paid {formatPrice(refund.booking.totalPrice)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    STATUS_STYLES[refund.status] ?? 'bg-inset text-foreground-secondary'
                  }`}
                >
                  {refund.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-base px-3 py-2">
                <div className="text-sm">
                  <span className="text-foreground-secondary">Refund </span>
                  <strong className="font-semibold text-foreground">{formatPrice(refund.amountIdr)}</strong>
                  <span className="ml-2 text-xs text-foreground-muted">
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
                <p className="mt-2 text-xs text-foreground-muted">
                  Reason: {refund.reason}
                </p>
              )}
              {refund.notes && (
                <p className="mt-1 text-xs text-danger">{refund.notes}</p>
              )}
            </article>
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
          Recently processed
        </h2>
        <ul className="space-y-2">
          {processed.length === 0 && (
            <li className="text-sm text-foreground-muted">No processed refunds yet.</li>
          )}
          {processed.slice(0, 10).map((refund) => (
            <li
              key={refund.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            >
              <span>
                <strong className="text-foreground">{refund.booking.bookingCode}</strong>
                <span className="ml-2 text-xs text-foreground-muted">
                  {refund.method} · {formatPrice(refund.amountIdr)}
                </span>
              </span>
              <span className="text-xs text-foreground-secondary">
                {refund.processedAt?.toISOString().slice(0, 10) ?? '—'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
