'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  Share2,
  Wallet,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui';
import {
  ExperienceBookingWidget,
  toDateKey,
  type AppliedCoupon,
  type BookingConfig,
} from '@/components/features/ExperienceBookingWidget';
import { VariantCatalogCard } from '@/components/features/VariantCatalogCard';
import { PromoBanner } from '@/components/features/PromoBanner';
import { formatPrice } from '@/lib/i18n';
import { REFUND_WINDOWS } from '@/lib/refundUtils';
import type { PickupZone, VehicleClass, VentureItem } from '@/types/venture';
import { cn } from '@/utils/cn';

interface ExperienceDetailClientProps {
  venture: VentureItem;
  zones: PickupZone[];
  vehicleClasses: VehicleClass[];
}

const PAYMENT_LOGOS = ['VISA', 'Mastercard', 'GoPay', 'QRIS'];
const PROMO_CODE = 'TRYBALI2026';
const PROMO_STORAGE_KEY = 'vb_promo_dismissed';
const CANCELLATION = REFUND_WINDOWS[0];

const ANCHORS = [
  { id: 'package-options', label: 'Packages' },
  { id: 'what-to-expect', label: 'What To Expect' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'location', label: 'Location' },
];

function buildInitialConfig(venture: VentureItem): BookingConfig {
  const firstVariant = venture.variants?.[0] ?? null;
  return {
    variantId: firstVariant?.id ?? '',
    date: null,
    slot: null,
    adults: Math.max(1, venture.minParticipants || 1),
    vehicleClassType: null,
    zoneId: null,
    hotelAddress: '',
    isTba: false,
    couponCode: '',
    addonIds: [],
    customerName: '',
    customerEmail: '',
    customerWhatsApp: '',
    countryCode: 'ID',
  };
}

export function ExperienceDetailClient({ venture, zones, vehicleClasses }: ExperienceDetailClientProps) {
  const [config, setConfig] = useState<BookingConfig>(() => buildInitialConfig(venture));
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeAnchor, setActiveAnchor] = useState('package-options');
  const [promoVisible, setPromoVisible] = useState(true);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

  const variant = useMemo(
    () => venture.variants?.find((item) => item.id === config.variantId) ?? venture.variants?.[0] ?? null,
    [venture.variants, config.variantId]
  );

  const fromPrice = venture.priceIdr;

  const patchConfig = useCallback(
    (patch: Partial<BookingConfig>) => setConfig((prev) => ({ ...prev, ...patch })),
    []
  );

  useEffect(() => {
    try {
      setPromoVisible(window.localStorage.getItem(PROMO_STORAGE_KEY) !== '1');
    } catch {
      /* storage unavailable — keep the banner visible */
    }
  }, []);

  const dismissPromo = () => {
    setPromoVisible(false);
    try {
      window.localStorage.setItem(PROMO_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  // Scroll-spy for the anchor bar
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
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openBooking = (variantId: string) => {
    setConfig((prev) => ({
      ...prev,
      variantId,
      slot: null,
      zoneId: null,
      vehicleClassType: null,
      hotelAddress: '',
      isTba: false,
      couponCode: '',
      addonIds: [],
    }));
    setAppliedCoupon(null);
    setIsSheetOpen(true);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: venture.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    } catch {
      /* user cancelled */
    }
  };

  const handleBook = async () => {
    if (!config.date || !config.slot || !variant) return;
    setIsBooking(true);
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureId: venture.id,
          variantId: variant.id,
          bookingDate: toDateKey(config.date),
          slotTimeId: config.slot.id,
          fulfillmentMode: variant.fulfillmentMode,
          pickupZoneId: variant.fulfillmentMode === 'SELF_DRIVE' ? undefined : config.zoneId,
          vehicleClassType:
            variant.fulfillmentMode === 'PRIVATE_TRANSFER' ? config.vehicleClassType : undefined,
          hotelAddress: config.hotelAddress || undefined,
          isTba: config.isTba,
          couponCode: appliedCoupon?.code ?? undefined,
          paxCount: config.adults,
          selectedAddons: config.addonIds,
          customerName: config.customerName,
          customerEmail: config.customerEmail,
          customerWhatsApp: config.customerWhatsApp,
          countryCode: config.countryCode,
        }),
      });
      const data = await response.json();
      if (data.success && data.data?.redirectUrl) {
        window.location.href = data.data.redirectUrl;
        return;
      }
      throw new Error(data.error?.message || 'Booking failed');
    } catch (error) {
      setIsBooking(false);
      alert(error instanceof Error ? error.message : 'Booking failed. Please try again.');
    }
  };

  const reviews = useMemo(() => venture.reviewList ?? [], [venture.reviewList]);
  const faqs = venture.faqs ?? [];
  const reviewCount = venture.reviewCount;

  const histogram = useMemo(() => {
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((review) => review.rating === stars).length;
      const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
      return { stars, count, percent };
    });
  }, [reviews]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${venture.location || venture.title} Bali`
  )}`;

  return (
    <main className="min-h-screen bg-white pb-28 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <a href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" />
          All adventures
        </a>

        {promoVisible && (
          <div className="mb-4">
            <PromoBanner
              code={PROMO_CODE}
              label="Launch offer — 40% off with code"
              onDismiss={dismissPromo}
            />
          </div>
        )}

        {/* Hero */}
        <div className="relative mb-4 overflow-hidden rounded-2xl">
          <div className="relative h-56 w-full bg-neutral-200 md:h-80">
            <Image
              src={venture.imageUrl}
              alt={venture.title}
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={share}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow transition-colors hover:bg-white"
              aria-label="Share this adventure"
            >
              <Share2 className="h-5 w-5 text-neutral-700" />
            </button>
          </div>
          {shareState === 'copied' && (
            <span className="absolute bottom-3 right-3 rounded-full bg-neutral-900 px-3 py-1 text-xs text-white">
              Link copied
            </span>
          )}
        </div>

        {/* Product header */}
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-700">
              <MapPin className="h-3.5 w-3.5" /> {venture.location || 'Bali'}
            </span>
            {venture.badge && (
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {venture.badge}
              </span>
            )}
          </div>

          <h1 className="font-heading text-2xl font-bold leading-tight text-neutral-900 md:text-3xl">
            {venture.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <strong className="text-neutral-900">{venture.rating.toFixed(1)}</strong>
              <span>· {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {venture.duration}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> Up to {venture.maxParticipants} guests
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-800">
              <CheckCircle className="h-4 w-4" /> Instant confirmation
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700">
              <Wallet className="h-4 w-4" /> Reschedule free ≥24h before
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700">
              <Shield className="h-4 w-4" /> {CANCELLATION.percentage}% refund ≥24h before
            </span>
          </div>
        </div>

        {/* Anchor navigation */}
        <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-neutral-200 bg-white/95 px-4 py-2 backdrop-blur">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Page sections">
            {ANCHORS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={cn(
                  'min-h-[44px] whitespace-nowrap rounded-full px-4 py-2 font-heading text-xs font-bold uppercase tracking-wider transition-colors',
                  activeAnchor === id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Variant catalogue */}
            <section id="package-options" className="scroll-mt-24">
              <h2 className="mb-1 font-heading text-lg font-bold text-neutral-900">Choose your package</h2>
              <p className="mb-3 text-sm text-neutral-500">
                Same river, different ways to get there. Prices per guest.
              </p>
              <div className="space-y-3">
                {venture.variants.map((item) => (
                  <VariantCatalogCard
                    key={item.id}
                    variant={item}
                    inclusions={venture.inclusions}
                    active={item.id === variant?.id && isSheetOpen}
                    onShowDates={() => openBooking(item.id)}
                  />
                ))}
              </div>
            </section>

            {/* What to expect */}
            <section id="what-to-expect" className="scroll-mt-24 rounded-2xl border border-neutral-200 p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-neutral-900">What to expect</h2>
              <p className="mb-5 text-sm leading-relaxed text-neutral-600">{venture.description}</p>

              {venture.itinerary.length > 0 && (
                <div className="mb-5">
                  <h3 className="mb-2 text-sm font-semibold text-neutral-900">Itinerary</h3>
                  <div className="space-y-2">
                    {venture.itinerary.map((item, index) => (
                      <div key={index} className="flex gap-3 text-sm">
                        <span className="w-16 shrink-0 font-medium text-neutral-500">{item.time}</span>
                        <span className="text-neutral-700">{item.activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {venture.highlights.length > 0 && (
                <div className="mb-5">
                  <h3 className="mb-2 text-sm font-semibold text-neutral-900">Highlights</h3>
                  <ul className="space-y-1.5">
                    {venture.highlights.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-green-700">What&apos;s included</h3>
                  <ul className="space-y-1.5">
                    {venture.inclusions.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-neutral-500">Not included</h3>
                  <ul className="space-y-1.5">
                    {venture.exclusions.map((item, index) => (
                      <li key={index} className="text-sm text-neutral-500">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {faqs.length > 0 && (
                <div className="mt-5 space-y-2">
                  <h3 className="text-sm font-semibold text-neutral-900">Things to know</h3>
                  {faqs.map((faq, index) => (
                    <div key={index} className="overflow-hidden rounded-lg border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="flex min-h-[44px] w-full items-center justify-between p-3.5 text-left text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                      >
                        {faq.question}
                        {expandedFaq === index ? (
                          <ChevronUp className="h-5 w-5 text-neutral-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-neutral-400" />
                        )}
                      </button>
                      {expandedFaq === index && (
                        <div className="px-3.5 pb-3.5 text-sm text-neutral-600">{faq.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reviews from the database */}
            <section id="reviews" className="scroll-mt-24 rounded-2xl border border-neutral-200 p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-neutral-900">Reviews</h2>
              <div className="mb-5 flex items-center gap-4 rounded-xl bg-neutral-50 p-4">
                <span className="font-heading text-4xl font-bold tabular-nums text-neutral-900">
                  {venture.rating.toFixed(1)}
                </span>
                <div className="flex-1 space-y-1">
                  {histogram.map(({ stars, percent }) => (
                    <div key={stars} className="flex items-center gap-2 text-xs text-neutral-500">
                      <span className="w-6">{stars}★</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
                        <div className="h-full bg-yellow-400" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No verified reviews yet — be the first to share your experience.
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">{review.author}</span>
                        <div className="ml-auto flex items-center gap-0.5">
                          {Array.from({ length: review.rating }).map((_, index) => (
                            <Star key={index} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Location */}
            <section id="location" className="scroll-mt-24 rounded-2xl border border-neutral-200 p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-neutral-900">Location</h2>
              <div className="flex h-32 items-center justify-center rounded-lg bg-neutral-100">
                <MapPin className="h-10 w-10 text-neutral-300" />
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-neutral-600">{venture.location || 'Bali'}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-neutral-900 underline"
                >
                  <MapPin className="h-4 w-4" /> Open in Google Maps
                </a>
                <p className="text-xs text-neutral-500">
                  Hotel pickup is available on the Shared and Private transfer packages.
                </p>
              </div>
            </section>
          </div>

          {/* Desktop summary rail */}
          <aside className="hidden lg:sticky lg:top-20 lg:col-span-1 lg:block">
            <div className="rounded-2xl border border-neutral-200 p-5">
              <span className="text-xs text-neutral-500">From</span>
              <p className="font-heading text-3xl font-bold tabular-nums text-neutral-900">
                {formatPrice(fromPrice)}
                <span className="text-sm font-normal text-neutral-500"> /guest</span>
              </p>
              <button
                type="button"
                onClick={() => openBooking(variant?.id ?? venture.variants[0]?.id ?? '')}
                className="mt-4 min-h-[44px] w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
              >
                Show dates
              </button>
              <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-xs text-neutral-500">
                <p className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Secure checkout powered by Midtrans
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> {PAYMENT_LOGOS.join(' / ')}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <span className="block text-xs text-neutral-500">From</span>
            <span className="font-heading text-lg font-bold tabular-nums text-neutral-900">
              {formatPrice(fromPrice)}
              <span className="text-xs font-normal text-neutral-500"> /guest</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => openBooking(variant?.id ?? venture.variants[0]?.id ?? '')}
            className="min-h-[44px] flex-1 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            Show dates
          </button>
        </div>
      </div>

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={variant?.title ?? 'Book your adventure'}
        className="sm:max-w-lg h-[92vh] sm:h-auto"
      >
        <ExperienceBookingWidget
          venture={venture}
          config={config}
          zones={zones}
          vehicleClasses={vehicleClasses}
          appliedCoupon={appliedCoupon}
          onCouponChange={setAppliedCoupon}
          onChange={patchConfig}
          onBook={handleBook}
          isBooking={isBooking}
        />
      </BottomSheet>
    </main>
  );
}
