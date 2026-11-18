'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, AlertCircle, Calendar, MapPin, Clock, QrCode, Navigation, Shield, ShieldAlert, ChevronDown, ChevronUp, MessageCircle, FileText, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/lib/i18n';
import { LIFECYCLE_LABELS } from '@/lib/bookingLifecycle';
import { canReviewBooking } from '@/lib/reviewSchema';
import { quoteCancellation } from '@/lib/refundUtils';
import { BookingActions } from '@/components/features/BookingActions';

interface TripCardProps {
  booking: {
    id: string;
    bookingCode: string;
    bookingDate: string;
    slotTime?: { time: string } | null;
    paxCount: number;
    totalPrice: number;
    fulfillmentMode: 'SELF_DRIVE' | 'SHARED_TRANSFER' | 'PRIVATE_TRANSFER';
    driverInfo?: unknown | null;
    paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
    lifecycleStatus: 'AWAITING_PAYMENT' | 'CONFIRMED' | 'DRIVER_ASSIGNED' | 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
    variant: {
      title: string;
      venture: {
        title: string;
        imageUrl: string;
        location: { name: string } | string | null;
        meetingPoint?: string | null;
        meetingPointMapsUrl?: string | null;
        id?: string;
        slug?: string;
      };
      slotTimes: { id: string; time: string; maxCapacity: number; currentBookings: number }[];
    };
    review?: { id: string } | null;
    refund?: { status: string; amountIdr: number } | null;
    vouchers: { id: string; qrCodeData: string; status: string } | null;
    waiverAcceptedAt?: Date | null;
    waiverVersion?: string | null;
    waiverDigitalSignature?: string | null;
    cancelledAt?: Date | null;
  };
  token?: string;
  voucherToken?: string;
  isUpcoming: boolean;
  countdown?: { label: string; days: number; hours: number; minutes: number; isPast: boolean };
  reviewToken?: string | null;
}

interface ParsedDriverInfo {
  name: string;
  phone: string;
  vehicle_model: string | null;
  plate_number: string | null;
}

/** Defensive parse of the JSON column — the DB can hold anything. */
function parseDriverInfo(value: unknown): ParsedDriverInfo | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const phone = typeof record.phone === 'string' ? record.phone.trim() : '';
  if (!name || !phone) return null;
  return {
    name,
    phone,
    vehicle_model: typeof record.vehicle_model === 'string' ? record.vehicle_model : null,
    plate_number: typeof record.plate_number === 'string' ? record.plate_number : null,
  };
}

export function TripCard({ booking, token, voucherToken, isUpcoming, countdown, reviewToken }: TripCardProps) {
  const { id, bookingCode, bookingDate, slotTime, paxCount, totalPrice, fulfillmentMode, paymentStatus, lifecycleStatus, driverInfo, variant, review, refund, vouchers, waiverAcceptedAt, variant: { title: variantTitle, venture } } = booking as TripCardProps['booking'] & { cancelledAt?: Date | null };

  const [expanded, setExpanded] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const quote = quoteCancellation({
    bookingDate,
    slotTime: slotTime?.time,
    totalPrice,
  });
  const actionable = paymentStatus === 'PAID' && lifecycleStatus === 'CONFIRMED' && !(booking as { cancelledAt?: Date | null }).cancelledAt;
  const reviewable = canReviewBooking({
    paymentStatus,
    bookingDate,
    reviewId: review?.id ?? null,
    lifecycleStatus,
  });

  const getLifecycleColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'DRIVER_ASSIGNED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'CHECKED_IN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'AWAITING_PAYMENT': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'NO_SHOW': return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
    }
  };

  const getLifecycleIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle className="h-3.5 w-3.5 text-green-600" />;
      case 'AWAITING_PAYMENT': return <AlertCircle className="h-3.5 w-3.5 text-amber-600" />;
      case 'COMPLETED': return <CheckCircle className="h-3.5 w-3.5 text-blue-600" />;
      case 'CANCELLED': return <AlertCircle className="h-3.5 w-3.5 text-red-600" />;
      case 'NO_SHOW': return <AlertCircle className="h-3.5 w-3.5 text-neutral-600" />;
      default: return <AlertCircle className="h-3.5 w-3.5 text-neutral-600" />;
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Parse meeting point from string format "name|lat|lng" or use venture.meetingPoint
  const parseMeetingPoint = (meetingPointStr: string | null): { name: string; latitude: number; longitude: number } | null => {
    if (!meetingPointStr) return null;
    const parts = meetingPointStr.split('|');
    if (parts.length >= 3) {
      return { name: parts[0], latitude: parseFloat(parts[1]), longitude: parseFloat(parts[2]) };
    }
    return { name: meetingPointStr, latitude: 0, longitude: 0 };
  };

  const meetingPoint = parseMeetingPoint(venture.meetingPoint ?? null);

  const primaryVoucher = vouchers?.status === 'ACTIVE' ? vouchers : null;

  const waiverPending = !waiverAcceptedAt;
  const conciergeLink = `https://wa.me/6285117321388?text=${encodeURIComponent(
    `Hi BaliWild! I have a question about booking ${bookingCode} (${variant.venture.title}, ${formatDisplayDate(bookingDate)}).`
  )}`;

  // 4-step operational stepper derived from the operational lifecycle:
  // CONFIRMED → DRIVER_ASSIGNED → CHECKED_IN → COMPLETED.
  const steps = [
    {
      label: 'Confirmed',
      detail: 'Payment settled, slot locked',
      done:
        lifecycleStatus === 'CONFIRMED' ||
        lifecycleStatus === 'DRIVER_ASSIGNED' ||
        lifecycleStatus === 'CHECKED_IN' ||
        lifecycleStatus === 'COMPLETED',
    },
    {
      label: 'Driver assigned',
      detail: 'Your driver is on the way to the pickup zone',
      done:
        lifecycleStatus === 'DRIVER_ASSIGNED' ||
        lifecycleStatus === 'CHECKED_IN' ||
        lifecycleStatus === 'COMPLETED',
    },
    {
      label: 'Checked in',
      detail: 'Show the QR at the meeting point',
      done: lifecycleStatus === 'CHECKED_IN' || lifecycleStatus === 'COMPLETED',
    },
    {
      label: 'Completed',
      detail: 'Enjoy the adventure!',
      done: lifecycleStatus === 'COMPLETED',
    },
  ];

  const isTransfer = fulfillmentMode !== 'SELF_DRIVE';
  const mapsUrl =
    venture.meetingPointMapsUrl ??
    (meetingPoint && meetingPoint.latitude !== 0 && meetingPoint.longitude !== 0
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${meetingPoint.latitude},${meetingPoint.longitude}`
        )}`
      : meetingPoint
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingPoint.name)}`
        : null);
  const driver = parseDriverInfo(driverInfo);
  const driverWaLink = driver ? `https://wa.me/${driver.phone.replace(/[^\d]/g, '').replace(/^0/, '62')}` : null;

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10 overflow-hidden transition-shadow hover:shadow-md">
      {/* Main Card */}
      <div className="p-4 sm:p-5">
        {/* Boarding Pass hero — upcoming trips with an active voucher */}
        {isUpcoming && primaryVoucher && (
          <div className="mb-4 overflow-hidden rounded-2xl bg-brand-ink text-white dark:bg-neutral-900">
            <div className="flex items-stretch gap-3 p-3 sm:gap-4 sm:p-4">
              <div className="flex w-24 shrink-0 items-center justify-center rounded-xl bg-white p-2 sm:w-28">
                <Image
                  src={`/api/bookings/${id}/qr?access=${encodeURIComponent(voucherToken ?? '')}`}
                  alt={`Boarding pass QR for ${bookingCode}`}
                  width={104}
                  height={104}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">BaliWild Boarding Pass</p>
                <p className="mt-1 font-mono text-lg font-bold tracking-widest text-white sm:text-xl">
                  {bookingCode}
                </p>
                <p className="mt-1 text-xs text-white/75">
                  {formatDisplayDate(bookingDate)}
                  {slotTime ? ` · ${slotTime.time}` : ''} · {paxCount} guest{paxCount > 1 ? 's' : ''}
                </p>
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-white/90">
                  {variant.venture.title}
                </p>
                <span className="mt-2 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                  {LIFECYCLE_LABELS[lifecycleStatus]}
                </span>
              </div>
            </div>
            <div className="border-t border-dashed border-white/20 px-4 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
              Show this QR at check-in
            </div>
          </div>
        )}

        {/* Yellow action-required banner — unsigned waiver */}
        {isUpcoming && waiverPending && (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-400 p-3 text-amber-950 dark:border-amber-400/60">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-bold">Action required — sign your safety waiver</p>
              <p className="text-xs font-medium opacity-90">
                Takes 1 minute. Required before the activity starts.
              </p>
              {token && (
                <Link
                  href={`/waiver?booking=${id}&token=${encodeURIComponent(token)}`}
                  className="mt-2 inline-flex min-h-[40px] items-center rounded-lg bg-amber-950 px-3 text-xs font-bold text-amber-300 transition-transform hover:scale-[1.02]"
                >
                  Sign waiver now
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Real-signal 3-step stepper (driver-assignment steps await schema support) */}
        {isUpcoming && (
          <ol
            aria-label="Trip progress"
            className="mb-4 grid grid-cols-4 gap-1 rounded-2xl border border-neutral-100 bg-neutral-50 p-3 dark:border-white/10 dark:bg-neutral-800/50"
          >
            {steps.map((step, index) => (
              <li key={step.label} className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold',
                    step.done
                      ? 'bg-green-600 text-white'
                      : 'border border-neutral-200 bg-white text-neutral-500 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-400'
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    'mt-1.5 text-[10px] font-bold uppercase tracking-wide',
                    step.done ? 'text-green-700 dark:text-green-400' : 'text-neutral-500 dark:text-neutral-400'
                  )}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 text-[9px] leading-tight text-neutral-500 dark:text-neutral-400">
                  {step.detail}
                </span>
              </li>
            ))}
          </ol>
        )}

        {/* Header: Image + Status */}
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
          <Image
            src={variant.venture.imageUrl}
            alt={variant.venture.title}
            fill
            className="object-cover"
            priority={isUpcoming}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Status Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              getLifecycleColor(lifecycleStatus)
            )}>
              {getLifecycleIcon(lifecycleStatus)}
              <span className="font-semibold">{LIFECYCLE_LABELS[lifecycleStatus]}</span>
            </span>
            {isUpcoming && countdown && countdown.days <= 3 && countdown.days >= 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-xs font-bold text-white animate-pulse">
                {countdown.days === 0 ? 'Today' : `${countdown.days}d left`}
              </span>
            )}
          </div>

          {/* Expand Toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur text-neutral-600 dark:text-neutral-400 shadow-lg transition-colors hover:bg-white dark:hover:bg-neutral-800"
            aria-label={expanded ? 'Collapse trip details' : 'Expand trip details'}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Main Info */}
        <div className="space-y-3">
          <div>
            <h3 className="font-heading text-lg font-bold text-neutral-900 dark:text-white">
              {variant.venture.title}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{variantTitle}</p>
          </div>

          {/* Meta Grid */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDisplayDate(bookingDate)}</span>
              {slotTime && <span> · {slotTime.time}</span>}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {slotTime?.time || 'All day'}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {paxCount} guest{paxCount > 1 ? 's' : ''}
            </span>
            <span className="font-semibold text-neutral-900 dark:text-white">
              {formatPrice(totalPrice)}
            </span>
          </div>

          {/* Waiver Status — collapsed into the yellow banner for upcoming trips */}
          {!isUpcoming && (
            <div className="flex items-center gap-2 text-xs">
              <Shield className={cn('h-3.5 w-3.5 shrink-0', waiverAcceptedAt ? 'text-green-600' : 'text-amber-600')} />
              <span className={cn('font-medium', waiverAcceptedAt ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400')}>
                {waiverAcceptedAt ? 'Waiver signed' : 'Waiver pending'}
              </span>
              {!waiverAcceptedAt && token && (
                <Link
                  href={`/waiver?booking=${id}&token=${encodeURIComponent(token!)}`}
                  className="ml-auto text-brand-ink hover:underline font-medium"
                >
                  Sign now
                </Link>
              )}
            </div>
          )}
          {isUpcoming && waiverAcceptedAt && (
            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
              <Shield className="h-3.5 w-3.5 shrink-0 text-green-600" />
              <span className="font-medium">Waiver signed</span>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            expanded ? 'max-h-[800px] opacity-100 mt-4 pt-4 border-t border-neutral-100 dark:border-white/10' : 'max-h-0 opacity-0'
          )}
        >
          <div className="space-y-4">
            {/* Logistics module — transfer: driver card · self-drive: meeting point */}
            {isTransfer && driver ? (
              <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-100 dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/20 text-sm font-bold text-brand-ink dark:bg-brand/30 dark:text-brand">
                      {driver.name.trim().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {driver.name}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {driver.vehicle_model ? `${driver.vehicle_model} · ` : ''}
                        <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                          {driver.plate_number}
                        </span>
                      </p>
                      {slotTime && (
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          Pickup at {slotTime.time}
                        </p>
                      )}
                    </div>
                  </div>
                  {driverWaLink && (
                    <a
                      href={driverWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp driver ${driver.name}`}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-900 transition-colors hover:border-brand shrink-0 dark:text-white"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ) : isTransfer && !driver ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600 dark:border-white/10 dark:bg-neutral-800/50 dark:text-neutral-300">
                Your driver is being assigned — the pickup details will be sent to your WhatsApp
                once assigned.
              </div>
            ) : (
              meetingPoint && (
                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-100 dark:border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-ink dark:bg-brand/20 dark:text-brand">
                        <Navigation className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">Meeting Point</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{meetingPoint.name}</p>
                      </div>
                    </div>
                    {mapsUrl && (
                      <Link
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-900 transition-colors hover:border-brand shrink-0"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Open in Google Maps
                      </Link>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Voucher QR Code */}
            {primaryVoucher && (
              <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-100 dark:border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-ink dark:bg-brand/20 dark:text-brand">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">Entry Voucher</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Show this QR code at the venue</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="text-sm font-medium text-brand-ink hover:underline flex items-center gap-1"
                  >
                    {showQR ? 'Hide' : 'Show'} QR
                    <ChevronDown className={cn('h-4 w-4 transition-transform', showQR && 'rotate-180')} />
                  </button>
                </div>
                {showQR && (
                  <div className="flex justify-center">
                    <Image
                      src={`/api/bookings/${id}/qr?access=${encodeURIComponent(voucherToken ?? '')}`}
                      alt={`Voucher QR for ${variant.venture.title}`}
                      width={200}
                      height={200}
                      className="rounded-lg bg-white p-2 border border-neutral-200 dark:border-white/10"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Booking Code & Actions */}
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-100 dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-neutral-500">{bookingCode}</span>
                <span className="text-xs text-neutral-500">{paymentStatus}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* View Voucher */}
                {primaryVoucher && paymentStatus === 'PAID' && !refund && token && (
                  <Link
                    href={`/voucher/${id}?access=${encodeURIComponent(voucherToken ?? '')}`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-900 transition-colors hover:border-brand"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    View Voucher
                  </Link>
                )}

                {/* Past trips: invoice, signed waiver, book again */}
                {!isUpcoming && token && (
                  <Link
                    href={`/trips/invoice/${id}?token=${encodeURIComponent(token)}`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-900 transition-colors hover:border-brand"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Download Invoice
                  </Link>
                )}
                {!isUpcoming && token && waiverAcceptedAt && (
                  <Link
                    href={`/waiver/${id}?token=${encodeURIComponent(token)}`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-900 transition-colors hover:border-brand"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    View Signed Waiver
                  </Link>
                )}
                {!isUpcoming && venture.id && venture.slug && (
                  <Link
                    href={`/experiences/${venture.id}/${venture.slug}`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-brand-ink px-3 text-xs font-semibold text-white transition-colors hover:bg-neutral-900"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Book Again
                  </Link>
                )}

                {/* Self-serve: 24/7 concierge with booking code prefilled */}
                {isUpcoming && (
                  <a
                    href={conciergeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-900 transition-colors hover:border-brand dark:text-white"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    24/7 Concierge
                  </a>
                )}

                {/* Write Review */}
                {reviewable && reviewToken && !review && (
                  <Link
                    href={`/review/${id}?token=${reviewToken}`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-900 transition-colors hover:border-brand"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    Write Review
                  </Link>
                )}

                {/* Refund Status */}
                {refund && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Cancelled · refund {refund.status.toLowerCase()}
                  </span>
                )}

                {/* Awaiting Payment */}
                {paymentStatus !== 'PAID' && !refund && (
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                    <CheckCircle className="h-3.5 w-3.5 text-amber-600" />
                    Awaiting payment
                  </span>
                )}
              </div>

              {/* Reschedule/Cancel Actions */}
              {actionable && token && (
                <BookingActions
                  bookingId={id}
                  token={token}
                  canCancel={quote.eligible}
                  canReschedule={quote.hoursBefore >= 24}
                  refundAmount={quote.refundAmount}
                  feeAmount={quote.feeAmount}
                />
              )}

              {!actionable && paymentStatus === 'PAID' && lifecycleStatus === 'CONFIRMED' && (
                <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                  Changes and cancellation close 24 hours before the activity.
                </p>
              )}
            </div>

            {/* Refund Info */}
            {refund && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-xs font-medium text-amber-700 dark:text-amber-400">
                Refund {refund.status.toLowerCase()} · {formatPrice(refund.amountIdr)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}