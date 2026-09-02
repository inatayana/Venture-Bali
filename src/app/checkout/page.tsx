'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { BookingForm } from '@/components/booking/BookingForm';
import { useBookingStore } from '@/store/bookingStore';

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function CheckoutPage() {
  const bookings = useBookingStore((state) => state.bookings);
  const getTotalPrice = useBookingStore((state) => state.getTotalPrice);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to adventures
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No items selected</p>
                  <Link
                    href="/"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Browse Adventures
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {bookings.map((booking, index) => (
                      <div
                        key={`${booking.ventureId}-${index}`}
                        className="flex gap-4 pb-4 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {booking.title}
                          </h3>
                          <div className="mt-1 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{booking.participants} participants</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(
                                  booking.bookingDate
                                ).toLocaleDateString('id-ID', {
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
                          <span className="font-semibold text-gray-900">
                            {formatPrice(booking.totalPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatPrice(getTotalPrice())}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-600">Tax (10%)</span>
                      <span className="font-medium">
                        {formatPrice(getTotalPrice() * 0.1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                      <span className="text-lg font-semibold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(getTotalPrice() * 1.1)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Booking Form - Right Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Contact Information
              </h2>
              <BookingForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
