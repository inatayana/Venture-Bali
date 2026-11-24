'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface CheckInButtonProps {
  bookingId: string;
  alreadyCheckedIn: boolean;
}

/**
 * Operator-only check-in action shown on the voucher verification page.
 * Confirms the guest is physically present and redeems the voucher.
 */
export function CheckInButton({ bookingId, alreadyCheckedIn }: CheckInButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyCheckedIn);

  if (done) {
    return (
      <p className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
        <CheckCircle className="h-5 w-5" aria-hidden="true" />
        Guest checked in
      </p>
    );
  }

  const checkIn = async () => {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Could not check in this guest');
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check in this guest');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/40 dark:bg-blue-950/30">
      <button
        type="button"
        onClick={() => void checkIn()}
        disabled={pending}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-base font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <UserCheck className="h-5 w-5" aria-hidden="true" />
        )}
        {pending ? 'Checking in…' : 'Check-in this guest'}
      </button>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}
