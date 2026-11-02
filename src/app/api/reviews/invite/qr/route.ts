import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { buildInviteUrl, verifyInviteToken } from '@/lib/reviewInvite';

export const dynamic = 'force-dynamic';

/** SVG QR for a founding-guest invite. Only live, unused invites render. */
export async function GET(request: NextRequest) {
  const inviteId = request.nextUrl.searchParams.get('inviteId')?.trim();
  const token = request.nextUrl.searchParams.get('token')?.trim();

  if (!inviteId || !token || !verifyInviteToken(inviteId, token)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid invite link' } },
      { status: 400 },
    );
  }

  const invite = await prisma.reviewInvite.findUnique({
    where: { id: inviteId },
    select: { status: true, expiresAt: true },
  });
  if (!invite || invite.status !== 'UNUSED' || invite.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { success: false, error: { code: 'INVITE_UNAVAILABLE', message: 'Invite is no longer active' } },
      { status: 404 },
    );
  }

  try {
    const svg = await QRCode.toString(buildInviteUrl(inviteId, token), {
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
    console.error('Invite QR generation failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not render the QR code' } },
      { status: 500 },
    );
  }
}
