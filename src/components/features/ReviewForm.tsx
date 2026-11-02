/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { CheckCircle, ImagePlus, Loader2, Star, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { compressReviewPhoto } from '@/lib/compressImage';

const REVIEW_MAX_LENGTH = 500;
const PHOTO_LIMIT = 3;

interface ReviewFormProps {
  bookingId: string;
  token: string;
  ventureTitle: string;
  /** Prefilled from the booking; the guest may change what is shown publicly. */
  defaultName?: string;
  defaultLocation?: string;
  /** Hide the photo picker until Supabase Storage is configured. */
  photosEnabled?: boolean;
}

const RATING_LABELS = ['', 'Not for me', 'Okay', 'Good', 'Great', 'Unforgettable'];

/** Guest review form: name, origin, stars, comment. No account required. */
export function ReviewForm({
  bookingId,
  token,
  ventureTitle,
  defaultName = '',
  defaultLocation = '',
  photosEnabled = false,
}: ReviewFormProps) {
  const [guestName, setGuestName] = useState(defaultName);
  const [guestLocation, setGuestLocation] = useState(defaultLocation);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [published, setPublished] = useState(false);

  const uploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPhotoError(null);

    const remaining = PHOTO_LIMIT - photos.length;
    if (remaining <= 0) {
      setPhotoError('You can add up to 3 photos.');
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      setPhotoError(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} allowed.`);
    }

    setUploading(true);
    for (const file of selected) {
      try {
        if (!file.type.startsWith('image/')) throw new Error('Use a JPG, PNG or WebP photo.');
        const compressed = await compressReviewPhoto(file);
        const form = new FormData();
        form.set('token', token);
        form.set('bookingId', bookingId);
        form.set('file', compressed);

        const response = await fetch('/api/reviews/photos', { method: 'POST', body: form });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error?.message ?? 'Could not upload the photo.');
        }
        setPhotos((current) => [...current, data.data.url].slice(0, PHOTO_LIMIT));
      } catch (err) {
        setPhotoError(err instanceof Error ? err.message : 'Could not upload the photo.');
      }
    }
    setUploading(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (guestName.trim().length < 2) {
      setError('Enter the name you want shown with your review.');
      return;
    }
    if (rating === 0) {
      setError('Pick a rating from 1 to 5 stars.');
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          bookingId,
          rating,
          comment,
          guestName: guestName.trim(),
          guestLocation: guestLocation.trim() || undefined,
          photos,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Could not save the review');
      setPublished(data.data?.published === true);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the review');
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle className="mx-auto h-8 w-8 text-green-600" aria-hidden="true" />
        <h2 className="mt-2 font-heading text-lg font-bold text-green-900">Thank you!</h2>
        <p className="mt-1 text-sm text-green-800">
          {published
            ? `Your review is now live on ${ventureTitle}.`
            : `Your review is waiting for a quick check and will appear on ${ventureTitle} shortly.`}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="font-heading text-lg font-bold text-neutral-900">{ventureTitle}</h2>
      <p className="mt-1 text-sm text-neutral-600">
        How was the trip? Your review helps other travellers pick the right adventure.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Your name
          <input
            type="text"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            minLength={2}
            maxLength={60}
            required
            autoComplete="name"
            placeholder="First name"
            className="mt-2 min-h-[44px] w-full rounded-xl border border-neutral-300 px-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none focus:border-brand-ink"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Where are you from?
          <input
            type="text"
            value={guestLocation}
            onChange={(event) => setGuestLocation(event.target.value)}
            maxLength={80}
            autoComplete="address-level2"
            placeholder="City, country"
            className="mt-2 min-h-[44px] w-full rounded-xl border border-neutral-300 px-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none focus:border-brand-ink"
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Your rating
        </legend>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value > 1 ? 's' : ''}`}
              aria-pressed={rating === value}
              className="rounded-md p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-8 w-8',
                  value <= rating
                    ? 'fill-brand text-brand'
                    : 'text-neutral-300'
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm font-medium text-neutral-700">
              {RATING_LABELS[rating]}
            </span>
          )}
        </div>
      </fieldset>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Your review
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          minLength={20}
          maxLength={REVIEW_MAX_LENGTH}
          required
          placeholder="What did you enjoy? Tips for the next guest — what to bring, what to expect…"
          className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none focus:border-brand-ink"
        />
      </label>
      <p className="mt-1 text-right text-xs text-neutral-600">
        {comment.length}/{REVIEW_MAX_LENGTH}
      </p>

      {photosEnabled && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Photos <span className="font-normal normal-case tracking-normal">(optional, up to 3)</span>
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div key={photo} className="relative overflow-hidden rounded-xl bg-neutral-100">
                <img
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="aspect-[4/3] w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotos((current) => current.filter((url) => url !== photo))}
                  aria-label={`Remove photo ${index + 1}`}
                  className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {photos.length < PHOTO_LIMIT && (
              <label
                className={cn(
                  'flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-300 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-500',
                  uploading && 'pointer-events-none opacity-60'
                )}
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                )}
                {uploading ? 'Uploading…' : 'Add photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => {
                    void uploadPhotos(event.target.files);
                    event.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>
            )}
          </div>
          {photoError && (
            <p role="alert" className="mt-2 text-xs text-red-700">
              {photoError}
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-brand transition-colors hover:bg-neutral-900 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Submit review
      </button>
      <p className="mt-2 text-center text-xs text-neutral-500">
        Verified 4–5 star reviews appear immediately. Other reviews are checked by our team.
      </p>
    </form>
  );
}
