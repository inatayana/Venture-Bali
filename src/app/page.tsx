import { VentureExplorer } from '@/components/features/VentureExplorer';
import { loadVentures } from '@/lib/ventureService';

export const revalidate = 60;

export default async function Home() {
  const { ventures, source } = await loadVentures();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-heading text-4xl font-bold uppercase tracking-wider text-blue-600">
            Venture Bali
          </h1>
          <p className="text-gray-600 mt-1">Discover amazing adventures in Bali</p>
        </div>
      </header>

      <VentureExplorer ventures={ventures} />

      {source === 'fallback' && (
        <p className="container mx-auto px-4 pb-8 text-xs text-gray-400 text-center">
          Showing the offline catalogue. Connect a database to browse the full inventory.
        </p>
      )}
    </main>
  );
}
