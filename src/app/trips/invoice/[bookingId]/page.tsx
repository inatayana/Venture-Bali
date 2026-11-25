import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyCustomerLinkToken } from '@/lib/customerLink';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { InvoiceActions } from './InvoiceActions';
import { formatPrice } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Invoice | BaliWild',
  robots: { index: false, follow: false },
};

interface InvoicePageProps {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ token?: string }>;
}

function formatDisplayDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function InvoicePage({ params, searchParams }: InvoicePageProps) {
  const { bookingId } = await params;
  const { token } = await searchParams;
  const payload = verifyCustomerLinkToken(token);
  if (!payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold text-neutral-900">This invoice link is invalid or expired</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Open the latest confirmation email or WhatsApp message from BaliWild to get a fresh link.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white"
          >
            Browse adventures
          </Link>
        </div>
      </main>
    );
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, customerId: payload.customerId },
    include: {
      customer: { select: { name: true, email: true } },
      variant: {
        select: {
          title: true,
          venture: { select: { title: true } },
        },
      },
      slotTime: { select: { time: true } },
      vouchers: { select: { status: true, qrCodeData: true } },
      refund: { select: { status: true, amountIdr: true } },
    },
  });

  if (!booking) notFound();

  const zoneSurcharge = booking.zoneSurchargeIdr ?? 0;
  const nightSurcharge = booking.nightSurchargeIdr ?? 0;
  const discount = booking.discountIdr ?? 0;
  // totalPrice = base + zone + night − discount → recover the base for display.
  const packageBase = booking.totalPrice - zoneSurcharge - nightSurcharge + discount;
  const issuedAt = booking.createdAt;
  const isPaid = booking.paymentStatus === 'PAID';

  return (
    <main className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 print:max-w-none print:rounded-none print:shadow-none print:ring-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-6">
          <div>
            <BrandWordmark className="text-xl text-brand-ink" />
            <p className="mt-1 text-xs text-neutral-500">PT Natayana Bali Tours · baliwild.com</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Invoice</p>
            <p className="mt-1 font-mono text-lg font-bold text-neutral-900">{booking.bookingCode}</p>
            <p className="text-xs text-neutral-500">Issued {formatDisplayDate(issuedAt)}</p>
          </div>
        </div>

        {/* Bill to */}
        <div className="border-b border-neutral-200 p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Bill to</p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">{booking.customer.name}</p>
          <p className="text-xs text-neutral-500">{booking.customer.email}</p>
        </div>

        {/* Line items */}
        <div className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Adventure</p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-100 pb-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">{booking.variant.venture.title}</p>
              <p className="text-xs text-neutral-600">
                {booking.variant.title} · {formatDisplayDate(booking.bookingDate)}
                {booking.slotTime ? ` · ${booking.slotTime.time}` : ''} · {booking.paxCount} guest
                {booking.paxCount > 1 ? 's' : ''}
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-neutral-900">
              {formatPrice(packageBase)}
            </p>
          </div>

          <dl className="mt-3 space-y-1 text-xs text-neutral-600">
            {zoneSurcharge > 0 && (
              <div className="flex justify-between">
                <dt>Private transfer surcharge</dt>
                <dd className="tabular-nums">{formatPrice(zoneSurcharge)}</dd>
              </div>
            )}
            {nightSurcharge > 0 && (
              <div className="flex justify-between">
                <dt>Night slot surcharge</dt>
                <dd className="tabular-nums">{formatPrice(nightSurcharge)}</dd>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount{booking.appliedCouponCode ? ` (${booking.appliedCouponCode})` : ''}</dt>
                <dd className="tabular-nums">−{formatPrice(discount)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Total</p>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-neutral-900">
                {formatPrice(booking.totalPrice)}
              </p>
              <span
                className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPaid ? 'Paid' : booking.paymentStatus}
              </span>
            </div>
          </div>

          {booking.refund && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Refund {booking.refund.status.toLowerCase()} · {formatPrice(booking.refund.amountIdr)}
            </p>
          )}
        </div>

        {/* Actions (hidden in print) */}
        <div className="border-t border-neutral-200 p-6 print:hidden">
          <InvoiceActions bookingCode={booking.bookingCode} />
          <p className="mt-3 text-center text-[11px] text-neutral-400">
            This is a payment receipt, not a tax invoice. Questions: support@baliwild.com
          </p>
        </div>
      </div>
    </main>
  );
}
