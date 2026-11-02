import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CheckCircle, AlertCircle, Clock, Users, MapPin, ShieldCheck } from 'lucide-react';

interface VerifyPageProps {
  params: { code: string };
}

export const metadata: Metadata = {
  title: 'Voucher verification | BaliWild',
  robots: { index: false, follow: false },
};

/**
 * Staff-facing voucher verification page — the destination encoded in the
 * voucher QR code. Read-only on purpose: scanning must never accidently
 * redeem a voucher.
 */
export default async function VoucherVerifyPage({ params }: VerifyPageProps) {
  const booking = await prisma.booking.findUnique({
    where: { bookingCode: decodeURIComponent(params.code) },
    include: { variant: { select: { title: true } }, slotTime: { select: { time: true } }, customer: true, vouchers: true },
  });

  if (!booking) notFound();

  const voucher = booking.vouchers[0] ?? null;
  const isPaid = booking.paymentStatus === 'PAID';
  const isRedeemed = voucher?.status === 'REDEEMED';
  const isValid = isPaid && voucher?.status === 'ACTIVE';

  const state = isRedeemed
    ? {
        tone: 'amber' as const,
        title: 'Voucher already redeemed',
        message: `Redeemed ${voucher?.redeemedAt?.toLocaleString('id-ID') ?? ''}`.trim(),
        icon: Clock,
      }
    : isValid
      ? {
          tone: 'green' as const,
          title: 'Valid voucher',
          message: 'Payment settled. Hand over the activity wristband.',
          icon: CheckCircle,
        }
      : {
          tone: 'red' as const,
          title: 'Not valid',
          message: isPaid
            ? 'Payment settled but no active voucher was issued.'
            : `Payment status: ${booking.paymentStatus}`,
          icon: AlertCircle,
        };

  const toneClasses = {
    green: 'border-green-200 bg-green-50 text-green-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-red-200 bg-red-50 text-red-800',
  }[state.tone];

  const Icon = state.icon;

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className={`rounded-2xl border p-5 ${toneClasses}`}>
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold">{state.title}</h1>
              <p className="text-sm opacity-80">{state.message}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Booking code</p>
          <p className="font-mono text-2xl font-bold tracking-widest text-neutral-900">
            {booking.bookingCode}
          </p>

          <div className="mt-4 space-y-3 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">{booking.variant.title}</p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-600" />
              {booking.bookingDate}
              {booking.slotTime ? ` · ${booking.slotTime.time}` : ''}
            </p>
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4 text-neutral-600" />
              {booking.paxCount} guests · {booking.customer.name}
            </p>
            {booking.fulfillmentMode !== 'SELF_DRIVE' && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neutral-600" />
                {booking.isTba ? 'Pickup TBA by H-1' : booking.hotelAddress ?? 'Hotel pickup'}
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
          <ShieldCheck className="h-4 w-4" />
          Verified against the BaliWild booking database
        </p>
      </div>
    </main>
  );
}
