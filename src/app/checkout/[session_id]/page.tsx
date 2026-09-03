'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Shield, CheckCircle, Loader2, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatPrice } from '@/lib/i18n';
import type { Booking } from '@/types/venture';

interface CheckoutPageProps {
  params: Promise<{ session_id: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

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

  const handlePayWithMidtrans = async () => {
    if (!booking || paying) return;
    setPaying(true);

    try {
      const response = await fetch('/api/payment/midtrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          orderId: booking.bookingCode,
          amount: booking.totalPrice,
          customerName: 'Customer', // Would come from form
          customerEmail: 'customer@example.com',
          customerPhone: '+628123456789',
        }),
      });

      const data = await response.json();
      if (data.success && data.snapToken) {
        // Load Midtrans Snap.js
        loadMidtransSnap(data.snapToken);
      } else {
        throw new Error(data.error?.message || 'Failed to initialize payment');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Payment initialization failed');
    } finally {
      setPaying(false);
    }
  };

  const loadMidtransSnap = (token: string) => {
    // In production, load Midtrans Snap.js from CDN
    // For demo, simulate payment completion
    console.log('Initializing Midtrans Snap with token:', token);

    // Simulate payment completion after 3 seconds
    setTimeout(() => {
      // In real implementation, this callback comes from Midtrans
      handlePaymentSuccess();
    }, 3000);
  };

  const handlePaymentSuccess = () => {
    alert('Payment successful! Redirecting to voucher...');
    window.location.href = `/voucher/${booking?.id}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'Invalid booking session'}</p>
          <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <a href="/" className="inline-flex items-center gap-2 text-blue-600 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to adventures
        </a>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <h2 className="heading-caps text-lg text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex gap-4 pb-4 border-b border-gray-100">
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-gray-900">{booking.variant?.title ?? 'Adventure Booking'}</h3>
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
                    <span className="font-heading font-bold tabular-nums text-gray-900">{formatPrice(booking.totalPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-heading font-medium tabular-nums">{formatPrice(booking.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax & Fees</span>
                  <span className="font-heading font-medium tabular-nums">{formatPrice(Math.round(booking.totalPrice * 0.1))}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <span className="font-heading text-lg font-semibold text-gray-900">Total</span>
                  <span className="font-heading text-2xl font-bold tabular-nums text-blue-600">{formatPrice(Math.round(booking.totalPrice * 1.1))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment - Right Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <h2 className="heading-caps text-lg text-gray-900 mb-6">Payment</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-gray-900">Midtrans Snap</h3>
                    <p className="text-sm text-gray-500">Credit Card, Debit Card, GoPay, QRIS, Bank Transfer</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>🔒 Secure checkout powered by Midtrans</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>PCI DSS Level 1 Certified</span>
                </div>

                <Button
                  onClick={handlePayWithMidtrans}
                  disabled={paying}
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
                    `Pay ${formatPrice(Math.round(booking.totalPrice * 1.1))}`
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