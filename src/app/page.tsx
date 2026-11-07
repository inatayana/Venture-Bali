import { VentureExplorer } from '@/components/features/VentureExplorer';
import { HomeHero } from '@/components/features/HomeHero';
import { TrustStrip } from '@/components/features/TrustStrip';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { HomeHeader } from '@/components/layout/HomeHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { SearchProvider } from '@/components/search/SearchProvider';
import { loadVentures } from '@/lib/ventureService';
import { generateWebsiteStructuredData, getBaseUrl } from '@/lib/seo';

export const revalidate = 60;

export default async function Home() {
  const { ventures, source } = await loadVentures();

  return (
    <main className="min-h-screen bg-neutral-50">
      <JsonLd data={generateWebsiteStructuredData(getBaseUrl())} />
      <HomeHeader />

      <SearchProvider>
        <HomeHero />
        <VentureExplorer ventures={ventures} />
      </SearchProvider>

      <TrustStrip />

      {source === 'fallback' && (
        <p className="container mx-auto px-4 pb-8 text-xs text-gray-600 text-center">
          Showing the offline catalogue. Connect a database to browse the full inventory.
        </p>
      )}

      <SiteFooter />
    </main>
  );
}
