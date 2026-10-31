/**
 * Venture Bali — E-Voucher QR code generation.
 *
 * Server-only: the QR is rendered as an SVG data URL so the voucher page can
 * stay a light client component. The encoded payload is the public
 * verification URL, not internal database ids.
 */

import QRCode from 'qrcode';
import { getBaseUrl } from './seo';

export interface VoucherQRCodeOptions {
  width?: number;
  margin?: number;
  color?: { dark: string; light: string };
}

/** Payload encoded in the voucher QR code — a URL staff can scan. */
export function generateQRCodeData(bookingCode: string): string {
  return `${getBaseUrl()}/voucher/verify/${encodeURIComponent(bookingCode)}`;
}

/**
 * Render a scannable QR code as an SVG data URL.
 * SVG keeps it crisp at any size and avoids a canvas dependency on the server.
 */
export async function generateQRCodeDataURL(
  data: string,
  options: VoucherQRCodeOptions = {}
): Promise<string> {
  const { width = 512, margin = 2, color = { dark: '#111827', light: '#ffffff' } } = options;

  const svg = await QRCode.toString(data, {
    type: 'svg',
    width,
    margin,
    color,
    errorCorrectionLevel: 'M',
  });

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}
