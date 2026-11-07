'use client';



/**
 * Home hero section with exact specifications:
 * - Height: 600px (Desktop) / 80vh / 450px (Mobile)
 * - Width: 100vw / 100% (Full-width)
 * - Background: cover, center
 * - Flexbox column, justify-center, items-center
 * - Search bar floating: max-width 760px, height 64px, border-radius 999px (pill), centered at bottom
 */
export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-white">
      {/* Background video with poster fallback */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-0" />
      </div>

      {/* Gradient overlays for text readability */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-brand-ink via-transparent to-black/25 lg:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-brand/10 blur-3xl"
      />

      {/* Main hero container - full width, fixed height */}
      <div className="relative w-full min-h-[600px] min-h-[80vh] max-h-[600px] md:min-h-[600px] lg:min-h-[600px]">
        <div className="relative flex min-h-[600px] h-[80vh] max-h-[600px] flex-col items-center justify-center px-4">
          {/* Decorative brand blobs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-brand/10 blur-3xl"
          />

          {/* Gradient overlays for text readability */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-brand-ink via-transparent to-black/25 lg:hidden"
          />

          {/* Content container - centered */}
          <div className="relative z-10 flex min-h-[600px] h-[80vh] max-h-[600px] w-full flex-col items-center justify-center px-4">
            {/* Badge */}
            <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
              OTA Petualangan & Aktivitas Outdoor #1 di Bali
            </p>

            {/* Headline */}
            <h1 className="mt-4 max-w-3xl font-heading text-[clamp(1.75rem,7.5vw,2.25rem)] font-bold uppercase leading-[1.06] tracking-tight text-white lg:text-[3.25rem] text-center">
              <span className="block">
                Bali <span className="text-brand">Taklukkan alam liar!</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base text-center">
              Rafting, ATV, tubing & trekking di seluruh Bali. Konfirmasi instan, reschedule gratis, dan 100% dijalankan operator lokal.
            </p>

            {/* Floating Search Bar - Pill shape, max-width 760px, height 64px */}
            <div className="mt-8 w-full max-w-[760px] mx-auto">
              <div className="relative">
                <div className="relative rounded-full bg-white/95 backdrop-blur-sm shadow-[0_20px_40px_-20px_rgba(0,0,0,0.4)] ring-1 ring-white/20 overflow-hidden">
                  <div className="flex min-h-[64px] h-[64px] items-center px-6 rounded-full bg-white/95 backdrop-blur-sm shadow-[0_20px_40px_-20px_rgba(0,0,0,0.4)] ring-1 ring-white/20">
                    <div className="flex-1 flex items-center gap-3 px-6">
                      <span className="text-sm font-medium text-neutral-500">📍</span>
                      <span className="text-base font-medium text-neutral-900">Cari petualangan...</span>
                    </div>
                    <button className="shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-brand-ink text-brand transition-colors hover:bg-neutral-900">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust points */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 11a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xs font-medium text-white/80">Konfirmasi Instan</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span className="text-xs font-medium text-white/80">Reschedule Gratis</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span className="text-xs font-medium text-white/80">100% Operator Lokal</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}