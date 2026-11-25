'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Check,
  Edit3,
  Heart,
  LogOut,
  MessageSquareQuote,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { BottomSheet, Button } from '@/components/ui';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import type { CustomerSessionUser } from '@/hooks/useCustomerSession';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-white/15 dark:bg-neutral-900 dark:text-white';

const links = [
  { href: '/trips', label: 'My trips', hint: 'Vouchers, directions and reschedules', icon: CalendarDays },
  { href: '/wishlists', label: 'Wishlists', hint: 'Saved adventures, synced to your account', icon: Heart },
  { href: '/reviews/mine', label: 'My reviews', hint: 'Stories from your completed trips', icon: MessageSquareQuote },
];

export function ProfileDashboard({ user: initialUser }: { user: CustomerSessionUser }) {
  const [user, setUser] = useState(initialUser);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialUser.name);
  const [whatsapp, setWhatsapp] = useState(initialUser.whatsapp);
  const [countryCode, setCountryCode] = useState(initialUser.countryCode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  async function saveProfile(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, whatsapp, countryCode }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { name: string; whatsapp: string; countryCode: string };
        error?: { message?: string };
      };

      if (!response.ok || !payload.data) {
        setError(payload.error?.message ?? 'Could not save your profile');
        return;
      }

      setUser((current) => ({ ...current, name: payload.data!.name }));
      setEditing(false);
      setMessage('Profile saved.');
    } catch {
      setError('Could not save your profile. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event: FormEvent): Promise<void> {
    event.preventDefault();
    setPasswordBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          user.hasPassword ? { currentPassword, newPassword } : { newPassword },
        ),
      });
      const payload = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        setError(payload.error?.message ?? 'Could not save your password');
        return;
      }

      setUser((current) => ({ ...current, hasPassword: true }));
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password saved. Other devices have been signed out.');
    } catch {
      setError('Could not save your password. Please try again.');
    } finally {
      setPasswordBusy(false);
    }
  }

  async function signOut(): Promise<void> {
    setBusy(true);
    try {
      await fetch('/api/account/logout', { method: 'POST' });
      // Full navigation re-renders every consumer from an unauthenticated server state.
      window.location.assign('/');
    } catch {
      setError('Could not sign out. Please try again.');
      setBusy(false);
    }
  }

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <>
      <h1 className="font-heading text-3xl font-bold text-neutral-900 dark:text-white">My profile</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Your BaliWild account, trips and saved adventures in one place.
      </p>

      {message && (
        <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10 sm:p-8" aria-labelledby="account-heading">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand/20 font-heading text-2xl font-bold text-brand-ink">
            {initials || 'B'}
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white" title="Email verified">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="account-heading" className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">
              {user.name}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <span>{user.email}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-950/50 dark:text-green-300">
                <Check className="h-3 w-3" aria-hidden="true" />
                Verified
              </span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Member since {new Date(user.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button variant="outline" onClick={() => setEditing((current) => !current)}>
            <Edit3 className="mr-2 h-4 w-4" aria-hidden="true" />
            {editing ? 'Cancel' : 'Edit profile'}
          </Button>
        </div>

        {editing && (
          <form onSubmit={saveProfile} className="mt-6 grid gap-4 border-t border-neutral-200 pt-6 dark:border-white/10 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="profile-name" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Full name</label>
              <input id="profile-name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="profile-country" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Country code</label>
              <input id="profile-country" required maxLength={2} value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase())} className={inputClass} />
            </div>
            <div>
              <label htmlFor="profile-whatsapp" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">WhatsApp</label>
              <input id="profile-whatsapp" required value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} inputMode="tel" className={inputClass} placeholder="6281234567890" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" isLoading={busy}>Save changes</Button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8" aria-labelledby="your-space-heading">
        <h2 id="your-space-heading" className="font-heading text-xl font-bold text-neutral-900 dark:text-white">Your space</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {links.map(({ href, label, hint, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 transition-colors hover:bg-brand/5 dark:bg-neutral-900 dark:ring-white/10 dark:hover:bg-white/5"
            >
              <Icon className="h-5 w-5 shrink-0 text-brand-ink dark:text-brand" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-neutral-900 dark:text-white">{label}</span>
                <span className="mt-1 block text-xs text-neutral-600 dark:text-neutral-400">{hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10" aria-labelledby="password-heading">
        <h2 id="password-heading" className="font-heading text-xl font-bold text-neutral-900 dark:text-white">Password</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {user.hasPassword
            ? 'You can sign in with your password or with an email code.'
            : 'Password sign-in is optional. Email codes already keep your account safe.'}
        </p>
        <div className="mt-4">
          <Button variant="outline" onClick={() => setShowPasswordForm((current) => !current)}>
            {showPasswordForm ? 'Cancel' : user.hasPassword ? 'Change password' : 'Add password'}
          </Button>
        </div>

        {showPasswordForm && (
          <form onSubmit={savePassword} className="mt-5 grid gap-4 border-t border-neutral-200 pt-5 dark:border-white/10 sm:grid-cols-2">
            {user.hasPassword && (
              <div className="sm:col-span-2">
                <label htmlFor="current-password" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Current password</label>
                <input id="current-password" required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} autoComplete="current-password" />
              </div>
            )}
            <div className="sm:col-span-2">
              <label htmlFor="new-password" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">New password</label>
              <input id="new-password" required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} autoComplete="new-password" />
              <p className="mt-1 text-xs text-neutral-500">At least 8 characters. A password is optional; email codes always work.</p>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" isLoading={passwordBusy}>Save password</Button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8 flex flex-col gap-3 border-t border-neutral-200 pt-6 dark:border-white/10 sm:flex-row" aria-label="Account actions">
        <Button variant="outline" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Preferences
        </Button>
        <Button variant="ghost" onClick={() => void signOut()} disabled={busy}>
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Sign out
        </Button>
      </section>

      <BottomSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Preferences">
        <div className="space-y-5 pb-2">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Language</h3>
            <div className="mt-2"><LanguageSwitcher /></div>
          </section>
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Currency</h3>
            <p className="mt-1 text-xs text-neutral-600">Charged in IDR. Other currencies are approximate.</p>
            <div className="mt-2"><CurrencySelector /></div>
          </section>
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Theme</h3>
            <div className="mt-2"><ThemeSwitcher /></div>
          </section>
        </div>
      </BottomSheet>
    </>
  );
}
