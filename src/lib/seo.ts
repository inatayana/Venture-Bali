import type { Metadata } from 'next';
import type { VentureItem } from '@/types/venture';

export type SupportedDomain = 'venture-bali.com' | 'localhost';

const FALLBACK_BASE_URL = 'https://venture-bali.com';

export function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_BASE_URL).replace(/\/$/, '');
}

interface GenerateVentureParams {
  venture: VentureItem;
  /** Preferred: any absolute base URL (env-driven). */
  baseUrl?: string;
  /** Legacy call-site support. Ignored when `baseUrl` is provided. */
  domain?: SupportedDomain;
  isAdmin?: boolean;
}

function resolveBaseUrl({ baseUrl, domain }: GenerateVentureParams): string {
  if (baseUrl) return baseUrl.replace(/\/$/, '');
  if (domain) return `https://${domain}`;
  return getBaseUrl();
}

function resolveImageUrl(baseUrl: string, imageUrl: string): string {
  return /^https?:\/\//.test(imageUrl) ? imageUrl : `${baseUrl}${imageUrl}`;
}

export function generateVentureMetadata(params: GenerateVentureParams): Metadata {
  const { venture, isAdmin = false } = params;
  const baseUrl = resolveBaseUrl(params);
  const canonicalUrl = isAdmin
    ? `${baseUrl}/admin/experiences/${venture.id}/${venture.slug}`
    : `${baseUrl}/experiences/${venture.id}/${venture.slug}`;

  const title = `${venture.title} | Venture Bali`;
  const description = venture.description.length > 160
    ? `${venture.description.substring(0, 157)}...`
    : venture.description;

  const imageUrl = resolveImageUrl(baseUrl, venture.imageUrl);

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Venture Bali',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: venture.title,
        },
      ],
      type: 'article',
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        noarchive: true,
        nosnippet: false,
        notranslate: true,
      },
    },
  };
}

/**
 * JSON-LD for the product detail page.
 * Emits a Product offer plus FAQPage — the two rich-result types Google
 * actually awards for experiences — instead of the previous
 * TouristAttraction-only payload with fake geo coordinates and a fake phone.
 */
export function generateVentureStructuredData(params: GenerateVentureParams): Record<string, unknown> {
  const { venture, isAdmin = false } = params;
  const baseUrl = resolveBaseUrl(params);
  const canonicalUrl = isAdmin
    ? `${baseUrl}/admin/experiences/${venture.id}/${venture.slug}`
    : `${baseUrl}/experiences/${venture.id}/${venture.slug}`;
  const imageUrl = resolveImageUrl(baseUrl, venture.imageUrl);

  const graph: Array<Record<string, unknown>> = [
    {
      '@type': 'Product',
      name: venture.title,
      description: venture.description,
      image: imageUrl,
      sku: venture.slug,
      url: canonicalUrl,
      category: venture.category,
      offers: {
        '@type': 'Offer',
        price: venture.priceIdr,
        priceCurrency: 'IDR',
        availability: 'https://schema.org/InStock',
        url: canonicalUrl,
      },
      ...(venture.reviewCount > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: venture.rating,
              reviewCount: venture.reviewCount,
            },
          }
        : {}),
    },
    {
      '@type': 'TouristAttraction',
      name: venture.title,
      description: venture.description,
      image: imageUrl,
      url: canonicalUrl,
      address: {
        '@type': 'PostalAddress',
        addressLocality: venture.location?.split(',')[0]?.trim() || 'Bali',
        addressRegion: 'Bali',
        addressCountry: 'ID',
      },
    },
  ];

  if (venture.faqs && venture.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: venture.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function generateSitemapEntry(venture: VentureItem, domain?: SupportedDomain): string {
  const baseUrl = domain ? `https://${domain}` : getBaseUrl();
  return `
    <url>
      <loc>${baseUrl}/experiences/${venture.id}/${venture.slug}</loc>
      <lastmod>${venture.updatedAt.toISOString().split('T')[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `.trim();
}
