'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface RefundActionsProps {
  refundId: string;
  hasPayment: boolean;
  status: string;
}

export function RefundActions({ refundId, hasPayment, status }: RefundActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<'MIDTRANS' | 'MANUAL' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const process = async (method: 'MIDTRANS' | 'MANUAL') => {
    setPending(method);
    setError(null);
    try {
      const response = await fetch(`/api/admin/refunds/${refundId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? 'Could not process this refund');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process this refund');
    } finally {
      setPending(null);
    }
  };

  if (status === 'PROCESSED') {
    return <span className="text-xs font-semibold text-green-700">Processed</span>;
  }

  return (
    <div className="text-right">
      <div className="flex flex-wrap justify-end gap-2">
        {hasPayment && (
          <button
            type="button"
            onClick={() => process('MIDTRANS')}
            disabled={pending !== null}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-brand-ink px-3 text-xs font-semibold text-brand disabled:opacity-60"
          >
            {pending === 'MIDTRANS' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Refund via Midtrans
          </button>
        )}
        <button
          type="button"
          onClick={() => process('MANUAL')}
          disabled={pending !== null}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-700 disabled:opacity-60"
        >
          {pending === 'MANUAL' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Mark manual refund
        </button>
      </div>
      {error && <p className="mt-1 max-w-xs text-xs text-red-600">{error}</p>}
    </div>
  );
}
