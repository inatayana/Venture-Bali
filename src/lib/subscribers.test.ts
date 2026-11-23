import { prisma } from '@/lib/prisma';
import { subscribeToNewsletter } from './subscribers';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscriber: {
      upsert: jest.fn(),
    },
  },
}));

describe('subscribeToNewsletter', () => {
  const upsert = prisma.subscriber.upsert as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('upserts the address with the default source', async () => {
    upsert.mockResolvedValue({ id: 's1', email: 'guest@example.com', source: 'HOMEPAGE' });

    const result = await subscribeToNewsletter('guest@example.com');

    expect(result).toEqual({ ok: true, email: 'guest@example.com' });
    expect(upsert).toHaveBeenCalledWith({
      where: { email: 'guest@example.com' },
      create: { email: 'guest@example.com', source: 'HOMEPAGE' },
      update: { source: 'HOMEPAGE' },
    });
  });

  it('records an explicit capture source', async () => {
    upsert.mockResolvedValue({ id: 's1', email: 'guest@example.com', source: 'CHECKOUT' });

    const result = await subscribeToNewsletter('guest@example.com', 'CHECKOUT');

    expect(result).toEqual({ ok: true, email: 'guest@example.com' });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { email: 'guest@example.com', source: 'CHECKOUT' } })
    );
  });

  it('never throws on a database failure', async () => {
    upsert.mockRejectedValue(new Error('connection refused'));

    const result = await subscribeToNewsletter('guest@example.com');

    expect(result).toEqual({ ok: false, error: 'connection refused' });
    expect(console.error).toHaveBeenCalled();
  });
});
