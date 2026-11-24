import { Metadata } from 'next';
import { WaiverSigningPage } from '@/components/features/WaiverSigning';

interface WaiverPageProps {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ access?: string; token?: string }>;
}

export const metadata: Metadata = {
  title: 'Sign Safety Waiver | BaliWild',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function WaiverPage({ params, searchParams }: WaiverPageProps) {
  const { bookingId } = await params;
  const { access, token } = await searchParams;

  return (
    <WaiverSigningPage bookingId={bookingId} accessToken={access || token || ''} />
  );
}