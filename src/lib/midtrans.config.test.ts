/**
 * The config guard needs a fresh module instance, so it lives in its own file:
 * `midtrans.test.ts` caches the config after its first successful call.
 */
describe('getMidtransConfig', () => {
  const saved = {
    server: process.env.MIDTRANS_SERVER_KEY,
    client: process.env.MIDTRANS_CLIENT_KEY,
    production: process.env.MIDTRANS_IS_PRODUCTION,
  };

  afterEach(() => {
    process.env.MIDTRANS_SERVER_KEY = saved.server;
    process.env.MIDTRANS_CLIENT_KEY = saved.client;
    process.env.MIDTRANS_IS_PRODUCTION = saved.production;
    jest.resetModules();
  });

  it('throws MidtransConfigError when the client key is missing', async () => {
    process.env.MIDTRANS_SERVER_KEY = 'SB-Mid-server-test';
    delete process.env.MIDTRANS_CLIENT_KEY;

    const mod = await import('@/lib/midtrans');

    expect(() => mod.getMidtransConfig()).toThrow(mod.MidtransConfigError);
  });

  it('throws MidtransConfigError when the server key is missing', async () => {
    delete process.env.MIDTRANS_SERVER_KEY;
    process.env.MIDTRANS_CLIENT_KEY = 'SB-Mid-client-test';

    const mod = await import('@/lib/midtrans');

    expect(() => mod.getMidtransConfig()).toThrow(/credentials not configured/i);
  });

  it('returns both keys once configured', async () => {
    process.env.MIDTRANS_SERVER_KEY = 'SB-Mid-server-test';
    process.env.MIDTRANS_CLIENT_KEY = 'SB-Mid-client-test';
    process.env.MIDTRANS_IS_PRODUCTION = 'false';

    const mod = await import('@/lib/midtrans');

    expect(mod.getMidtransConfig()).toEqual({
      serverKey: 'SB-Mid-server-test',
      clientKey: 'SB-Mid-client-test',
      isProduction: false,
    });
  });
});
