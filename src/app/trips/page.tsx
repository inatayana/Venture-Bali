'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';

/**
 * Trips — the guest's trip hub behind the App Shell. 
 * Split layout: left side explains the magic-link flow with CTA,
 * right side shows an interactive world map with destination pins.
 */
export default function TripsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Major destinations BaliWild serves / inspires
  const destinations = [
    { name: 'Kuta, Bali', lat: -8.72, lng: 115.17, short: 'Kuta' },
    { name: 'Ubud, Bali', lat: -8.51, lng: 115.26, short: 'Ubud' },
    { name: 'Seminyak, Bali', lat: -8.69, lng: 115.17, short: 'Seminyak' },
    { name: 'Nusa Dua, Bali', lat: -8.80, lng: 115.23, short: 'Nusa Dua' },
    { name: 'Istanbul', lat: 41.01, lng: 28.98, short: 'Istanbul' },
    { name: 'Tokyo', lat: 35.68, lng: 139.69, short: 'Tokyo' },
    { name: 'Ho Chi Minh City', lat: 10.82, lng: 106.63, short: 'HCMC' },
    { name: 'Melbourne', lat: -37.81, lng: 144.96, short: 'Melbourne' },
    { name: 'Sydney', lat: -33.87, lng: 151.21, short: 'Sydney' },
    { name: 'Singapore', lat: 1.35, lng: 103.82, short: 'Singapore' },
  ];

  // Simple mercator projection for a world map (equirectangular background)
  const project = (lat: number, lng: number, width: number, height: number) => {
    const x = ((lng + 180) / 360) * width;
    const latRad = (lat * Math.PI) / 180;
    const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * height;
    return { x, y };
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-heading text-3xl font-bold text-neutral-900 dark:text-white">Trips</h1>
        </div>
        <div className="container mx-auto px-4 py-16 grid gap-8 lg:grid-cols-2">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-2xl" />
            <div className="h-6 w-64 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-4 w-80 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-12 w-32 bg-brand-ink rounded-xl" />
          </div>
          <div className="animate-pulse h-[500px] lg:h-[600px] bg-neutral-200 dark:bg-neutral-700 rounded-2xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-neutral-900 dark:text-white">Trips</h1>
      </div>

      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Info & CTA */}
          <div className="flex flex-col justify-center px-4 lg:pr-8">
            <div className="max-w-lg">
              <div className="mb-8 relative">
                {/* Decorative illustration area */}
                <div className="relative h-64 w-full rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20 flex items-center justify-center overflow-hidden">
                  <div className="flex flex-col items-center gap-4 text-brand-ink">
                    <svg
                      className="h-16 w-16 opacity-60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div className="flex items-center gap-6 text-sm opacity-70">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-8 rounded bg-brand/20 flex items-center justify-center">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <span>Bali</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-8 rounded bg-brand/20 flex items-center justify-center">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                          </svg>
                        </div>
                        <span>Asia</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-8 rounded bg-brand/20 flex items-center justify-center">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="9" width="18" height="11" rx="2" />
                            <path d="M9 9V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                          </svg>
                        </div>
                        <span>Stay</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="font-heading text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white mb-3">
                Map out your next trip
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-8 max-w-md">
                After you book a trip, experience, or service, come back here to see details, explore the map, and save places to visit.
              </p>

              <Link
                href="/explore"
                className="inline-flex items-center gap-2 min-h-[52px] px-8 rounded-xl bg-brand-ink text-white font-semibold text-base hover:bg-brand/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Get started
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Map */}
          <div className="relative rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10">
            <div className="relative aspect-[1/1] lg:aspect-[4/3]">
              {/* World map background - using a simple styled div with pseudo-element for map texture */}
              <div
                className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmFpbiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNNDAgMEgwVjQwSDQwVjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2VlZSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhaW4pIi8+PC9zdmc+')] bg-cover"
                aria-hidden="true"
              />
              {/* Continents overlay - simplified landmass shapes */}
              <svg className="absolute inset-0 w-full h-full text-neutral-300 dark:text-neutral-600" viewBox="0 0 360 180" preserveAspectRatio="none" aria-hidden="true">
                {/* Simplified landmasses */}
                <path d="M120,50 Q140,45 155,55 Q170,65 175,80 Q180,95 170,105 Q155,115 140,110 Q125,105 115,95 Q105,85 110,70 Q115,55 120,50 Z" fill="currentColor" opacity="0.15" />
                <path d="M180,40 Q200,35 220,40 Q240,45 250,60 Q255,75 250,90 Q240,105 220,110 Q200,115 185,110 Q170,105 165,90 Q160,75 170,60 Q175,45 180,40 Z" fill="currentColor" opacity="0.15" />
                <path d="M250,50 Q270,45 290,50 Q310,55 320,70 Q325,85 320,100 Q310,115 290,120 Q270,125 255,120 Q240,115 235,100 Q230,85 240,70 Q245,55 250,50 Z" fill="currentColor" opacity="0.15" />
                <path d="M60,80 Q75,75 90,80 Q105,85 110,100 Q115,115 105,125 Q90,135 70,130 Q55,125 50,110 Q45,95 50,85 Q55,75 60,80 Z" fill="currentColor" opacity="0.15" />
                <path d="M20,120 Q35,115 50,120 Q65,125 70,140 Q75,155 65,165 Q50,175 30,170 Q15,165 10,150 Q5,135 15,125 Q25,120 20,120 Z" fill="currentColor" opacity="0.15" />
                <path d="M280,130 Q295,125 310,130 Q325,135 330,150 Q335,165 325,175 Q310,180 295,175 Q280,170 270,155 Q265,140 275,135 Q285,130 280,130 Z" fill="currentColor" opacity="0.15" />
              </svg>

              {/* Destination pins */}
              {destinations.map((dest) => {
                const pos = project(dest.lat, dest.lng, 360, 180);
                return (
                  <button
                    key={dest.name}
                    type="button"
                    className="absolute"
                    style={{
                      left: `calc(${pos.x / 360} * 100%)`,
                      top: `calc(${pos.y / 180} * 100%)`,
                      transform: 'translate(-50%, -100%)',
                    }}
                    aria-label={`View ${dest.name}`}
                    title={dest.name}
                  >
                    <span
                      className="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand-ink text-white shadow-lg transition-all duration-200 hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900"
                      aria-hidden="true"
                    >
                      <MapPin className="h-4 w-4" />
                      {/* Pulse ring */}
                      <span className="absolute inset-0 rounded-full bg-brand-ink opacity-30 animate-ping" />
                    </span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {dest.short}
                    </span>
                  </button>
                );
              })}

              {/* Graticule lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 360 180" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <pattern id="graticule" width="30" height="15" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 15" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.08" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#graticule)" />
              </svg>
            </div>

            {/* Map controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1" aria-label="Map controls">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 dark:bg-neutral-800/90 backdrop-blur text-neutral-700 dark:text-neutral-300 shadow-lg hover:bg-white dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="Zoom in"
                title="Zoom in"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 dark:bg-neutral-800/90 backdrop-blur text-neutral-700 dark:text-neutral-300 shadow-lg hover:bg-white dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="Zoom out"
                title="Zoom out"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </button>
            </div>

            {/* Attribution */}
            <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-neutral-500 dark:text-neutral-400">
              Map data © OpenStreetMap contributors
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}