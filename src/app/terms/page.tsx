import type { Metadata } from 'next';
import Link from 'next/link';
import { TERMS_SECTIONS, TERMS_VERSION } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Booking terms | BaliWild',
  description: 'Terms of service for booking adventure activities with BaliWild.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-foreground-muted underline">
          ← Back to adventures
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-bold text-foreground">Booking terms</h1>
        <p className="mt-2 text-sm text-foreground-muted">Version {TERMS_VERSION}</p>

        <div className="mt-8 space-y-7">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="font-heading text-lg font-bold text-foreground">{section.title}</h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-foreground-secondary">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-foreground-secondary">
          This page is a draft prepared for launch and is pending final legal review.
        </p>
      </article>
    </main>
  );
}
