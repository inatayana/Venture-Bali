import { CalendarClock, MapPin, ShieldCheck, Sparkles } from 'lucide-react';

const POINTS = [
  {
    icon: Sparkles,
    title: 'Instant confirmation',
    detail: 'Your slot is locked the moment you pay.',
  },
  {
    icon: CalendarClock,
    title: 'Free reschedule ≥24h',
    detail: 'Plans changed? Move the date at no cost.',
  },
  {
    icon: ShieldCheck,
    title: '80% refund ≥24h',
    detail: 'Cancel at least a day ahead, keep 80%.',
  },
  {
    icon: MapPin,
    title: 'Licensed local operators',
    detail: 'Certified guides, English speaking, Bali based.',
  },
];

/**
 * Trust strip shown under the catalogue grid: four promises, no marketing fluff.
 */
export function TrustStrip() {
  return (
    <section aria-label="Why book with us" className="container mx-auto px-4 pb-12">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map(({ icon: Icon, title, detail }) => (
          <div
            key={title}
            className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/30">
              <Icon className="h-4 w-4 text-brand-ink" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
