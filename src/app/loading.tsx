import { CardSkeleton, Skeleton } from '@/components/ui';

/** Route-level skeleton: shows the hero and card shells while the catalogue loads. */
export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 h-[57px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)]" />

      <div className="bg-brand-ink">
        <div className="container mx-auto space-y-3 px-4 pt-10 sm:pt-16">
          <Skeleton className="h-6 w-56 rounded-full bg-white/15" />
          <Skeleton className="h-11 w-[70%] bg-white/15" />
          <Skeleton className="h-11 w-[45%] bg-white/15" />
          <Skeleton className="h-5 w-[60%] bg-white/10" />
          <Skeleton className="mt-4 h-[92px] w-full rounded-2xl bg-white/15" />
        </div>
        <div className="container mx-auto mt-8 border-t border-white/10 px-4 py-3">
          <Skeleton className="h-4 w-80 bg-white/10" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-[86px] w-[84px] shrink-0 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
