import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OpsLoginForm } from './OpsLoginForm';

export const metadata: Metadata = {
  title: 'Field Ops sign in | BaliWild',
  robots: { index: false, follow: false },
};

export default function OpsLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10">
      <Suspense fallback={<div className="h-80 w-full max-w-md animate-pulse rounded-2xl bg-neutral-800" />}>
        <OpsLoginForm />
      </Suspense>
    </main>
  );
}
