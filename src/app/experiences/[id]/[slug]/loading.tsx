import { Skeleton } from '@/components/ui';

/** Route-level skeleton for the product page. */
export default function ExperienceLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="h-14 border-b border-neutral-200 bg-white" />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[minmax(340px,380px)_1fr] lg:items-start">
        <div className="hidden space-y-3 rounded-2xl border border-neutral-200 p-5 lg:block">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-9 w-1/2" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-[300px] w-full rounded-2xl sm:h-[440px]" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
