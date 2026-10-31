'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/i18n';

export interface AdminPickupZone {
  id: string;
  name: string;
  surchargeIdr: number;
  isCustomQuote: boolean;
}

export interface AdminVariantDraft {
  id: string;
  title: string;
  shortDescription: string;
  fulfillmentMode: 'SELF_DRIVE' | 'SHARED_TRANSFER' | 'PRIVATE_TRANSFER';
  pickupZoneId: string | null;
  duration: string | null;
  badge: string | null;
  transportBadge: string | null;
  minimumSpendIdr: number | null;
  sortOrder: number;
  priceTiers: { minPax: number; maxPax: number; pricePerPax: number }[];
  bookingCount: number;
}

interface VariantPackageEditorProps {
  ventureId: string;
  zones: AdminPickupZone[];
  /** Omit to render the "Add package" trigger instead of "Edit". */
  variant?: AdminVariantDraft;
}

interface TierDraft {
  minPax: string;
  maxPax: string;
  pricePerPax: string;
}

const MODE_OPTIONS = [
  { value: 'SELF_DRIVE', label: 'Self drive — meet at the meeting point' },
  { value: 'SHARED_TRANSFER', label: 'Shared transfer — hotel shuttle' },
  { value: 'PRIVATE_TRANSFER', label: 'Private transfer — private car' },
] as const;

function toTierDrafts(variant?: AdminVariantDraft): TierDraft[] {
  if (!variant || variant.priceTiers.length === 0) {
    return [{ minPax: '1', maxPax: '10', pricePerPax: '500000' }];
  }
  return variant.priceTiers.map((tier) => ({
    minPax: String(tier.minPax),
    maxPax: String(tier.maxPax),
    pricePerPax: String(tier.pricePerPax),
  }));
}

/**
 * Create / edit / delete a package (variant) from the admin panel.
 *
 * Rendered inline (no modal) so it stays usable on small operator screens:
 * click "Add package" or "Edit" to expand the form, save to POST/PATCH, and the
 * router refresh pulls the new row in.
 */
export function VariantPackageEditor({ ventureId, zones, variant }: VariantPackageEditorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(variant?.title ?? '');
  const [shortDescription, setShortDescription] = useState(variant?.shortDescription ?? '');
  const [fulfillmentMode, setFulfillmentMode] = useState(variant?.fulfillmentMode ?? 'SELF_DRIVE');
  const [pickupZoneId, setPickupZoneId] = useState(variant?.pickupZoneId ?? '');
  const [duration, setDuration] = useState(variant?.duration ?? '');
  const [badge, setBadge] = useState(variant?.badge ?? '');
  const [transportBadge, setTransportBadge] = useState(variant?.transportBadge ?? '');
  const [minimumSpendIdr, setMinimumSpendIdr] = useState(
    variant?.minimumSpendIdr ? String(variant.minimumSpendIdr) : ''
  );
  const [sortOrder, setSortOrder] = useState(String(variant?.sortOrder ?? 0));
  const [tiers, setTiers] = useState<TierDraft[]>(() => toTierDrafts(variant));

  const isEditing = Boolean(variant);
  const isSelfDrive = fulfillmentMode === 'SELF_DRIVE';

  const updateTier = (index: number, patch: Partial<TierDraft>) => {
    setTiers((current) =>
      current.map((tier, tierIndex) => (tierIndex === index ? { ...tier, ...patch } : tier))
    );
  };

  const save = async () => {
    setPending(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        fulfillmentMode,
        pickupZoneId: isSelfDrive ? null : pickupZoneId || null,
        duration: duration.trim() || undefined,
        badge: badge.trim() || null,
        transportBadge: transportBadge.trim() || null,
        minimumSpendIdr: minimumSpendIdr === '' ? null : Number(minimumSpendIdr),
        sortOrder: Number(sortOrder),
        priceTiers: tiers.map((tier) => ({
          minPax: Number(tier.minPax),
          maxPax: Number(tier.maxPax),
          pricePerPax: Number(tier.pricePerPax),
        })),
      };

      const response = await fetch(
        isEditing ? `/api/admin/variants/${variant?.id}` : `/api/admin/ventures/${ventureId}/variants`,
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Could not save the package');

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the package');
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    if (!variant) return;
    if (!window.confirm(`Delete the package "${variant.title}"? This cannot be undone.`)) return;

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/variants/${variant.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Could not delete the package');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the package');
    } finally {
      setPending(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={
            isEditing
              ? 'inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline'
              : 'inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700'
          }
        >
          {isEditing ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
          {isEditing ? 'Edit' : 'Add package'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={remove}
            disabled={pending || (variant?.bookingCount ?? 0) > 0}
            title={
              (variant?.bookingCount ?? 0) > 0
                ? `${variant?.bookingCount} booking(s) — packages with bookings cannot be deleted`
                : 'Delete this package'
            }
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-blue-100 bg-blue-50/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-bold text-gray-900">
          {isEditing ? `Edit package · ${variant?.title}` : 'New package'}
        </h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs font-semibold text-gray-500 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-gray-600">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="South Bali: Private Transfer"
            className="mt-1 min-h-[40px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </label>

        <label className="text-xs font-medium text-gray-600">
          Duration
          <input
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            placeholder="3 hours"
            className="mt-1 min-h-[40px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </label>

        <label className="text-xs font-medium text-gray-600 sm:col-span-2">
          Short description
          <textarea
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs font-medium text-gray-600">
          Fulfilment mode
          <select
            value={fulfillmentMode}
            onChange={(event) => {
              const next = event.target.value as AdminVariantDraft['fulfillmentMode'];
              setFulfillmentMode(next);
              if (next === 'SELF_DRIVE') setPickupZoneId('');
            }}
            className="mt-1 min-h-[40px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
          >
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-gray-600">
          Locked pickup zone
          <select
            value={pickupZoneId}
            disabled={isSelfDrive}
            onChange={(event) => setPickupZoneId(event.target.value)}
            className="mt-1 min-h-[40px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">No locked zone — guest picks the area</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
                {zone.isCustomQuote
                  ? ' (custom quote)'
                  : zone.surchargeIdr > 0
                    ? ` (+${formatPrice(zone.surchargeIdr)})`
                    : ' (included)'}
              </option>
            ))}
          </select>
          <span className="mt-1 block font-normal text-gray-400">
            Locked zones preselect the area in the booking sheet and keep the
            surcharge visible on the package card.
          </span>
        </label>

        <label className="text-xs font-medium text-gray-600">
          Badge (optional)
          <input
            value={badge}
            onChange={(event) => setBadge(event.target.value)}
            placeholder="Most Popular"
            className="mt-1 min-h-[40px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </label>

        <label className="text-xs font-medium text-gray-600">
          Transport badge (optional)
          <input
            value={transportBadge}
            onChange={(event) => setTransportBadge(event.target.value)}
            placeholder="🚐 Shared Transfer"
            className="mt-1 min-h-[40px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </label>

        <label className="text-xs font-medium text-gray-600">
          Minimum spend (IDR, optional)
          <input
            value={minimumSpendIdr}
            onChange={(event) => setMinimumSpendIdr(event.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            placeholder="1200000"
            className="mt-1 min-h-[40px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </label>

        <label className="text-xs font-medium text-gray-600">
          Sort order
          <input
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            className="mt-1 min-h-[40px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </label>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Price tiers (per guest, IDR)
          </span>
          <button
            type="button"
            onClick={() =>
              setTiers((current) => [...current, { minPax: '', maxPax: '', pricePerPax: '' }])
            }
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            + Add tier
          </button>
        </div>

        <div className="space-y-2">
          {tiers.map((tier, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_1.2fr_auto] items-center gap-2">
              <input
                value={tier.minPax}
                onChange={(event) =>
                  updateTier(index, { minPax: event.target.value.replace(/[^\d]/g, '') })
                }
                inputMode="numeric"
                placeholder="Min pax"
                aria-label={`Tier ${index + 1} minimum pax`}
                className="min-h-[40px] rounded-lg border border-gray-300 px-3 text-sm"
              />
              <input
                value={tier.maxPax}
                onChange={(event) =>
                  updateTier(index, { maxPax: event.target.value.replace(/[^\d]/g, '') })
                }
                inputMode="numeric"
                placeholder="Max pax"
                aria-label={`Tier ${index + 1} maximum pax`}
                className="min-h-[40px] rounded-lg border border-gray-300 px-3 text-sm"
              />
              <input
                value={tier.pricePerPax}
                onChange={(event) =>
                  updateTier(index, { pricePerPax: event.target.value.replace(/[^\d]/g, '') })
                }
                inputMode="numeric"
                placeholder="Price / guest"
                aria-label={`Tier ${index + 1} price per guest`}
                className="min-h-[40px] rounded-lg border border-gray-300 px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => setTiers((current) => current.filter((_, i) => i !== index))}
                disabled={tiers.length === 1}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-30"
                aria-label={`Remove tier ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? 'Save changes' : 'Create package'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-sm font-medium text-gray-500 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
