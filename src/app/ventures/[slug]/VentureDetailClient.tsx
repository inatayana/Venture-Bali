'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  Star,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  CheckCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  Heart,
  Share2,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PackageOptionsWidget, type BookingConfig } from '@/components/booking/PackageOptionsWidget';
import { formatPrice } from '@/lib/i18n';
import type { VentureItem } from '@/types/venture';
import { cn } from '@/utils/cn';

interface VentureDetailClientProps {
  venture: VentureItem;
}

const PAYMENT_LOGOS = ['VISA', 'Mastercard', 'GoPay', 'QRIS'];

const ANCHORS = [
  { id: 'package-options', label: 'Package Options' },
  { id: 'what-to-expect', label: 'What To Expect' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'location', label: 'Location' },
];

function buildInitialConfig(venture: VentureItem): BookingConfig {
  return {
    variantId: venture.variants?.[0]?.id ?? '',
    date: null,
    slot: null,
    adults: venture.minParticipants || 1,
    transfer: 'NONE',
    zoneId: null,
    addonIds: [],
  };
}

export function VentureDetailClient({ venture }: VentureDetailClientProps) {
  const [config, setConfig] = useState<BookingConfig>(() => buildInitialConfig(venture));
  const [isBooking, setIsBooking] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeAnchor, setActiveAnchor] = useState('package-options');
  const [isWishlisted, setIsWishlisted] = useState(false);

  const variant = useMemo(
    () => venture.variants?.find((v) => v.id === config.variantId) ?? venture.variants?.[0] ?? null,
    [venture.variants, config.variantId]
  );

  // Lowest-tier "from" price for mobile CTA bar
  const fromPrice = useMemo(() => {
    const tiers = variant?.priceTiers ?? [{ minPax: 1, maxPax: 1, pricePerPax: venture.priceIdr }];
    return Math.min(...tiers.map((t) => t.pricePerPax));
  }, [variant, venture.priceIdr]);

  const patchConfig = (patch: Partial<BookingConfig>) =>
    setConfig((prev) => ({ ...prev, ...patch }));

  // Scroll-spy for anchor bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveAnchor(entry.target.id);
        }
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    ANCHORS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBook = async () => {
    if (!config.date || !config.slot || !variant) return;
    setIsBooking(true);
    try {
      const bookingDate = config.date.toISOString().split('T')[0];
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureId: venture.id,
          variantId: variant.id,
          bookingDate,
          slotTimeId: config.slot.id,
          fulfillmentMode: config.transfer === 'NONE' ? 'SELF_DRIVE' : 'PRIVATE_TRANSFER',
          pickupZoneId: config.transfer === 'NONE' ? undefined : config.zoneId,
          vehicleClassType: config.transfer === 'NONE' ? undefined : config.transfer,
          paxCount: config.adults,
          selectedAddons: config.addonIds,
          customerName: 'Customer',
          customerEmail: 'customer@example.com',
          customerWhatsApp: '+628123456789',
        }),
      });
      const data = await response.json();
      if (data.success && data.data?.redirectUrl) {
        window.location.href = data.data.redirectUrl;
      } else {
        throw new Error(data.error?.message || 'Booking failed');
      }
    } catch (error) {
      setIsBooking(false);
      setIsSheetOpen(false);
      alert(error instanceof Error ? error.message : 'Booking failed. Please try again.');
    }
  };

  const widget = (onBook: () => void) => (
    <PackageOptionsWidget
      venture={venture}
      config={config}
      onChange={patchConfig}
      onBook={onBook}
      isBooking={isBooking}
    />
  );

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
    <main className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
      <div className="container mx-auto px-4 py-6">
        <a href="/" className="inline-flex items-center gap-2 text-blue-600 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to adventures
        </a>

        {/* ===== Section 1: Hero Gallery & Quick Overview ===== */}
        <div className="relative rounded-xl shadow-md overflow-hidden mb-4">
          <div className="relative h-64 md:h-96 w-full bg-gray-200">
            <Image
              src={venture.imageUrl}
              alt={venture.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="p-2.5 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
              aria-label="Add to wishlist"
            >
              <Heart className={cn('w-5 h-5', isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600')} />
            </button>
            <button
              type="button"
              className="p-2.5 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-4">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 mb-2">{venture.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-gray-900">{venture.rating.toFixed(1)}</span>
              <span className="text-gray-500">({venture.reviewCount} reviews)</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full">
              <CheckCircle className="w-4 h-4" />
              Instant Confirmation
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
              Free Cancellation
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {venture.location}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {venture.duration}</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Up to {venture.maxParticipants}</span>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> {venture.difficulty}</span>
          </div>
        </div>

        {/* ===== Section 3: Sticky Anchor Nav Bar ===== */}
        <div className="sticky top-0 z-40 -mx-4 px-4 bg-white/95 backdrop-blur border-b border-gray-200 py-2.5 mb-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Page sections">
            {ANCHORS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={cn(
                  'px-4 py-2 rounded-full font-heading text-sm font-semibold uppercase tracking-wider whitespace-nowrap transition-colors min-h-[44px]',
                  activeAnchor === id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* ===== Section 2 (mobile summary → scroll to sheet trigger) ===== */}
            <div id="package-options" className="lg:hidden bg-white rounded-xl shadow-md p-6">
              <h2 className="heading-caps text-lg text-gray-900 mb-1">Package Options</h2>
              <p className="text-sm text-gray-500 mb-4">Configure package, date, pax & transport</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block">From</span>
                  <span className="font-heading text-2xl font-bold tabular-nums text-blue-600">{formatPrice(fromPrice)}</span>
                  <span className="text-xs text-gray-500"> /pax</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-heading font-semibold uppercase tracking-wider hover:bg-blue-700 min-h-[44px]"
                >
                  Select Options
                </button>
              </div>
            </div>

            {/* ===== Section 4: What To Expect ===== */}
            <div id="what-to-expect" className="bg-white rounded-xl shadow-md p-6 scroll-mt-20">
              <h2 className="heading-caps text-lg text-gray-900 mb-4">What To Expect</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{venture.description}</p>

              {venture.itinerary.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Itinerary</h3>
                  <div className="space-y-3">
                    {venture.itinerary.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-20 shrink-0 text-sm font-medium text-blue-600">{item.time}</div>
                        <div className="text-sm text-gray-600">{item.activity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                      <li key={i} className="text-sm text-gray-500">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Things to Know</h3>
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
                    >
                      {faq.q}
                      {expandedFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>
                    {expandedFaq === i && <div className="px-4 pb-4 text-sm text-gray-600">{faq.a}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* ===== Section 5: Reviews ===== */}
            <div id="reviews" className="bg-white rounded-xl shadow-md p-6 scroll-mt-20">
              <h2 className="heading-caps text-lg text-gray-900 mb-4">Reviews</h2>
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <span className="font-heading text-4xl font-bold tabular-nums text-gray-900">{venture.rating.toFixed(1)}</span>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3].map((stars) => (
                    <div key={stars} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-6">{stars}★</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: stars === 5 ? '82%' : stars === 4 ? '14%' : '4%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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

            {/* ===== Section 6: Location & Related ===== */}
            <div id="location" className="bg-white rounded-xl shadow-md p-6 scroll-mt-20">
              <h2 className="heading-caps text-lg text-gray-900 mb-4">Location</h2>
              <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center text-gray-400 relative">
                <MapPin className="w-12 h-12 text-gray-300" />
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-600">{venture.location}</p>
                <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Open in Google Maps
                </button>
                <p className="text-xs text-gray-500">
                  Hotel pickup available when you select a transport option in Package Options.
                </p>
              </div>
            </div>
          </div>

          {/* ===== Section 2: Desktop Inline Configurator (sticky) ===== */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-16 bg-white rounded-xl shadow-md p-6 max-h-[calc(100vh-5rem)] overflow-y-auto">
              <div className="mb-4 pb-4 border-b border-gray-100">
                <span className="text-sm text-gray-500 block">From</span>
                <span className="font-heading text-3xl font-bold tabular-nums text-blue-600">{formatPrice(fromPrice)}</span>
                <span className="text-sm text-gray-500"> / person</span>
              </div>
              {widget(handleBook)}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>🔒 Secure checkout powered by Midtrans</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>✓ {PAYMENT_LOGOS.join(' / ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Mobile: Fixed Bottom CTA ===== */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 p-3 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <span className="text-xs text-gray-500 block">From</span>
            <span className="font-heading text-lg font-bold tabular-nums text-blue-600">{formatPrice(fromPrice)}</span>
            <span className="text-xs text-gray-500"> /pax</span>
          </div>
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="px-8 py-3.5 bg-blue-600 text-white rounded-lg font-heading font-semibold uppercase tracking-wider hover:bg-blue-700 min-h-[44px]"
          >
            Select Options
          </button>
        </div>
      </div>

      {/* ===== Mobile: Full-height Configurator Bottom Sheet ===== */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Package Options"
        className="sm:!max-w-lg h-[92vh] sm:h-auto"
      >
        {widget(async () => {
          await handleBook();
        })}
      </BottomSheet>
    </main>
  );
}
