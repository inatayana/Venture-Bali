import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { verifyCustomerLinkToken } from '@/lib/customerLink';
import { buildReviewUrl } from '@/lib/reviewLink';

export const dynamic = 'force-dynamic';

/**
 * Scannable QR code for a review request.
 *
 * The signed customer token is the authorisation, so the endpoint only renders
 * links that were issued by the booking flow. Response is SVG, which stays
 * crisp in email clients and on printed cards.
 */
export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get('bookingId')?.trim();
  const token = request.nextUrl.searchParams.get('token')?.trim();

  if (!bookingId || !token || !verifyCustomerLinkToken(token)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid review link' } },
      { status: 400 }
    );
  }

  try {
    const svg = await QRCode.toString(buildReviewUrl(bookingId, token), {
      type: 'svg',
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    });

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('Review QR generation failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not render the QR code' } },
      { status: 500 }
    );
  }
}
