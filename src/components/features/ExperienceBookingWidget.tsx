'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock, Lock, MapPin, Shield, Tag, Users } from 'lucide-react';
import { Button, Stepper, Calendar as CalendarComponent, TimeSlotPill } from '@/components/ui';
import { PriceApprox } from '@/components/currency/PriceApprox';
import { track } from '@/lib/analytics';
import { formatPrice } from '@/lib/i18n';
import { getBookingProgress } from '@/lib/bookingProgress';
import { PickupAddonsStep } from '@/components/features/PickupAddonsStep';
import { normalizeAddons } from '@/lib/addons';
import { COUNTRIES, countryLabel, findCountry } from '@/lib/countries';
import {
  computeQuote,
  isDateAvailable,
  isSlotBookable,
  parseSlotHour,
  NIGHT_SURCHARGE_FROM_HOUR,
} from '@/lib/pricing';
import type {
  Addon,
  PickupZone,
  SlotTime,
  VehicleClass,
  VehicleClassType,
  VentureItem,
} from '@/types/venture';
import { cn } from '@/utils/cn';

export interface BookingConfig {
  variantId: string;
  date: Date | null;
  slot: SlotTime | null;
  adults: number;
  vehicleClassType: VehicleClassType | null;
  zoneId: string | null;
  hotelAddress: string;
  isTba: boolean;
  couponCode: string;
  addonIds: string[];
  customerName: string;
  customerEmail: string;
  customerWhatsApp: string;
  countryCode: string;
  termsAccepted: boolean;
  waiverAccepted: boolean;
}

export interface AppliedCoupon {
  code: string;
  label: string;
  discountPercent: number;
}

interface ExperienceBookingWidgetProps {
  venture: VentureItem;
  config: BookingConfig;
  zones: PickupZone[];
  vehicleClasses: VehicleClass[];
  appliedCoupon: AppliedCoupon | null;
  onCouponChange: (coupon: AppliedCoupon | null) => void;
  onChange: (patch: Partial<BookingConfig>) => void;
  onBook: () => void;
  isBooking: boolean;
}

const MAX_GUESTS = 10;

export type CheckoutStep = 'plan' | 'details';

const QUICK_DATES = [
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
];

/** "Sat, 8 Nov 2026" — checkout recap only, never used for API payloads. */
export function formatTripDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Local-date key (never toISOString — that shifts the day across timezones). */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ExperienceBookingWidget({
  venture,
  config,
  zones,
  vehicleClasses,
  appliedCoupon,
  onCouponChange,
  onChange,
  onBook,
  isBooking,
}: ExperienceBookingWidgetProps) {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('plan');

  const variant = useMemo(
    () => venture.variants?.find((item) => item.id === config.variantId) ?? venture.variants?.[0] ?? null,
    [venture.variants, config.variantId]
  );

  const fulfillmentMode = variant?.fulfillmentMode ?? 'SELF_DRIVE';
  const needsPickup = fulfillmentMode !== 'SELF_DRIVE';
  const needsVehicle = fulfillmentMode === 'PRIVATE_TRANSFER';

  // Zone-locked packages (e.g. "South Bali: Shared Pickup") preselect their zone.
  // The customer can still switch area, but the package intent stays visible.
  const lockedZone = variant?.pickupZone ?? null;
  const [zoneOverride, setZoneOverride] = useState(false);

  useEffect(() => {
    setZoneOverride(false);
  }, [variant?.id]);

  // A new package starts a new plan; never land on step 2 with stale choices.
  useEffect(() => {
    setStep('plan');
  }, [variant?.id]);

  useEffect(() => {
    track('checkout_step_view', { step, ventureId: venture.id });
  }, [step, venture.id]);

  const zoneLocked = Boolean(lockedZone) && !zoneOverride;

  const priceTiers = useMemo(() => {
    if (variant?.priceTiers?.length) return variant.priceTiers;
    return [{ minPax: 1, maxPax: venture.maxParticipants, pricePerPax: venture.priceIdr }];
  }, [variant, venture.priceIdr, venture.maxParticipants]);

  const zone = useMemo(
    () => (needsPickup ? zones.find((item) => item.id === config.zoneId) ?? null : null),
    [needsPickup, zones, config.zoneId]
  );
  const vehicleClass = useMemo(
    () => (needsVehicle ? vehicleClasses.find((item) => item.name === config.vehicleClassType) ?? null : null),
    [needsVehicle, vehicleClasses, config.vehicleClassType]
  );

  const selectedAddons: Addon[] = useMemo(
    () =>
      normalizeAddons(variant?.addons).filter(
        (addon) => config.addonIds.includes(addon.id) && !(addon.requiresTransfer && !needsPickup)
      ),
    [variant, config.addonIds, needsPickup]
  );

  const dateKey = config.date ? toDateKey(config.date) : null;
  const promoActive = Boolean(
    variant?.promoPriceIdr && variant.promoPriceIdr > 0 && variant.promoPriceIdr < Math.min(...priceTiers.map((tier) => tier.pricePerPax))
  );

  const quote = useMemo(
    () =>
      computeQuote({
        priceTiers,
        paxCount: config.adults,
        fulfillmentMode,
        promoPriceIdr: variant?.promoPriceIdr ?? null,
        coupon: appliedCoupon
          ? { ...appliedCoupon, isActive: true, minPax: 1, usedCount: 0 }
          : null,
        minimumSpendIdr: variant?.minimumSpendIdr ?? null,
        slotTimeLabel: config.slot?.time ?? null,
        zone,
        vehicleClass,
        selectedAddons,
      }),
    [priceTiers, config.adults, fulfillmentMode, variant, appliedCoupon, config.slot, zone, vehicleClass, selectedAddons]
  );

  const dateBlocked = dateKey && variant ? !isDateAvailable(variant, dateKey) : false;

  const slotOptions = useMemo(() => {
    if (!variant || !dateKey || dateBlocked) return [];
    return (variant.slotTimes ?? []).map((slot) => {
      const available = slot.maxCapacity - slot.currentBookings;
      const enoughCapacity = slot.isAvailable && available >= config.adults;
      const withinCutoff = isSlotBookable(dateKey, slot.time, fulfillmentMode);
      return { slot, available, enabled: enoughCapacity && withinCutoff };
    });
  }, [variant, dateKey, dateBlocked, config.adults, fulfillmentMode]);

  // Keep the selected slot valid when the guest count or date changes.
  useEffect(() => {
    if (!config.slot || !dateKey) return;
    const stillValid = slotOptions.some(
      (option) => option.slot.id === config.slot?.id && option.enabled
    );
    if (!stillValid) onChange({ slot: null });
  }, [config.slot, dateKey, slotOptions, onChange]);

  const maxGuests = Math.min(MAX_GUESTS, venture.maxParticipants);
  const guestCountTouched = config.adults > venture.minParticipants;
  const dialCode = findCountry(config.countryCode).dial;
  const whatsappDigits = config.customerWhatsApp.replace(/\D/g, '');

  const planMissing: string[] = [];
  if (!config.date) planMissing.push('Pick an adventure date');
  if (!config.slot) planMissing.push('Choose a departure time');
  if (needsPickup && !config.zoneId) planMissing.push('Select a pickup area');
  if (needsPickup && zone?.isCustomQuote) {
    planMissing.push('Outer areas need a custom quote — choose another pickup area');
  }
  if (needsPickup && !config.isTba && !config.hotelAddress.trim()) {
    planMissing.push('Add your hotel/villa address or mark it TBA');
  }
  if (needsVehicle && !config.vehicleClassType) planMissing.push('Choose a vehicle class');

  const detailsMissing: string[] = [];
  if (!config.customerName.trim()) detailsMissing.push('Enter the lead guest name');
  if (!config.customerEmail.trim()) detailsMissing.push('Enter an email for the e-voucher');
  if (!config.customerWhatsApp.trim()) detailsMissing.push('Enter a WhatsApp number');
  else if (whatsappDigits.length < 6) detailsMissing.push('Enter a valid WhatsApp number');
  if (!config.termsAccepted) detailsMissing.push('Accept the booking terms to continue');
  if (!config.waiverAccepted) detailsMissing.push('Accept the safety waiver to continue');

  const planReady = planMissing.length === 0;
  const detailsReady = detailsMissing.length === 0;
  const missing = step === 'plan' ? planMissing : detailsMissing;

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code || couponLoading) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, paxCount: config.adults, promoActive }),
      });
      const payload = await response.json();
      if (payload.success && payload.data) {
        onCouponChange(payload.data);
        onChange({ couponCode: payload.data.code });
        setCouponInput('');
      } else {
        onCouponChange(null);
        onChange({ couponCode: '' });
        setCouponError(payload.error?.message ?? 'This coupon cannot be used');
      }
    } catch {
      onCouponChange(null);
      setCouponError('Could not validate the coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    onCouponChange(null);
    setCouponError(null);
    onChange({ couponCode: '' });
  };

  const toggleAddon = (addonId: string) => {
    onChange({
      addonIds: config.addonIds.includes(addonId)
        ? config.addonIds.filter((id) => id !== addonId)
        : [...config.addonIds, addonId],
    });
  };

  const progress = getBookingProgress(
    { ...config, customQuote: Boolean(zone?.isCustomQuote) },
    needsPickup,
    needsVehicle
  );
  const stepIndex = step === 'plan' ? 0 : 1;

  return (
    <div className="space-y-6 pb-2" id="package-options">
      {/* Two-step checkout: plan the trip, then guest details & payment. */}
      <div className="flex items-center gap-1.5" aria-label="Booking progress">
        {progress.steps.map((progressStep, index) => {
          const isCurrent = index === stepIndex;
          return (
            <div key={progressStep.key} className="flex-1">
              <span
                className={cn(
                  'block h-1.5 rounded-full transition-colors',
                  isCurrent
                    ? 'bg-brand'
                    : progressStep.done
                      ? 'bg-brand-ink'
                      : 'bg-neutral-200'
                )}
              />
              <span
                className={cn(
                  'mt-1 block text-[10px] font-semibold uppercase tracking-wide',
                  isCurrent || progressStep.done ? 'text-neutral-900' : 'text-neutral-400'
                )}
              >
                {progressStep.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-bold text-neutral-900">
          {step === 'plan' ? 'Plan your trip' : 'Guest details & pay'}
        </h2>
        <span className="shrink-0 text-xs font-medium text-neutral-500">
          Step {stepIndex + 1} of 2
        </span>
      </div>

      {step === 'plan' ? (
        <>

      {/* 1 · Guest counter */}
      <section>
        <h3 className="mb-3 flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider text-neutral-500">
          <Users className="h-4 w-4" /> 1 · Guests
        </h3>
        <div className="rounded-xl border border-neutral-200 p-4">
          <Stepper
            label="Participants"
            value={config.adults}
            min={Math.max(1, venture.minParticipants)}
            max={maxGuests}
            onChange={(value) => onChange({ adults: value })}
          />
          <p className="mt-2 text-xs text-neutral-500">
            {guestCountTouched ? `${config.adults} guests` : `Price is shown per guest · up to ${maxGuests} guests`}
          </p>
        </div>
      </section>

      {/* 2 · Mini calendar */}
      <section>
        <h3 className="mb-3 flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider text-neutral-500">
          <CalendarDays className="h-4 w-4" /> 2 · Date
        </h3>
        <div className="mb-3 flex gap-2">
          {QUICK_DATES.map((quick) => {
            const date = new Date();
            date.setDate(date.getDate() + quick.offset);
            const active = config.date?.toDateString() === date.toDateString();
            return (
              <button
                key={quick.label}
                type="button"
                onClick={() => onChange({ date, slot: null })}
                className={cn(
                  'min-h-[44px] rounded-lg border-2 px-4 text-sm font-medium transition-colors',
                  active
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                )}
              >
                {quick.label}
              </button>
            );
          })}
        </div>
        <div className="rounded-xl border border-neutral-200 p-3">
          <CalendarComponent
            selectedDate={config.date}
            onDateSelect={(date) => onChange({ date, slot: null })}
            blackoutDates={variant?.blackoutDates ?? []}
            minDate={new Date()}
          />
        </div>
        {dateBlocked && (
          <p className="mt-2 text-sm text-red-600">This date is not available. Please pick another day.</p>
        )}
      </section>

      {/* 3 · Departure slots */}
      <section>
        <h3 className="mb-3 flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider text-neutral-500">
          <Clock className="h-4 w-4" /> 3 · Departure time
        </h3>
        {!config.date && (
          <p className="text-sm text-neutral-400">Pick a date to see available times</p>
        )}
        {config.date && slotOptions.length === 0 && (
          <p className="text-sm text-neutral-500">No departures left for this date. Try another day.</p>
        )}
        {slotOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {slotOptions.map(({ slot, available, enabled }) => (
              <TimeSlotPill
                key={slot.id}
                label={slot.time}
                spotsLeft={available}
                selected={config.slot?.id === slot.id}
                disabled={!enabled}
                onSelect={() => onChange({ slot })}
              />
            ))}
          </div>
        )}
        {parseSlotHour(config.slot?.time) !== null &&
          (parseSlotHour(config.slot?.time) as number) >= NIGHT_SURCHARGE_FROM_HOUR && (
            <p className="mt-2 text-xs text-neutral-500">
              Evening departure · +{formatPrice(50_000)} per guest applies
            </p>
          )}
      </section>

      {/* 4 · Pickup details (conditional) */}
      {needsPickup && (
        <section id="pickup-step" className="scroll-mt-24">
          <h3 className="mb-3 flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider text-neutral-500">
            <MapPin className="h-4 w-4" /> 4 · Pickup
          </h3>
          <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                Pickup area
              </span>

              {zoneLocked && lockedZone ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {lockedZone.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {lockedZone.isCustomQuote
                        ? 'Custom quote — confirmed by WhatsApp'
                        : lockedZone.surchargeIdr > 0
                          ? `+${formatPrice(lockedZone.surchargeIdr)}${fulfillmentMode === 'SHARED_TRANSFER' ? '/guest' : '/vehicle'}`
                          : 'Included in this package'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setZoneOverride(true)}
                    className="min-h-[44px] shrink-0 text-sm font-semibold text-neutral-900 underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <select
                  id="pickup-zone"
                  value={config.zoneId ?? ''}
                  onChange={(event) => onChange({ zoneId: event.target.value })}
                  className="min-h-[44px] w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
                >
                  <option value="" disabled>
                    Select your area…
                  </option>
                  {zones.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.isCustomQuote
                        ? ' (custom quote)'
                        : item.surchargeIdr > 0
                          ? ` (+${formatPrice(item.surchargeIdr)}${fulfillmentMode === 'SHARED_TRANSFER' ? '/guest' : '/vehicle'})`
                          : ' (included)'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="hotel-address" className="mb-1.5 block text-xs font-medium text-neutral-500">
                Hotel or villa address
              </label>
              <input
                id="hotel-address"
                type="text"
                value={config.hotelAddress}
                disabled={config.isTba}
                onChange={(event) => onChange({ hotelAddress: event.target.value })}
                placeholder={config.isTba ? 'To be confirmed by H-1' : 'e.g. Villa Melati, Jl. Raya Seminyak'}
                className="min-h-[44px] w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400"
              />
              <label className="mt-2 flex min-h-[44px] items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={config.isTba}
                  onChange={(event) => onChange({ isTba: event.target.checked })}
                  className="h-5 w-5 rounded border-neutral-300"
                />
                Address TBA — I&apos;ll confirm by H-1
              </label>
            </div>

            {needsVehicle && (
              <div>
                <span className="mb-2 block text-xs font-medium text-neutral-500">Vehicle class</span>
                <div className="space-y-2">
                  {vehicleClasses.map((item) => {
                    const active = config.vehicleClassType === item.name;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange({ vehicleClassType: item.name })}
                        className={cn(
                          'flex min-h-[44px] w-full items-center justify-between rounded-lg border-2 px-3 py-2 text-left transition-colors',
                          active ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
                        )}
                      >
                        <span>
                          <span className="block text-sm font-semibold text-neutral-900">{item.label}</span>
                          <span className="text-xs text-neutral-500">
                            {item.description ?? `Up to ${item.vehicleMaxPax} guests`}
                          </span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-neutral-900">
                          {item.deltaIdr > 0 ? `+${formatPrice(item.deltaIdr)}` : 'Included'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {(config.zoneId || config.hotelAddress.trim() || config.isTba) && (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2">
              <span className="min-w-0 truncate text-sm text-neutral-700">
                <strong className="font-semibold">Pickup</strong> ·{' '}
                {zone?.name ?? 'area not selected'} ·{' '}
                {config.isTba ? 'address TBA by H-1' : config.hotelAddress || 'add an address'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (zoneLocked) {
                    setZoneOverride(true);
                    return;
                  }
                  document.getElementById('pickup-step')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  document.getElementById('pickup-zone')?.focus();
                }}
                className="min-h-[44px] shrink-0 text-sm font-semibold text-neutral-900 underline"
              >
                Change
              </button>
            </div>
          )}

          {zone?.isCustomQuote && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Outer areas are quoted manually, so online payment is unavailable for this pickup
              area. Choose another area to book instantly.
            </p>
          )}
        </section>
      )}

      {/* Self-drive: show the exact base-camp meeting point */}
      {!needsPickup && (
        <section>
          <h3 className="mb-3 flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider text-neutral-500">
            <MapPin className="h-4 w-4" /> 4 · Meeting point
          </h3>
          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="text-sm font-semibold text-neutral-900">
              {venture.meetingPoint?.name ?? venture.location}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Make your own way here · arrive 15 minutes before departure
            </p>
            {venture.meetingPoint && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${venture.meetingPoint.latitude},${venture.meetingPoint.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-neutral-900 underline"
              >
                <MapPin className="h-4 w-4" /> Open in Google Maps
              </a>
            )}
          </div>
        </section>
      )}

      {/* 5 · Coupon */}
      <section>
        <h3 className="mb-3 flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider text-neutral-500">
          <Tag className="h-4 w-4" /> Promo code
        </h3>
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
            <span className="text-sm text-green-800">
              <strong>{appliedCoupon.code}</strong> applied · −{appliedCoupon.discountPercent}%
            </span>
            <button
              type="button"
              onClick={removeCoupon}
              className="min-h-[44px] px-2 text-sm font-medium text-green-800 underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
              placeholder="Enter code"
              className="min-h-[44px] flex-1 rounded-lg border border-neutral-300 px-3 text-sm uppercase outline-none focus:border-neutral-900"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={couponLoading || couponInput.trim().length < 3}
              className="min-h-[44px] rounded-lg border-2 border-neutral-900 px-4 text-sm font-semibold text-neutral-900 disabled:border-neutral-200 disabled:text-neutral-400"
            >
              {couponLoading ? '…' : 'Apply'}
            </button>
          </div>
        )}
        {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
      </section>

      {/* 6 · Add-ons */}
      <PickupAddonsStep
        addons={variant?.addons}
        variantId={variant?.id ?? ''}
        fulfillmentMode={fulfillmentMode}
        selectedAddonIds={config.addonIds}
        onToggle={toggleAddon}
      />
        </>
      ) : (
        <>
          {/* Step 2 · recap of the plan, editable without losing guest details */}
          <section
            aria-label="Your trip"
            className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Your trip
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {config.date ? formatTripDate(config.date) : 'Date not set'}
                  {config.slot ? ` · ${config.slot.time}` : ''}
                </p>
                <p className="text-sm text-neutral-700">
                  {config.adults} {config.adults === 1 ? 'guest' : 'guests'}
                  {selectedAddons.length > 0
                    ? ` · ${selectedAddons.map((addon) => addon.name).join(', ')}`
                    : ''}
                </p>
                <p className="text-sm text-neutral-700">
                  {needsPickup
                    ? `Pickup · ${zone?.name ?? 'area not selected'}${
                        config.isTba
                          ? ' · address TBA by H-1'
                          : config.hotelAddress
                            ? ` · ${config.hotelAddress}`
                            : ''
                      }`
                    : `Meeting point · ${venture.meetingPoint?.name ?? venture.location}`}
                </p>
                {appliedCoupon && (
                  <p className="text-xs font-medium text-green-700">
                    Coupon {appliedCoupon.code} · −{appliedCoupon.discountPercent}%
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep('plan')}
                className="min-h-[44px] shrink-0 text-sm font-semibold text-neutral-900 underline underline-offset-4"
              >
                Edit
              </button>
            </div>
          </section>

          {/* Lead traveller + legal acceptance */}
          <section>
            <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-neutral-500">
              Lead traveller
            </h3>
        <div className="space-y-2.5 rounded-xl border border-neutral-200 p-4">
          <input
            aria-label="Full name"
            className="min-h-[44px] w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
            onChange={(event) => onChange({ customerName: event.target.value })}
            placeholder="Full name"
            type="text"
            value={config.customerName}
          />
          <input
            aria-label="Email address"
            className="min-h-[44px] w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
            onChange={(event) => onChange({ customerEmail: event.target.value })}
            placeholder="Email for the e-voucher"
            type="email"
            value={config.customerEmail}
          />
          <div>
            <label htmlFor="guest-country" className="mb-1.5 block text-xs font-medium text-neutral-500">
              Country
            </label>
            <select
              id="guest-country"
              value={config.countryCode}
              onChange={(event) => onChange({ countryCode: event.target.value })}
              className="min-h-[44px] w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-900"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {countryLabel(country)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="guest-whatsapp" className="mb-1.5 block text-xs font-medium text-neutral-500">
              WhatsApp number
            </label>
            <div className="flex">
              <span className="flex min-h-[44px] items-center rounded-l-lg border border-r-0 border-neutral-300 bg-neutral-50 px-3 text-sm font-medium text-neutral-700">
                +{dialCode}
              </span>
              <input
                id="guest-whatsapp"
                aria-label="WhatsApp number"
                className="min-h-[44px] w-full rounded-r-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
                inputMode="tel"
                onChange={(event) => onChange({ customerWhatsApp: event.target.value })}
                placeholder="812 3456 7890"
                type="tel"
                value={config.customerWhatsApp}
              />
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              Used for pickup coordination and your e-voucher.
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Before you pay
          </p>
          <label className="flex min-h-[44px] items-start gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={config.termsAccepted}
              onChange={(event) => onChange({ termsAccepted: event.target.checked })}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300"
            />
            <span>
              I accept the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium underline">
                booking terms
              </a>
              , including the cancellation and no-show policy.
            </span>
          </label>
          <label className="flex min-h-[44px] items-start gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={config.waiverAccepted}
              onChange={(event) => onChange({ waiverAccepted: event.target.checked })}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300"
            />
            <span>
              I accept the{' '}
              <a href="/waiver" target="_blank" rel="noopener noreferrer" className="font-medium underline">
                activity safety waiver
              </a>{' '}
              and confirm the participant is medically fit.
            </span>
          </label>
        </div>
      </section>
        </>
      )}

      {/* Sticky summary + step action */}
      <div className="sticky bottom-0 -mx-4 -mb-4 border-t border-neutral-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <div className="mb-2 space-y-1 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>
              {config.adults} × {formatPrice(quote.unitPricePerPaxIdr)}
              {quote.promoActive && (
                <span className="ml-2 text-xs line-through">{formatPrice(quote.listPricePerPaxIdr)}</span>
              )}
            </span>
            <span className="tabular-nums">{formatPrice(quote.subtotalIdr)}</span>
          </div>
          {quote.discountIdr > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discount {appliedCoupon ? `(${appliedCoupon.code})` : '(promo price)'}</span>
              <span className="tabular-nums">−{formatPrice(quote.discountIdr)}</span>
            </div>
          )}
          {quote.minimumTopUpIdr > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>Minimum spend top-up</span>
              <span className="tabular-nums">{formatPrice(quote.minimumTopUpIdr)}</span>
            </div>
          )}
          {quote.nightSurchargeIdr > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>Evening surcharge</span>
              <span className="tabular-nums">{formatPrice(quote.nightSurchargeIdr)}</span>
            </div>
          )}
          {quote.transfer.totalFeeIdr > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>
                {fulfillmentMode === 'SHARED_TRANSFER'
                  ? 'Shared shuttle · per guest'
                  : `Private transfer · per group (${quote.transfer.vehicleCount} vehicle${quote.transfer.vehicleCount > 1 ? 's' : ''})`}
              </span>
              <span className="tabular-nums">{formatPrice(quote.transfer.totalFeeIdr)}</span>
            </div>
          )}
          {quote.addonsTotalIdr > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>Add-ons</span>
              <span className="tabular-nums">{formatPrice(quote.addonsTotalIdr)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-neutral-100 pt-1.5">
            <span className="text-sm font-medium text-neutral-900">Total</span>
            <span className="text-right">
              <span className="block font-heading text-xl font-bold tabular-nums text-neutral-900">
                {formatPrice(quote.totalPriceIdr)}
              </span>
              <PriceApprox amountIdr={quote.totalPriceIdr} className="text-[11px]" />
            </span>
          </div>
        </div>

        {step === 'plan' && (
          <Button
            onClick={() => {
              track('checkout_step_complete', { step: 'plan', ventureId: venture.id });
              setStep('details');
            }}
            disabled={!planReady}
            fullWidth
            size="lg"
            className="!rounded-xl !bg-brand-ink !text-brand hover:!bg-neutral-900 disabled:!bg-neutral-300 disabled:!text-neutral-500"
          >
            Continue
          </Button>
        )}

        {step === 'details' && (
          <div className="flex gap-2">
            <Button
              onClick={() => setStep('plan')}
              variant="outline"
              size="lg"
              className="!rounded-xl !px-4"
              aria-label="Back to plan your trip"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            <Button
              onClick={onBook}
              disabled={!planReady || !detailsReady || isBooking}
              fullWidth
              size="lg"
              className="!rounded-xl !bg-brand-ink !text-brand hover:!bg-neutral-900 disabled:!bg-neutral-300 disabled:!text-neutral-500"
            >
              {isBooking ? 'Processing…' : 'Continue to payment'}
            </Button>
          </div>
        )}

        {!((step === 'plan' && planReady) || (step === 'details' && detailsReady)) && (
          <p className="mt-1.5 text-center text-xs text-neutral-500">{missing[0]}</p>
        )}

        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <Shield className="h-3 w-3" aria-hidden="true" /> 80% refund ≥24h
          </span>
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3" aria-hidden="true" /> Secure checkout
          </span>
        </p>
      </div>
    </div>
  );
}
