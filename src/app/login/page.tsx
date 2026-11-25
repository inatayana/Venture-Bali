import { Suspense } from 'react';
import type { Metadata } from 'next';
import { GlobalDesktopHeader } from '@/components/layout/GlobalDesktopHeader';
import { DesktopBreadcrumb } from '@/components/layout/DesktopBreadcrumb';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in | BaliWild',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-50 pb-24 dark:bg-neutral-950 md:pb-12">
      <GlobalDesktopHeader />
      <DesktopBreadcrumb label="Sign in" />
      <div className="container mx-auto max-w-lg px-4 py-10">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
