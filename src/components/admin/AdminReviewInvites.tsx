'use client';

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, ExternalLink, Link2, Loader2, QrCode, Trash2 } from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';
import { cn } from '@/utils/cn';

export interface AdminInviteVenture {
  id: string;
  title: string;
  approved: number;
  pending: number;
  activeInvites: number;
}

export interface AdminInviteRow {
  id: string;
  ventureId: string;
  ventureTitle: string;
  guestName: string | null;
  guestCountryCode: string | null;
  status: 'UNUSED' | 'SUBMITTED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  url: string | null;
  qrUrl: string | null;
}

interface AdminReviewInvitesProps {
  ventures: AdminInviteVenture[];
  invites: AdminInviteRow[];
}

const TARGET = 10;

function isLive(invite: AdminInviteRow): boolean {
  return invite.status === 'UNUSED' && new Date(invite.expiresAt).getTime() > Date.now();
}

function statusLabel(invite: AdminInviteRow): string {
  if (invite.status === 'SUBMITTED') return 'Submitted';
  if (invite.status === 'EXPIRED' || !isLive(invite)) return 'Expired';
  return 'Active';
}

export function AdminReviewInvites({ ventures, invites }: AdminReviewInvitesProps) {
  const router = useRouter();
  const [ventureId, setVentureId] = useState(ventures[0]?.id ?? '');
  const [count, setCount] = useState(TARGET);
  const [days, setDays] = useState(30);
  const [guestName, setGuestName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const active = invites.filter(isLive);
  const used = invites.filter((invite) => !isLive(invite));

  const createInvites = async (targetVentureId: string, amount: number) => {
    if (!targetVentureId || amount <= 0) return;
    setBusy(`create:${targetVentureId}`);
    setError(null);
    try {
      const response = await fetch('/api/admin/review-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureId: targetVentureId,
          count: amount,
          expiresInDays: days,
          guestName: guestName.trim() || undefined,
          guestCountryCode: countryCode || undefined,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Could not create invites');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invites');
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (inviteId: string) => {
    if (!window.confirm('Revoke this invite? The link will stop working.')) return;
    setBusy(`revoke:${inviteId}`);
    setError(null);
    try {
      const response = await fetch(`/api/admin/review-invites/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Could not revoke the invite');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke the invite');
    } finally {
      setBusy(null);
    }
  };

  const copy = async (invite: AdminInviteRow) => {
    if (!invite.url) return;
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopied(invite.id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setError('Could not copy the link. Open it and copy from the address bar.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
          Create invites
        </h2>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            void createInvites(ventureId, count);
          }}
        >
          <label className="min-w-0 text-xs font-semibold text-foreground-secondary sm:col-span-2">
            Product
            <select
              value={ventureId}
              onChange={(event) => setVentureId(event.target.value)}
              className="mt-1 block min-h-[44px] w-full rounded-lg border border-line-strong px-2 text-sm text-foreground"
            >
              {ventures.map((venture) => (
                <option key={venture.id} value={venture.id}>
                  {venture.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-foreground-secondary">
            How many
            <input
              type="number"
              min={1}
              max={TARGET}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="mt-1 block min-h-[44px] w-full rounded-lg border border-line-strong px-2 text-sm text-foreground"
            />
          </label>
          <label className="text-xs font-semibold text-foreground-secondary">
            Expires in (days)
            <input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="mt-1 block min-h-[44px] w-full rounded-lg border border-line-strong px-2 text-sm text-foreground"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy !== null || !ventureId}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy?.startsWith('create:') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Create links
            </button>
          </div>
          <label className="text-xs font-semibold text-foreground-secondary">
            Guest label (optional)
            <input
              type="text"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              maxLength={60}
              placeholder="e.g. Camille"
              className="mt-1 block min-h-[44px] w-full rounded-lg border border-line-strong px-2 text-sm text-foreground"
            />
          </label>
          <label className="text-xs font-semibold text-foreground-secondary">
            Country (optional)
            <select
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              className="mt-1 block min-h-[44px] w-full rounded-lg border border-line-strong px-2 text-sm text-foreground"
            >
              <option value="">Guest chooses</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
        </form>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
          Coverage · {TARGET} published reviews per product
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {ventures.map((venture) => {
            const remaining = Math.max(0, TARGET - venture.activeInvites);
            return (
              <div key={venture.id} className="min-w-0 rounded-xl border border-line bg-surface p-3">
                <p className="truncate text-sm font-semibold text-foreground">{venture.title}</p>
                <p className="mt-1 text-xs text-foreground-secondary">
                  {venture.approved}/{TARGET} published · {venture.pending} pending ·{' '}
                  {venture.activeInvites} active invite{venture.activeInvites === 1 ? '' : 's'}
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-inset">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.min(100, Math.round((venture.approved / TARGET) * 100))}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVentureId(venture.id);
                    void createInvites(venture.id, remaining || TARGET);
                  }}
                  disabled={remaining === 0 || busy !== null}
                  className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-foreground underline disabled:text-foreground-muted disabled:no-underline"
                >
                  {remaining === 0 ? '10 active invites' : `Create ${remaining} more`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
          Active links ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-foreground-muted">
            No active invites. Create links for a product above.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {active.map((invite) => (
              <article key={invite.id} className="min-w-0 rounded-xl border border-line bg-surface p-3">
                <p className="truncate text-sm font-semibold text-foreground">{invite.ventureTitle}</p>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  {invite.guestName || 'Unassigned'}
                  {invite.guestCountryCode ? ` · ${invite.guestCountryCode}` : ''} · expires{' '}
                  {new Date(invite.expiresAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                <div className="mt-2 flex items-start gap-3">
                  {invite.qrUrl ? (
                    <img
                      src={invite.qrUrl}
                      alt={`QR invite for ${invite.ventureTitle}`}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-lg border border-line bg-surface p-1"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-line-strong text-foreground-muted">
                      <QrCode className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => copy(invite)}
                      disabled={!invite.url}
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-lg border border-line-strong px-2 text-xs font-semibold text-foreground disabled:opacity-50"
                    >
                      {copied === invite.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied === invite.id ? 'Copied' : 'Copy link'}
                    </button>
                    {invite.url && (
                      <a
                        href={invite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-lg bg-neutral-900 px-2 text-xs font-semibold text-white"
                      >
                        <ExternalLink className="h-4 w-4" /> Open
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => revoke(invite.id)}
                      disabled={busy !== null}
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-lg border border-danger/30 px-2 text-xs font-semibold text-danger disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" /> Revoke
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {used.length > 0 && (
        <details className="rounded-xl border border-line bg-surface p-3">
          <summary className="flex min-h-[44px] cursor-pointer items-center text-sm font-semibold text-foreground">
            Used & expired invites ({used.length})
          </summary>
          <div className="mt-2 divide-y divide-line">
            {used.map((invite) => (
              <div key={invite.id} className="flex flex-wrap items-center gap-2 py-2 text-xs">
                <span className="min-w-0 flex-1 truncate text-foreground-secondary">
                  {invite.ventureTitle} · {invite.guestName || 'Unassigned'}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-semibold',
                    invite.status === 'SUBMITTED'
                      ? 'bg-success/10 text-success'
                      : 'bg-inset text-foreground-secondary'
                  )}
                >
                  {statusLabel(invite)}
                </span>
                <span className="text-foreground-muted">
                  {new Date(invite.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
