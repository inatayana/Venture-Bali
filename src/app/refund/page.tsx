import Link from 'next/link';
import type { Metadata } from 'next';
import { CheckCircle, XCircle, RefreshCw, Umbrella, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund & Reschedule Policy | BaliWild',
  description:
    'BaliWild cancellation, reschedule and no-show policy. Cancel at least 24 hours before your activity for an 80% refund. Reschedules are free 24 hours before. Refunds are paid back to the original payment method within 3 business days.',
};

const RULES = [
  { when: 'Cancel ≥ 24 hours before your activity', result: '20% cancellation fee · 80% refunded', ok: true },
  { when: 'Cancel < 24 hours before your activity', result: 'Cancellation is not possible', ok: false },
  { when: 'Reschedule ≥ 24 hours before your activity', result: 'Free, subject to availability', ok: true },
  { when: 'Reschedule < 24 hours before your activity', result: 'Not possible', ok: false },
  { when: 'No-show without confirmation ≥ 1 day before', result: '100% fee · no refund', ok: false },
  { when: 'Refund payout after confirmation', result: 'Within 3 business days · original payment method', ok: true },
] as const;

const FAQ = [
  {
    q: 'How do I cancel or reschedule?',
    a: 'Open your booking confirmation link (email or WhatsApp) and use the Change or Cancel option, or reply to the reminder WhatsApp message at least 24 hours before your trip. Cancellations inside 24 hours of the activity cannot be accepted — that is the same rule shown at checkout.',
  },
  {
    q: 'When will I receive my money back?',
    a: 'Approved refunds are returned to your original payment method (QRIS, virtual account, e-wallet or card) within 3 business days after the cancellation is confirmed. You will receive a WhatsApp and email confirmation with the refund reference.',
  },
  {
    q: 'No-show or cannot make the pickup time?',
    a: 'Message us on WhatsApp before your activity. If we receive no confirmation at least 1 day before and you do not arrive, the booking is treated as a no-show with a 100% fee and no refund.',
  },
  {
    q: 'Bad weather or unsafe conditions?',
    a: 'Adventure activities depend on river, sea and weather conditions. If an activity cannot run safely, you will be offered another date or a full refund — never a credit note you did not ask for.',
  },
  {
    q: 'Can I combine a promo with a coupon?',
    a: 'No. A promotional price and a coupon code can never be combined, and the amount shown at checkout is the amount charged.',
  },
] as const;

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-neutral-500 underline hover:text-neutral-900">
          ← Back to adventures
        </Link>

        <h1 className="mt-4 font-heading text-3xl font-bold text-neutral-900">
          Refund &amp; Reschedule Policy
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Version 2.0.0 · The policy below is enforced by our system at the time you cancel or
          reschedule, using your booking date and activity time (Bali time, WITA).
        </p>

        <div className="mt-8 space-y-3">
          {RULES.map((rule) => (
            <div
              key={rule.when}
              className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
            >
              <span
                className={
                  rule.ok
                    ? 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600'
                    : 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600'
                }
              >
                {rule.ok ? (
                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900">{rule.when}</p>
                <p className="text-sm text-neutral-600">{rule.result}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="font-heading text-xl font-bold text-neutral-900">Frequently asked</h2>
          <div className="mt-3 divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
            {FAQ.map((item) => (
              <div key={item.q} className="p-4">
                <h3 className="text-sm font-bold text-neutral-900">{item.q}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-neutral-950 p-6 text-white">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-brand" aria-hidden="true" />
            <h2 className="font-heading text-lg font-bold">Still unsure?</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            Our AI concierge can answer policy questions any time, and the BaliWild team is on
            WhatsApp during operating hours for bookings that need a human decision.
          </p>
          <a
            href="https://wa.me/6285117321388"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-brand-ink transition-transform hover:scale-[1.02]"
          >
            Chat with BaliWild
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-neutral-500">
          This policy forms part of and is enforced together with the{' '}
          <Link href="/terms" className="underline hover:text-neutral-900">
            booking terms
          </Link>{' '}
          and the{' '}
          <Link href="/waiver" className="underline hover:text-neutral-900">
            safety waiver
          </Link>
          . Time calculations use Bali time (WITA, UTC+8). Approved cancels and reschedules are
          processed by our system automatically — the refund or reschedule applies immediately and
          you will receive confirmation.
        </p>

        <p className="mt-4 text-xs text-neutral-400">
          <Umbrella className="mr-1 inline h-4 w-4 align-text-bottom" aria-hidden="true" />
          If severe weather or a safety assessment closes an activity, you always get another date
          or a full refund.
        </p>
      </article>
    </main>
  );
}
