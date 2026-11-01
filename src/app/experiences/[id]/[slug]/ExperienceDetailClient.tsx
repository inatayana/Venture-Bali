'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Star,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  CheckCircle,
  Shield,
  Share2,
  Heart,
  Wallet,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  BadgeCheck,
} from 'lucide-react';
import { BottomSheet, Stepper } from '@/components/ui';
import {
  ExperienceBookingWidget,
  toDateKey,
  type AppliedCoupon,
  type BookingConfig,
} from '@/components/features/ExperienceBookingWidget';
import { VariantCatalogCard } from '@/components/features/VariantCatalogCard';
import { VariantDetailModal } from '@/components/features/VariantDetailModal';
import { CategoryQuickMenu } from '@/components/features/CategoryQuickMenu';
import { ProductLightbox } from '@/components/features/ProductLightbox';
import { PromoBanner } from '@/components/features/PromoBanner';
import { formatPrice } from '@/lib/i18n';
import { REFUND_WINDOWS } from '@/lib/refundUtils';
import { computeQuote } from '@/lib/pricing';
import { findCountry } from '@/lib/countries';
import { toInternationalPhone } from '@/lib/phone';
import type { PickupZone, Variant, VehicleClass, VentureItem } from '@/types/venture';
import { cn } from '@/utils/cn';

interface ExperienceDetailClientProps {
  venture: VentureItem;
  zones: PickupZone[];
  vehicleClasses: VehicleClass[];
}

const PAYMENT_LOGOS = ['VISA', 'Mastercard', 'GoPay', 'QRIS'];
const PROMO_CODE = 'TRYBALI2026';

/** Anchor targets in the sticky PDP sub-nav. */
const PDP_SECTIONS = [
  { id: 'packages', label: 'Packages' },
  { id: 'details', label: 'What to expect' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'coverage', label: 'Location' },
] as const;
// Mirrors the launch coupon in src/data/catalogue.ts (display label only).
const PROMO_DISCOUNT_PERCENT = 40;
const PROMO_STORAGE_KEY = 'vb_promo_dismissed';
const CANCELLATION = REFUND_WINDOWS[0];

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
    termsAccepted: false,
    waiverAccepted: false,
  };
}

export function ExperienceDetailClient({ venture, zones, vehicleClasses }: ExperienceDetailClientProps) {
  const gallery = useMemo(
    () => (venture.gallery.length > 0 ? venture.gallery : [venture.imageUrl]),
    [venture.gallery, venture.imageUrl]
  );
  const [activeImage, setActiveImage] = useState(gallery[0] ?? venture.imageUrl);
  const [config, setConfig] = useState<BookingConfig>(() => buildInitialConfig(venture));
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [detailVariantId, setDetailVariantId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mobileSlideIndex, setMobileSlideIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<string>('packages');
  const [navVisible, setNavVisible] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [promoVisible, setPromoVisible] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

  const selectedVariant = useMemo(
    () => venture.variants?.find((item) => item.id === config.variantId) ?? venture.variants?.[0] ?? null,
    [venture.variants, config.variantId]
  );

  const detailVariant = useMemo(
    () => venture.variants?.find((item) => item.id === detailVariantId) ?? null,
    [venture.variants, detailVariantId]
  );

  // The active image always sits in the large slot; the rest fill the three
  // small tiles (a variant image may not be part of the venture gallery).
  const orderedGallery = useMemo(() => {
    const pool = [activeImage, ...gallery.filter((image) => image !== activeImage)];
    return pool.slice(0, 4);
  }, [activeImage, gallery]);

  const gallerySliderRef = useRef<HTMLDivElement>(null);

  const handleGalleryScroll = useCallback(() => {
    const slider = gallerySliderRef.current;
    if (!slider || slider.clientWidth === 0) return;
    const next = Math.round(slider.scrollLeft / slider.clientWidth);
    const last = Math.max(0, orderedGallery.length - 1);
    setMobileSlideIndex(Math.min(last, Math.max(0, next)));
  }, [orderedGallery.length]);

  // Selecting another package swaps the lead photo: go back to the first slide.
  useEffect(() => {
    gallerySliderRef.current?.scrollTo({ left: 0 });
    setMobileSlideIndex(0);
  }, [activeImage]);

  // Scroll-spy for the sticky PDP sub-nav.
  useEffect(() => {
    const sections = PDP_SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (element): element is HTMLElement => element !== null
    );
    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: [0, 1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // The floating section nav only appears once the packages section reaches the
  // sticky header, and fades out again when the guest scrolls back up.
  useEffect(() => {
    const packages = document.getElementById('packages');
    if (!packages) return;

    const sync = () => {
      setNavVisible(packages.getBoundingClientRect().top <= 120);
    };

    sync();
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  const estimate = useMemo(() => {
    const tiers = selectedVariant?.priceTiers?.length
      ? selectedVariant.priceTiers
      : [{ minPax: 1, maxPax: venture.maxParticipants, pricePerPax: venture.priceIdr }];

    return computeQuote({
      priceTiers: tiers,
      paxCount: config.adults,
      fulfillmentMode: selectedVariant?.fulfillmentMode ?? 'SELF_DRIVE',
      promoPriceIdr: selectedVariant?.promoPriceIdr ?? null,
      minimumSpendIdr: selectedVariant?.minimumSpendIdr ?? null,
    });
  }, [selectedVariant, config.adults, venture.maxParticipants, venture.priceIdr]);

  const patchConfig = useCallback(
    (patch: Partial<BookingConfig>) => setConfig((prev) => ({ ...prev, ...patch })),
    []
  );

  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  useEffect(() => {
    try {
      setPromoVisible(window.localStorage.getItem(PROMO_STORAGE_KEY) !== '1');
    } catch {
      /* storage unavailable */
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

  const selectVariant = (item: Variant) => {
    if (item.imageUrl) setActiveImage(item.imageUrl);
    setConfig((prev) => ({ ...prev, variantId: item.id }));
  };

  /** Tier 1 card click: select the package and open its detail modal (Tier 2). */
  const openVariantDetails = (item: Variant) => {
    selectVariant(item);
    setDetailVariantId(item.id);
  };

  const openBooking = (variantId: string) => {
    const selected = venture.variants.find((item) => item.id === variantId);
    if (selected?.imageUrl) setActiveImage(selected.imageUrl);

    setConfig((prev) => ({
      ...prev,
      variantId,
      slot: null,
      zoneId: selected?.pickupZoneId ?? null,
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
    if (!config.date || !config.slot || !selectedVariant) return;
    setIsBooking(true);
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureId: venture.id,
          variantId: selectedVariant.id,
          bookingDate: toDateKey(config.date),
          slotTimeId: config.slot.id,
          fulfillmentMode: selectedVariant.fulfillmentMode,
          pickupZoneId: selectedVariant.fulfillmentMode === 'SELF_DRIVE' ? undefined : config.zoneId,
          vehicleClassType:
            selectedVariant.fulfillmentMode === 'PRIVATE_TRANSFER' ? config.vehicleClassType : undefined,
          hotelAddress: config.hotelAddress || undefined,
          isTba: config.isTba,
          couponCode: appliedCoupon?.code ?? undefined,
          paxCount: config.adults,
          selectedAddons: config.addonIds,
          customerName: config.customerName,
          customerEmail: config.customerEmail,
          customerWhatsApp: toInternationalPhone(findCountry(config.countryCode).dial, config.customerWhatsApp),
          countryCode: config.countryCode,
          termsAccepted: config.termsAccepted,
          waiverAccepted: config.waiverAccepted,
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

  const histogram = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((stars) => {
        const count = reviews.filter((review) => review.rating === stars).length;
        const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
        return { stars, count, percent };
      }),
    [reviews]
  );

  const mapsUrl = venture.meetingPoint
    ? `https://www.google.com/maps/search/?api=1&query=${venture.meetingPoint.latitude},${venture.meetingPoint.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${venture.location || venture.title} Bali`
      )}`;

  const selectedPrice = estimate.unitPricePerPaxIdr;
  const serviceType = selectedVariant?.fulfillmentMode === 'SELF_DRIVE' ? 'Meeting point' : 'Hotel pickup available';

  return (
    <main className="min-h-screen bg-white pb-28 lg:pb-10">
      {/* Sticky product bar: back link + breadcrumb stay reachable while scrolling */}
      <div className="sticky top-0 z-40 bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
          <a
            href="/"
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
            aria-label="Back to all adventures"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">All adventures</span>
          </a>

          <nav
            aria-label="Breadcrumb"
            className="min-w-0 flex-1 border-l border-neutral-200 pl-3"
          >
            <ol className="flex min-w-0 items-center gap-1.5 text-xs">
              <li className="hidden shrink-0 sm:block">
                <a href="/" className="text-neutral-500 transition-colors hover:text-neutral-900">
                  Home
                </a>
              </li>
              <li aria-hidden="true" className="hidden shrink-0 text-neutral-300 sm:block">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li className="shrink-0">
                <CategoryQuickMenu currentCategory={venture.category} />
              </li>
              <li aria-hidden="true" className="shrink-0 text-neutral-300">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li className="min-w-0">
                <span
                  className="block truncate font-medium text-neutral-800"
                  aria-current="page"
                >
                  {venture.title}
                </span>
              </li>
            </ol>
          </nav>

          <div className="hidden shrink-0 items-baseline gap-1 pl-3 lg:flex">
            <span className="font-heading text-base font-bold tabular-nums text-neutral-900">
              {formatPrice(selectedPrice)}
            </span>
            <span className="text-xs text-neutral-500">/guest</span>
          </div>
        </div>
      </div>

      {/* Sticky section nav — floats in the right content column */}
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-4">
        {promoVisible && (
          <div className="mb-4">
            <PromoBanner code={PROMO_CODE} label={`Launch offer — ${PROMO_DISCOUNT_PERCENT}% off with code`} onDismiss={dismissPromo} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(340px,380px)_1fr] lg:items-start">
          {/* LEFT — sticky booking card (desktop only) */}
          <aside className="hidden lg:sticky lg:top-[76px] lg:block">
            <div className="rounded-2xl border border-neutral-200 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                {selectedVariant ? 'Selected package' : 'Starting price'}
              </p>
              <p className="mt-0.5 font-heading text-base font-bold text-neutral-900">
                {selectedVariant?.title ?? venture.title}
              </p>

              <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-xs font-medium text-neutral-500">From</span>
                {estimate.promoActive && (
                  <span className="text-sm tabular-nums text-neutral-400 line-through">
                    {formatPrice(estimate.listPricePerPaxIdr)}
                  </span>
                )}
                <span className="font-heading text-3xl font-bold tabular-nums text-neutral-900">
                  {formatPrice(selectedPrice)}
                </span>
                <span className="text-sm text-neutral-500">/ guest</span>
              </div>

              {selectedVariant?.minimumSpendIdr ? (
                <p className="mt-1 text-xs font-medium text-neutral-600">
                  Minimum {formatPrice(selectedVariant.minimumSpendIdr)} to book
                </p>
              ) : (
                <p className="mt-1 text-xs text-neutral-500">No minimum spend</p>
              )}

              <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2">
                <Stepper
                  label="Guests"
                  value={config.adults}
                  min={Math.max(1, venture.minParticipants)}
                  max={Math.min(10, venture.maxParticipants)}
                  onChange={(value) => patchConfig({ adults: value })}
                />
              </div>

              <div className="mt-3 space-y-1 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>
                    {config.adults} × {formatPrice(estimate.unitPricePerPaxIdr)}
                  </span>
                  <span className="tabular-nums">{formatPrice(estimate.subtotalIdr)}</span>
                </div>
                {estimate.discountIdr > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Promo savings</span>
                    <span className="tabular-nums">−{formatPrice(estimate.discountIdr)}</span>
                  </div>
                )}
                {estimate.minimumTopUpIdr > 0 && (
                  <div className="flex justify-between">
                    <span>Minimum spend top-up</span>
                    <span className="tabular-nums">{formatPrice(estimate.minimumTopUpIdr)}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3">
                <span className="text-sm font-medium text-neutral-900">Estimated total</span>
                <span className="font-heading text-xl font-bold tabular-nums text-neutral-900">
                  {formatPrice(estimate.totalPriceIdr)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => selectedVariant && openBooking(selectedVariant.id)}
                className="mt-3 min-h-[48px] w-full rounded-xl bg-brand-ink text-sm font-semibold text-brand transition-colors hover:bg-neutral-900"
              >
                Show dates
              </button>
              <p className="mt-2 text-center text-xs text-neutral-500">
                Pickup and add-ons are added in the next step.
              </p>

              <div className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                <p className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> {CANCELLATION.description} · reschedule free ≥24h
                </p>
                <p className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Secure checkout · {PAYMENT_LOGOS.join(' / ')}
                </p>
              </div>
            </div>
          </aside>

          {/* RIGHT — hero, header and all scrollable content */}
          <div className="space-y-6">
            {/* Floating section nav: revealed at #packages, centred on the content column */}
            <div
              className={cn(
                'sticky top-[64px] z-30 h-0 transition-all duration-300 ease-out',
                navVisible
                  ? 'visible translate-y-0 opacity-100'
                  : 'invisible -translate-y-2 opacity-0'
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -top-3 h-16 bg-gradient-to-b from-white via-white/90 to-transparent"
              />
              <div className="relative flex justify-center pt-1">
                <nav
                  aria-label="Page sections"
                  className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-neutral-200/80 bg-white/95 p-1 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.25)] backdrop-blur scrollbar-hide"
                >
                  {PDP_SECTIONS.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        aria-current={isActive ? 'true' : undefined}
                        className={cn(
                          'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                          isActive
                            ? 'bg-brand-ink text-brand'
                            : 'text-neutral-600 hover:bg-brand/25 hover:text-neutral-900'
                        )}
                      >
                        {section.label}
                      </a>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Desktop: asymmetric gallery — one large photo plus three tiles */}
            <div className="hidden sm:grid sm:h-[440px] sm:grid-cols-[2fr_1fr] sm:grid-rows-3 sm:gap-2">
              {orderedGallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl bg-neutral-100',
                    index === 0 && 'row-span-3'
                  )}
                  aria-label={index === 0 ? 'Main product photo' : `View photo ${index + 1}`}
                >
                  <Image
                    src={image}
                    alt={index === 0 ? venture.title : ''}
                    fill
                    sizes={index === 0 ? '(max-width: 1024px) 100vw, 760px' : '380px'}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority={index === 0}
                  />
                  <span className="pointer-events-none absolute inset-0 bg-brand-ink/0 transition-colors duration-300 group-hover:bg-brand-ink/5" />
                </button>
              ))}
            </div>

            {/* Mobile: swipeable gallery slider (no thumbnail row) */}
            <div className="relative sm:hidden">
              <div
                ref={gallerySliderRef}
                onScroll={handleGalleryScroll}
                role="group"
                aria-roledescription="carousel"
                aria-label={`${venture.title} photos`}
                className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-neutral-100 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {orderedGallery.map((image, index) => (
                  <button
                    key={`mobile-${image}-${index}`}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="relative aspect-[4/3] w-full shrink-0 snap-center overflow-hidden"
                    aria-label={`Open photo ${index + 1} of ${orderedGallery.length}`}
                  >
                    <Image
                      src={image}
                      alt={index === 0 ? venture.title : `${venture.title} — photo ${index + 1}`}
                      fill
                      sizes="100vw"
                      className="object-cover"
                      priority={index === 0}
                    />
                  </button>
                ))}
              </div>

              <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-neutral-950/55 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur">
                {Math.min(mobileSlideIndex + 1, orderedGallery.length)} / {orderedGallery.length}
              </span>

              {orderedGallery.length > 1 && (
                <div className="mt-2.5 flex items-center justify-center gap-1.5" aria-hidden="true">
                  {orderedGallery.map((image, index) => (
                    <span
                      key={`dot-${image}-${index}`}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        index === mobileSlideIndex ? 'w-5 bg-neutral-900' : 'w-1.5 bg-neutral-300'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-ink">
                  {venture.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-700">
                  <MapPin className="h-3.5 w-3.5" /> {venture.location || 'Bali'}
                </span>
                <span className="text-xs text-neutral-500">{serviceType}</span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-heading text-2xl font-bold leading-tight text-neutral-900 md:text-3xl">
                    {venture.title}
                  </h1>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    {venture.shortDescription ?? venture.description}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setWishlisted((prev) => !prev)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 transition-colors hover:bg-neutral-50"
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                    aria-pressed={wishlisted}
                  >
                    <Heart
                      className={cn('h-5 w-5', wishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-600')}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={share}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 transition-colors hover:bg-neutral-50"
                    aria-label="Share this adventure"
                  >
                    <Share2 className="h-5 w-5 text-neutral-600" />
                  </button>
                </div>
              </div>
              {shareState === 'copied' && (
                <p className="text-xs font-medium text-green-700">Link copied to clipboard.</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600">
                {reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <strong className="text-neutral-900">{venture.rating.toFixed(1)}</strong>
                    <span>
                      · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                    <Star className="h-3.5 w-3.5 text-neutral-400" />
                    New · no reviews yet
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {selectedVariant?.duration ?? venture.duration}
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
                  <Wallet className="h-4 w-4" /> Reschedule free ≥24h
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700">
                  <Shield className="h-4 w-4" /> {CANCELLATION.percentage}% refund ≥24h
                </span>
              </div>
            </div>

            <section id="packages">
              <h2 className="mb-1 font-heading text-lg font-bold text-neutral-900">Choose your package</h2>
              <p className="mb-3 text-sm text-neutral-500">
                Same adventure, different ways to get there. Prices per guest.
              </p>
              <div className="space-y-3">
                {venture.variants.map((item) => (
                  <VariantCatalogCard
                    key={item.id}
                    variant={item}
                    selected={item.id === selectedVariant?.id}
                    onSelect={() => selectVariant(item)}
                    onShowDates={() => openBooking(item.id)}
                    onOpenDetails={() => openVariantDetails(item)}
                    fallbackImageUrl={venture.imageUrl}
                  />
                ))}
              </div>
            </section>

            {(selectedVariant?.addons?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-2 font-heading text-lg font-bold text-neutral-900">
                  Add-ons for this package
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedVariant?.addons?.map((addon) => (
                    <div key={addon.id} className="rounded-xl border border-neutral-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-neutral-900">{addon.name}</p>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-900">
                          {formatPrice(addon.price)}
                        </span>
                      </div>
                      {addon.description && (
                        <p className="mt-0.5 text-xs text-neutral-500">{addon.description}</p>
                      )}
                      {addon.requiresTransfer && (
                        <p className="mt-1 text-[11px] font-medium text-neutral-500">
                          Available with transfer packages
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Select add-ons in the booking sheet after choosing a date.
                </p>
              </section>
            )}

            <section id="safety" className="rounded-2xl border border-neutral-200 p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-neutral-900">
                Safety & requirements
              </h2>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-neutral-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">Minimum age</p>
                  <p className="mt-0.5 text-sm font-semibold text-neutral-900">
                    {venture.minAge ? `${venture.minAge}+ years` : 'All ages'}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">Maximum weight</p>
                  <p className="mt-0.5 text-sm font-semibold text-neutral-900">
                    {venture.maxWeightKg ? `${venture.maxWeightKg} kg` : '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">Duration</p>
                  <p className="mt-0.5 text-sm font-semibold text-neutral-900">
                    {selectedVariant?.duration ?? venture.duration}
                  </p>
                </div>
              </div>

              {venture.safetyBriefing && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <Shield className="mr-1 inline h-4 w-4" />
                  {venture.safetyBriefing}
                </p>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {venture.essentialInfo.whatToBring.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      What to bring
                    </h3>
                    <ul className="space-y-1 text-sm text-neutral-700">
                      {venture.essentialInfo.whatToBring.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {venture.essentialInfo.knowBeforeYouGo.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Know before you go
                    </h3>
                    <ul className="space-y-1 text-sm text-neutral-700">
                      {venture.essentialInfo.knowBeforeYouGo.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {faqs.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-semibold text-neutral-900">Frequently asked</h3>
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

            <section id="details" className="scroll-mt-28 rounded-2xl border border-neutral-200 p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-neutral-900">What to expect</h2>
              <p className="mb-4 text-sm leading-relaxed text-neutral-600">{venture.description}</p>

              {venture.itinerary.length > 0 && (
                <div className="mb-4">
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
                <ul className="space-y-1.5">
                  {venture.highlights.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Provider card — deliberately contains no partner name or photo (AGENTS.md §9). */}
            <section className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 font-heading text-sm font-bold text-white">
                VB
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-bold text-neutral-900">
                  Licensed local adventure team
                  <BadgeCheck className="h-4 w-4 text-green-600" />
                </p>
                <p className="text-xs text-neutral-500">
                  Verified operator · English-speaking guides · Bali, Indonesia
                </p>
              </div>
            </section>

            <section id="reviews" className="rounded-2xl border border-neutral-200 p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-neutral-900">Reviews</h2>

              {reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-6 text-center">
                  <Star className="mx-auto h-6 w-6 text-neutral-300" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium text-neutral-700">No verified reviews yet</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Guests can review after their trip — yours would be the first.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-5 flex items-center gap-4 rounded-xl bg-neutral-50 p-4">
                    <span className="font-heading text-4xl font-bold tabular-nums text-neutral-900">
                      {venture.rating.toFixed(1)}
                    </span>
                    <div className="flex-1 space-y-1">
                      {histogram.map(({ stars, percent }) => (
                        <div
                          key={stars}
                          className="flex items-center gap-2 text-xs text-neutral-500"
                        >
                          <span className="w-6">{stars}★</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
                            <div
                              className="h-full bg-yellow-400"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900">
                            {review.author}
                          </span>
                          <div className="ml-auto flex items-center gap-0.5">
                            {Array.from({ length: review.rating }).map((_, index) => (
                              <Star
                                key={index}
                                className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section id="coverage" className="rounded-2xl border border-neutral-200 p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-neutral-900">
                Coverage & meeting point
              </h2>
              <div className="flex h-32 items-center justify-center rounded-xl bg-neutral-100">
                <MapPin className="h-10 w-10 text-neutral-300" />
              </div>

              <div className="mt-3 rounded-xl border border-neutral-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Meeting point
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-900">
                  {venture.meetingPoint?.name ?? venture.location}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  For self-drive packages · transfers are picked up at your hotel
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-neutral-900 underline"
                >
                  <MapPin className="h-4 w-4" /> Open in Google Maps
                </a>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-neutral-900">Hotel pickup zones</h3>
              <ul className="mt-2 space-y-1.5">
                {zones.map((zone) => (
                  <li key={zone.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-neutral-700">{zone.name}</span>
                    <span className="shrink-0 text-xs font-medium text-neutral-500">
                      {zone.isCustomQuote
                        ? 'Custom quote'
                        : zone.surchargeIdr > 0
                          ? `from +${formatPrice(zone.surchargeIdr)}`
                          : 'Included'}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-neutral-500">
                Pickup is available on Shared and Private transfer packages. Choose your area in the
                booking sheet.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-neutral-900">
                Terms & cancellation
              </h2>
              <ul className="space-y-1.5 text-sm text-neutral-700">
                <li>• {CANCELLATION.percentage}% refund when cancelling at least 24 hours before the activity.</li>
                <li>• Cancellation inside 24 hours is not possible.</li>
                <li>• Reschedule is free at least 24 hours before.</li>
                <li>• No-show without confirmation: no refund.</li>
                <li>• The activity safety waiver must be accepted at checkout.</li>
              </ul>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium">
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">
                  Booking terms
                </a>
                <a href="/waiver" target="_blank" rel="noopener noreferrer" className="underline">
                  Safety waiver
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <span className="block truncate text-xs text-neutral-500">
              {selectedVariant?.title ?? 'From'}
            </span>
            <span className="font-heading text-lg font-bold tabular-nums text-neutral-900">
              {formatPrice(selectedPrice)}
              <span className="text-xs font-normal text-neutral-500"> /guest</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => selectedVariant && openBooking(selectedVariant.id)}
            className="min-h-[44px] shrink-0 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-brand"
          >
            Show dates
          </button>
        </div>
      </div>

      <VariantDetailModal
        variant={detailVariant}
        isSelected={detailVariant !== null && detailVariant.id === selectedVariant?.id}
        promo={{ code: PROMO_CODE, percent: PROMO_DISCOUNT_PERCENT }}
        onClose={() => setDetailVariantId(null)}
        onShowDates={() => {
          if (!detailVariant) return;
          setDetailVariantId(null);
          openBooking(detailVariant.id);
        }}
        fallbackImageUrl={venture.imageUrl}
      />

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={closeSheet}
        title={selectedVariant?.title ?? 'Book your adventure'}
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

      <ProductLightbox
        images={orderedGallery}
        index={lightboxIndex}
        title={venture.title}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </main>
  );
}
