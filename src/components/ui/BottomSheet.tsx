'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Pinned below the scroll area — used for the checkout summary + Next button. */
  footer?: React.ReactNode;
  className?: string;
}

const DISMISS_THRESHOLD_PX = 120;

/**
 * Mobile-first bottom sheet.
 *
 * Animation is transform-only (translateY) so the slide-up and drag-dismiss
 * stay on the compositor thread at 60fps. No animation library is needed.
 * Includes a drag handle, swipe-to-dismiss, Escape handling, body scroll lock
 * and a lightweight focus trap.
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const dragState = useRef<{ active: boolean; startY: number }>({ active: false, startY: 0 });
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    previousFocus.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    function trapTab(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', trapTab);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', trapTab);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [isOpen, handleEscape]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = { active: true, startY: event.clientY };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;
    const delta = event.clientY - dragState.current.startY;
    setDragY(Math.max(0, delta));
  };

  const endDrag = () => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    setIsDragging(false);
    if (dragY > DISMISS_THRESHOLD_PX) {
      setDragY(0);
      onClose();
    } else {
      setDragY(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className={cn(
          'relative w-full sm:max-w-lg flex flex-col overflow-hidden',
          'bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl',
          'max-h-[92vh] animate-slide-up',
          className
        )}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 180ms ease-out',
          willChange: 'transform',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="shrink-0 touch-none"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="flex justify-center pt-2.5 pb-1" aria-hidden="true">
            <span className="h-1.5 w-10 rounded-full bg-neutral-300" />
          </div>
          <div className="flex items-center justify-between px-4 pb-3 border-b border-neutral-100">
            <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-1 rounded-full hover:bg-neutral-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
