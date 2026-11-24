'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Z_INDEX } from '@/lib/zIndex';

export interface ToastProps {
  open: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  /** Auto-dismiss delay in ms (default 5s). */
  durationMs?: number;
}

/**
 * Toast — a short, centered notification. Supports an optional action
 * button (e.g. "Undo" when a wishlist item is removed) and auto-dismisses
 * after a few seconds.
 */
export function Toast({ open, message, actionLabel, onAction, onClose, durationMs = 5000 }: ToastProps) {
  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => onClose(), durationMs);
    return () => clearTimeout(timer);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      style={{ zIndex: Z_INDEX.toast }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg"
    >
      <span>{message}</span>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={() => {
            onAction();
            onClose();
          }}
          className="ml-3 rounded-lg bg-brand-ink px-3 py-1.5 font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          {actionLabel}
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Close toast"
        onClick={onClose}
        className="ml-2 rounded p-1 text-white/70 transition-colors hover:text-white"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
