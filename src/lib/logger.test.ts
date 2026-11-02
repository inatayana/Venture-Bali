import { createLogger, redact, reportError } from './logger';

describe('logger', () => {
  it('redacts key variants and keeps operational ids', () => {
    const payload = redact({
      bookingId: 'bk_123',
      userPassword: 'p',
      'x-api-key': 'k',
      contactEmail: 'guest@example.com',
      fullName: 'Jane Guest',
      headers: {
        cookie: 'c',
        authorization: 'Bearer secret',
        'set-cookie': 's',
      },
      file: 'ok',
      error: new Error('boom'),
    }) as Record<string, unknown>;

    expect(payload.bookingId).toBe('bk_123');
    expect(payload.userPassword).toBe('[REDACTED]');
    expect(payload['x-api-key']).toBe('[REDACTED]');
    expect(payload.contactEmail).toBe('[REDACTED]');
    expect(payload.fullName).toBe('[REDACTED]');
    expect(payload.headers).toEqual({
      cookie: '[REDACTED]',
      authorization: '[REDACTED]',
      'set-cookie': '[REDACTED]',
    });
    expect(payload.file).toBe('ok');
    expect((payload.error as Record<string, unknown>).type).toBe('Error');
  });

  it('writes one JSON line with level, scope and message', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const log = createLogger('booking');

    log.info('created', { bookingId: 'bk_1', email: 'guest@example.com' });

    const line = JSON.parse(String(spy.mock.calls[0][0]));
    expect(line.level).toBe('info');
    expect(line.scope).toBe('booking');
    expect(line.message).toBe('created');
    expect(line.bookingId).toBe('bk_1');
    expect(line.email).toBe('[REDACTED]');

    spy.mockRestore();
  });

  it('composes child scopes', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    createLogger('baliwild').child('booking').info('created');

    const line = JSON.parse(String(spy.mock.calls[0][0]));
    expect(line.scope).toBe('baliwild.booking');

    spy.mockRestore();
  });

  it('omits stack traces in production', () => {
    const env = process.env as Record<string, string | undefined>;
    const original = env.NODE_ENV;
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      env.NODE_ENV = 'production';
      reportError(new Error('boom'));

      const line = JSON.parse(String(spy.mock.calls[0][0]));
      expect(line.error.type).toBe('Error');
      expect(line.error.stack).toBeUndefined();
    } finally {
      env.NODE_ENV = original;
      spy.mockRestore();
    }
  });

  it('normalises unknown errors without leaking raw values', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = reportError(new Error('database password leaked'), {
      requestId: 'req_1',
    });

    expect(result.type).toBe('Error');
    expect(result.message).toBe('database password leaked');
    const line = JSON.parse(String(spy.mock.calls[0][0]));
    expect(line.requestId).toBe('req_1');
    expect(line.error.type).toBe('Error');

    spy.mockRestore();
  });
});
