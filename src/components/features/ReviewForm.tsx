'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, Star } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ReviewFormProps {
  bookingId: string;
  token: string;
  ventureTitle: string;
}

const RATING_LABELS = ['', 'Not for me', 'Okay', 'Good', 'Great', 'Unforgettable'];

/** Guest review form: stars, comment, submit. No account required. */
export function ReviewForm({ bookingId, token, ventureTitle }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Pick a rating from 1 to 5 stars.');
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, bookingId, rating, comment }),
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
          Your review is waiting for a quick check and will appear on {ventureTitle} shortly.
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
                    ? 'fill-yellow-400 text-yellow-400'
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
          rows={5}
          minLength={20}
          maxLength={1000}
          required
          placeholder="What did you enjoy? Tips for the next guest — what to bring, what to expect…"
          className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none focus:border-brand-ink"
        />
      </label>
      <p className="mt-1 text-right text-xs text-neutral-400">{comment.length}/1000</p>

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-brand transition-colors hover:bg-neutral-900 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Submit review
      </button>
      <p className="mt-2 text-center text-xs text-neutral-500">
        Reviews are checked before they appear on the product page.
      </p>
    </form>
  );
}
