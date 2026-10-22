import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/adminSession';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Operator Sign In | Venture Bali',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (session) {
    redirect('/admin');
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-blue-600">
            Venture Bali
          </h1>
          <p className="text-sm text-gray-500 mt-1">Operator Panel</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <AdminLoginForm />
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Access is restricted to authorised operators.
        </p>
      </div>
    </main>
  );
}
