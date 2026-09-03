'use client';

import { useMemo, useState, useEffect } from 'react';
import { Calendar, Clock, Car, Plus, Check } from 'lucide-react';
import { Button, Stepper, Calendar as CalendarComponent, TimeSlotCard } from '@/components/ui';
import { formatPrice } from '@/lib/i18n';
import { convertFromIDR } from '@/lib/fx';
import {
  calculateTotalPrice,
  filterAddonsForMode,
  isDateAvailable,
  getAvailableSlots,
} from '@/lib/pricing';
import { mockVehicleClasses, mockPickupZones } from '@/data/mockVentures';
import type { VentureItem, VehicleClassType, FulfillmentMode, SlotTime } from '@/types/venture';
import { cn } from '@/utils/cn';

export interface BookingConfig {
  variantId: string;
  date: Date | null;
  slot: SlotTime | null;
  adults: number;
  transfer: 'NONE' | VehicleClassType;
  zoneId: string | null;
  addonIds: string[];
}

interface PackageOptionsWidgetProps {
  venture: VentureItem;
  config: BookingConfig;
  onChange: (patch: Partial<BookingConfig>) => void;
  onBook: () => void;
  isBooking: boolean;
}

const QUICK_DATES = [
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
];

export function PackageOptionsWidget({
  venture,
  config,
  onChange,
  onBook,
  isBooking,
}: PackageOptionsWidgetProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [usdEstimate, setUsdEstimate] = useState<string | null>(null);

  const variant = useMemo(
    () => venture.variants?.find((v) => v.id === config.variantId) ?? venture.variants?.[0] ?? null,
    [venture.variants, config.variantId]
  );

  const priceTiers = useMemo(() => {
    if (variant?.priceTiers?.length) return variant.priceTiers;
    return [{ minPax: 1, maxPax: venture.maxParticipants, pricePerPax: venture.priceIdr }];
  }, [variant, venture.priceIdr, venture.maxParticipants]);

  const fulfillmentMode: FulfillmentMode = config.transfer === 'NONE' ? 'SELF_DRIVE' : 'PRIVATE_TRANSFER';
  const vehicleClass = config.transfer === 'NONE' ? null : mockVehicleClasses.find((c) => c.name === config.transfer) ?? null;
  const zone = fulfillmentMode === 'PRIVATE_TRANSFER' ? mockPickupZones.find((z) => z.id === config.zoneId) ?? null : null;

  const selectedAddons = useMemo(
    () =>
      (variant?.addons ?? []).filter(
        (a) => config.addonIds.includes(a.id) && !(a.requiresTransfer && fulfillmentMode !== 'PRIVATE_TRANSFER')
      ),
    [variant, config.addonIds, fulfillmentMode]
  );

  const total = useMemo(
    () =>
      calculateTotalPrice(priceTiers, config.adults, fulfillmentMode, {
        zone,
        vehicleClass,
        selectedAddons,
      }),
    [priceTiers, config.adults, fulfillmentMode, zone, vehicleClass, selectedAddons]
  );

  // FX estimate (display only)
  useEffect(() => {
    let cancelled = false;
    convertFromIDR(total.totalPriceIdr, 'USD')
      .then((usd) => {
        if (!cancelled) setUsdEstimate(`≈ US$${usd.toLocaleString('en-US')}`);
      })
      .catch(() => setUsdEstimate(null));
    return () => {
      cancelled = true;
    };
  }, [total.totalPriceIdr]);

  const addonsWithState = useMemo(
    () => filterAddonsForMode(variant?.addons ?? [], fulfillmentMode),
    [variant, fulfillmentMode]
  );

  const dateStr = config.date ? config.date.toISOString().split('T')[0] : null;
  const dateBlocked = dateStr && variant ? !isDateAvailable(variant, dateStr) : false;
  const slots = useMemo(
    () => (variant && !dateBlocked ? getAvailableSlots(variant, config.adults) : []),
    [variant, dateBlocked, config.adults]
  );

  const isCustomQuote = fulfillmentMode === 'PRIVATE_TRANSFER' && zone?.isCustomQuote === true;

  const handleTransferChange = (value: 'NONE' | VehicleClassType) => {
    if (value === 'NONE') {
      // Dependent matrix: reset zone + transfer-required combos
      onChange({ transfer: 'NONE', zoneId: null, addonIds: config.addonIds.filter((id) => {
        const addon = variant?.addons?.find((a) => a.id === id);
        return addon ? !addon.requiresTransfer : false;
      }) });
    } else {
      onChange({ transfer: value, zoneId: config.zoneId ?? 'zone-1' });
    }
  };

  const handleToggleAddon = (addonId: string, requiresTransfer: boolean, disabled: boolean) => {
    if (disabled) return;
    if (config.addonIds.includes(addonId)) {
      onChange({ addonIds: config.addonIds.filter((id) => id !== addonId) });
    } else {
      onChange({ addonIds: [...config.addonIds, addonId] });
    }
  };

  const requestQuoteUrl = `https://wa.me/?text=${encodeURIComponent(
    `Request Quote: ${venture.title} (${variant?.title ?? ''}) — ${config.adults} pax, ${vehicleClass?.label ?? ''}, ${zone?.name ?? ''}`
  )}`;

  return (
    <div className="space-y-5" id="package-options">
      {/* Step A — Package Type */}
      <div>
        <h3 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">1 · Package Type</h3>
        <div className="space-y-2">
          {(venture.variants ?? []).map((v) => {
            const active = v.id === variant?.id;
            const tier = v.priceTiers[v.priceTiers.length - 1];
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onChange({ variantId: v.id, slot: null })}
                className={cn(
                  'w-full text-left p-4 rounded-xl border-2 transition-all min-h-[44px]',
                  active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{v.title}</span>
                      {v.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-yellow-900 rounded">
                          {v.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{v.shortDescription}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-xs text-gray-500">from</span>
                    <span className="font-heading font-bold tabular-nums text-blue-600">{formatPrice(tier.pricePerPax)}</span>
                    <span className="block text-xs text-gray-400">/pax</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step B — Date & Time */}
      <div>
        <h3 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">2 · Date & Time</h3>
        <div className="flex gap-2 mb-3">
          {QUICK_DATES.map((q) => {
            const d = new Date();
            d.setDate(d.getDate() + q.offset);
            const active = config.date?.toDateString() === d.toDateString();
            return (
              <button
                key={q.label}
                type="button"
                onClick={() => onChange({ date: d, slot: null })}
                className={cn(
                  'px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all min-h-[44px]',
                  active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {q.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all flex items-center gap-1.5 min-h-[44px]',
              showCalendar ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
        </div>

        {showCalendar && (
          <div className="mb-3 p-3 border border-gray-200 rounded-xl">
            <CalendarComponent
              selectedDate={config.date}
              onDateSelect={(date) => onChange({ date, slot: null })}
              blackoutDates={variant?.blackoutDates ?? []}
              minDate={new Date()}
            />
          </div>
        )}

        {dateBlocked && (
          <p className="text-sm text-red-600 mb-2">Selected date is not available. Please pick another date.</p>
        )}

        {slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((s) => {
              const slot: SlotTime = {
                id: `slot-${s.time.replace(/\s|:/g, '')}`,
                variantId: variant?.id ?? '',
                time: s.time,
                maxCapacity: s.capacity,
                currentBookings: s.booked,
                isAvailable: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              return (
                <TimeSlotCard
                  key={slot.id}
                  slot={slot}
                  isSelected={config.slot?.time === s.time}
                  onSelect={(sel) => onChange({ slot: sel })}
                />
              );
            })}
          </div>
        )}
        {!config.date && (
          <p className="text-sm text-gray-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Pick a date to see available times
          </p>
        )}
      </div>

      {/* Step C — Travellers */}
      <div>
        <h3 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">3 · Travellers</h3>
        <Stepper
          label="Adults"
          value={config.adults}
          min={venture.minParticipants}
          max={venture.maxParticipants}
          onChange={(v) => onChange({ adults: v })}
        />
      </div>

      {/* Step D — Transport */}
      <div>
        <h3 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Car className="w-4 h-4" /> 4 · Transport
        </h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleTransferChange('NONE')}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all min-h-[44px]',
              config.transfer === 'NONE' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="text-left">
              <span className="font-semibold text-gray-900 block">No Transfer</span>
              <span className="text-xs text-gray-500">Meeting Point Only</span>
            </div>
            <span className="font-heading font-bold tabular-nums text-gray-900">Rp 0</span>
          </button>

          {mockVehicleClasses.map((c) => {
            const active = config.transfer === c.name;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleTransferChange(c.name)}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all min-h-[44px]',
                  active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="text-left">
                  <span className="font-semibold text-gray-900 block">{c.label}</span>
                  {c.description && <span className="text-xs text-gray-500">{c.description}</span>}
                </div>
                <span className="font-heading font-bold tabular-nums text-gray-900">
                  {c.deltaIdr > 0 ? `+ ${formatPrice(c.deltaIdr)}/vehicle` : 'Included'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Zone picker — revealed when transfer selected */}
        {config.transfer !== 'NONE' && (
          <div className="mt-3">
            <label htmlFor="zone-picker" className="text-xs font-medium text-gray-500 block mb-2">
              Pickup Area
            </label>
            <select
              id="zone-picker"
              value={config.zoneId ?? ''}
              onChange={(e) => onChange({ zoneId: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700"
            >
              <option value="" disabled>Select area…</option>
              {mockPickupZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                  {z.isCustomQuote ? ' (Custom Quote)' : z.surchargeIdr > 0 ? ` (+${formatPrice(z.surchargeIdr)}/vehicle)` : ' (Included)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Step E — Combo Add-ons (dependent) */}
      {addonsWithState.length > 0 && (
        <div>
          <h3 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> 5 · Combos & Add-ons
          </h3>
          {fulfillmentMode !== 'PRIVATE_TRANSFER' && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2">
              Combos require hotel transfer — select a transport option to unlock.
            </p>
          )}
          <div className="space-y-2">
            {addonsWithState.map((a) => {
              const checked = config.addonIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleToggleAddon(a.id, a.requiresTransfer, a.isDisabled)}
                  disabled={a.isDisabled}
                  className={cn(
                    'w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left min-h-[44px]',
                    a.isDisabled && 'opacity-50 cursor-not-allowed border-gray-100',
                    !a.isDisabled && checked && 'border-blue-600 bg-blue-50',
                    !a.isDisabled && !checked && 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                      checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    )}
                  >
                    {checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </span>
                  <div className="flex-1">
                    <span className={cn('font-medium text-sm block', a.isDisabled ? 'text-gray-400' : 'text-gray-900')}>
                      {a.name}
                      {a.isCombo && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded">COMBO</span>
                      )}
                    </span>
                    {a.isDisabled && <span className="text-xs text-amber-700">Requires hotel transfer</span>}
                  </div>
                  <span className={cn('font-heading text-sm font-bold tabular-nums shrink-0', a.isDisabled ? 'text-gray-400' : 'text-blue-600')}>
                    + {formatPrice(a.price)}/pax
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Real-time Total */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between"
        >
          <span className="text-sm font-medium text-gray-600">Total Price</span>
          <span className="text-right">
            <span className="block font-heading text-2xl font-bold tabular-nums text-blue-600">{formatPrice(total.totalPriceIdr)}</span>
            {usdEstimate && <span className="text-xs text-gray-500">{usdEstimate}</span>}
          </span>
        </button>
        {showBreakdown && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Base ({config.adults} pax × {formatPrice(total.pricePerPax)})</span>
              <span>{formatPrice(total.totalPrice)}</span>
            </div>
            {total.transfer.totalFeeIdr > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Transfer ({total.transfer.vehicleCount} × {formatPrice(total.transfer.feePerVehicleIdr)})</span>
                <span>{formatPrice(total.transfer.totalFeeIdr)}</span>
              </div>
            )}
            {total.addonsTotalIdr > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Combos & Add-ons ({config.addonIds.length})</span>
                <span>{formatPrice(total.addonsTotalIdr)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      {isCustomQuote ? (
        <a
          href={requestQuoteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center px-6 py-3.5 font-heading font-semibold uppercase tracking-wider text-lg rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors min-h-[44px]"
        >
          Request Quote (Outer Area)
        </a>
      ) : (
        <Button onClick={onBook} disabled={isBooking || !config.date || !config.slot} fullWidth size="lg">
          {isBooking ? 'Processing…' : 'Book Now'}
        </Button>
      )}
      {!config.slot && config.date && !isCustomQuote && (
        <p className="text-xs text-gray-400 text-center">Select a time slot to continue</p>
      )}
    </div>
  );
}
