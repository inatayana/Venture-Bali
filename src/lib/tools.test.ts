import {
  AGENT_TOOLS,
  getRefundPolicy,
  calculatePrice,
  checkAvailability,
  getProductInfo,
  createBooking,
} from './tools';
import { prisma } from '@/lib/prisma';
import { mockExperiences } from '@/data/mockExperiences';
import { REFUND_WINDOWS, NO_SHOW_POLICY, REFUND_PROCESSING_DAYS } from './refundUtils';
import type { AgentState } from './agent';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    venture: {
      findFirst: jest.fn(),
    },
  },
}));

const mockedFindFirst = prisma.venture.findFirst as jest.Mock;

function makeState(overrides: Partial<AgentState['context']> = {}): AgentState {
  return {
    sessionId: 'session-1',
    channel: 'whatsapp',
    language: 'id',
    context: {
      intent: 'product_inquiry',
      ...overrides,
    },
    lastAction: 'info',
    activeFlow: 'product_search',
  };
}

beforeEach(() => {
  mockedFindFirst.mockReset();
  // Default: the database is reachable but empty.
  mockedFindFirst.mockResolvedValue(null);
});

describe('Agent tools', () => {
  describe('getRefundPolicy', () => {
    it('states the enforced 20% cancel fee and 80% refund', async () => {
      const result = await getRefundPolicy();

      expect(result.policy).toContain('20%');
      expect(result.policy).toContain('80%');
      expect(result.policy).toContain('24h');
    });

    it('never invents a 72-hour or 70% refund window', async () => {
      const result = await getRefundPolicy();
      const serialised = JSON.stringify(result);

      expect(serialised).not.toContain('72');
      expect(serialised).not.toContain('70');
      expect(serialised).not.toContain('48-72');
    });

    it('exposes exactly the windows defined in refundUtils', async () => {
      const result = await getRefundPolicy();

      expect(result.windows).toHaveLength(REFUND_WINDOWS.length + 1);
      expect(result.windows[0]).toEqual({
        hours: REFUND_WINDOWS[0].hours,
        percentage: REFUND_WINDOWS[0].percentage,
        description: REFUND_WINDOWS[0].description,
      });
      expect(result.windows[1].percentage).toBe(0);
    });

    it('includes the no-show rule', async () => {
      const result = await getRefundPolicy();
      const noShow = result.windows.find((w) => w.hours === 'no-show');

      expect(noShow?.percentage).toBe(NO_SHOW_POLICY.refundPercentage);
      expect(noShow?.description).toBe(NO_SHOW_POLICY.description);
    });

    it('uses the shared processing window', async () => {
      const result = await getRefundPolicy();
      expect(result.processingDays).toBe(REFUND_PROCESSING_DAYS);
      expect(result.processingDays).toBe(3);
    });
  });

  describe('getProductInfo', () => {
    it('reads the product from the database', async () => {
      const row = {
        id: 'vtr-db',
        slug: 'ubud-atv-jungle-ride',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        title: 'Ubud ATV Jungle Ride through Rice Terraces and Waterfalls',
        hook3Sec: 'Ride a quad bike',
        shortDescription: 'Guided ATV adventure in Ubud.',
        duration: '2.5 hours',
        badge: null,
        highlights: [],
        inclusions: [],
        exclusions: [],
        itinerary: [],
        essentialInfo: { perfectFor: [], whatToBring: [], knowBeforeYouGo: [] },
        faqs: [],
        languages: ['en'],
        category: 'ATV',
        subcategory: null,
        primaryKeyword: 'Ubud ATV',
        secondaryKeywords: [],
        searchTags: [],
        difficulty: 'EASY',
        suitableFor: [],
        imageUrl: '/images/atv-ubud.svg',
        gallery: [],
        videoUrl: null,
        rating: 4.8,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        location: null,
        variants: [],
        reviews: [],
      };
      mockedFindFirst.mockResolvedValue(row);

      const result = await getProductInfo(makeState({ productId: 'ubud-atv-jungle-ride' }));

      expect(result.found).toBe(true);
      expect(result.venture?.slug).toBe('ubud-atv-jungle-ride');
      expect(mockedFindFirst).toHaveBeenCalled();
    });

    it('reports a missing product instead of substituting another one', async () => {
      const result = await getProductInfo(makeState({ productId: 'does-not-exist' }));

      expect(result.found).toBe(false);
      expect(result.venture).toBeNull();
    });

    it('falls back to the offline catalogue when the database is unreachable', async () => {
      mockedFindFirst.mockRejectedValue(new Error('database down'));

      const result = await getProductInfo(makeState({ productId: 'ubud-atv-jungle-ride' }));

      expect(result.found).toBe(true);
      expect(result.venture?.slug).toBe('ubud-atv-jungle-ride');
    });
  });

  describe('calculatePrice', () => {
    it('uses the real price tiers of the requested product', async () => {
      mockedFindFirst.mockRejectedValue(new Error('use fallback'));

      const result = await calculatePrice(
        makeState({ productId: 'ubud-atv-jungle-ride', paxCount: 2 })
      );

      // ATV Self Drive tier for 2 pax is Rp 450.000.
      expect(result.pricePerPax).toBe(450000);
      expect(result.totalPrice).toBe(900000);
      expect(result.paxCount).toBe(2);
      expect(result.currency).toBe('IDR');
    });

    it('applies the group tier for a larger party', async () => {
      mockedFindFirst.mockRejectedValue(new Error('use fallback'));

      const result = await calculatePrice(
        makeState({ productId: 'ubud-atv-jungle-ride', paxCount: 6 })
      );

      // 5-10 pax tier is Rp 380.000.
      expect(result.pricePerPax).toBe(380000);
      expect(result.totalPrice).toBe(2280000);
    });

    it('does not always quote the first product in the catalogue', async () => {
      mockedFindFirst.mockRejectedValue(new Error('use fallback'));

      const atv = await calculatePrice(
        makeState({ productId: 'ubud-atv-jungle-ride', paxCount: 1 })
      );
      const rafting = await calculatePrice(
        makeState({ productId: 'ayung-river-white-water-rafting', paxCount: 1 })
      );

      expect(atv.pricePerPax).toBe(550000);
      expect(rafting.pricePerPax).toBe(450000);
      expect(atv.pricePerPax).not.toBe(rafting.pricePerPax);
    });

    it('defaults to a single participant', async () => {
      mockedFindFirst.mockRejectedValue(new Error('use fallback'));

      const result = await calculatePrice(makeState({ productId: 'ubud-atv-jungle-ride' }));

      expect(result.paxCount).toBe(1);
      expect(result.totalPrice).toBe(result.pricePerPax);
    });
  });

  describe('checkAvailability', () => {
    it('reports the real open slots', async () => {
      mockedFindFirst.mockRejectedValue(new Error('use fallback'));

      const result = await checkAvailability(
        makeState({ productId: 'ubud-atv-jungle-ride', bookingDate: '2026-11-01' })
      );

      expect(result.slots.length).toBeGreaterThan(0);
      expect(result.totalAvailable).toBeGreaterThan(0);
      expect(result.available).toBe(true);
      expect(result.slots.every((slot) => slot.capacity > slot.booked)).toBe(true);
    });

    it('blocks a blackout date', async () => {
      mockedFindFirst.mockRejectedValue(new Error('use fallback'));

      const result = await checkAvailability(
        makeState({ productId: 'ubud-atv-jungle-ride', bookingDate: '2026-12-25' })
      );

      expect(result.available).toBe(false);
      expect(result.totalAvailable).toBe(0);
      expect(result.slots).toHaveLength(0);
    });
  });

  describe('createBooking', () => {
    it('quotes the real price but does not claim to have persisted a booking', async () => {
      mockedFindFirst.mockRejectedValue(new Error('use fallback'));

      const result = await createBooking(
        makeState({ productId: 'ubud-atv-jungle-ride', paxCount: 3 })
      );

      // 3-4 pax tier is Rp 420.000.
      expect(result.booking.totalPrice).toBe(1260000);
      expect(result.persisted).toBe(false);
      expect(result.bookingCode).toBe('PENDING');
      expect(result.voucherId).toBe('');
    });
  });

  describe('AGENT_TOOLS', () => {
    it('exposes every tool the agent dispatches to', () => {
      expect(Object.keys(AGENT_TOOLS).sort()).toEqual([
        'calculatePrice',
        'checkAvailability',
        'createBooking',
        'getProductInfo',
        'getRefundPolicy',
        'sendBookingConfirmation',
      ]);
    });
  });

  describe('offline catalogue integrity', () => {
    it('the fallback products all have price tiers the agent can quote', () => {
      mockExperiences.forEach((venture) => {
        venture.variants.forEach((variant) => {
          expect(variant.priceTiers.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
