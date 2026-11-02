'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';

interface ReviewModerationActionsProps {
  reviewId: string;
  isApproved?: boolean;
}

/** Approve or remove a guest review. Published rows offer Delete instead. */
export function ReviewModerationActions({ reviewId, isApproved = false }: ReviewModerationActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: 'approve' | 'reject') => {
    if (
      action === 'reject' &&
      !window.confirm(
        isApproved
          ? 'Delete this published review? This cannot be undone.'
          : 'Delete this review? This cannot be undone.'
      )
    ) {
      return;
    }

    setPending(action);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Action failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isApproved && (
        <button
          type="button"
          onClick={() => run('approve')}
          disabled={pending !== null}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-green-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
        >
          {pending === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Approve
        </button>
      )}
      <button
        type="button"
        onClick={() => run('reject')}
        disabled={pending !== null}
        className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-line px-3 text-xs font-semibold text-foreground-secondary transition-colors hover:border-danger/30 hover:text-danger disabled:opacity-60"
      >
        {pending === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        {isApproved ? 'Delete' : 'Reject'}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
