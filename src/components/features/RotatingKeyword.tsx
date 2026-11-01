'use client';

import { useEffect, useState } from 'react';

export const HERO_KEYWORDS = [
  'Adrenaline',
  'ATV Ride',
  'River Rafting',
  'Mount Batur Trekking',
  'River Tubing',
  'Zipline',
  'Bali Swing',
] as const;

const TYPE_MS = 65;
const DELETE_MS = 32;
const HOLD_MS = 1400;
const BETWEEN_MS = 220;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  return reduced;
}

/**
 * Typewriter headline keyword.
 *
 * Types a word, holds it, deletes it and moves to the next one. The container
 * keeps a fixed line height and the word never wraps, so the hero does not
 * shift while the text grows (no CLS).
 */
export function RotatingKeyword({ keywords = HERO_KEYWORDS }: { keywords?: readonly string[] }) {
  const words = keywords.length > 0 ? keywords : HERO_KEYWORDS;
  const reducedMotion = usePrefersReducedMotion();

  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState(reducedMotion ? words[0] : '');
  const [phase, setPhase] = useState<'typing' | 'holding' | 'deleting'>('typing');

  useEffect(() => {
    if (reducedMotion) {
      setText(words[0]);
      return;
    }

    const word = words[wordIndex % words.length];
    let timer: number;

    if (phase === 'typing') {
      if (text.length < word.length) {
        timer = window.setTimeout(() => setText(word.slice(0, text.length + 1)), TYPE_MS);
      } else {
        timer = window.setTimeout(() => setPhase('holding'), HOLD_MS);
      }
    } else if (phase === 'holding') {
      timer = window.setTimeout(() => setPhase('deleting'), BETWEEN_MS);
    } else if (text.length > 0) {
      timer = window.setTimeout(() => setText(word.slice(0, text.length - 1)), DELETE_MS);
    } else {
      timer = window.setTimeout(() => {
        setWordIndex((index) => (index + 1) % words.length);
        setPhase('typing');
      }, BETWEEN_MS);
    }

    return () => window.clearTimeout(timer);
  }, [text, phase, wordIndex, words, reducedMotion]);

  return (
    <span className="inline-flex min-h-[1.1em] items-center whitespace-nowrap">
      <span className="bg-brand px-2 text-brand-ink">{text || '\u00A0'}</span>
      <span
        aria-hidden="true"
        className="ml-0.5 inline-block h-[1em] w-[3px] animate-blink bg-brand"
      />
    </span>
  );
}
