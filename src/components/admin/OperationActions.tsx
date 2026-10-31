'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, UserX } from 'lucide-react';

type FinalStatus = 'COMPLETED' | 'NO_SHOW';

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
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
