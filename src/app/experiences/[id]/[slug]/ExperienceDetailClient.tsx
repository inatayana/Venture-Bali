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
import { BottomSheet, Stepper, VentureCard } from '@/components/ui';
import {
  ExperienceBookingWidget,
  toDateKey,
  type AppliedCoupon,
  type BookingConfig,
} from '@/components/features/ExperienceBookingWidget';
import { VariantCatalogCard } from '@/components/features/VariantCatalogCard';
import { VariantDetailModal } from '@/components/features/VariantDetailModal';
import { CategoryQuickMenu } from '@/components/features/CategoryQuickMenu';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { CollapsibleText } from '@/components/features/CollapsibleText';
import { ReviewsSection } from '@/components/features/reviews/ReviewsSection';
import { itineraryStepDisplay } from '@/lib/itineraryDisplay';
import { clampText, HIGHLIGHT_MAX, HOOK_MAX } from '@/lib/contentLimits';
import { formatDuration, totalDurationMinutes, TRANSFER_NOTE } from '@/lib/itineraryDuration';
import { emphasiseLead } from '@/lib/emphasiseLead';
import { ProductLightbox } from '@/components/features/ProductLightbox';
import { PromoBanner } from '@/components/features/PromoBanner';
import { formatPrice } from '@/lib/i18n';
import { track } from '@/lib/analytics';
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
  /** Other adventures in the same category. */
  related?: VentureItem[];
}

const PAYMENT_LOGOS = ['VISA', 'Mastercard', 'GoPay', 'QRIS'];
const PROMO_CODE = 'TRYBALI2026';

/** Anchor targets in the sticky PDP sub-nav. */
const PDP_SECTIONS = [
  { id: 'packages', label: 'Packages' },
  { id: 'details', label: 'What to expect' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'coverage', label: 'Location' },
  { id: 'related', label: 'More' },
] as const;
// Mirrors the launch coupon in src/data/catalogue.ts (display label only).
const PROMO_DISCOUNT_PERCENT = 40;
const PROMO_STORAGE_KEY = 'baliwild_promo_dismissed';
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

export function ExperienceDetailClient({
  venture,
  zones,
  vehicleClasses,
  related = [],
}: ExperienceDetailClientProps) {
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

  // Analytics: one view_item per product page.
  useEffect(() => {
    track('view_item', {
      item_id: venture.id,
      item_name: venture.title,
      item_category: venture.category,
      price_idr: venture.priceIdr,
    });
  }, [venture]);

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
    track('select_package', {
      item_id: venture.id,
      item_name: venture.title,
      variant_id: item.id,
      variant_title: item.title,
      category: venture.category,
    });
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
        track('begin_checkout', {
          item_id: venture.id,
          item_name: venture.title,
          variant_id: selectedVariant.id,
          value: estimate.totalPriceIdr,
          currency: 'IDR',
          pax: config.adults,
        });
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
  const itineraryTotal = totalDurationMinutes(venture.itinerary);

  const mapsUrl = venture.meetingPoint
    ? `https://www.google.com/maps/search/?api=1&query=${venture.meetingPoint.latitude},${venture.meetingPoint.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${venture.location || venture.title} Bali`
      )}`;

  const selectedPrice = estimate.unitPricePerPaxIdr;
  const serviceType = selectedVariant?.fulfillmentMode === 'SELF_DRIVE' ? 'Meeting point' : 'Hotel pickup available';

  return (
    <main className="min-h-screen bg-surface pb-28 lg:pb-10">
      {/* Sticky product bar: back link + breadcrumb stay reachable while scrolling */}
      <div className="sticky top-0 z-40 bg-surface/95 shadow-[0_2px_10px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
          <a
            href="/"
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-foreground transition-colors hover:bg-inset"
            aria-label="Back to all adventures"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">All adventures</span>
          </a>

          <nav
            aria-label="Breadcrumb"
            className="min-w-0 flex-1 border-l border-line pl-3"
          >
            <ol className="flex min-w-0 items-center gap-1.5 text-xs">
              <li className="hidden shrink-0 sm:block">
                <a href="/" className="text-foreground-muted transition-colors hover:text-foreground">
                  Home
                </a>
              </li>
              <li aria-hidden="true" className="hidden shrink-0 text-foreground-muted/50 sm:block">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li className="shrink-0">
                <CategoryQuickMenu currentCategory={venture.category} />
              </li>
              <li aria-hidden="true" className="shrink-0 text-foreground-muted/50">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li className="min-w-0">
                <span
                  className="block truncate font-medium text-foreground"
                  aria-current="page"
                >
                  {venture.title}
                </span>
              </li>
            </ol>
          </nav>

          <div className="flex shrink-0 items-center gap-1 pl-2">
            <button
              type="button"
              onClick={() => setWishlisted((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line transition-colors hover:bg-base"
              aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-pressed={wishlisted}
            >
              <Heart
                className={cn('h-5 w-5', wishlisted ? 'fill-red-500 text-danger' : 'text-foreground-secondary')}
              />
            </button>
            <button
              type="button"
              onClick={share}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line transition-colors hover:bg-base"
              aria-label="Share this adventure"
            >
              <Share2 className="h-5 w-5 text-foreground-secondary" />
            </button>
            {shareState === 'copied' && (
              <span className="hidden text-xs font-medium text-success sm:inline">Copied</span>
            )}
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
            <div className="rounded-2xl border border-line p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-foreground-muted">
                {selectedVariant ? 'Selected package' : 'Starting price'}
              </p>
              <p className="mt-0.5 font-heading text-base font-bold text-foreground">
                {selectedVariant?.title ?? venture.title}
              </p>

              <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-xs font-medium text-foreground-muted">From</span>
                {estimate.promoActive && (
                  <span className="text-sm tabular-nums text-foreground-secondary line-through">
                    {formatPrice(estimate.listPricePerPaxIdr)}
                  </span>
                )}
                <span className="font-heading text-3xl font-bold tabular-nums text-foreground">
                  {formatPrice(selectedPrice)}
                </span>
                <span className="text-sm text-foreground-muted">/ guest</span>
              </div>

              {selectedVariant?.minimumSpendIdr ? (
                <p className="mt-1 text-xs font-medium text-foreground-secondary">
                  Minimum {formatPrice(selectedVariant.minimumSpendIdr)} to book
                </p>
              ) : (
                <p className="mt-1 text-xs text-foreground-muted">No minimum spend</p>
              )}

              <div className="mt-3 rounded-xl bg-base px-3 py-2">
                <Stepper
                  label="Guests"
                  value={config.adults}
                  min={Math.max(1, venture.minParticipants)}
                  max={Math.min(10, venture.maxParticipants)}
                  onChange={(value) => patchConfig({ adults: value })}
                />
              </div>

              <div className="mt-3 space-y-1 text-sm text-foreground-secondary">
                <div className="flex justify-between">
                  <span>
                    {config.adults} × {formatPrice(estimate.unitPricePerPaxIdr)}
                  </span>
                  <span className="tabular-nums">{formatPrice(estimate.subtotalIdr)}</span>
                </div>
                {estimate.discountIdr > 0 && (
                  <div className="flex justify-between text-success">
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

              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-sm font-medium text-foreground">Estimated total</span>
                <span className="font-heading text-xl font-bold tabular-nums text-foreground">
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
              <p className="mt-2 text-center text-xs text-foreground-muted">
                Pickup and add-ons are added in the next step.
              </p>

              <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-xs text-foreground-muted">
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
                  className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-line/80 bg-surface/95 p-1 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.25)] backdrop-blur scrollbar-hide"
                >
                  {PDP_SECTIONS.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        aria-current={isActive ? 'true' : undefined}
                        className={cn(
                          'inline-flex min-h-[44px] shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                          isActive
                            ? 'bg-brand-ink text-brand'
                            : 'text-foreground-secondary hover:bg-brand/25 hover:text-foreground'
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
            <div className="!mt-0 hidden sm:grid sm:h-[440px] sm:grid-cols-[2fr_1fr] sm:grid-rows-3 sm:gap-2">
              {orderedGallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl bg-inset',
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
            <div className="relative !mt-0 sm:hidden">
              <div
                ref={gallerySliderRef}
                onScroll={handleGalleryScroll}
                role="group"
                aria-roledescription="carousel"
                aria-label={`${venture.title} photos`}
                className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-inset [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

              <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-neutral-950/55 px-2.5 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur">
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
                <span className="inline-flex items-center gap-1 rounded-full bg-inset px-3 py-1 font-medium text-foreground-secondary">
                  <MapPin className="h-3.5 w-3.5" /> {venture.location || 'Bali'}
                </span>
                <span className="text-xs text-foreground-muted">{serviceType}</span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-heading text-2xl font-bold leading-tight text-foreground md:text-3xl">
                    {venture.title}
                  </h1>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-foreground-secondary">
                    {clampText(venture.hook3Sec, HOOK_MAX)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground-secondary">
                {reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-brand text-brand" />
                    <strong className="text-foreground">{venture.rating.toFixed(1)}</strong>
                    <span>
                      · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-inset px-2.5 py-1 text-xs font-medium text-foreground-secondary">
                    <Star className="h-3.5 w-3.5 text-foreground-secondary" />
                    New · no reviews yet
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {selectedVariant?.duration ?? venture.duration}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" /> Up to {venture.maxParticipants} guests
                </span>
                {venture.bookedThisMonth ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand/30 px-2 py-0.5 text-xs font-medium text-foreground">
                    <Users className="h-3.5 w-3.5" /> {venture.bookedThisMonth} booked this month
                  </span>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <span className="inline-flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
                  <CheckCircle className="h-4 w-4" /> Instant confirmation
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-base px-3 py-2 text-xs font-medium text-foreground-secondary">
                  <Wallet className="h-4 w-4" /> Reschedule free ≥24h
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-base px-3 py-2 text-xs font-medium text-foreground-secondary">
                  <Shield className="h-4 w-4" /> {CANCELLATION.percentage}% refund ≥24h
                </span>
              </div>
            </div>

            <section id="packages">
              <h2 className="mb-1 font-heading text-lg font-bold text-foreground">Choose your package</h2>
              <p className="mb-3 text-sm text-foreground-muted">
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
                <h2 className="mb-2 font-heading text-lg font-bold text-foreground">
                  Add-ons for this package
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedVariant?.addons?.map((addon) => (
                    <div key={addon.id} className="rounded-xl border border-line p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{addon.name}</p>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                          {formatPrice(addon.price)}
                        </span>
                      </div>
                      {addon.description && (
                        <p className="mt-0.5 text-xs text-foreground-muted">{addon.description}</p>
                      )}
                      {addon.requiresTransfer && (
                        <p className="mt-1 text-xs font-medium text-foreground-muted">
                          Available with transfer packages
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-foreground-muted">
                  Select add-ons in the booking sheet after choosing a date.
                </p>
              </section>
            )}

            {venture.highlights.length > 0 && (
              <section className="rounded-2xl border border-line p-5">
                <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Highlights</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {venture.highlights.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-start gap-2 rounded-xl bg-base px-3 py-2 text-sm text-foreground-secondary"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{clampText(item, HIGHLIGHT_MAX)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section id="safety" className="rounded-2xl border border-line p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">
                Safety & requirements
              </h2>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-base px-3 py-2">
                  <p className="text-xs uppercase tracking-wider text-foreground-muted">Minimum age</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {venture.minAge ? `${venture.minAge}+ years` : 'All ages'}
                  </p>
                </div>
                <div className="rounded-xl bg-base px-3 py-2">
                  <p className="text-xs uppercase tracking-wider text-foreground-muted">Maximum weight</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {venture.maxWeightKg ? `${venture.maxWeightKg} kg` : '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-base px-3 py-2">
                  <p className="text-xs uppercase tracking-wider text-foreground-muted">Duration</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {selectedVariant?.duration ?? venture.duration}
                  </p>
                </div>
              </div>

              {venture.safetyBriefing && (
                <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
                  <Shield className="mr-1 inline h-4 w-4" />
                  {venture.safetyBriefing}
                </p>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {venture.essentialInfo.whatToBring.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-foreground">
                      What to bring
                    </h3>
                    <ul className="space-y-1.5 text-sm text-foreground-secondary">
                      {venture.essentialInfo.whatToBring.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span aria-hidden="true" className="text-foreground-secondary">•</span>
                          <span>{emphasiseLead(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {venture.essentialInfo.knowBeforeYouGo.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-foreground">
                      Know before you go
                    </h3>
                    <ul className="space-y-1.5 text-sm text-foreground-secondary">
                      {venture.essentialInfo.knowBeforeYouGo.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span aria-hidden="true" className="text-foreground-secondary">•</span>
                          <span>{emphasiseLead(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {faqs.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Frequently asked</h3>
                  {faqs.map((faq, index) => (
                    <div key={index} className="overflow-hidden rounded-lg border border-line">
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="flex min-h-[44px] w-full items-center justify-between p-3.5 text-left text-sm font-medium text-foreground hover:bg-base"
                      >
                        {faq.question}
                        {expandedFaq === index ? (
                          <ChevronUp className="h-5 w-5 text-foreground-secondary" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-foreground-secondary" />
                        )}
                      </button>
                      {expandedFaq === index && (
                        <div className="px-3.5 pb-3.5 text-sm text-foreground-secondary">{faq.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section id="details" className="scroll-mt-28 rounded-2xl border border-line p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">What to expect</h2>
              <CollapsibleText
                text={venture.longDescription ?? venture.description}
                limit={225}
                id="venture-description"
                className="mb-4 text-sm leading-relaxed text-foreground-secondary"
              />

              {venture.itinerary.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Itinerary</h3>                  <ol className="relative ml-3 space-y-4 border-l-[3px] border-line pl-6">
                    {venture.itinerary.map((item, index) => {
                      const step = itineraryStepDisplay(item.activity);
                      return (
                        <li key={`${item.time}-${index}`} className="relative">
                          <span
                            className="absolute -left-[39px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold tabular-nums text-brand-ink ring-4 ring-white"
                            aria-hidden="true"
                          >
                            {index + 1}
                          </span>
                          {(item.durationMinutes || item.duration) && (
                            <p className="text-xs font-semibold text-foreground-muted">
                              <span className="uppercase tracking-wide">Duration:</span>{' '}
                              <span className="tabular-nums">
                                {item.duration ??
                                  formatDuration(item.durationMinutes ?? 0)}
                              </span>
                            </p>
                          )}
                          <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
                            {step.title}
                          </p>
                          {step.description && (
                            <p className="mt-0.5 text-xs leading-relaxed text-foreground-secondary">
                              {step.description}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                  {itineraryTotal !== null && (
                    <div className="mt-4 rounded-xl bg-base px-3.5 py-3">
                      <p className="text-xs font-semibold text-foreground">
                        Total estimated duration:{' '}
                        <span className="tabular-nums">{formatDuration(itineraryTotal)}</span>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
                        {TRANSFER_NOTE}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Provider card — deliberately contains no partner name or photo (AGENTS.md §9). */}
            <section className="flex items-center gap-3 rounded-2xl border border-line p-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 font-heading text-sm font-bold text-white">
                VB
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  Licensed local adventure team
                  <BadgeCheck className="h-4 w-4 text-success" />
                </p>
                <p className="text-xs text-foreground-muted">
                  Verified operator · English-speaking guides · Bali, Indonesia
                </p>
              </div>
            </section>

            <section id="reviews" className="rounded-2xl border border-line p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Reviews</h2>
              <ReviewsSection
                reviews={reviews}
                average={venture.rating}
                count={reviewCount}
                ventureId={venture.id}
              />
            </section>

            <section id="coverage" className="rounded-2xl border border-line p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">
                Coverage & meeting point
              </h2>
              <div className="flex h-32 items-center justify-center rounded-xl bg-inset">
                <MapPin className="h-10 w-10 text-foreground-muted/50" />
              </div>

              <div className="mt-3 rounded-xl border border-line p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                  Meeting point
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {venture.meetingPoint?.name ?? venture.location}
                </p>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  For self-drive packages · transfers are picked up at your hotel
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-foreground underline"
                >
                  <MapPin className="h-4 w-4" /> Open in Google Maps
                </a>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-foreground">Hotel pickup zones</h3>
              <ul className="mt-2 space-y-1.5">
                {zones.map((zone) => (
                  <li key={zone.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground-secondary">{zone.name}</span>
                    <span className="shrink-0 text-xs font-medium text-foreground-muted">
                      {zone.isCustomQuote
                        ? 'Custom quote'
                        : zone.surchargeIdr > 0
                          ? `from +${formatPrice(zone.surchargeIdr)}`
                          : 'Included'}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-foreground-muted">
                Pickup is available on Shared and Private transfer packages. Choose your area in the
                booking sheet.
              </p>
            </section>

            <section className="rounded-2xl border border-line p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">
                Terms & cancellation
              </h2>
              <ul className="space-y-1.5 text-sm text-foreground-secondary">
                <li>• {CANCELLATION.percentage}% refund when cancelling at least 24 hours before the activity.</li>
                <li>• Cancellation inside 24 hours is not possible.</li>
                <li>• Reschedule is free at least 24 hours before.</li>
                <li>• No-show without confirmation: no refund.</li>
                <li>• The activity safety waiver must be accepted at checkout.</li>
              </ul>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium">
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center underline">
                  Booking terms
                </a>
                <a href="/waiver" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center underline">
                  Safety waiver
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section id="related" className="mx-auto max-w-7xl px-4 pb-10 pt-2">
          <h2 className="font-heading text-lg font-bold text-foreground">
            More adventures to explore
          </h2>
          <div
            className="mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
            aria-label="More adventures to explore"
          >
            {related.map((item) => (
              <VentureCard
                key={item.id}
                venture={item}
                href={`/experiences/${item.id}/${item.slug}`}
                className="w-[78%] shrink-0 snap-start sm:w-auto"
              />
            ))}
          </div>
        </section>
      )}

      <SiteFooter />

      {/* Mobile sticky CTA — the only price/CTA source on phones. */}
      <div
        className="fixed inset-x-0 z-40 border-t border-line bg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden"
        style={{ bottom: 'var(--cookie-consent-height, 0px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <span className="block truncate text-xs text-foreground-muted">
              {selectedVariant?.title ?? 'From'}
            </span>
            <span className="font-heading text-lg font-bold tabular-nums text-foreground">
              {formatPrice(selectedPrice)}
              <span className="text-xs font-normal text-foreground-muted"> /guest</span>
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
