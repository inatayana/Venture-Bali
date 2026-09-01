import { mockVentures } from '@/data/mockVentures';
import type { VentureItem, BookingRequest, APIResponse, UserRole } from '@/types/venture';

describe('Type Definitions', () => {
  it('UserRole type includes admin, member, and guest', () => {
    const roles: UserRole[] = ['admin', 'member', 'guest'];
    expect(roles).toContain('admin');
    expect(roles).toContain('member');
    expect(roles).toContain('guest');
  });

  it('BookingRequest interface matches expected structure', () => {
    const booking: BookingRequest = {
      ventureId: 'vtr-001',
      userId: 'usr-001',
      bookingDate: '2026-12-01',
      participants: 2,
      participantNames: ['Alice', 'Bob'],
      contactEmail: 'alice@example.com',
      contactPhone: '+6281234567890',
      specialRequests: 'Near the entrance',
      promoCode: 'WELCOME10',
    };
    expect(booking.ventureId).toBe('vtr-001');
    expect(booking.participantNames).toHaveLength(2);
  });

  it('APIResponse interface supports generic type', () => {
    const response: APIResponse<VentureItem> = {
      success: true,
      data: mockVentures[0],
      error: null,
      meta: { total: 1, page: 1, pageSize: 10 },
    };
    expect(response.success).toBe(true);
    expect(response.meta?.total).toBe(1);
  });
});
