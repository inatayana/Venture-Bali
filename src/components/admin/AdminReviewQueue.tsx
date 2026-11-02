'use client';

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Star, Trash2, X } from 'lucide-react';
import { ReviewModerationActions } from '@/components/admin/ReviewModerationActions';
import { cn } from '@/utils/cn';

export interface AdminReviewItem {
  id: string;
  ventureId: string;
  ventureTitle: string;
  rating: number;
  comment: string;
  guestName: string;
  guestLocation: string | null;
  bookingCode: string | null;
  bookingDate: string | null;
  source: 'VERIFIED_BOOKING' | 'FOUNDING_GUEST' | 'IMPORTED';
  isApproved: boolean;
  photos: string[];
  createdAt: string;
}

const SOURCE_LABELS: Record<AdminReviewItem['source'], string> = {
  VERIFIED_BOOKING: 'Verified booking',
  FOUNDING_GUEST: 'Founding guest',
  IMPORTED: 'Imported review',
};

interface AdminReviewQueueProps {
  reviews: AdminReviewItem[];
}

/** Selectable moderation queue with bulk approve/delete and photo removal. */
export function AdminReviewQueue({ reviews }: AdminReviewQueueProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allSelected = reviews.length > 0 && selected.size === reviews.length;
  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(reviews.map((review) => review.id)));
  };

  const runBulk = async (action: 'approve' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} review(s)? This cannot be undone.`)) {
      return;
    }
    setBusy(action);
    setError(null);
    try {
      const response = await fetch('/api/admin/reviews/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Bulk action failed');
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setBusy(null);
    }
  };

  const removePhoto = async (reviewId: string, photoUrl: string) => {
    if (!window.confirm('Remove this photo from the review?')) return;
    setBusy(`photo:${reviewId}`);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove-photo', photoUrl }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Could not remove the photo');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the photo');
    } finally {
      setBusy(null);
    }
  };

  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-200 bg-white p-6 text-sm text-neutral-500">
        No reviews match these filters.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
        <label className="flex min-h-[44px] items-center gap-2 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-5 w-5 rounded border-neutral-300"
          />
          Select all
        </label>
        <span className="text-xs text-neutral-500">{selectedIds.length} selected</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runBulk('approve')}
            disabled={selectedIds.length === 0 || busy !== null}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-green-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
          >
            {busy === 'approve' ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Approve selected
          </button>
          <button
            type="button"
            onClick={() => runBulk('delete')}
            disabled={selectedIds.length === 0 || busy !== null}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete selected
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {reviews.map((review) => (
        <article
          key={review.id}
          className={cn(
            'rounded-xl border bg-white p-4',
            selected.has(review.id) ? 'border-brand-ink' : 'border-neutral-200'
          )}
        >
          <div className="flex flex-wrap items-start gap-3">
            <input
              type="checkbox"
              checked={selected.has(review.id)}
              onChange={() => toggle(review.id)}
              aria-label={`Select review by ${review.guestName}`}
              className="mt-1 h-5 w-5 rounded border-neutral-300"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-neutral-900">{review.ventureTitle}</p>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                  {SOURCE_LABELS[review.source]}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    review.isApproved
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-800'
                  )}
                >
                  {review.isApproved ? 'Published' : 'Pending'}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {review.guestName}
                {review.guestLocation ? ` · ${review.guestLocation}` : ''} ·{' '}
                {review.bookingCode ?? 'no booking'} ·{' '}
                {review.bookingDate ?? review.createdAt.slice(0, 10)}
              </p>

              <div className="mt-2 flex items-center gap-0.5" aria-label={`${review.rating} of 5 stars`}>
                {Array.from({ length: review.rating }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-brand text-brand" />
                ))}
              </div>

              <p className="mt-2 whitespace-pre-line break-words text-sm text-neutral-700">
                {review.comment}
              </p>

              {review.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.photos.map((photo) => (
                    <div key={photo} className="relative">
                      <a href={photo} target="_blank" rel="noopener noreferrer">
                        <img
                          src={photo}
                          alt={`Guest photo for ${review.ventureTitle}`}
                          className="h-24 w-32 rounded-lg border border-neutral-200 object-cover"
                        />
                      </a>
                      <button
                        type="button"
                        onClick={() => removePhoto(review.id, photo)}
                        disabled={busy !== null}
                        aria-label="Remove photo"
                        className="absolute -right-2 -top-2 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                <span className="text-xs text-neutral-500">
                  Submitted {review.createdAt.slice(0, 10)}
                </span>
                <ReviewModerationActions reviewId={review.id} isApproved={review.isApproved} />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
