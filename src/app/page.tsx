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

/** Popular pickup hubs offered by the hero destination picker. */
const HUBS = ['Ubud', 'Seminyak', 'Canggu', 'Nusa Dua', 'Sanur', 'Denpasar', 'Kuta', 'Uluwatu'];

/** Collect unique gallery images from all ventures for the hero carousel. */
function collectGalleryImages(ventures: Awaited<ReturnType<typeof loadVentures>>['ventures']): string[] {
  const images = new Set<string>();
  for (const venture of ventures) {
    if (venture.imageUrl) images.add(venture.imageUrl);
    for (const galleryImage of venture.gallery) {
      images.add(galleryImage);
    }
  }
  // Return a diverse selection: main images first, then gallery images
  return Array.from(images).slice(0, 8);
}

export default async function Home() {
  const { ventures, source } = await loadVentures();
  const suggestions = ventures.slice(0, 5).map((venture) => ({
    title: venture.title,
    href: `/experiences/${venture.id}/${venture.slug}`,
  }));
  const galleryImages = collectGalleryImages(ventures);

  return (
    <main className="min-h-screen bg-neutral-50">
      <JsonLd data={generateWebsiteStructuredData(getBaseUrl())} />
      <HomeHeader />

      <SearchProvider>
        <HomeHero hubs={HUBS} suggestions={suggestions} galleryImages={galleryImages} />
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
