import { Search, SlidersHorizontal } from 'lucide-react';

interface ExploreSearchBarProps {
  onOpenChange: (open: boolean) => void;
}

export function ExploreSearchBar({ onOpenChange }: ExploreSearchBarProps) {
  return (
    <section className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-neutral-200 dark:border-white/10 dark:bg-neutral-950/95">
      <div className="container mx-auto px-4 py-4">
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="w-full flex min-h-[52px] items-center gap-3 px-4 rounded-xl border border-neutral-200 bg-white hover:border-brand-ink/50 hover:bg-brand/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          aria-label="Search adventures"
        >
          <Search className="w-5 h-5 text-neutral-400 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left text-base text-neutral-500 font-medium">
            Start your search…
          </span>
          <SlidersHorizontal className="w-5 h-5 text-neutral-400 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}