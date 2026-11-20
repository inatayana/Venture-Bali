/**
 * Deterministic conversion messages for the growth loop.
 *
 * These builders are pure: no network calls, no env vars, no invented urgency.
 * The wishlist CTA uses a WhatsApp deep link (guest initiates the message), so
 * it needs no Meta template approval. The hold-recovery text is ready for the
 * existing notification channel when outbound messaging is approved.
 */

export const CONCIERGE_WHATSAPP_URL = 'https://wa.me/6285117321388';

export function buildWishlistEnquiryUrl(input: {
  title: string;
  id: string;
  slug: string;
  baseUrl: string;
}): string {
  const url = `${input.baseUrl}/experiences/${input.id}/${input.slug}`;
  const text = `Hi, I saved "${input.title}" on my wishlist. Is it available for my dates? ${url}`;
  return `${CONCIERGE_WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}

export function buildHoldRecoveryText(input: {
  bookingCode: string;
  title: string;
  dateLabel: string;
  checkoutUrl: string;
}): string {
  return [
    `Your reservation ${input.bookingCode} for ${input.title} on ${input.dateLabel} is still on hold.`,
    'Finish the payment to keep your slot.',
    `Checkout: ${input.checkoutUrl}`,
    'Need help? Chat our Ubud team on WhatsApp.',
  ].join('\n');
}
