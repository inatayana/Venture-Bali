/**
 * Venture Bali — E-Voucher Generation with QR Code
 */

import { createHash } from 'crypto';

export interface VoucherData {
  bookingId: string;
  bookingCode: string;
  ventureTitle: string;
  customerName: string;
  bookingDate: string;
  slotTime: string;
  paxCount: number;
  totalPrice: number;
  issuedAt: Date;
}

export function generateVoucherId(bookingId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const hash = createHash('sha256').update(bookingId + timestamp).digest('hex').substring(0, 8).toUpperCase();
  return `VR-${timestamp}-${hash}`;
}

export function generateQRCodeData(voucherId: string, bookingCode: string): string {
  // QR code contains voucher verification URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://venturebali.com';
  return `${baseUrl}/voucher/verify/${voucherId}?code=${bookingCode}`;
}

export interface VoucherQRCodeOptions {
  width?: number;
  margin?: number;
  color?: { dark: string; light: string };
}

export async function generateQRCodeDataURL(
  data: string,
  options: VoucherQRCodeOptions = {}
): Promise<string> {
  // In production, use a library like 'qrcode' or 'qrcode-terminal'
  // For now, return a placeholder SVG data URL
  const { width = 256, margin = 2, color = { dark: '#000000', light: '#ffffff' } } = options;

  // Simple QR code placeholder - in production use actual QR library
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${width} ${width}">
      <rect width="${width}" height="${width}" fill="${color.light}"/>
      <rect x="${margin * 10}" y="${margin * 10}" width="${width - margin * 20}" height="${width - margin * 20}" fill="${color.dark}" opacity="0.1"/>
      <text x="${width / 2}" y="${width / 2}" text-anchor="middle" font-family="monospace" font-size="10" fill="${color.dark}">
        QR: ${data.substring(0, 30)}...
      </text>
    </svg>
  `;

  const base64 = Buffer.from(svg.trim()).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

export async function generateVoucherPDF(voucher: VoucherData, qrCodeDataURL: string): Promise<Buffer> {
  // In production, use a library like 'pdfkit' or 'puppeteer' to generate PDF
  // For now, return a placeholder
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>E-Voucher - ${voucher.bookingCode}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .voucher { border: 2px solid #1E40AF; border-radius: 12px; padding: 30px; max-width: 500px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #1E40AF; }
        .title { font-size: 24px; margin: 10px 0; }
        .details { background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .label { color: #6B7280; }
        .value { font-weight: bold; }
        .qr-section { text-align: center; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="voucher">
        <div class="header">
          <div class="logo">🌴 Venture Bali</div>
          <div class="title">E-Voucher</div>
          <div class="booking-code">${voucher.bookingCode}</div>
        </div>
        <div class="details">
          <div class="detail-row"><span class="label">Activity:</span><span class="value">${voucher.ventureTitle}</span></div>
          <div class="detail-row"><span class="label">Guest:</span><span class="value">${voucher.customerName}</span></div>
          <div class="detail-row"><span class="label">Date:</span><span class="value">${voucher.bookingDate}</span></div>
          <div class="detail-row"><span class="label">Time:</span><span class="value">${voucher.slotTime}</span></div>
          <div class="detail-row"><span class="label">Participants:</span><span class="value">${voucher.paxCount}</span></div>
          <div class="detail-row"><span class="label">Total Paid:</span><span class="value">Rp ${voucher.totalPrice.toLocaleString('id-ID')}</span></div>
        </div>
        <div class="qr-section">
          <img src="${qrCodeDataURL}" alt="QR Code" width="150" height="150" />
          <p style="font-size: 12px; color: #6B7280; margin-top: 8px;">Show this QR code at the venue</p>
        </div>
        <div class="footer">
          Voucher ID: ${generateVoucherId(voucher.bookingId)}<br>
          Issued: ${voucher.issuedAt.toLocaleString()}<br>
          This voucher is valid for one-time use only.
        </div>
      </div>
    </body>
    </html>
  `;

  // Return HTML as buffer (in production, convert to PDF)
  return Buffer.from(html, 'utf-8');
}