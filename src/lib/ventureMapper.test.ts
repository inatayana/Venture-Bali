import {
  toVentureItem,
  parseDurationHours,
  deriveFromPrice,
  deriveParticipantBounds,
  deriveIsAvailable,
  type VentureWithRelations,
} from './ventureMapper';

const NOW = new Date('2026-10-22T00:00:00.000Z');

function buildVenture(overrides: Partial<VentureWithRelations> = {}): VentureWithRelations {
  return {
    id: 'vtr-1',
    slug: 'ubud-atv-jungle-ride',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    title: 'Ubud ATV Jungle Ride through Rice Terraces and Waterfalls',
    hook3Sec: 'Ride a quad bike across Bali jungle trails',
    shortDescription: 'Guided ATV adventure through the jungles of Ubud.',
    duration: '2.5 hours',
    badge: 'Best Seller',
    meetingPoint: 'Ubud ATV Base Camp — Payangan',
    meetingPointLat: -8.435,
    meetingPointLng: 115.272,
    highlights: ['Quad bike through rice paddies', 'Certified guide'],
    inclusions: ['ATV rental', 'Safety gear'],
    exclusions: ['Personal expenses'],
    itinerary: [{ time: '08:00', activity: 'Safety briefing' }],
    essentialInfo: {
      perfectFor: ['Couples'],
      whatToBring: ['Closed shoes'],
      knowBeforeYouGo: ['Minimum age 12'],
    },
    faqs: [{ question: 'Licence needed?', answer: 'No.' }],
    languages: ['en', 'id'],
    category: 'ATV',
    subcategory: 'Jungle Trail',
    primaryKeyword: 'Ubud ATV',
    secondaryKeywords: ['quad bike Bali'],
    searchTags: ['atv', 'ubud'],
    difficulty: 'EASY',
    suitableFor: ['COUPLE', 'FAMILY'],
    imageUrl: '/images/atv-ubud.svg',
    gallery: ['/images/atv-ubud.svg'],
    videoUrl: null,
    rating: 4.8,
    createdAt: NOW,
    updatedAt: NOW,
    location: {
      id: 'loc-1',
      name: 'Tegallalang, Ubud, Gianyar, Bali',
      region: 'Gianyar',
      latitude: -8.4312,
      longitude: 115.2791,
      createdAt: NOW,
      updatedAt: NOW,
    },
    variants: [
      {
        id: 'var-1',
        ventureId: 'vtr-1',
        title: 'Self Drive',
        shortDescription: 'Ride the ATV yourself',
        badge: null,
        transportBadge: '📍 Meeting Point',
        imageUrl: '/images/atv-ubud.svg',
        duration: '2.5 hrs',
        fulfillmentMode: 'SELF_DRIVE',
        promoPriceIdr: null,
        operationNotes: null,
        sortOrder: 1,
        blackoutDates: ['2026-12-25'],
        createdAt: NOW,
        updatedAt: NOW,
        priceTiers: [
          { id: 'pt-1', variantId: 'var-1', minPax: 1, maxPax: 1, pricePerPax: 550000 },
          { id: 'pt-2', variantId: 'var-1', minPax: 2, maxPax: 2, pricePerPax: 450000 },
          { id: 'pt-3', variantId: 'var-1', minPax: 3, maxPax: 4, pricePerPax: 420000 },
          { id: 'pt-4', variantId: 'var-1', minPax: 5, maxPax: 10, pricePerPax: 380000 },
        ],
        slotTimes: [
          {
            id: 'slot-1',
            variantId: 'var-1',
            time: '08:00 AM',
            maxCapacity: 10,
            currentBookings: 2,
            isAvailable: true,
            createdAt: NOW,
            updatedAt: NOW,
          },
        ],
        addons: [
          {
            id: 'addon-1',
            variantId: 'var-1',
            name: 'Professional Photography',
            price: 150000,
            description: '1-hour session',
            requiresTransfer: false,
            isCombo: false,
            createdAt: NOW,
            updatedAt: NOW,
          },
        ],
      },
    ],
    reviews: [
      {
        id: 'rev-1',
        ventureId: 'vtr-1',
        customerId: 'cus-1',
        rating: 5,
        comment: 'Great ride',
        isApproved: true,
        createdAt: NOW,
      },
    ],
    ...overrides,
  } as VentureWithRelations;
}

describe('parseDurationHours', () => {
  it.each([
    ['2.5 hours', 2.5],
    ['8 hours', 8],
    ['4 hours', 4],
    ['1,5 hours', 1.5],
    ['Half day', 0],
    ['', 0],
  ])('parses "%s" as %s', (input, expected) => {
    expect(parseDurationHours(input)).toBe(expected);
  });
});

describe('deriveFromPrice', () => {
  it('returns the cheapest price per pax across all tiers and variants', () => {
    expect(deriveFromPrice(buildVenture())).toBe(380000);
  });

  it('returns 0 when there are no tiers', () => {
    const venture = buildVenture({ variants: [] } as Partial<VentureWithRelations>);
    expect(deriveFromPrice(venture)).toBe(0);
  });
});

describe('deriveParticipantBounds', () => {
  it('derives the lowest and highest tier bounds', () => {
    expect(deriveParticipantBounds(buildVenture())).toEqual({ min: 1, max: 10 });
  });

  it('falls back to 1/1 when there are no tiers', () => {
    const venture = buildVenture({ variants: [] } as Partial<VentureWithRelations>);
    expect(deriveParticipantBounds(venture)).toEqual({ min: 1, max: 1 });
  });
});

describe('deriveIsAvailable', () => {
  it('is true when a slot still has capacity', () => {
    expect(deriveIsAvailable(buildVenture())).toBe(true);
  });

  it('is false when every slot is sold out', () => {
    const venture = buildVenture({
      variants: [
        {
          ...buildVenture().variants[0],
          slotTimes: [
            {
              ...buildVenture().variants[0].slotTimes[0],
              currentBookings: 10,
              maxCapacity: 10,
            },
          ],
        },
      ],
    } as Partial<VentureWithRelations>);
    expect(deriveIsAvailable(venture)).toBe(false);
  });

  it('is false when the variant is marked unavailable', () => {
    const venture = buildVenture({
      variants: [
        {
          ...buildVenture().variants[0],
          slotTimes: [
            { ...buildVenture().variants[0].slotTimes[0], isAvailable: false },
          ],
        },
      ],
    } as Partial<VentureWithRelations>);
    expect(deriveIsAvailable(venture)).toBe(false);
  });
});

describe('toVentureItem', () => {
  it('maps the scalar fields straight through', () => {
    const item = toVentureItem(buildVenture());
    expect(item.id).toBe('vtr-1');
    expect(item.slug).toBe('ubud-atv-jungle-ride');
    expect(item.title).toBe('Ubud ATV Jungle Ride through Rice Terraces and Waterfalls');
    expect(item.category).toBe('ATV');
    expect(item.rating).toBe(4.8);
  });

  it('derives description, price, duration and participant bounds', () => {
    const item = toVentureItem(buildVenture());
    expect(item.description).toBe('Guided ATV adventure through the jungles of Ubud.');
    expect(item.priceIdr).toBe(380000);
    expect(item.durationHours).toBe(2.5);
    expect(item.minParticipants).toBe(1);
    expect(item.maxParticipants).toBe(10);
  });

  it('falls back to hook3Sec when shortDescription is missing', () => {
    const item = toVentureItem(
      buildVenture({ shortDescription: null } as Partial<VentureWithRelations>)
    );
    expect(item.description).toBe('Ride a quad bike across Bali jungle trails');
  });

  it('maps the location relation to a display string', () => {
    expect(toVentureItem(buildVenture()).location).toBe('Tegallalang, Ubud, Gianyar, Bali');
  });

  it('returns an empty location string when there is no location', () => {
    const item = toVentureItem(
      buildVenture({ location: null, locationId: null } as Partial<VentureWithRelations>)
    );
    expect(item.location).toBe('');
  });

  it('counts only approved reviews', () => {
    const venture = buildVenture({
      reviews: [
        { ...buildVenture().reviews[0], id: 'rev-1' },
        { ...buildVenture().reviews[0], id: 'rev-2', isApproved: false },
      ],
    } as Partial<VentureWithRelations>);
    expect(toVentureItem(venture).reviewCount).toBe(1);
  });

  it('maps variants with their price tiers, slots and add-ons', () => {
    const item = toVentureItem(buildVenture());
    expect(item.variants).toHaveLength(1);
    expect(item.variants[0].title).toBe('Self Drive');
    expect(item.variants[0].priceTiers).toHaveLength(4);
    expect(item.variants[0].priceTiers[0]).toEqual({
      minPax: 1,
      maxPax: 1,
      pricePerPax: 550000,
    });
    expect(item.variants[0].blackoutDates).toEqual(['2026-12-25']);
    expect(item.variants[0].slotTimes?.[0].time).toBe('08:00 AM');
    expect(item.variants[0].addons?.[0].name).toBe('Professional Photography');
  });

  it('parses the JSON columns into typed structures', () => {
    const item = toVentureItem(buildVenture());
    expect(item.highlights).toEqual(['Quad bike through rice paddies', 'Certified guide']);
    expect(item.meetingPoint).toEqual({
      name: 'Ubud ATV Base Camp — Payangan',
      latitude: -8.435,
      longitude: 115.272,
    });
    expect(item.variants[0].imageUrl).toBe('/images/atv-ubud.svg');
    expect(item.variants[0].duration).toBe('2.5 hrs');
    expect(item.inclusions).toEqual(['ATV rental', 'Safety gear']);
    expect(item.exclusions).toEqual(['Personal expenses']);
    expect(item.itinerary).toEqual([{ time: '08:00', activity: 'Safety briefing' }]);
    expect(item.essentialInfo.perfectFor).toEqual(['Couples']);
    expect(item.faqs).toEqual([{ question: 'Licence needed?', answer: 'No.' }]);
    expect(item.languages).toEqual(['en', 'id']);
    expect(item.suitableFor).toEqual(['COUPLE', 'FAMILY']);
  });

  it('drops malformed entries instead of leaking them into the UI', () => {
    const item = toVentureItem(
      buildVenture({
        highlights: ['valid', 42, null, 'also valid'],
        itinerary: [{ time: '08:00' }, { time: '09:00', activity: 'Ride' }],
        faqs: [{ question: 'missing answer' }],
        essentialInfo: { perfectFor: ['ok', 7] },
        suitableFor: ['COUPLE', 'NOT_A_VALID_GROUP'],
      } as unknown as Partial<VentureWithRelations>)
    );

    expect(item.highlights).toEqual(['valid', 'also valid']);
    expect(item.itinerary).toEqual([{ time: '09:00', activity: 'Ride' }]);
    expect(item.faqs).toEqual([]);
    expect(item.essentialInfo.perfectFor).toEqual(['ok']);
    expect(item.suitableFor).toEqual(['COUPLE']);
  });

  it('never returns undefined for the fields the UI depends on', () => {
    const item = toVentureItem(
      buildVenture({
        highlights: null,
        inclusions: null,
        exclusions: null,
        itinerary: null,
        essentialInfo: null,
        faqs: null,
        languages: null,
        gallery: null,
        secondaryKeywords: null,
        searchTags: null,
        suitableFor: null,
      } as unknown as Partial<VentureWithRelations>)
    );

    expect(item.highlights).toEqual([]);
    expect(item.inclusions).toEqual([]);
    expect(item.exclusions).toEqual([]);
    expect(item.itinerary).toEqual([]);
    expect(item.languages).toEqual([]);
    expect(item.gallery).toEqual([]);
    expect(item.essentialInfo).toEqual({
      perfectFor: [],
      whatToBring: [],
      knowBeforeYouGo: [],
    });
    expect(typeof item.description).toBe('string');
    expect(item.description.length).toBeGreaterThan(0);
  });
});
