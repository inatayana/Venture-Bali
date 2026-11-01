import { VentureExplorer } from '@/components/features/VentureExplorer';
import { HomeHero } from '@/components/features/HomeHero';
import { TrustStrip } from '@/components/features/TrustStrip';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { HomeHeader } from '@/components/layout/HomeHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { SearchProvider } from '@/components/search/SearchProvider';
import { loadVentures, getLatestPaidBookingPulse } from '@/lib/ventureService';
import { generateWebsiteStructuredData, getBaseUrl } from '@/lib/seo';
import { MEGA_CATEGORIES } from '@/lib/taxonomy';

export const revalidate = 60;

/** Popular pickup hubs offered by the hero destination picker. */
const HUBS = ['Ubud', 'Seminyak', 'Canggu', 'Nusa Dua', 'Sanur', 'Denpasar', 'Kuta', 'Uluwatu'];

export default async function Home() {
  const [{ ventures, source }, bookingPulse] = await Promise.all([
    loadVentures(),
    getLatestPaidBookingPulse(),
  ]);
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
      <HomeHeader />

      <SearchProvider>
        <HomeHero hubs={HUBS} suggestions={suggestions} stats={stats} bookingPulse={bookingPulse} />
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
