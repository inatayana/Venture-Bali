'use client';

import { useEffect, useState } from 'react';
import { QrCode, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';
import { DigitalWaiverModal } from './DigitalWaiverModal';

interface Participant {
  id: string;
  fullName: string;
  participantType: 'ADULT' | 'YOUTH' | 'KID' | 'INFANT';
  isMinor: boolean;
  waiverComplete: boolean;
  waiverSignedAt: string | null;
  checkedInAt: string | null;
}

interface Props {
  bookingId: string;
  token: string;
  bookingCode: string;
}

export function TripExtras({ bookingId, token, bookingCode }: Props) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [waiverVersion, setWaiverVersion] = useState('v3');
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const query = `?token=${encodeURIComponent(token)}`;

    async function load() {
      try {
        const [participantsResponse, qrResponse] = await Promise.all([
          fetch(`/api/bookings/${bookingId}/participants${query}`, { cache: 'no-store' }),
          fetch(`/api/bookings/${bookingId}/qr${query}`, { cache: 'no-store' }),
        ]);
        const participantsBody = (await participantsResponse.json()) as {
          success?: boolean;
          data?: { participants?: Participant[]; waiverVersion?: string };
        };
        const qrBody = (await qrResponse.json()) as {
          success?: boolean;
          data?: { token?: string | null; expiresAt?: string };
        };
        if (cancelled) return;

        if (!participantsResponse.ok || !participantsBody.data) {
          setError('Could not load waiver details for this trip.');
        } else {
          setParticipants(participantsBody.data.participants ?? []);
          if (participantsBody.data.waiverVersion) setWaiverVersion(participantsBody.data.waiverVersion);
        }

        if (qrResponse.ok && qrBody.data?.token) {
          setQrToken(qrBody.data.token);
          setExpiresAt(qrBody.data.expiresAt ?? null);
          const { default: QRCode } = await import('qrcode');
          const image = await QRCode.toDataURL(qrBody.data.token, { width: 240, margin: 1 });
          if (!cancelled) setQrImage(image);
        }
      } catch {
        if (!cancelled) setError('Boarding pass is temporarily unavailable.');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bookingId, token]);

  const complete = participants.filter((participant) => participant.waiverComplete).length;
  const allSigned = participants.length > 0 && complete === participants.length;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10" aria-label={`Trip extras for ${bookingCode}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
          {qrImage ? (
            // QR is generated locally from the signed token; no remote request.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrImage} alt="Check-in QR code" className="h-24 w-24" />
          ) : (
            <QrCode className="h-8 w-8 text-neutral-400" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-neutral-500">{bookingCode}</p>
          <h3 className="mt-1 font-heading text-base font-bold text-neutral-900 dark:text-white">Boarding pass</h3>
          {expiresAt && (
            <p className="mt-0.5 text-xs text-neutral-500">
              Valid until {new Date(expiresAt).toLocaleString()}
            </p>
          )}
          <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${allSigned ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {allSigned ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <AlertTriangle className="h-4 w-4" aria-hidden="true" />}
            Waivers {complete}/{participants.length} signed
          </p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>

        <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} disabled={participants.length === 0}>
          Sign waivers
        </Button>
      </div>

      {modalOpen && qrToken && (
        <DigitalWaiverModal
          bookingId={bookingId}
          token={token}
          waiverVersion={waiverVersion}
          participants={participants}
          onClose={() => setModalOpen(false)}
          onSaved={setParticipants}
        />
      )}
    </section>
  );
}
