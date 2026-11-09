import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
  beforeSend(event) {
    // Filter out noisy errors in production
    if (process.env.NODE_ENV === 'production') {
      // Ignore network errors from client that we can't control
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }
      // Ignore resize observer loop errors (common browser noise)
      if (event.exception?.values?.[0]?.value?.includes?.('ResizeObserver loop')) {
        return null;
      }
    }
    return event;
  },
});