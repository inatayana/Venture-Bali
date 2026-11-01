import {
  generateArticleStructuredData,
  generateVentureMetadata,
  generateVentureStructuredData,
  generateWebsiteStructuredData,
} from './seo';
import type { VentureItem } from '@/types/venture';

const NOW = new Date('2026-11-01T00:00:00.000Z');

function makeVenture(overrides: Partial<VentureItem> = {}): VentureItem {
  return {
    id: 'venture-1',
    slug: 'ubud-river-tubing',
    tenantId: 'tenant-1',
    title: 'Ubud River Tubing Adventure with Lunch',
    hook3Sec: 'A calm river and a big day out.',
    description: 'A gentle river tubing adventure near Ubud with lunch and hotel pickup.',
    longDescription: 'Long description',
    duration: '4 hrs',
    durationHours: 4,
    priceIdr: 450_000,
    minParticipants: 1,
    maxParticipants: 10,
    reviewCount: 2,
    rating: 4.5,
    reviewList: [
      {
        id: 'r1',
        rating: 5,
        comment: 'Amazing trip',
        author: 'Nicholas',
        location: 'Woodbridge Township, NJ',
        isVerified: true,
        createdAt: NOW,
      },
      {
        id: 'r2',
        rating: 4,
        comment: 'Great guides',
        author: 'Anna',
        isVerified: true,
        createdAt: NOW,
      },
    ],
    isAvailable: true,
    location: 'Ubud, Gianyar',
    highlights: ['River tubing'],
    inclusions: ['Guide'],
    exclusions: ['Personal expenses'],
    itinerary: [],
    essentialInfo: { perfectFor: [], whatToBring: [], knowBeforeYouGo: [] },
    faqs: [{ question: 'What should I bring?', answer: 'Reef shoes and a dry bag.' }],
    languages: ['English'],
    category: 'Tubing',
    difficulty: 'EASY',
    imageUrl: '/images/tubing.svg',
    gallery: ['/images/tubing-2.svg'],
    variants: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as VentureItem;
}

describe('generateVentureMetadata', () => {
  it('keeps the meta title under 60 characters and description under 155', () => {
    const metadata = generateVentureMetadata({
      venture: makeVenture(),
      baseUrl: 'https://baliwild.com',
    });

    expect(String(metadata.title).length).toBeLessThanOrEqual(60);
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
  });

  it('falls back to the product title when the brand suffix would overflow', () => {
    const metadata = generateVentureMetadata({
      venture: makeVenture({ title: 'A'.repeat(55) }),
      baseUrl: 'https://baliwild.com',
    });

    expect(metadata.title).toBe('A'.repeat(55));
  });
});

describe('generateVentureStructuredData', () => {
  const data = generateVentureStructuredData({
    venture: makeVenture(),
    baseUrl: 'https://baliwild.com',
  }) as { '@graph': Array<Record<string, unknown>> };

  it('emits Product, TouristAttraction, BreadcrumbList and FAQPage', () => {
    const types = data['@graph'].map((node) => node['@type']);
    expect(types).toEqual(
      expect.arrayContaining(['Product', 'TouristAttraction', 'BreadcrumbList', 'FAQPage'])
    );
  });

  it('includes real reviews, aggregate rating and every gallery image', () => {
    const product = data['@graph'].find((node) => node['@type'] === 'Product') as Record<
      string,
      unknown
    >;
    const reviews = product.review as Array<Record<string, unknown>>;

    expect(product.aggregateRating).toMatchObject({ ratingValue: 4.5, reviewCount: 2 });
    expect(reviews).toHaveLength(2);
    expect((reviews[0].author as { name: string }).name).toBe('Nicholas');
    expect(product.image).toEqual([
      'https://baliwild.com/images/tubing.svg',
      'https://baliwild.com/images/tubing-2.svg',
    ]);
  });

  it('marks sold-out products and omits ratings when there are no reviews', () => {
    const empty = generateVentureStructuredData({
      venture: makeVenture({ isAvailable: false, reviewCount: 0, reviewList: [] }),
      baseUrl: 'https://baliwild.com',
    }) as { '@graph': Array<Record<string, unknown>> };
    const product = empty['@graph'].find((node) => node['@type'] === 'Product') as Record<
      string,
      unknown
    >;

    expect((product.offers as { availability: string }).availability).toBe(
      'https://schema.org/SoldOut'
    );
    expect(product.aggregateRating).toBeUndefined();
    expect(product.review).toBeUndefined();
  });

  it('puts the category between home and product in the breadcrumb', () => {
    const breadcrumbs = data['@graph'].find(
      (node) => node['@type'] === 'BreadcrumbList'
    ) as { itemListElement: Array<{ position: number; name: string; item: string }> };

    expect(breadcrumbs.itemListElement.map((item) => item.name)).toEqual([
      'Home',
      'River Tubing',
      'Ubud River Tubing Adventure with Lunch',
    ]);
    expect(breadcrumbs.itemListElement[1].item).toBe(
      'https://baliwild.com/?category=tubing'
    );
  });
});

describe('generateWebsiteStructuredData', () => {
  it('links the organization, website search and travel agency', () => {
    const data = generateWebsiteStructuredData('https://baliwild.com') as {
      '@graph': Array<Record<string, unknown>>;
    };

    expect(data['@graph'].map((node) => node['@type'])).toEqual([
      'Organization',
      'WebSite',
      'TravelAgency',
    ]);
    expect(
      (data['@graph'][1].potentialAction as { target: { urlTemplate: string } }).target
        .urlTemplate
    ).toBe('https://baliwild.com/?q={search_term_string}');
  });
});

describe('generateArticleStructuredData', () => {
  it('emits a BlogPosting with an editorial author and breadcrumbs', () => {
    const data = generateArticleStructuredData(
      {
        slug: 'bali-rafting-guide',
        title: 'Bali Rafting Guide',
        description: 'What to expect on the Ayung River.',
        publishedAt: NOW,
        updatedAt: NOW,
        keywords: ['bali rafting'],
        tags: ['Rafting'],
      },
      'https://baliwild.com'
    ) as { '@graph': Array<Record<string, unknown>> };

    const article = data['@graph'][0];
    expect(article['@type']).toBe('BlogPosting');
    expect(article.author).toMatchObject({ '@type': 'Organization' });
    expect(article.mainEntityOfPage).toMatchObject({
      '@id': 'https://baliwild.com/blog/bali-rafting-guide',
    });
    expect(data['@graph'][1]['@type']).toBe('BreadcrumbList');
  });
});
