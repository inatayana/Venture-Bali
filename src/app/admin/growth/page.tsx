import { getGrowthMetrics } from '@/lib/growthMetrics';

export const dynamic = 'force-dynamic';

const formatNumber = (value: number): string => new Intl.NumberFormat('id-ID').format(value);

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}

export default async function AdminGrowthPage() {
  const metrics = await getGrowthMetrics();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Growth</h1>
        <p className="mt-1 text-sm text-neutral-500">
          KPI yang dihitung dari data tersimpan. Sesi organik dan peringkat dibaca dari GA4 / Search
          Console, bukan dari halaman ini.
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Diperbarui {new Date(metrics.generatedAt).toLocaleString('id-ID')}
        </p>
      </header>

      <section aria-labelledby="conversion-heading" className="space-y-3">
        <h2 id="conversion-heading" className="text-lg font-semibold text-neutral-900 dark:text-white">
          Konversi
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <MetricCard label="Booking" value={formatNumber(metrics.conversion.bookings)} />
          <MetricCard
            label="Booking 30 hari"
            value={formatNumber(metrics.conversion.bookingsLast30Days)}
          />
          <MetricCard label="Lunas" value={formatNumber(metrics.conversion.paidBookings)} />
          <MetricCard
            label="Lunas 30 hari"
            value={formatNumber(metrics.conversion.paidBookingsLast30Days)}
          />
          <MetricCard
            label="Pendapatan lunas"
            value={`Rp${formatNumber(metrics.conversion.paidRevenueIdr)}`}
            hint="IDR, dari Payment grossAmount"
          />
        </div>
      </section>

      <section aria-labelledby="content-heading" className="space-y-3">
        <h2 id="content-heading" className="text-lg font-semibold text-neutral-900 dark:text-white">
          Konten & kepercayaan
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <MetricCard label="Produk" value={formatNumber(metrics.catalogue.ventures)} />
          <MetricCard
            label="Artikel terbit"
            value={formatNumber(metrics.catalogue.publishedArticles)}
            hint={`dari ${formatNumber(metrics.catalogue.totalArticles)} total`}
          />
          <MetricCard
            label="Artikel 30 hari"
            value={formatNumber(metrics.catalogue.articlesLast30Days)}
          />
          <MetricCard
            label="Review disetujui"
            value={formatNumber(metrics.catalogue.approvedReviews)}
          />
        </div>
      </section>
    </div>
  );
}
