'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';

interface ReviewModerationActionsProps {
  reviewId: string;
  isApproved?: boolean;
}

/**
 * Reviews are published on submit, so the only admin action left is delete.
 * `isApproved` only changes the confirmation copy for legacy rows.
 */
export function ReviewModerationActions({ reviewId, isApproved = true }: ReviewModerationActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (
      !window.confirm(
        isApproved
          ? 'Delete this published review? This cannot be undone.'
          : 'Delete this review? This cannot be undone.'
      )
    ) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Action failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Delete
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
