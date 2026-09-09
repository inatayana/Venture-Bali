import { mapTransactionStatus } from '@/lib/midtrans';

describe('mapTransactionStatus', () => {
  it('maps settlement to PAID', () => {
    expect(mapTransactionStatus('settlement')).toBe('PAID');
  });

  it('maps capture with accept fraud to PAID', () => {
    expect(mapTransactionStatus('capture', 'accept')).toBe('PAID');
  });

  it('maps capture with challenge fraud to PENDING', () => {
    expect(mapTransactionStatus('capture', 'challenge')).toBe('PENDING');
  });

  it('maps pending to PENDING', () => {
    expect(mapTransactionStatus('pending')).toBe('PENDING');
  });

  it('maps deny, cancel, expire to CANCELLED', () => {
    expect(mapTransactionStatus('deny')).toBe('CANCELLED');
    expect(mapTransactionStatus('cancel')).toBe('CANCELLED');
    expect(mapTransactionStatus('expire')).toBe('CANCELLED');
  });

  it('maps unknown status to FAILED', () => {
    expect(mapTransactionStatus('weird-status')).toBe('FAILED');
  });
});
