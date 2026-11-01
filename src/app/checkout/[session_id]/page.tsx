'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CreditCard, Shield, CheckCircle, Loader2, Users, Calendar, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatPrice } from '@/lib/i18n';
import type { Booking } from '@/types/venture';

interface CheckoutPageProps {
  params: Promise<{ session_id: string }>;
}

interface SnapWindow {
  snap?: {
    pay: (token: string, callbacks: { onSuccess?: () => void; onPending?: () => void; onError?: () => void }) => void;
  };
}

const MIDTRANS_SNAP_SANDBOX = 'https://app.sandbox.midtrans.com/snap/snap.js';
const MIDTRANS_SNAP_PRODUCTION = 'https://app.midtrans.com/snap/snap.js';

// Prices are all-in IDR integers; Midtrans charges booking.totalPrice exactly.

function loadSnapScript(clientKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as SnapWindow;
    if (w.snap) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-midtrans-snap]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Midtrans Snap.js')));
      return;
    }
    const script = document.createElement('script');
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    script.src = isProduction ? MIDTRANS_SNAP_PRODUCTION : MIDTRANS_SNAP_SANDBOX;
    script.setAttribute('data-midtrans-snap', 'true');
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Midtrans Snap.js'));
    document.body.appendChild(script);
  });
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [holdExpired, setHoldExpired] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { session_id } = await params;
        const response = await fetch(`/api/booking/${session_id}`);
        if (!response.ok) {
          throw new Error('Booking not found');
        }
        const data = await response.json();
        if (data.success) {
          setBooking(data.data);
          const expiresAt = data.data.expiresAt ? new Date(data.data.expiresAt) : null;
          setHoldExpiresAt(expiresAt);
          if (
            data.data.paymentStatus === 'PENDING' &&
            (!expiresAt || expiresAt.getTime() <= Date.now())
          ) {
            setHoldExpired(true);
          }
        } else {
          throw new Error(data.error?.message || 'Failed to load booking');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [params]);

  // Live hold countdown: the booking keeps its slot for a few minutes only.
  useEffect(() => {
    if (!holdExpiresAt || holdExpired) return;

    const tick = () => {
      const next = Date.now();
      setNow(next);
      if (holdExpiresAt.getTime() <= next) setHoldExpired(true);
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [holdExpiresAt, holdExpired]);

  const holdRemainingMs = holdExpiresAt ? Math.max(0, holdExpiresAt.getTime() - now) : null;
  const holdRemainingLabel =
    holdRemainingMs === null
      ? null
      : `${String(Math.floor(holdRemainingMs / 60000)).padStart(2, '0')}:${String(
          Math.floor((holdRemainingMs % 60000) / 1000)
        ).padStart(2, '0')}`;
  const holdIsUrgent = holdRemainingMs !== null && holdRemainingMs <= 120_000;

  const handlePaymentResult = useCallback(() => {
    window.location.href = `/voucher/${booking?.id}`;
  }, [booking]);

  const handlePayWithMidtrans = async () => {
    if (!booking || paying) return;
    setPaying(true);
    setPayError(null);

    try {
      const response = await fetch('/api/payment/midtrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data = await response.json();
      if (data.success && data.snapToken) {
        const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '';
        await loadSnapScript(clientKey);

        const w = window as SnapWindow;
        if (!w.snap) {
          throw new Error('Midtrans Snap failed to initialize');
        }
        w.snap.pay(data.snapToken, {
          onSuccess: handlePaymentResult,
          onPending: handlePaymentResult,
          onError: () => setPaying(false),
        });
      } else if (data.error?.code === 'HOLD_EXPIRED') {
        setHoldExpired(true);
        setPaying(false);
      } else {
        throw new Error(data.error?.message || 'Failed to initialize payment');
      }
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment initialization failed');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-ink" />
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'Invalid booking session'}</p>
          <a href="/" className="inline-block px-6 py-3 bg-brand-ink text-brand rounded-lg font-medium hover:bg-neutral-900">
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  const amountDue = booking.totalPrice;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <a href="/" className="inline-flex items-center gap-2 text-brand-ink mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to adventures
        </a>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex gap-4 pb-4 border-b border-gray-100">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{booking.variant?.title ?? 'Adventure Booking'}</h3>
                    <div className="mt-1 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{booking.paxCount} participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(booking.bookingDate).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{formatPrice(booking.totalPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                {booking.discountIdr > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Discount{booking.appliedCouponCode ? ` (${booking.appliedCouponCode})` : ''}
                    </span>
                    <span className="font-medium text-green-700">−{formatPrice(booking.discountIdr)}</span>
                  </div>
                )}
                {booking.nightSurchargeIdr > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Evening surcharge</span>
                    <span className="font-medium">{formatPrice(booking.nightSurchargeIdr)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-brand-ink">{formatPrice(amountDue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment - Right Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-brand-ink" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Midtrans Snap</h3>
                    <p className="text-sm text-gray-500">Credit Card, Debit Card, GoPay, QRIS, Bank Transfer</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout powered by Midtrans</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>PCI DSS Level 1 Certified</span>
                </div>

                {holdRemainingLabel && !holdExpired && booking.paymentStatus === 'PENDING' && (
                  <div
                    className={`mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      holdIsUrgent
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      Your slot is held for{' '}
                      <strong className="tabular-nums">{holdRemainingLabel}</strong>
                      {holdIsUrgent ? ' — finish the payment soon.' : '.'}
                    </span>
                  </div>
                )}

                {holdExpired && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-semibold">Your reservation hold expired.</p>
                    <p className="mt-1">
                      We released the slot so it is not blocked for other guests. Pick the date and
                      time again to start a fresh 10-minute hold.
                    </p>
                    <a
                      href="/"
                      className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-neutral-900 px-4 font-semibold text-white"
                    >
                      Choose another slot
                    </a>
                  </div>
                )}

                {payError && (
                  <div
                    role="alert"
                    className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                  >
                    <p className="font-semibold">Payment could not start</p>
                    <p className="mt-1 text-amber-800">{payError}</p>
                    <p className="mt-2 text-xs text-amber-700">
                      You can retry in a moment, or contact us and we&apos;ll finish it manually.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handlePayWithMidtrans}
                  disabled={paying || holdExpired}
                  fullWidth
                  size="lg"
                  className="mt-6"
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${formatPrice(amountDue)}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
