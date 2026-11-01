import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/adminSession';

export const metadata: Metadata = {
  title: 'Operator Sign In | BaliWild',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * The sign-in page lives in its own route-group branch so it does NOT inherit
 * `app/admin/layout.tsx` — that layout redirects unauthenticated visitors to
 * this very page, which used to create an infinite redirect loop.
 */
export default async function AdminLoginPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (session) {
    redirect('/admin');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-ink px-4 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <BrandWordmark className="text-2xl" />
          <p className="mt-2 font-heading text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Own the wild.
          </p>
          <p className="mt-1 text-sm text-white/50">Operator Panel</p>
        </div>

        <div className="rounded-xl bg-white p-6 text-neutral-900 shadow-2xl">
          <AdminLoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-white/40">
          Access is restricted to authorised operators.
        </p>
      </div>
    </main>
  );
}
