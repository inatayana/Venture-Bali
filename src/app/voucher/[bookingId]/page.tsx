'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeft, CheckCircle, Calendar, Users, Clock, Printer, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatPrice } from '@/lib/i18n';
import type { Booking, Voucher } from '@/types/venture';

interface VoucherPageProps {
  params: Promise<{ bookingId: string }>;
}

type VoucherBooking = Booking & {
  qrCodeDataUrl?: string | null;
  voucher?: Voucher | null;
};

const STATUS_LABEL: Record<Booking['paymentStatus'], string> = {
  PAID: 'Paid',
  PENDING: 'Awaiting payment',
  CANCELLED: 'Cancelled',
  FAILED: 'Payment failed',
};

export default function VoucherPage({ params }: VoucherPageProps) {
  const [booking, setBooking] = useState<VoucherBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { bookingId } = await params;
        const response = await fetch(`/api/booking/${bookingId}`);
        if (!response.ok) throw new Error('Booking not found');
        const data = await response.json();
        if (data.success) {
          setBooking(data.data);
        } else {
          throw new Error(data.error?.message || 'Failed to load booking');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load voucher');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Voucher Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'Invalid voucher'}</p>
          <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  const isPaid = booking.paymentStatus === 'PAID';
  const voucherId = booking.bookingCode;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <a href="/" className="inline-flex items-center gap-2 text-blue-600 mb-4 print:hidden">
          <ArrowLeft className="w-4 h-4" />
          Back to adventures
        </a>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className={`text-white p-6 ${isPaid ? 'bg-gradient-to-r from-blue-600 to-blue-800' : 'bg-gradient-to-r from-amber-500 to-amber-700'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm opacity-90">E-VOUCHER</span>
                <span className="text-sm opacity-90">{voucherId}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  {isPaid ? <CheckCircle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isPaid ? 'Booking confirmed!' : 'Awaiting payment'}
                  </h1>
                  <p className="opacity-90">{booking.bookingCode}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {!isPaid && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  We are still waiting for the payment confirmation from Midtrans. Your voucher
                  becomes valid as soon as the payment settles. Keep this page and refresh it in a
                  few moments.
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-5">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{booking.variant?.title ?? 'Adventure Booking'}</h2>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium">{new Date(booking.bookingDate).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-medium">{booking.slotTime?.time || 'TBA'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Guests</p>
                      <p className="font-medium">{booking.paxCount}</p>
                    </div>
                  </div>
                </div>
                {booking.fulfillmentMode !== 'SELF_DRIVE' && (
                  <p className="mt-3 text-xs text-gray-500">
                    Pickup: {booking.isTba ? 'To be confirmed by H-1' : booking.hotelAddress || 'Hotel pickup'}
                  </p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  {isPaid ? 'Show this QR code at the venue' : 'Pending booking code'}
                </h3>
                {isPaid && booking.qrCodeDataUrl ? (
                  <Image
                    src={booking.qrCodeDataUrl}
                    alt={`Voucher QR code for ${booking.bookingCode}`}
                    width={192}
                    height={192}
                    unoptimized
                    className="mx-auto h-48 w-48"
                  />
                ) : (
                  <p className="font-mono text-2xl font-bold tracking-widest text-gray-900">
                    {booking.bookingCode}
                  </p>
                )}
                <p className="mt-3 font-mono text-sm tracking-widest text-gray-600">
                  {booking.bookingCode}
                </p>
                {booking.voucher && (
                  <p className="mt-1 text-xs text-gray-400">
                    Voucher status: {booking.voucher.status}
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Important reminders
                </h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Present this booking code at the meeting point</li>
                  <li>• Arrive 15 minutes before the scheduled time</li>
                  <li>• Bring a valid ID for verification</li>
                  <li>• This voucher is valid for one-time use only</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 print:hidden">
                <Button variant="outline" onClick={() => window.print()} fullWidth>
                  <Printer className="w-4 h-4 mr-2" />
                  Print / Save as PDF
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl shadow-md p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Payment summary</h3>
            <div className="space-y-2 text-sm">
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
              <div className="flex justify-between pt-2 border-t border-gray-200 text-lg font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-blue-600">{formatPrice(booking.totalPrice)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Payment status:{' '}
                <span className={`font-medium ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                  {STATUS_LABEL[booking.paymentStatus]}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
