'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface HeroGalleryProps {
  /** Array of image URLs to display in the gallery */
  images: readonly string[];
  /** Auto-play interval in milliseconds (0 to disable) */
  autoPlayInterval?: number;
  /** Whether to show navigation arrows */
  showArrows?: boolean;
  /** Whether to show dot indicators */
  showIndicators?: boolean;
  /** Optional alt text prefix for accessibility */
  altPrefix?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Hero gallery carousel for the home page hero section.
 * Displays a rotating set of adventure images with smooth transitions,
 * navigation arrows, dot indicators, auto-play, and swipe support.
 *
 * Features:
 * - Smooth CSS transitions between slides
 * - Keyboard navigation (ArrowLeft/ArrowRight)
 * - Touch/swipe support on mobile
 * - Auto-play with pause on hover/focus
 * - Accessible with proper ARIA labels
 * - Responsive: larger on desktop, optimized for mobile
 */
export function HeroGallery({
  images,
  autoPlayInterval = 5000,
  showArrows = true,
  showIndicators = true,
  altPrefix = 'Bali adventure',
  className,
}: HeroGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);

  const goToNext = useCallback(() => {
    if (isAnimating || images.length <= 1) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [images.length, isAnimating]);

  const goToPrev = useCallback(() => {
    if (isAnimating || images.length <= 1) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [images.length, isAnimating]);

  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating || index === currentIndex || index < 0 || index >= images.length) return;
      setIsAnimating(true);
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), 500);
    },
    [currentIndex, images.length, isAnimating]
  );

  // Handle auto-play
  useEffect(() => {
    if (autoPlayInterval <= 0 || images.length <= 1) return;

    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        if (!isHovered && !isFocused && !isAnimating) {
          setCurrentIndex((prev) => (prev + 1) % images.length);
        }
      }, autoPlayInterval);
    };

    const stopAutoPlay = () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };

    startAutoPlay();
    return stopAutoPlay;
  }, [autoPlayInterval, images.length, isHovered, isFocused, isAnimating]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [images.length, isAnimating, goToNext, goToPrev]);

  // Touch/swipe handlers
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    startXRef.current = event.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const diff = startXRef.current - event.touches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
      startXRef.current = null;
    }
  }, [goToNext, goToPrev]);

  const handleTouchEnd = useCallback(() => {
    startXRef.current = null;
  }, []);

  // Preload adjacent images for smoother transitions
  useEffect(() => {
    const preloadIndices = [
      currentIndex,
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length,
    ];

    preloadIndices.forEach((idx) => {
      const img = new window.Image();
      img.src = images[idx];
    });
  }, [currentIndex, images]);

  if (images.length === 0) return null;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-neutral-900',
        'lg:rounded-3xl',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Adventure gallery"
    >
      {/* Gallery track */}
      <div
        ref={trackRef}
        className="flex transition-transform duration-500 ease-out will-change-transform"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((image, index) => (
          <div key={image} className="flex-shrink-0 w-full" style={{ width: '100%' }}>
            <Image
              src={image}
              alt={`${altPrefix} ${index + 1}`}
              fill
              priority={index === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-[50vh] min-h-[300px] max-h-[600px] w-full object-cover object-center"
              quality={85}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {showArrows && images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            disabled={isAnimating}
            aria-label="Previous image"
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm',
              'transition-all duration-200 hover:bg-black/60 hover:scale-110',
              'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-black',
              'disabled:opacity-50 disabled:pointer-events-none',
              'lg:left-6 lg:h-14 lg:w-14'
            )}
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            disabled={isAnimating}
            aria-label="Next image"
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm',
              'transition-all duration-200 hover:bg-black/60 hover:scale-110',
              'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-black',
              'disabled:opacity-50 disabled:pointer-events-none',
              'lg:right-6 lg:h-14 lg:w-14'
            )}
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {showIndicators && images.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2"
          role="tablist"
          aria-label="Slide indicators"
        >
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              disabled={isAnimating}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-black',
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/75'
              )}
            />
          ))}
        </div>
      )}

      {/* Slide counter (desktop only) */}
      {images.length > 1 && (
        <div className="hidden lg:absolute lg:bottom-4 lg:right-6 lg:px-3 lg:py-1.5 lg:rounded-full lg:bg-black/40 lg:backdrop-blur-sm lg:text-white lg:text-sm lg:font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}