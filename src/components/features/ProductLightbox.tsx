'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ChevronLeft, ChevronRight, LayoutGrid, X } from 'lucide-react';

interface ProductLightboxProps {
  images: string[];
  /** null = closed */
  index: number | null;
  title: string;
  onClose: () => void;
  onChange: (index: number) => void;
}

/**
 * Immersive photo viewer with two modes:
 * - single-photo lightbox with prev/next and a thumbnail strip
 * - "all photos" masonry grid, opened from the grid button
 *
 * Close with the round X, the backdrop or Escape. In grid mode the back arrow
 * returns to the single-photo view.
 */
export function ProductLightbox({ images, index, title, onClose, onChange }: ProductLightboxProps) {
  const isOpen = index !== null;
  const [isGridView, setIsGridView] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsGridView(false);
      return;
    }

    previousFocus.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || index === null) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isGridView) setIsGridView(false);
        else onClose();
        return;
      }
      if (isGridView) return;
      if (event.key === 'ArrowRight') onChange((index + 1) % images.length);
      if (event.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, index, images.length, isGridView, onChange, onClose]);

  if (!isOpen || index === null) return null;

  const current = images[index];
  const hasMany = images.length > 1;
  const go = (nextIndex: number) => onChange((nextIndex + images.length) % images.length);

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in flex-col bg-neutral-950/[0.98] backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photo gallery`}
      onClick={onClose}
    >
      {/* Header: grid toggle · counter · close */}
      <div className="grid shrink-0 grid-cols-[44px_1fr_44px] items-center px-4 py-3 text-white">
        {isGridView ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsGridView(false);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/25"
            aria-label="Back to photo"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsGridView(true);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/25"
            aria-label="View all photos"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
        )}

        <span className="text-center text-sm font-medium tabular-nums">
          {isGridView ? `All photos (${images.length})` : `${index + 1} of ${images.length}`}
        </span>

        <button
          ref={closeRef}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
          aria-label="Close gallery"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {isGridView ? (
        <div
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto max-w-6xl columns-2 gap-2 sm:columns-3 lg:columns-4">
            {images.map((image, imageIndex) => (
              <button
                key={`${image}-${imageIndex}`}
                type="button"
                onClick={() => {
                  onChange(imageIndex);
                  setIsGridView(false);
                }}
                className="group relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-lg"
                aria-label={`Open photo ${imageIndex + 1}`}
              >
                <Image
                  src={image}
                  alt={`${title} — photo ${imageIndex + 1}`}
                  width={600}
                  height={400}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading="lazy"
                  className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          onClick={(event) => event.stopPropagation()}
        >
          {hasMany && (
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:left-4"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <div className="relative h-full w-full max-w-5xl">
            <Image
              src={current}
              alt={`${title} — photo ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {hasMany && (
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:right-4"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
