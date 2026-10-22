import '@/styles/globals.css';
import type { Metadata } from 'next';
import { barlowCondensed, plusJakartaSans } from '@/styles/fonts';

export const metadata: Metadata = {
  title: 'Venture Bali',
  description: 'Adventure tourism booking platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${plusJakartaSans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
