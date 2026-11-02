import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';
import { formatPrice } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function AdminVenturesPage() {
  const rows = await prisma.venture.findMany({
    include: ventureWithRelations,
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });

  const ventures = rows.map(toVentureItem);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Ventures</h1>
          <p className="text-sm text-foreground-muted mt-1">
            {ventures.length} products in the catalogue.
          </p>
        </div>
        <Link
          href="/admin/content"
          className="text-sm text-foreground hover:underline"
        >
          Generate content
        </Link>
      </header>

      {ventures.length === 0 ? (
        <div className="bg-surface rounded-xl shadow-sm border border-line p-10 text-center">
          <p className="text-foreground-muted">No ventures in the catalogue yet.</p>
          <p className="text-sm text-foreground-secondary mt-2">
            Run <code className="font-mono text-xs bg-inset px-1.5 py-0.5 rounded">npm run db:seed</code>{' '}
            to load the demo catalogue.
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-foreground-secondary border-b border-line bg-base">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Variants</th>
                  <th className="px-4 py-3 font-medium">From</th>
                  <th className="px-4 py-3 font-medium">Max pax</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Public page</th>
                </tr>
              </thead>
              <tbody>
                {ventures.map((venture) => (
                  <tr key={venture.id} className="border-b border-line last:border-0 hover:bg-base/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{venture.title}</p>
                      <p className="text-xs text-foreground-secondary font-mono">{venture.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary">{venture.category}</td>
                    <td className="px-4 py-3 text-foreground-secondary">
                      {venture.variants.map((v) => v.title).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-foreground tabular-nums">
                      {formatPrice(venture.priceIdr)}
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary tabular-nums">
                      {venture.maxParticipants}
                    </td>
                    <td className="px-4 py-3 text-foreground tabular-nums">
                      {venture.rating.toFixed(1)}
                      <span className="text-foreground-secondary"> ({venture.reviewCount})</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/ventures/${venture.id}`}
                          className="text-foreground hover:underline text-xs font-medium"
                        >
                          Manage
                        </Link>
                        <Link
                          href={`/experiences/${venture.id}/${venture.slug}`}
                          className="text-foreground-muted hover:underline text-xs"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
