import { mockVentures } from '@/data/mockVentures';
import { formatPrice } from '@/lib/i18n';

export default function AdminVenturesPage() {
  return (
    <div>
      <h1 className="heading-caps text-2xl text-gray-900 mb-1">Ventures</h1>
      <p className="text-sm text-gray-500 mb-6">Catalog management — mock data preview</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium text-right">Base Price</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Variants</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockVentures.map((venture) => (
                <tr key={venture.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-heading font-semibold text-gray-900">{venture.title}</p>
                    <p className="text-xs text-gray-400">/ventures/{venture.slug}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 capitalize">{venture.category}</td>
                  <td className="px-5 py-3.5 text-right font-heading font-bold tabular-nums text-gray-900">
                    {formatPrice(venture.priceIdr)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 tabular-nums">
                    {venture.rating.toFixed(1)} ({venture.reviewCount})
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 tabular-nums">{venture.durationHours}h</td>
                  <td className="px-5 py-3.5 text-gray-600 tabular-nums">{venture.variants?.length ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        venture.isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {venture.isAvailable ? 'Active' : 'Sold Out'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
