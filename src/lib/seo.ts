import type { Metadata } from 'next';
import type { VentureItem } from '@/types/venture';

export type SupportedDomain = 'venture-bali.com' | 'localhost';

interface GenerateVentureMetadataParams {
  venture: VentureItem;
  domain: SupportedDomain;
  isAdmin?: boolean;
}

const formatCurrency = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const toSlug = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
};

export function generateVentureMetadata({
  venture,
  domain,
  isAdmin = false,
}: GenerateVentureMetadataParams): Metadata {
  const baseUrl = `https://${domain}`;
  const canonicalUrl = isAdmin
    ? `${baseUrl}/admin/ventures/${venture.slug}`
    : `${baseUrl}/ventures/${venture.slug}`;

  const title = `${venture.title} | Venture Bali`;
  const description = venture.description.length > 160
    ? `${venture.description.substring(0, 157)}...`
    : venture.description;

  const imageUrl = `${baseUrl}${venture.imageUrl}`;

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: venture.title,
    image: imageUrl,
    description: venture.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: venture.location.split(',')[0].trim(),
      addressRegion: 'Bali',
      addressCountry: 'ID',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -8.4172,
      longitude: 115.2878,
    },
    url: canonicalUrl,
    telephone: '+62-361-1234567',
    priceRange: formatCurrency(venture.priceIdr),
    tourType: 'Adventure',
    offers: {
      '@type': 'Offer',
      price: venture.priceIdr,
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
      validFrom: venture.createdAt,
    },
  };

  return {
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
      site: '@venturebali',
      creator: '@venturebali',
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
    verification: {
      google: 'venturessystems',
    },
    structuredData: schemaData,
  };
}

export function generateSitemapEntry(venture: VentureItem, domain: SupportedDomain): string {
  const baseUrl = `https://${domain}`;
  return `
    <url>
      <loc>${baseUrl}/ventures/${venture.slug}</loc>
      <lastmod>${venture.updatedAt.split('T')[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `.trim();
}