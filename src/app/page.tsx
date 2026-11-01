import { VentureExplorer } from '@/components/features/VentureExplorer';
import { HomeHero } from '@/components/features/HomeHero';
import { TrustStrip } from '@/components/features/TrustStrip';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { JsonLd } from '@/components/seo/JsonLd';
import { SearchProvider } from '@/components/search/SearchProvider';
import { loadVentures } from '@/lib/ventureService';
import { generateWebsiteStructuredData, getBaseUrl } from '@/lib/seo';
import { MEGA_CATEGORIES } from '@/lib/taxonomy';

export const revalidate = 60;

/** Popular pickup hubs offered by the hero destination picker. */
const HUBS = ['Ubud', 'Seminyak', 'Canggu', 'Nusa Dua', 'Sanur', 'Denpasar', 'Kuta', 'Uluwatu'];

export default async function Home() {
  const { ventures, source } = await loadVentures();
  const suggestions = ventures.slice(0, 5).map((venture) => ({
    title: venture.title,
    href: `/experiences/${venture.id}/${venture.slug}`,
  }));

  const reviewed = ventures.filter((venture) => (venture.reviewCount ?? 0) > 0);
  const stats = {
    categories: MEGA_CATEGORIES.length,
    avgRating:
      reviewed.length > 0
        ? Math.round(
            (reviewed.reduce((sum, venture) => sum + venture.rating, 0) / reviewed.length) * 10
          ) / 10
        : null,
    reviewCount: ventures.reduce((sum, venture) => sum + (venture.reviewCount ?? 0), 0),
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <JsonLd data={generateWebsiteStructuredData(getBaseUrl())} />
      <header className="sticky top-0 z-40 bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <p className="text-brand-ink">
            <BrandWordmark className="text-2xl" />
          </p>
          <p className="hidden truncate text-xs text-gray-500 sm:block">
            Own the wild. Adventure, booked in minutes.
          </p>
        </div>
      </header>

      <SearchProvider>
        <HomeHero hubs={HUBS} suggestions={suggestions} stats={stats} />
        <VentureExplorer ventures={ventures} />
      </SearchProvider>

      <TrustStrip />

      {source === 'fallback' && (
        <p className="container mx-auto px-4 pb-8 text-xs text-gray-400 text-center">
          Showing the offline catalogue. Connect a database to browse the full inventory.
        </p>
      )}

      <SiteFooter />
    </main>
  );
}
