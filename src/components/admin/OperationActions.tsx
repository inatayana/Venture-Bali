'use client';

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ExternalLink, UserX } from 'lucide-react';

type FinalStatus = 'COMPLETED' | 'NO_SHOW';

interface ReviewInvite {
  url: string;
  qrUrl: string;
}

interface OperationActionsProps {
  bookingId: string;
  lifecycleStatus: string;
}

const FINAL_LABELS: Record<string, string> = {
  COMPLETED: 'Completed',
  NO_SHOW: 'No-show',
};

export function OperationActions({ bookingId, lifecycleStatus }: OperationActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<FinalStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewInvite | null>(null);

  if (review) {
    return (
      <div className="w-full max-w-[220px] rounded-xl border border-green-200 bg-green-50 p-3 text-right">
        <p className="flex items-center justify-end gap-1 text-xs font-semibold text-green-800">
          <CheckCircle className="h-4 w-4" /> Trip completed
        </p>
        <p className="mt-1 text-xs text-green-800">Scan to leave a review now</p>
        <img
          src={review.qrUrl}
          alt="QR code to review this trip"
          width={128}
          height={128}
          className="ml-auto mt-2 h-32 w-32 rounded-lg border border-green-200 bg-white p-1"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <a
            href={review.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-green-300 px-2 text-xs font-semibold text-green-800"
          >
            Open link <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={() => {
              setReview(null);
              router.refresh();
            }}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-green-700 px-3 text-xs font-semibold text-white"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (FINAL_LABELS[lifecycleStatus]) {
    return <span className="text-xs font-medium text-neutral-500">{FINAL_LABELS[lifecycleStatus]}</span>;
  }

  const update = async (status: FinalStatus) => {
    setPending(status);
    setError(null);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Could not update the job order');

      if (status === 'COMPLETED' && data.data?.review) {
        setReview(data.data.review as ReviewInvite);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the job order');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => update('COMPLETED')}
          disabled={pending !== null}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 text-xs font-semibold text-green-800 disabled:opacity-50"
        >
          <CheckCircle className="h-4 w-4" />
          {pending === 'COMPLETED' ? 'Saving…' : 'Redeem'}
        </button>
        <button
          type="button"
          onClick={() => update('NO_SHOW')}
          disabled={pending !== null}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 disabled:opacity-50"
        >
          <UserX className="h-4 w-4" />
          {pending === 'NO_SHOW' ? 'Saving…' : 'No-show'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
