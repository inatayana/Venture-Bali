import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/adminSession';

export const metadata: Metadata = {
  title: 'Operator Panel | BaliWild',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The middleware already blocks anonymous requests, but the layout repeats
  // the check so a page can never be rendered without a valid session.
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
