import type { Metadata } from 'next';
import Link from 'next/link';
import { TERMS_SECTIONS, TERMS_VERSION } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Booking terms | BaliWild',
  description: 'Terms of service for booking adventure activities with BaliWild.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-neutral-500 underline">
          ← Back to adventures
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-bold text-neutral-900">Booking terms</h1>
        <p className="mt-2 text-sm text-neutral-500">Version {TERMS_VERSION}</p>

        <div className="mt-8 space-y-7">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="font-heading text-lg font-bold text-neutral-900">{section.title}</h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-neutral-700">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 space-y-1 text-xs text-neutral-600">
          <p>Last updated: {TERMS_VERSION}</p>
          <p>
            Bookings accept the version shown on this page at the time of booking; your accepted
            version is stored on your booking for audit purposes.
          </p>
        </div>
      </article>
    </main>
  );
}
