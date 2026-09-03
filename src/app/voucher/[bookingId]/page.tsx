'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Calendar, Users, Clock, Download, QrCode, Shield } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatPrice } from '@/lib/i18n';
import type { Booking } from '@/types/venture';
import { generateVoucherId, generateQRCodeData, generateQRCodeDataURL } from '@/lib/voucher';

interface VoucherPageProps {
  params: Promise<{ bookingId: string }>;
}

export default function VoucherPage({ params }: VoucherPageProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showPDF, setShowPDF] = useState(false);

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

  useEffect(() => {
    if (booking) {
      const voucherId = generateVoucherId(booking.id);
      const qrData = generateQRCodeData(voucherId, booking.bookingCode);
      generateQRCodeDataURL(qrData).then(setQrCodeUrl);
    }
  }, [booking]);

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
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 mb-2">Voucher Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'Invalid voucher'}</p>
          <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  const voucherId = generateVoucherId(booking.id);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <a href="/" className="inline-flex items-center gap-2 text-blue-600 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to adventures
        </a>

        <div className="max-w-2xl mx-auto">
          {/* Voucher Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-heading text-sm font-semibold uppercase tracking-wider opacity-90">E-Voucher</span>
                <span className="font-heading text-sm font-semibold tracking-wider opacity-90">{voucherId}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="font-heading text-2xl font-bold">Booking Confirmed!</h1>
                  <p className="opacity-90">{booking.bookingCode}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Activity Info */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">{booking.variant?.title ?? 'Adventure Booking'}</h2>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium tabular-nums">{new Date(booking.bookingDate).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-medium tabular-nums">{booking.slotTime?.time || 'TBA'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Guests</p>
                      <p className="font-medium tabular-nums">{booking.paxCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                <h3 className="font-heading text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Show this QR code at the venue</h3>
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Voucher QR Code" className="w-48 h-48 mx-auto" />
                ) : (
                  <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <p className="mt-4 text-sm text-gray-500">Voucher ID: {voucherId}</p>
              </div>

              {/* Important Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Important Reminders
                </h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Present this QR code at the meeting point</li>
                  <li>• Arrive 15 minutes before scheduled time</li>
                  <li>• Bring valid ID for verification</li>
                  <li>• This voucher is valid for one-time use only</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowPDF(true)} fullWidth>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="primary" fullWidth>
                  Add to Wallet
                </Button>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-6 bg-white rounded-xl shadow-md p-5">
            <h3 className="font-heading font-semibold text-gray-900 mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Activity</span><span className="font-heading font-medium tabular-nums">{formatPrice(booking.totalPrice)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Tax & Fees (10%)</span><span className="font-heading font-medium tabular-nums">{formatPrice(Math.round(booking.totalPrice * 0.1))}</span></div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-lg font-bold">
                <span className="font-heading text-gray-900">Total Paid</span>
                <span className="font-heading tabular-nums text-blue-600">{formatPrice(Math.round(booking.totalPrice * 1.1))}</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">Payment Status: <span className="font-medium text-green-600">PAID</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      {showPDF && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-heading font-semibold">E-Voucher PDF</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPDF(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </Button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">PDF generation will be implemented with a PDF library (pdfkit/puppeteer) in production.</p>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                Voucher ID: {voucherId}<br />
                Booking: {booking.bookingCode}<br />
                Activity: {booking.variant?.title ?? 'Adventure Booking'}<br />
                Date: {new Date(booking.bookingDate).toLocaleDateString()}<br />
                Total: {formatPrice(Math.round(booking.totalPrice * 1.1))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}