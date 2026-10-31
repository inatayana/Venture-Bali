import { VentureExplorer } from '@/components/features/VentureExplorer';
import { loadVentures } from '@/lib/ventureService';

export const revalidate = 60;

export default async function Home() {
  const { ventures, source } = await loadVentures();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-brand-ink">
            Venture <span className="bg-brand px-1 text-brand-ink">Bali</span>
          </h1>
          <p className="hidden truncate text-xs text-gray-500 sm:block">
            Discover amazing adventures in Bali
          </p>
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
