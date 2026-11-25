'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui';
import type { FieldOpsUser } from '@/lib/opsGuard';

interface ParticipantDto {
  id: string;
  fullName: string;
  participantType: 'ADULT' | 'YOUTH' | 'KID' | 'INFANT';
  isMinor: boolean;
  waiverComplete: boolean;
  checkedInAt: string | null;
}

interface ManifestBooking {
  id: string;
  bookingCode: string;
  guestName: string;
  ventureTitle: string;
  paxCount: number;
  pickupTime: string | null;
  pickupPoint: string | null;
  lifecycleStatus: string;
  participants: ParticipantDto[];
}

type OpsAction = 'DRIVER_ASSIGNED' | 'CHECKED_IN' | 'NO_SHOW' | 'COMPLETED';

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}

type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike;

const ACTION_LABELS: Record<OpsAction, string> = {
  DRIVER_ASSIGNED: 'Assign',
  CHECKED_IN: 'Check in',
  NO_SHOW: 'No show',
  COMPLETED: 'Complete',
};

function todayWita(): string {
  return new Date(Date.now() + 8 * 60 * 60_000).toISOString().split('T')[0];
}

export function OpsPortal({ user }: { user: FieldOpsUser }) {
  const [date, setDate] = useState(todayWita);
  const [bookings, setBookings] = useState<ManifestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [manualAction, setManualAction] = useState<OpsAction>('CHECKED_IN');
  const [scanning, setScanning] = useState(false);
  const [scannerNote, setScannerNote] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const processingRef = useRef(false);

  const loadManifest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ops/manifest?date=${encodeURIComponent(date)}`, { cache: 'no-store' });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { bookings?: ManifestBooking[] };
        error?: { message?: string };
      };
      if (!response.ok || !payload.data) {
        setError(payload.error?.message ?? 'Could not load the manifest');
        return;
      }
      setBookings(payload.data.bookings ?? []);
    } catch {
      setError('Could not load the manifest. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void loadManifest();
  }, [loadManifest]);

  const submitCheckIn = useCallback(
    async (body: { token?: string; bookingCode?: string; action: OpsAction; participantId?: string }) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setNotice(null);
      setError(null);
      try {
        const response = await fetch('/api/ops/check-in', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        const payload = (await response.json()) as {
          success?: boolean;
          data?: { bookingCode?: string; lifecycleStatus?: string };
          error?: { message?: string };
        };
        if (!response.ok) {
          setError(payload.error?.message ?? 'Check-in failed');
        } else {
          setNotice(`${payload.data?.bookingCode ?? 'Booking'} → ${payload.data?.lifecycleStatus ?? 'updated'}`);
          setManualCode('');
          await loadManifest();
        }
      } catch {
        setError('Check-in failed. Check your connection.');
      } finally {
        processingRef.current = false;
      }
    },
    [loadManifest],
  );

  useEffect(() => {
    if (!scanning) return;

    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setScannerNote('Camera barcode scanning is not supported here — use the manual code field.');
      setScanning(false);
      return;
    }

    let cancelled = false;
    let frame = 0;
    let stream: MediaStream | null = null;
    const detector = new Detector({ formats: ['qr_code'] });

    async function tick() {
      if (cancelled || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes[0]?.rawValue) {
          const raw = codes[0].rawValue;
          await submitCheckIn(
            raw.startsWith('ci1.') ? { token: raw, action: 'CHECKED_IN' } : { bookingCode: raw, action: 'CHECKED_IN' },
          );
        }
      } catch {
        // Ignore transient decode failures while the camera adjusts.
      }
      if (!cancelled) frame = requestAnimationFrame(tick);
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        if (videoRef.current) {
          videoRef.current.srcObject = media;
          void videoRef.current.play();
        }
        frame = requestAnimationFrame(tick);
      })
      .catch(() => {
        setScannerNote('Camera unavailable — use the manual code field.');
        setScanning(false);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanning, submitCheckIn]);

  async function signOut(): Promise<void> {
    await fetch('/api/ops/logout', { method: 'POST' });
    window.location.assign('/ops/login');
  }

  function submitManual(event: FormEvent): void {
    event.preventDefault();
    if (!manualCode.trim()) return;
    void submitCheckIn({ bookingCode: manualCode.trim().toUpperCase(), action: manualAction });
  }

  const signedCount = bookings.filter((booking) => booking.lifecycleStatus === 'CHECKED_IN' || booking.lifecycleStatus === 'COMPLETED').length;

  return (
    <main className="min-h-screen bg-neutral-950 pb-24 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Field ops · {user.role}</p>
            <h1 className="font-heading text-xl font-bold">Today&apos;s manifest</h1>
          </div>
          <button type="button" onClick={() => void signOut()} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-neutral-200">
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div className="flex items-center gap-3 rounded-xl bg-neutral-900 p-3 ring-1 ring-white/10">
          <label htmlFor="ops-date" className="text-xs font-semibold text-neutral-400">Date</label>
          <input id="ops-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="flex-1 rounded-lg border border-white/15 bg-neutral-900 px-3 py-2 text-sm text-white" />
          <span className="text-xs text-neutral-400">{signedCount}/{bookings.length} checked</span>
        </div>

        {notice && <p role="status" className="rounded-xl bg-emerald-950/60 px-4 py-3 text-sm text-emerald-300">{notice}</p>}
        {error && <p role="alert" className="rounded-xl bg-red-950/60 px-4 py-3 text-sm text-red-300">{error}</p>}

        <section className="rounded-2xl bg-neutral-900 p-4 ring-1 ring-white/10" aria-labelledby="scanner-heading">
          <h2 id="scanner-heading" className="text-sm font-bold text-white">Scan boarding pass</h2>
          {scanning && <video ref={videoRef} muted playsInline className="mt-3 aspect-video w-full rounded-xl bg-black object-cover" />}
          {scannerNote && <p className="mt-2 text-xs text-amber-300">{scannerNote}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setScanning((current) => !current)}>
              {scanning ? 'Stop camera' : 'Open camera'}
            </Button>
          </div>
          <form onSubmit={submitManual} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input
              aria-label="Booking code"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="BW-2026-XXXX"
              className="rounded-lg border border-white/15 bg-neutral-950 px-3 py-2 text-sm uppercase text-white placeholder:text-neutral-600"
            />
            <select
              aria-label="Status"
              value={manualAction}
              onChange={(event) => setManualAction(event.target.value as OpsAction)}
              className="rounded-lg border border-white/15 bg-neutral-950 px-3 py-2 text-sm text-white"
            >
              {(Object.keys(ACTION_LABELS) as OpsAction[]).map((action) => (
                <option key={action} value={action}>{ACTION_LABELS[action]}</option>
              ))}
            </select>
            <Button type="submit" size="sm">Apply</Button>
          </form>
        </section>

        <section aria-label="Manifest" className="space-y-3">
          {loading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-neutral-900" />
          ) : bookings.length === 0 ? (
            <p className="rounded-2xl bg-neutral-900 p-6 text-center text-sm text-neutral-400 ring-1 ring-white/10">
              No assigned bookings for this date.
            </p>
          ) : (
            bookings.map((booking) => {
              const waived = booking.participants.filter((participant) => participant.waiverComplete).length;
              return (
                <article key={booking.id} className="rounded-2xl bg-neutral-900 p-4 ring-1 ring-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-emerald-400">{booking.bookingCode}</p>
                      <h3 className="mt-1 text-base font-bold">{booking.guestName}</h3>
                      <p className="text-xs text-neutral-400">{booking.ventureTitle} · {booking.paxCount} pax</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase text-neutral-200">
                      {booking.lifecycleStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-neutral-300">
                    {booking.pickupTime ? `Pickup ${booking.pickupTime}` : 'Pickup time TBA'}
                    {booking.pickupPoint ? ` · ${booking.pickupPoint}` : ''}
                  </p>
                  <p className={`mt-1 text-xs ${waived === booking.participants.length ? 'text-emerald-400' : 'text-amber-300'}`}>
                    Waivers {waived}/{booking.participants.length}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(Object.keys(ACTION_LABELS) as OpsAction[]).map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => void submitCheckIn({ bookingCode: booking.bookingCode, action })}
                        className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-white/10"
                      >
                        {ACTION_LABELS[action]}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
