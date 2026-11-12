'use client';

import { AlertTriangle } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Last-resort boundary for errors thrown in the root layout.
 *
 * This replaces the root layout, so it must render its own <html> and <body>.
 * Inline styles are intentional: Tailwind may not be available at this point.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#fafafa',
          color: '#111827',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
          }}
        >
          <div style={{ maxWidth: '480px', textAlign: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '9999px',
                background: '#fef3c7',
                color: '#b45309',
              }}
            >
              <AlertTriangle size={28} aria-hidden="true" />
            </span>
            <h1 style={{ marginTop: '16px', fontSize: '26px', lineHeight: 1.2 }}>
              BaliWild hit a problem
            </h1>
            <p style={{ marginTop: '12px', fontSize: '15px', lineHeight: 1.6, color: '#4b5563' }}>
              The page could not start. Reload to try again. If it keeps happening, contact
              support@baliwild.com and quote the reference below.
            </p>
            {error.digest && (
              <p style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
                Reference: <code>{error.digest}</code>
              </p>
            )}
            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={reset}
                style={{
                  minHeight: '44px',
                  padding: '0 24px',
                  borderRadius: '8px',
                  border: 0,
                  background: '#000000',
                  color: '#FFEE00',
                  fontSize: '14px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 24px',
                  borderRadius: '8px',
                  border: '2px solid #111827',
                  color: '#111827',
                  fontSize: '14px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                }}
              >
                Back to home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
