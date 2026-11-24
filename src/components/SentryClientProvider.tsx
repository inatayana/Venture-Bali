'use client';

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
  beforeSend(event) {
    if (process.env.NODE_ENV === 'production') {
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }
      if (event.exception?.values?.[0]?.value?.includes?.('ResizeObserver loop')) {
        return null;
      }
    }
    return event;
  },
});

export const SentryClientProvider = () => null;