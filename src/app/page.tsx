import { HomeHero } from '@/components/features/HomeHero';
import { TrustStrip } from '@/components/features/TrustStrip';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { HomeHeader } from '@/components/layout/HomeHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { loadVentures } from '@/lib/ventureService';
import { generateWebsiteStructuredData, getBaseUrl } from '@/lib/seo';
import { CuratedRows } from '@/components/features/CuratedRows';
import { ExploreFiltersProvider } from '@/components/features/ExploreFiltersProvider';
import { ExploreControlBar } from '@/components/features/ExploreControlBar';
import { HomeCatalogue } from '@/components/features/HomeCatalogue';

export const revalidate = 60;

export default async function Home() {
  const { ventures, source } = await loadVentures();

  return (
    <main className="min-h-screen bg-neutral-50">
      <JsonLd data={generateWebsiteStructuredData(getBaseUrl())} />
      <ExploreFiltersProvider>
        <HomeHeader />
        <ExploreControlBar showBack={false} />

        <HomeHero />

        {/* Section 1 & 2: Curated horizontal rows */}
        <section className="px-4 sm:px-6 lg:px-10 pt-4 md:pt-7 pb-0">
          <div className="max-w-[1440px] mx-auto">
            <CuratedRows ventures={ventures} source={source} referenceDate={source === 'fallback' ? '2026-01-01' : new Date().toISOString().split('T')[0]} />
          </div>
        </section>

        {/* Section 3: Shared /explore chrome + guaranteed strip + All Bali Adventures grid */}
        <HomeCatalogue ventures={ventures} />

        <TrustStrip />
      </ExploreFiltersProvider>

      {source === 'fallback' && (
        <p className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pb-8 text-xs text-gray-600 text-center">
          Showing the offline catalogue. Connect a database to browse the full inventory.
        </p>
      )}

      <SiteFooter />
    </main>
  );
}
