import type { Metadata } from 'next';
import type { VentureItem } from '@/types/venture';
import {
  BRAND_ADDRESS,
  BRAND_DESCRIPTION,
  BRAND_EDITORIAL_AUTHOR,
  BRAND_NAME,
} from './brand';
import { resolveCategory } from './taxonomy';

export type SupportedDomain = 'baliwild.com' | 'localhost';

const FALLBACK_BASE_URL = 'https://baliwild.com';

export function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_BASE_URL).replace(/\/$/, '');
}

function clipText(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3).trimEnd()}...`;
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

function resolveVentureImages(baseUrl: string, venture: VentureItem): string[] {
  const urls = [venture.imageUrl, ...(venture.gallery ?? [])].filter(
    (url): url is string => Boolean(url)
  );
  return Array.from(new Set(urls.map((url) => resolveImageUrl(baseUrl, url)))).slice(0, 8);
}

export function generateVentureMetadata(params: GenerateVentureParams): Metadata {
  const { venture, isAdmin = false } = params;
  const baseUrl = resolveBaseUrl(params);
  const canonicalUrl = isAdmin
    ? `${baseUrl}/admin/experiences/${venture.id}/${venture.slug}`
    : `${baseUrl}/experiences/${venture.id}/${venture.slug}`;

  const suffix = ` | ${BRAND_NAME}`;
  const title =
    venture.title.length + suffix.length <= 60 ? `${venture.title}${suffix}` : venture.title;
  const description = clipText(venture.description, 155);

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
      siteName: BRAND_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: venture.title,
        },
      ],
      type: 'website',
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
 * Emits Product (offer + real reviews), TouristAttraction, BreadcrumbList and
 * FAQPage — the rich-result types Google awards for experiences.
 */
export function generateVentureStructuredData(params: GenerateVentureParams): Record<string, unknown> {
  const { venture, isAdmin = false } = params;
  const baseUrl = resolveBaseUrl(params);
  const canonicalUrl = isAdmin
    ? `${baseUrl}/admin/experiences/${venture.id}/${venture.slug}`
    : `${baseUrl}/experiences/${venture.id}/${venture.slug}`;
  const images = resolveVentureImages(baseUrl, venture);
  const category = resolveCategory(venture.category);

  const reviews = (venture.reviewList ?? []).slice(0, 5).map((review) => ({
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Person',
      name: review.author,
    },
    datePublished: review.createdAt.toISOString().slice(0, 10),
    reviewBody: review.comment,
  }));

  const product: Record<string, unknown> = {
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: venture.title,
    description: venture.description,
    image: images.length > 1 ? images : images[0],
    sku: venture.slug,
    url: canonicalUrl,
    category: venture.category,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    offers: {
      '@type': 'Offer',
      price: venture.priceIdr,
      priceCurrency: 'IDR',
      availability: venture.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
      url: canonicalUrl,
    },
    ...(venture.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: venture.rating,
            reviewCount: venture.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(reviews.length > 0 ? { review: reviews } : {}),
  };

  const breadcrumbItems = [
    { name: 'Home', item: baseUrl },
    ...(category
      ? [{ name: category.canonical, item: `${baseUrl}/?category=${category.slug}` }]
      : []),
    { name: venture.title, item: canonicalUrl },
  ];

  const graph: Array<Record<string, unknown>> = [
    product,
    {
      '@type': 'TouristAttraction',
      name: venture.title,
      description: venture.description,
      ...(images.length > 0 ? { image: images } : {}),
      url: canonicalUrl,
      address: {
        '@type': 'PostalAddress',
        addressLocality: venture.location?.split(',')[0]?.trim() || 'Bali',
        addressRegion: 'Bali',
        addressCountry: 'ID',
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.item,
      })),
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

/** Site-wide Organization + WebSite (SearchAction) + TravelAgency graph. */
export function generateWebsiteStructuredData(baseUrl: string = getBaseUrl()): Record<string, unknown> {
  const organizationId = `${baseUrl}/#organization`;
  const websiteId = `${baseUrl}/#website`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: BRAND_NAME,
        url: baseUrl,
        description: BRAND_DESCRIPTION,
        address: {
          '@type': 'PostalAddress',
          addressLocality: BRAND_ADDRESS.locality,
          addressRegion: BRAND_ADDRESS.region2,
          addressCountry: BRAND_ADDRESS.country,
        },
        areaServed: {
          '@type': 'Place',
          name: 'Bali, Indonesia',
        },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: baseUrl,
        name: BRAND_NAME,
        publisher: { '@id': organizationId },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'TravelAgency',
        '@id': `${baseUrl}/#agency`,
        name: BRAND_NAME,
        url: baseUrl,
        description: BRAND_DESCRIPTION,
        address: {
          '@type': 'PostalAddress',
          addressLocality: BRAND_ADDRESS.locality,
          addressRegion: BRAND_ADDRESS.region2,
          addressCountry: BRAND_ADDRESS.country,
        },
        areaServed: {
          '@type': 'Place',
          name: 'Bali, Indonesia',
        },
        priceRange: '$$',
        parentOrganization: { '@id': organizationId },
      },
    ],
  };
}

interface ArticleStructuredInput {
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt: Date;
  keywords: string[];
  tags: string[];
}

/** BlogPosting + BreadcrumbList for an editorial article. */
export function generateArticleStructuredData(
  article: ArticleStructuredInput,
  baseUrl: string = getBaseUrl()
): Record<string, unknown> {
  const url = `${baseUrl}/blog/${article.slug}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline: article.title,
        description: article.description,
        url,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url,
        },
        datePublished: article.publishedAt.toISOString(),
        dateModified: article.updatedAt.toISOString(),
        keywords: article.keywords.join(', '),
        ...(article.tags.length > 0 ? { articleSection: article.tags[0] } : {}),
        author: {
          '@type': 'Organization',
          name: BRAND_EDITORIAL_AUTHOR,
        },
        publisher: {
          '@type': 'Organization',
          name: BRAND_NAME,
          url: baseUrl,
        },
        inLanguage: 'en',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
          { '@type': 'ListItem', position: 3, name: article.title, item: url },
        ],
      },
    ],
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
