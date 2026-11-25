import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireCustomer } from '@/lib/customerGuard';
import { GlobalDesktopHeader } from '@/components/layout/GlobalDesktopHeader';
import { DesktopBreadcrumb } from '@/components/layout/DesktopBreadcrumb';
import { ProfileDashboard } from './ProfileDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Profile | BaliWild',
  robots: { index: false, follow: false },
};

/** The profile belongs to the Customer actor only. Guests get a sign-in route. */
export default async function ProfilePage() {
  const user = await requireCustomer();
  if (!user) redirect('/login?next=/profile');

  return (
    <main className="min-h-screen bg-white pb-24 dark:bg-neutral-950 md:pb-12">
      <GlobalDesktopHeader />
      <DesktopBreadcrumb label="Profile" />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <ProfileDashboard user={user} />
      </div>
    </main>
  );
}
