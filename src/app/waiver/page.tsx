import type { Metadata } from 'next';
import Link from 'next/link';
import { WAIVER_SECTIONS, WAIVER_VERSION } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Safety waiver | Venture Bali',
  description: 'Activity safety waiver and release of liability for adventure activities.',
};

export default function WaiverPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-neutral-500 underline">
          ← Back to adventures
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-bold text-neutral-900">Safety waiver</h1>
        <p className="mt-2 text-sm text-neutral-500">Version {WAIVER_VERSION}</p>

        <div className="mt-8 space-y-7">
          {WAIVER_SECTIONS.map((section) => (
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

        <p className="mt-10 text-xs text-neutral-400">
          This waiver is a draft prepared for launch and is pending final legal review.
        </p>
      </article>
    </main>
  );
}
