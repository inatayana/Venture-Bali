'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, MapPin, Clock, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { useBookingStore } from '@/store/bookingStore';
import type { VentureItem } from '@/types/venture';

interface VentureDetailClientProps {
  venture: VentureItem;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export function VentureDetailClient({ venture }: VentureDetailClientProps) {
  const [participants, setParticipants] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const addBooking = useBookingStore((state) => state.addBooking);

  const handleBookNow = () => {
    setIsBooking(true);
    setTimeout(() => {
      addBooking({
        ventureId: venture.id,
        title: venture.title,
        participants,
        totalPrice: venture.priceIdr * participants,
        bookingDate: new Date().toISOString(),
      });
      setIsBooking(false);
      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 3000);
    }, 800);
  };

  const total = venture.priceIdr * participants;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <a href="/" className="inline-flex items-center gap-2 text-blue-600 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to adventures
        </a>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="relative h-64 w-full bg-gray-200">
            <Image
              src={venture.imageUrl}
              alt={venture.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {venture.title}
            </h1>
            <p className="text-gray-600 mb-4">{venture.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {venture.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" aria-hidden="true" />
                {venture.durationHours}h
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" aria-hidden="true" />
                up to {venture.maxParticipants}
              </span>
              <span className="flex items-center gap-1">
                <Star
                  className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  aria-hidden="true"
                />
                {venture.rating.toFixed(1)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
              <label htmlFor="participants" className="text-sm text-gray-700">
                Participants
              </label>
              <input
                id="participants"
                type="number"
                min={venture.minParticipants}
                max={venture.maxParticipants}
                value={participants}
                onChange={(e) => setParticipants(Number(e.target.value))}
                className="w-20 rounded-lg border border-gray-300 px-2 py-1.5"
              />
              <span className="text-xl font-bold text-blue-600 ml-auto">
                {formatPrice(total)}
              </span>
              <Button onClick={handleBookNow} disabled={isBooking}>
                {isBooking ? 'Booking...' : 'Book Now'}
              </Button>
            </div>

            {bookingSuccess && (
              <p role="status" className="mt-3 text-sm text-green-700">
                Booking confirmed!
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
