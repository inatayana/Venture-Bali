'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Star,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  CheckCircle,
  Shield,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin as MapPinIcon,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Calendar as CalendarComponent } from '@/components/ui/Calendar';
import { TimeSlotCard } from '@/components/ui/TimeSlotCard';
import { Stepper } from '@/components/ui/Stepper';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useBookingStore } from '@/store/bookingStore';
import { formatPrice } from '@/lib/i18n';
import type { VentureItem, Variant, SlotTime, PriceTier } from '@/types/venture';
import { calculatePriceBreakdown, getAvailableSlots, isDateAvailable } from '@/lib/pricing';

interface VentureDetailClientProps {
  venture: VentureItem;
}

const PAYMENT_LOGOS = [
  { name: 'VISA', icon: '💳' },
  { name: 'Mastercard', icon: '💳' },
  { name: 'GoPay', icon: '📱' },
  { name: 'QRIS', icon: '📱' },
];

type BookingStep = 'date' | 'time' | 'travellers';

export function VentureDetailClient({ venture }: VentureDetailClientProps) {
  const [participants, setParticipants] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  // Booking wizard state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<SlotTime | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  
  const addBooking = useBookingStore((state) => state.addBooking);

  // Use first variant as default if available
  const defaultVariant = useMemo(() => venture.variants?.[0] || null, [venture.variants]);

  // Initialize selected variant
  const variant = selectedVariant || defaultVariant;

  // Get price tiers from selected variant or venture
  const priceTiers: PriceTier[] = useMemo(() => {
    if (variant?.priceTiers?.length) return variant.priceTiers;
    return [{ minPax: 1, maxPax: venture.maxParticipants, pricePerPax: venture.priceIdr }];
  }, [variant, venture.priceIdr, venture.maxParticipants]);

  // Calculate price breakdown
  const priceBreakdown = useMemo(() => 
    calculatePriceBreakdown(priceTiers, participants), 
    [priceTiers, participants]
  );

  // Get available slots for selected date and variant
  const availableSlots = useMemo(() => {
    if (!selectedDate || !variant) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    if (!isDateAvailable(variant, dateStr)) return [];
    return getAvailableSlots(variant, participants);
  }, [selectedDate, variant, participants]);

  const handleBookNow = () => {
    setIsBookingOpen(true);
    setBookingStep('date');
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  };

  const handleTimeSelect = (slot: SlotTime) => {
    setSelectedTime(slot);
  };

  const handleNext = () => {
    if (bookingStep === 'date' && selectedDate) {
      setBookingStep('time');
    } else if (bookingStep === 'time' && selectedTime) {
      setBookingStep('travellers');
    }
  };

  const handleBack = () => {
    if (bookingStep === 'time') {
      setBookingStep('date');
    } else if (bookingStep === 'travellers') {
      setBookingStep('time');
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime || !variant) return;

    setIsBooking(true);
    setTimeout(() => {
      const bookingDate = selectedDate.toISOString().split('T')[0];
      const timeStr = selectedTime.time;
      
      addBooking({
        ventureId: venture.id,
        title: venture.title,
        participants,
        totalPrice: priceBreakdown.totalPrice,
        bookingDate: `${bookingDate}T${timeStr}:00.000Z`,
      });
      
      setIsBooking(false);
      setBookingSuccess(true);
      setIsBookingOpen(false);
      setTimeout(() => setBookingSuccess(false), 3000);
    }, 800);
  };

  const mockReviews = [
    { name: 'Sarah M.', country: '🇦🇺', rating: 5, text: 'Amazing experience! The guide was fantastic.' },
    { name: 'Takeshi K.', country: '🇯🇵', rating: 5, text: 'Best ATV ride in Bali. Highly recommended!' },
    { name: 'Linda S.', country: '🇸🇬', rating: 4, text: 'Great fun, well organized. Will come back!' },
  ];

  const faqs = [
    { q: 'Is there a cancellation policy?', a: 'Free cancellation up to 24 hours before the activity. 20% fee if cancelled within 24 hours.' },
    { q: 'What should I bring?', a: 'Change of clothes, sunscreen, and waterproof bag for personal items.' },
    { q: 'Is it safe?', a: 'Yes, all safety equipment is provided. Professional guides accompany you throughout.' },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <a href="/" className="inline-flex items-center gap-2 text-blue-600 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to adventures
        </a>

        {/* Section 1: Hero Gallery */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4">
          <div className="relative h-64 md:h-96 w-full bg-gray-200">
            <Image
              src={venture.imageUrl}
              alt={venture.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Section 2: Title + Rating + Trust Badges */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {venture.title}
              </h1>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-gray-900">{venture.rating.toFixed(1)}</span>
                  <span className="text-gray-500">({venture.reviewCount} reviews)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  Instant Confirmation
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                  Free Cancellation
                </span>
              </div>
            </div>

            {/* Variant Selector (if multiple variants) */}
            {venture.variants && venture.variants.length > 1 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Choose Your Option</h2>
                <div className="space-y-3">
                  {venture.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedVariant?.id === v.id || (!selectedVariant && v === defaultVariant)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{v.title}</span>
                            {v.badge && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-yellow-900 rounded">
                                {v.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{v.shortDescription}</p>
                        </div>
                        <span className="text-lg font-bold text-blue-600 shrink-0">
                          {formatPrice(calculatePriceBreakdown(v.priceTiers, participants).pricePerPax)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Quick Key Highlights */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">At a Glance</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-gray-500 block text-xs">Location</span>
                    <span className="text-gray-900 font-medium">{venture.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-gray-500 block text-xs">Duration</span>
                    <span className="text-gray-900 font-medium">{venture.duration}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-gray-500 block text-xs">Group Size</span>
                    <span className="text-gray-900 font-medium">Up to {venture.maxParticipants}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-gray-500 block text-xs">Difficulty</span>
                    <span className="text-gray-900 font-medium">{venture.difficulty}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Overview */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                {venture.description}
              </p>

              {venture.itinerary.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Itinerary</h3>
                  <div className="space-y-3">
                    {venture.itinerary.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-16 shrink-0 text-sm font-medium text-blue-600">
                          {item.time}
                        </div>
                        <div className="text-sm text-gray-600">{item.activity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 6: Inclusions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-green-700">What&apos;s Included ✅</h3>
                  <ul className="space-y-2">
                    {venture.inclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-red-700">Not Included ❌</h3>
                  <ul className="space-y-2">
                    {venture.exclusions.map((item, i) => (
                      <li key={i} className="text-sm text-gray-500">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 7: Reviews */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Reviews
              </h2>
              <div className="space-y-4">
                {mockReviews.map((review, i) => (
                  <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{review.country}</span>
                      <span className="font-medium text-gray-900">{review.name}</span>
                      <div className="flex items-center gap-0.5 ml-auto">
                        {Array.from({ length: review.rating }).map((_, j) => (
                          <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.text}</p>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-sm font-medium text-blue-600 hover:underline">
                Show all {venture.reviewCount} reviews
              </button>
            </div>

            {/* Section 8: Meeting Point */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Meeting Point</h2>
              <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center text-gray-400 relative">
                <MapPinIcon className="w-12 h-12 text-gray-300" />
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-600">{venture.location}</p>
                <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  Open in Google Maps
                </button>
              </div>
              {/* Hotel pickup info - available when venture has pickupZone data */}
              {/* {venture.pickupZone && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  <strong>Hotel Pickup Available:</strong> {venture.pickupZone.name} (+{formatPrice(venture.pickupZone.surchargeIdr)})
                </div>
              )} */}
            </div>

            {/* Section 9: Things to Know */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Things to Know</h2>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
                    >
                      {faq.q}
                      {expandedFaq === i ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {expandedFaq === i && (
                      <div className="px-4 pb-4 text-sm text-gray-600">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-xl shadow-md p-6">
              {/* Price Summary */}
              <div className="mb-4">
                <span className="text-sm text-gray-500 block">From</span>
                <span className="text-3xl font-bold text-blue-600">
                  {formatPrice(priceBreakdown.pricePerPax)}
                </span>
                <span className="text-sm text-gray-500"> / person</span>
              </div>

              {/* Quick Total Display */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Estimated Total ({participants} guest)</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(priceBreakdown.totalPrice)}
                </span>
              </div>

              {/* Variant display if selected */}
              {variant && variant.id !== defaultVariant?.id && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                  <span className="text-blue-700 font-medium">{variant.title}</span>
                </div>
              )}

              {/* Book Now Button - Opens Wizard */}
              <Button
                onClick={handleBookNow}
                disabled={isBooking}
                fullWidth
                size="lg"
              >
                {isBooking ? 'Booking...' : 'Show Dates & Book'}
              </Button>

              {bookingSuccess && (
                <p role="status" className="mt-3 text-sm text-green-700 text-center">
                  Booking confirmed!
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>🔒 Secure checkout powered by Midtrans</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>✓ Instant Confirmation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CreditCard className="w-4 h-4" />
                  <span>{PAYMENT_LOGOS.map((p) => p.name).join(' / ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Step Booking Wizard Bottom Sheet */}
      <BottomSheet
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setBookingStep('date');
          setSelectedDate(null);
          setSelectedTime(null);
        }}
        title={`Step ${bookingStep === 'date' ? 1 : bookingStep === 'time' ? 2 : 3} of 3`}
      >
        <div className="space-y-6">
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {['date', 'time', 'travellers'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  ['date', 'time', 'travellers'].indexOf(bookingStep) >= i
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                {i < 2 && (
                  <div className={`w-12 h-0.5 ${['date', 'time'].indexOf(bookingStep) > i ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Select Date */}
          {bookingStep === 'date' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
              <CalendarComponent
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                blackoutDates={variant?.blackoutDates}
                minDate={new Date()}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsBookingOpen(false)} fullWidth>
                  Cancel
                </Button>
                <Button onClick={handleNext} disabled={!selectedDate} fullWidth>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Select Time */}
          {bookingStep === 'time' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Time {selectedDate && `for ${selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
              </h3>
              {availableSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No available time slots for this date</p>
                  <Button variant="outline" onClick={() => setBookingStep('date')} className="mt-4">
                    Choose Another Date
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <TimeSlotCard
                      key={slot.time}
                      slot={{
                        id: `slot-${slot.time}`,
                        variantId: variant?.id || '',
                        time: slot.time,
                        maxCapacity: slot.capacity,
                        currentBookings: slot.booked,
                        isAvailable: slot.available > 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      }}
                      isSelected={selectedTime?.time === slot.time}
                      onSelect={handleTimeSelect}
                    />
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} fullWidth>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={!selectedTime} fullWidth>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: How Many Travellers */}
          {bookingStep === 'travellers' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">How Many Travellers?</h3>
              
              <div className="space-y-4">
                <Stepper
                  label="Adults"
                  value={participants}
                  min={venture.minParticipants}
                  max={Math.min(venture.maxParticipants, 10)}
                  onChange={setParticipants}
                />
                
                {/* Children stepper if applicable */}
                {false && ( // TODO: Add children support when needed
                  <Stepper
                    label="Children"
                    value={0}
                    min={0}
                    max={5}
                    onChange={() => {}}
                  />
                )}
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{participants} × Adult</span>
                  <span className="font-medium">{formatPrice(priceBreakdown.pricePerPax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Total</span>
                  <span className="font-bold text-lg">{formatPrice(priceBreakdown.totalPrice)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} fullWidth>
                  Back
                </Button>
                <Button onClick={handleConfirmBooking} disabled={isBooking} fullWidth>
                  {isBooking ? 'Booking...' : 'Confirm & Pay'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </main>
  );
}