import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { barlowCondensed, plusJakartaSans } from '@/styles/fonts';
import { InstallPrompt } from '@/components/InstallPrompt';
import { PwaRegistration } from '@/components/PwaRegistration';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { CookieConsent } from '@/components/CookieConsent';
import { AnalyticsPageView } from '@/components/AnalyticsPageView';
import {
  BRAND_NAME,
  BRAND_SHORT_DESCRIPTION,
  BRAND_TITLE,
} from '@/lib/brand';

export const metadata: Metadata = {
  title: BRAND_TITLE,
  description: BRAND_SHORT_DESCRIPTION,
  applicationName: BRAND_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: BRAND_NAME,
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: BRAND_TITLE,
    description: BRAND_SHORT_DESCRIPTION,
    siteName: BRAND_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND_TITLE,
    description: BRAND_SHORT_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${plusJakartaSans.variable}`}>
      <body className="font-sans">
        {children}
        <AnalyticsPageView />
        <PwaRegistration />
        <InstallPrompt />
        <CookieConsent />
        <ChatWidget />
      </body>
    </html>
  );
}
