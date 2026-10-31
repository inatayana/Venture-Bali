'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'vb_install_dismissed';

/**
 * Lightweight "add to home screen" prompt.
 * Only offered on the homepage (where there is no sticky checkout bar) and
 * only when the browser actually fires `beforeinstallprompt`.
 */
export function InstallPrompt() {
  const pathname = usePathname();
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;
    if (window.localStorage.getItem(DISMISS_KEY) === '1') return;

    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !promptEvent || pathname !== '/') return null;

  const install = async () => {
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setVisible(false);
  };

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 rounded-xl bg-neutral-900 p-3 text-white shadow-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install Venture Bali</p>
          <p className="text-xs text-white/70">Faster booking, works offline.</p>
        </div>
        <button
          type="button"
          onClick={install}
          className="min-h-[44px] rounded-lg bg-white px-4 text-sm font-semibold text-neutral-900"
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-white/70 hover:text-white"
          aria-label="Dismiss install prompt"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
