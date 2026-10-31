'use client';

interface PromoBannerProps {
  code: string;
  label: string;
  onDismiss: () => void;
}

/**
 * Global promotion strip. Rendered at the top of the product page and
 * dismissible for the session (localStorage in the parent).
 */
export function PromoBanner({ code, label, onDismiss }: PromoBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-900 px-4 py-3 text-white">
      <p className="text-sm">
        <span className="font-semibold">{label}</span>{' '}
        <span className="text-white/70">· use code</span>{' '}
        <span className="rounded bg-brand px-1.5 py-0.5 font-mono text-xs font-bold tracking-wide text-brand-ink">
          {code}
        </span>
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-full text-white/70 hover:text-white"
        aria-label="Dismiss promotion"
      >
        ✕
      </button>
    </div>
  );
}
