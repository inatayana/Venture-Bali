'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, Tag, Users } from 'lucide-react';
import { Button, Stepper, Calendar as CalendarComponent, TimeSlotPill } from '@/components/ui';
import { formatPrice } from '@/lib/i18n';
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
  billingName: string;
  billingStreet: string;
  billingCity: string;
  billingProvince: string;
  billingPostalCode: string;
  billingCountry: string;
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

const QUICK_DATES = [
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
];

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

  const variant = useMemo(
    () => venture.variants?.find((item) => item.id === config.variantId) ?? venture.variants?.[0] ?? null,
    [venture.variants, config.variantId]
  );

  const fulfillmentMode = variant?.fulfillmentMode ?? 'SELF_DRIVE';
  const needsPickup = fulfillmentMode !== 'SELF_DRIVE';
  const needsVehicle = fulfillmentMode === 'PRIVATE_TRANSFER';

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

  const missing: string[] = [];
  if (!config.date) missing.push('Pick an adventure date');
  if (!config.slot) missing.push('Choose a departure time');
  if (needsPickup && !config.zoneId) missing.push('Select a pickup area');
  if (needsPickup && !config.isTba && !config.hotelAddress.trim()) {
    missing.push('Add your hotel/villa address or mark it TBA');
  }
  if (needsVehicle && !config.vehicleClassType) missing.push('Choose a vehicle class');
  if (!config.customerName.trim()) missing.push('Enter the lead guest name');
  if (!config.customerEmail.trim()) missing.push('Enter an email for the e-voucher');
  if (!config.customerWhatsApp.trim()) missing.push('Enter a WhatsApp number');
  else if (whatsappDigits.length < 6) missing.push('Enter a valid WhatsApp number');
  if (!config.billingStreet.trim()) missing.push('Add your billing street address');
  if (!config.billingCity.trim()) missing.push('Add your billing city');
  if (!config.billingPostalCode.trim()) missing.push('Add your billing postal code');
  if (!config.termsAccepted) missing.push('Accept the booking terms to continue');
  if (!config.waiverAccepted) missing.push('Accept the safety waiver to continue');
  const canContinue = missing.length === 0;

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

  return (
    <div className="space-y-6 pb-2" id="package-options">
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
              <label htmlFor="pickup-zone" className="mb-1.5 block text-xs font-medium text-neutral-500">
                Pickup area
              </label>
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
                  document.getElementById('pickup-step')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  document.getElementById('pickup-zone')?.focus();
                }}
                className="min-h-[44px] shrink-0 text-sm font-semibold text-neutral-900 underline"
              >
                Change
              </button>
            </div>
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

      {/* 7 · Contact details */}
      <section>
        <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-neutral-500">
          7 · Who is coming?
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
      </section>

      {/* 8 · Billing & consent */}
      <section>
        <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-neutral-500">
          8 · Billing &amp; consent
        </h3>
        <div className="space-y-2.5 rounded-xl border border-neutral-200 p-4">
          <input
            aria-label="Billing name"
            className="min-h-[44px] w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
            onChange={(event) => onChange({ billingName: event.target.value })}
            placeholder="Billing name (same as lead guest if empty)"
            value={config.billingName}
          />
          <input
            aria-label="Billing street address"
            className="min-h-[44px] w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
            onChange={(event) => onChange({ billingStreet: event.target.value })}
            placeholder="Street address"
            value={config.billingStreet}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label="Billing city"
              className="min-h-[44px] w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
              onChange={(event) => onChange({ billingCity: event.target.value })}
              placeholder="City"
              value={config.billingCity}
            />
            <input
              aria-label="Billing postal code"
              className="min-h-[44px] w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
              onChange={(event) => onChange({ billingPostalCode: event.target.value })}
              placeholder="Postal code"
              value={config.billingPostalCode}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              aria-label="Billing country"
              className="min-h-[44px] rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-900"
              onChange={(event) => onChange({ billingCountry: event.target.value })}
              value={config.billingCountry}
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {countryLabel(country)}
                </option>
              ))}
            </select>
            <input
              aria-label="Billing province"
              className="min-h-[44px] w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
              onChange={(event) => onChange({ billingProvince: event.target.value })}
              placeholder="Province (optional)"
              value={config.billingProvince}
            />
          </div>
        </div>

        <label className="mt-3 flex min-h-[44px] items-start gap-2 text-sm text-neutral-700">
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
        <label className="mt-1 flex min-h-[44px] items-start gap-2 text-sm text-neutral-700">
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
      </section>

      {/* Sticky summary + Next */}
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
            <span className="font-heading text-xl font-bold tabular-nums text-neutral-900">
              {formatPrice(quote.totalPriceIdr)}
            </span>
          </div>
        </div>

        <Button
          onClick={onBook}
          disabled={!canContinue || isBooking}
          fullWidth
          size="lg"
          className="!rounded-xl !bg-neutral-900 hover:!bg-neutral-800 disabled:!bg-neutral-300"
        >
          {isBooking ? 'Processing…' : 'Next'}
        </Button>

        {!canContinue && (
          <p className="mt-1.5 text-center text-xs text-neutral-500">{missing[0]}</p>
        )}
      </div>
    </div>
  );
}
