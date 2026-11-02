'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { COUNTRIES } from '@/lib/countries';
import { PhotoUploader } from '@/components/features/ReviewPhotoUploader';

const REVIEW_MAX_LENGTH = 500;

const RATING_LABELS = ['', 'Not for me', 'Okay', 'Good', 'Great', 'Unforgettable'];

interface FoundingGuestReviewFormProps {
  inviteId: string;
  token: string;
  ventureTitle: string;
  defaultName?: string;
  defaultCountryCode?: string;
  photosEnabled?: boolean;
}

/**
 * Review form for a real invited guest who did the activity without an online
 * booking. The signed, single-use invite is the authorisation; every review is
 * labelled “Founding guest” and goes through moderation.
 */
export function FoundingGuestReviewForm({
  inviteId,
  token,
  ventureTitle,
  defaultName = '',
  defaultCountryCode = 'ID',
  photosEnabled = false,
}: FoundingGuestReviewFormProps) {
  const [guestName, setGuestName] = useState(defaultName);
  const [guestCountryCode, setGuestCountryCode] = useState(defaultCountryCode);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const uploadPhoto = async (file: File) => {
    const form = new FormData();
    form.set('token', token);
    form.set('inviteId', inviteId);
    form.set('file', file);

    const response = await fetch('/api/reviews/invite/photos', { method: 'POST', body: form });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message ?? 'Could not upload the photo.');
    }
    return data.data.url as string;
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
      const response = await fetch('/api/reviews/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          inviteId,
          rating,
          comment,
          guestName: guestName.trim(),
          guestCountryCode,
          photos,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Could not save the review');
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
          Your founding guest review is waiting for a quick check and will appear on {ventureTitle}
          shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-5">
      <span className="inline-flex rounded-full bg-brand/30 px-2.5 py-1 text-xs font-semibold text-neutral-800">
        Founding guest
      </span>
      <h2 className="mt-2 font-heading text-lg font-bold text-neutral-900">{ventureTitle}</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Thanks for joining us. Your honest review helps the next traveller choose the right
        adventure.
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
          <select
            value={guestCountryCode}
            onChange={(event) => setGuestCountryCode(event.target.value)}
            required
            className="mt-2 min-h-[44px] w-full rounded-xl border border-neutral-300 px-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none focus:border-brand-ink"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
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
              className="flex h-11 w-11 items-center justify-center rounded-md transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-8 w-8',
                  value <= rating ? 'fill-brand text-brand' : 'text-neutral-300'
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
        <PhotoUploader
          photos={photos}
          onChange={setPhotos}
          uploadFile={uploadPhoto}
          onUploadingChange={setPhotoUploading}
        />
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || photoUploading}
        className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-brand transition-colors hover:bg-neutral-900 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Submit review
      </button>
      <p className="mt-2 text-center text-xs text-neutral-500">
        Founding guest reviews are checked by our team before they appear.
      </p>
    </form>
  );
}
