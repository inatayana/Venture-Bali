import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { barlowCondensed, plusJakartaSans } from '@/styles/fonts';
import { InstallPrompt } from '@/components/InstallPrompt';
import { PwaRegistration } from '@/components/PwaRegistration';
import { ChatWidget } from '@/components/chat/ChatWidget';

export const metadata: Metadata = {
  title: 'Venture Bali',
  description: 'Adventure tourism booking platform',
  applicationName: 'Venture Bali',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Venture Bali',
  },
  formatDetection: { telephone: false },
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
  themeColor: '#111827',
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
        <PwaRegistration />
        <InstallPrompt />
        <ChatWidget />
      </body>
    </html>
  );
}
