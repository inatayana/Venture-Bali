import { VentureCard } from '@/components/ui';
import { mockVentures } from '@/data/mockVentures';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-blue-600">Venture Bali</h1>
          <p className="text-gray-600 mt-1">
            Discover amazing adventures in Bali
          </p>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Featured Adventures
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockVentures.map((venture) => (
            <VentureCard
              key={venture.id}
              venture={venture}
              onSelect={(id) => console.log('Selected venture:', id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
