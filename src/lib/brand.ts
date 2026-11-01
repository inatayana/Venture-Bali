/**
 * Public-facing brand strings used by metadata, structured data and emails.
 *
 * The domain/brand decision is still open, so keep every SEO-facing name here:
 * switching to another name later means changing this file (plus the deployed
 * NEXT_PUBLIC_APP_URL), not hunting through templates.
 */
export const BRAND_NAME = 'Venture Bali';
export const BRAND_EDITORIAL_AUTHOR = 'Venture Bali Editorial Team';
export const BRAND_DESCRIPTION =
  'Adventure bookings across Bali with licensed local operators — instant confirmation and free reschedule up to 24 hours before.';
export const BRAND_ADDRESS = {
  locality: 'Ubud',
  region: 'Gianyar',
  region2: 'Bali',
  country: 'ID',
} as const;
