import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireFieldOps } from '@/lib/opsGuard';
import { OpsPortal } from './OpsPortal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Field operations | BaliWild',
  robots: { index: false, follow: false },
};

export default async function OpsPage() {
  const user = await requireFieldOps();
  if (!user) redirect('/ops/login');

  return <OpsPortal user={user} />;
}
