'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';

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
  waiverVersion: string;
  participants: Participant[];
  onClose: () => void;
  onSaved: (participants: Participant[]) => void;
}

const inputClass =
  'mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/25 dark:border-white/15 dark:bg-neutral-900 dark:text-white';

interface Draft {
  id: string;
  fullName: string;
  participantType: Participant['participantType'];
  signature: string;
  emergencyName: string;
  emergencyPhone: string;
  dietary: string;
  medical: string;
  guardianName: string;
  guardianRelationship: string;
  guardianConsent: boolean;
}

function toDraft(participant: Participant): Draft {
  return {
    id: participant.id,
    fullName: participant.fullName,
    participantType: participant.participantType,
    signature: '',
    emergencyName: '',
    emergencyPhone: '',
    dietary: '',
    medical: '',
    guardianName: '',
    guardianRelationship: '',
    guardianConsent: false,
  };
}

export function DigitalWaiverModal({ bookingId, token, waiverVersion, participants, onClose, onSaved }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(participants.map(toDraft));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(id: string, patch: Partial<Draft>): void {
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  }

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const signedAt = new Date().toISOString();
    const payload = {
      participants: drafts.map((draft) => ({
        id: draft.id,
        fullName: draft.fullName,
        participantType: draft.participantType,
        waiverVersion,
        waiverSignedAt: signedAt,
        waiverDigitalSignature: draft.signature.trim(),
        waiverSignatureMethod: 'typed',
        emergencyContactName: draft.emergencyName.trim() || null,
        emergencyContactPhone: draft.emergencyPhone.trim() || null,
        dietaryNotes: draft.dietary.trim() || null,
        medicalNotes: draft.medical.trim() || null,
        ...(participants.find((person) => person.id === draft.id)?.isMinor
          ? {
              guardianName: draft.guardianName.trim() || null,
              guardianRelationship: draft.guardianRelationship.trim() || null,
              guardianConsentAt: draft.guardianConsent ? signedAt : null,
            }
          : {}),
      })),
    };

    try {
      const response = await fetch(`/api/bookings/${bookingId}/participants?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        success?: boolean;
        data?: { participants?: Participant[] };
        error?: { message?: string };
      };
      if (!response.ok || !body.data?.participants) {
        setError(body.error?.message ?? 'Could not save waivers');
        return;
      }
      onSaved(body.data.participants);
      onClose();
    } catch {
      setError('Could not save waivers. Check your connection.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="waiver-title">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl dark:bg-neutral-900 sm:rounded-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="waiver-title" className="font-heading text-xl font-bold text-neutral-900 dark:text-white">Sign safety waivers</h2>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">One signature per traveller (version {waiverVersion}).</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

        <div className="mt-5 space-y-5">
          {drafts.map((draft, index) => {
            const isMinor = participants.find((person) => person.id === draft.id)?.isMinor ?? false;
            return (
              <fieldset key={draft.id} className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
                <legend className="px-1 text-sm font-bold text-neutral-900 dark:text-white">
                  Traveller {index + 1} · {draft.participantType}
                </legend>

                <label className="mt-2 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">Full name</label>
                <input required minLength={2} value={draft.fullName} onChange={(event) => update(draft.id, { fullName: event.target.value })} className={inputClass} />

                <label className="mt-3 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">Type your signature</label>
                <input required minLength={2} value={draft.signature} onChange={(event) => update(draft.id, { signature: event.target.value })} className={inputClass} placeholder={draft.fullName} />

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">Emergency contact</label>
                    <input value={draft.emergencyName} onChange={(event) => update(draft.id, { emergencyName: event.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">Emergency phone</label>
                    <input value={draft.emergencyPhone} onChange={(event) => update(draft.id, { emergencyPhone: event.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">Dietary notes</label>
                    <input value={draft.dietary} onChange={(event) => update(draft.id, { dietary: event.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">Medical notes</label>
                    <input value={draft.medical} onChange={(event) => update(draft.id, { medical: event.target.value })} className={inputClass} />
                  </div>
                </div>

                {isMinor && (
                  <div className="mt-4 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Guardian consent required for minors</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <input required aria-label="Guardian name" placeholder="Guardian name" value={draft.guardianName} onChange={(event) => update(draft.id, { guardianName: event.target.value })} className={inputClass} />
                      <input required aria-label="Guardian relationship" placeholder="Relationship" value={draft.guardianRelationship} onChange={(event) => update(draft.id, { guardianRelationship: event.target.value })} className={inputClass} />
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                      <input type="checkbox" required checked={draft.guardianConsent} onChange={(event) => update(draft.id, { guardianConsent: event.target.checked })} />
                      I consent on behalf of this minor.
                    </label>
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>

        <Button type="submit" size="lg" fullWidth isLoading={busy} className="mt-6">Save waivers</Button>
      </form>
    </div>
  );
}
