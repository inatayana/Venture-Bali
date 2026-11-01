import { getBaseUrl } from './seo';

/**
 * Links used by the post-trip review request.
 *
 * `buildReviewUrl` is the human link; `buildReviewQrUrl` points at the SVG QR
 * endpoint so the code can be embedded in an email (data-URI images are
 * blocked by several mail clients). The QR itself encodes the same URL.
 */
export function buildReviewUrl(bookingId: string, token: string): string {
  return `${getBaseUrl()}/review/${encodeURIComponent(bookingId)}?token=${encodeURIComponent(token)}`;
}

export function buildReviewQrUrl(bookingId: string, token: string): string {
  return `${getBaseUrl()}/api/reviews/qr?bookingId=${encodeURIComponent(
    bookingId
  )}&token=${encodeURIComponent(token)}`;
}
