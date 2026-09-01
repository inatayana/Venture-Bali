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
      </div>
    </main>
  );
}

