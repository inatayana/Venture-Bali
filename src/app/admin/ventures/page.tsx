import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';
import { formatPrice } from '@/lib/i18n';
import { mockExperiences } from '@/data/mockExperiences';

export const dynamic = 'force-dynamic';

/** Row shape with the relations toVentureItem needs. */
type AdminVentureRow = Prisma.VentureGetPayload<{
  include: ReturnType<typeof ventureWithRelations>;
}>;

export default async function AdminVenturesPage() {
  let rows: AdminVentureRow[] = [];

  try {
    rows = await prisma.venture.findMany({
      include: ventureWithRelations(),
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });
  } catch (error) {
    console.warn('Database unavailable for admin ventures, using mock data:', error);
  }

  const ventures = rows.length > 0 ? rows.map(toVentureItem) : mockExperiences;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Ventures</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {ventures.length} products in the catalogue.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/content"
            className="inline-flex min-h-[44px] items-center text-sm text-brand-ink hover:underline"
          >
            Generate content
          </Link>
          <Link
            href="/admin/ventures/new"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-neutral-900 dark:bg-white px-4 text-sm font-semibold text-white dark:text-neutral-900"
          >
            + New product
          </Link>
        </div>
      </header>

      {ventures.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">No ventures in the catalogue yet.</p>
          <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">
            Run <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">npm run db:seed</code>{' '}
            to load the demo catalogue.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
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
                  <tr key={venture.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{venture.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">{venture.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{venture.category}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {venture.variants.map((v) => v.title).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 tabular-nums">
                      {formatPrice(venture.priceIdr)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 tabular-nums">
                      {venture.maxParticipants}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 tabular-nums">
                      {venture.rating.toFixed(1)}
                      <span className="text-gray-600 dark:text-gray-400"> ({venture.reviewCount})</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/ventures/${venture.id}`}
                          className="text-brand-ink hover:underline text-xs font-medium"
                        >
                          Manage
                        </Link>
                        <Link
                          href={`/experiences/${venture.id}/${venture.slug}`}
                          className="text-gray-500 dark:text-gray-400 hover:underline text-xs"
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
