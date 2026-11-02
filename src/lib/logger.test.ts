import { createLogger, redact, reportError } from './logger';

describe('logger', () => {
  it('redacts sensitive keys and keeps operational ids', () => {
    const payload = redact({
      bookingId: 'bk_123',
      email: 'guest@example.com',
      authorization: 'Bearer secret',
      nested: { password: 'hunter2', whatsapp: '+628123456789' },
    }) as Record<string, unknown>;

    expect(payload.bookingId).toBe('bk_123');
    expect(payload.email).toBe('[REDACTED]');
    expect(payload.authorization).toBe('[REDACTED]');
    expect(payload.nested).toEqual({
      password: '[REDACTED]',
      whatsapp: '[REDACTED]',
    });
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

  it('normalises unknown errors without leaking raw values', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = reportError(new Error('database password leaked'), {
      requestId: 'req_1',
    });

    expect(result.name).toBe('Error');
    expect(result.message).toBe('database password leaked');
    const line = JSON.parse(String(spy.mock.calls[0][0]));
    expect(line.requestId).toBe('req_1');
    expect(line.error.name).toBe('Error');

    spy.mockRestore();
  });
});
