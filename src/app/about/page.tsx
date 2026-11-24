import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Compass,
  HeartHandshake,
  Leaf,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { BRAND_EMAIL_SUPPORT } from '@/lib/brand';
import { GlobalDesktopHeader } from '@/components/layout/GlobalDesktopHeader';

export const metadata: Metadata = {
  title: 'Our Local Story & Impact | BaliWild',
  description:
    'BaliWild is 100% Bali-owned and operated. Book direct and skip 20–30% foreign OTA commissions — your payment supports Balinese guides, drivers, nature and culture.',
  openGraph: {
    title: 'Our Local Story & Impact | BaliWild',
    description:
      'Bali-Owned & Operated. Built by Locals, Guided with Heart. No foreign OTA commission.',
    type: 'website',
  },
};

const PILLARS = [
  {
    icon: Users,
    title: 'Direct Local Livelihoods',
    body: 'River guides, ATV instructors and Balinese drivers are paid fairly and with dignity under direct contracts with BaliWild — without commission cuts to foreign intermediaries.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety-First Local Standards',
    body: 'We invest continuously in international-standard safety gear — helmets, life jackets, a well-maintained fleet and participant insurance — backed by a Digital Waiver before every activity. Guest safety is the honour of a Balinese host.',
  },
  {
    icon: Leaf,
    title: 'Preserving Bali’s Nature & Cultural Heritage',
    body: 'Guided by Tri Hita Karana, we keep the Pakerisan and Ayung river corridors clean, protect village trails, and respect the traditions of the local banjar communities we work with.',
  },
] as const;

const COMPARISONS = [
  {
    aspect: 'Harga',
    direct: 'Harga jujur langsung dari operator — tanpa potongan komisi OTA asing 20–30%.',
    ota: 'Komisi 20–30% dipotong dari nilai perjalanan Anda oleh perantara luar negeri.',
  },
  {
    aspect: 'Dukungan Operasional',
    direct: `Terhubung langsung dengan tim operasional kami di Ubud via WhatsApp & ${BRAND_EMAIL_SUPPORT}.`,
    ota: 'Call center perantara di luar negeri, jauh dari lapangan Bali.',
  },
  {
    aspect: 'Fleksibilitas Logistik',
    direct: 'Bebas memilih datang langsung ke titik kumpul (Self-Drive) atau penjemputan hotel berbasis zona.',
    ota: 'Pilihan logistik kaku mengikuti paket yang dijual perantara.',
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <GlobalDesktopHeader />
      <main className="min-h-screen bg-neutral-50 text-foreground dark:bg-neutral-950">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-brand-ink text-white dark:bg-neutral-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand/25 blur-3xl"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-ink via-transparent to-transparent dark:from-neutral-900" aria-hidden="true" />

        <div className="relative mx-auto max-w-[1440px] px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              Our local story &amp; impact
            </p>

            <h1 className="mt-5 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Bali-Owned &amp; Operated.
              <span className="mt-1 block text-brand">Built by Locals, Guided with Heart.</span>
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
              Saat Anda memesan langsung di <strong className="text-white">BaliWild (baliwild.com)</strong>, Anda menghilangkan potongan komisi perantara OTA asing —{' '}
              <strong className="text-brand">GetYourGuide &amp; Klook 30%, Viator 25%, Airbnb Experiences 20%</strong>. Nilai perjalanan Anda langsung sampai ke operator dan tim lokal di Bali, bukan keluar dari pulau ini.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand" aria-hidden="true" /> Ubud, Gianyar · Bali
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HeartHandshake className="h-3.5 w-3.5 text-brand" aria-hidden="true" /> Direct operator, no foreign OTA commission
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-ink dark:text-brand">
            Where your adventure goes
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
            Three commitments behind every booking
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/20 text-brand-ink dark:text-brand">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Transparent comparison */}
      <section className="border-y border-neutral-200 bg-white py-12 dark:border-white/10 dark:bg-neutral-900 lg:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-ink dark:text-brand">
              Book direct with BaliWild vs. foreign OTA platforms
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
              Same adventure. A fairer price, and a team you can actually reach.
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {COMPARISONS.map(({ aspect, direct, ota }) => (
              <article
                key={aspect}
                className="rounded-2xl border border-neutral-200 p-5 dark:border-white/10"
              >
                <h3 className="font-heading text-lg font-bold">{aspect}</h3>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-brand/10 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-ink dark:text-brand">
                      <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> BaliWild · Direct
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{direct}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-100 p-3 dark:bg-white/5">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Foreign OTA
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{ota}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand-ink p-6 text-white sm:flex-row sm:items-center sm:p-8 dark:bg-neutral-900">
          <div>
            <h2 className="font-heading text-2xl font-bold">Ready to keep your adventure in Bali?</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              Choose from guided ATV, rafting, tubing, trekking and more — operated locally, confirmed instantly.
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex min-h-[52px] shrink-0 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-brand-ink transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Explore Guided Adventures
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Questions before booking? Chat our Ubud operations team on WhatsApp or email {BRAND_EMAIL_SUPPORT}.
          <MessageCircle className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
        </p>
      </section>
      </main>
    </>
  );
}