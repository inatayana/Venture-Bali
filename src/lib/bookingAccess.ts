import type { NextRequest } from 'next/server';
import { verifyBookingReadAccess } from './customerLink';
import { requireCustomer } from './customerGuard';

/** Customer session wins; otherwise the guest magic/scoped link is accepted. */
export async function authorizeBookingRead(
  request: NextRequest,
  booking: { id: string; customerId: string },
): Promise<boolean> {
  const user = await requireCustomer();
  if (user && user.customerId === booking.customerId) return true;

  const token =
    request.nextUrl.searchParams.get('token') ?? request.nextUrl.searchParams.get('access');
  return verifyBookingReadAccess(token, booking).allowed;
}
