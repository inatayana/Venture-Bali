import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { verifyCustomerLinkToken, createBookingViewToken, createReviewToken } from '@/lib/customerLink';
import { canReviewBooking } from '@/lib/reviewSchema';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { GlobalDesktopHeader } from '@/components/layout/GlobalDesktopHeader';
import { BRAND_EMAIL_SUPPORT } from '@/lib/brand';
import { TripCard } from './TripCard';
import { Calendar, CalendarDays, Compass, Mail, QrCode, AlertCircle, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface TripsPageProps {
  searchParams: { token?: string };
}

/**
 * Trip Hub — the guest's visual trip dashboard.
 * Guests open it through the private magic link in their booking
 * confirmation email/WhatsApp message; nav links without a token show the
 * link guide. Shows upcoming & past trips with QR codes, directions,
 * status timeline, and integrated reschedule/cancel actions.
 */
export default async function TripsPage({ searchParams }: TripsPageProps) {
  const payload = verifyCustomerLinkToken(searchParams.token);

  if (!payload) {
    if (!searchParams.token) {
      // Tokenless entry point (nav link, typed URL): show how to open trips.
      return <TripsGuide />;
    }
    return <InvalidTokenNotice />;
  }

  const customer = await prisma.customer.findUnique({
    where: { id: payload.customerId },
    include: {
      bookings: {
        orderBy: { bookingDate: 'desc' },
        include: {
          // TODO(driver-info): add `driverInfo: true` after `prisma generate` runs
          // (blocked on a node process holding the client DLL).
          variant: {
            include: {
              venture: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  imageUrl: true,
                  location: true,
                  meetingPoint: true,
                  meetingPointMapsUrl: true,
                },
              },
              slotTimes: { select: { id: true, time: true, maxCapacity: true, currentBookings: true } },
            },
          },
          slotTime: { select: { time: true } },
          review: { select: { id: true } },
          refund: { select: { status: true, amountIdr: true } },
          vouchers: { select: { id: true, qrCodeData: true, status: true } },
        },
      },
    },
  });

  if (!customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <p className="text-sm text-neutral-600">We could not find this profile.</p>
      </main>
    );
  }

  // Separate upcoming and past trips
  const now = new Date();
  const upcomingBookings = customer.bookings.filter((b) => new Date(b.bookingDate) >= now && b.paymentStatus === 'PAID' && !b.cancelledAt);
  const pastBookings = customer.bookings.filter((b) => new Date(b.bookingDate) < now || b.paymentStatus !== 'PAID' || b.cancelledAt);

  // Generate review token
  const getReviewToken = (bookingId: string) => {
    const reviewable = canReviewBooking({
      paymentStatus: 'PAID',
      bookingDate: '',
      reviewId: null,
      lifecycleStatus: 'COMPLETED',
    });
    return reviewable ? createReviewToken(customer.id, bookingId) : null;
  };

  // Countdown to trip
  const getCountdown = (bookingDate: string, slotTime?: string) => {
    const tripDate = new Date(`${bookingDate}T${slotTime || '00:00'}`);
    const diff = tripDate.getTime() - now.getTime();
    if (diff <= 0) return { label: 'Today', days: 0, hours: 0, minutes: 0, isPast: false };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { label: days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`, days, hours, minutes, isPast: false };
  };

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <GlobalDesktopHeader />

      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-neutral-900 dark:text-white">Your Trips</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Manage your BaliWild adventures — QR codes, directions, changes, and memories.
          </p>
        </div>

        {/* Upcoming Trips */}
        {(upcomingBookings.length > 0 || pastBookings.length > 0) ? (
          <>
            {upcomingBookings.length > 0 && (
              <section aria-labelledby="upcoming-heading" className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 id="upcoming-heading" className="font-heading text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-brand" />
                    Upcoming ({upcomingBookings.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <TripCard
                      key={booking.id}
                      booking={booking}
                      token={searchParams.token}
                      voucherToken={createBookingViewToken(booking.id) ?? ''}
                      isUpcoming={true}
                      countdown={getCountdown(booking.bookingDate, booking.slotTime?.time)}
                    />
                  ))}
                </div>
              </section>
            )}

            {pastBookings.length > 0 && (
              <section aria-labelledby="past-heading">
                <div className="flex items-center justify-between mb-6">
                  <h2 id="past-heading" className="font-heading text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <QrCode className="h-6 w-6 text-neutral-500" />
                    Past Trips ({pastBookings.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <TripCard
                      key={booking.id}
                      booking={booking}
                      token={searchParams.token}
                      voucherToken={createBookingViewToken(booking.id) ?? ''}
                      isUpcoming={false}
                      reviewToken={getReviewToken(booking.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          // Empty State
          <div className="text-center py-16">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-brand/10 flex items-center justify-center">
              <QrCode className="h-10 w-10 text-brand" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">No trips yet</h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              Your BaliWild adventures will appear here once you book.
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-white hover:bg-brand/90 transition-colors"
            >
              Find your adventure
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-white/10 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            This private link expires in 30 days. Need help?{' '}
            <a href="mailto:hello@baliwild.com" className="text-brand-ink hover:underline font-medium">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

/** Tokenless visit (nav entry, typed URL): explain how to open the hub. */
function TripsGuide() {
  return (
    <>
      <GlobalDesktopHeader />
      <main className="min-h-screen bg-neutral-50 pb-24 md:pb-12">
      <header className="md:hidden bg-brand-ink text-white px-4 py-10">
        <div className="container mx-auto">
          <Link href="/" aria-label="BaliWild home" className="mb-6 inline-block">
            <BrandWordmark className="text-2xl" />
          </Link>
          <h1 className="font-heading text-3xl font-bold">Trips</h1>
          <p className="mt-2 max-w-2xl text-brand/80 text-sm">
            Your bookings, vouchers and cancellations — no password needed.
          </p>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 hidden font-heading text-3xl font-bold text-neutral-900 dark:text-white md:block">
          Trips
        </h1>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <CalendarDays className="h-6 w-6 text-neutral-700 dark:text-neutral-300" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-heading text-xl font-bold text-neutral-900 dark:text-white">
            Open your private trips link
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-neutral-500" aria-hidden="true" />
              <span>
                After payment, we send a confirmation email and WhatsApp message
                with your private trips link.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-neutral-500" aria-hidden="true" />
              <span>
                Open that link to see every booking, download vouchers, reschedule
                or cancel. The link stays valid for 30 days.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Compass className="mt-0.5 h-4 w-4 text-neutral-500" aria-hidden="true" />
              <span>
                Lost the message? Contact{' '}
                <a
                  href={`mailto:${BRAND_EMAIL_SUPPORT}`}
                  className="font-semibold text-brand-ink underline-offset-4 hover:underline"
                >
                  {BRAND_EMAIL_SUPPORT}
                </a>{' '}
                and we will resend it.
              </span>
            </li>
          </ol>
        </div>

        <Link
          href="/explore"
          className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-white transition-colors hover:bg-neutral-900"
        >
          Plan your next adventure
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      </main>
    </>
  );
}

/** Invalid or expired magic link on /trips. */
function InvalidTokenNotice() {
  return (
    <>
      <GlobalDesktopHeader />
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-sm text-center">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
        <h1 className="text-xl font-bold text-neutral-900">This link is invalid or expired</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Open the latest email or WhatsApp message we sent with your booking confirmation. If
          you still cannot find it, reply to that message and our team will resend the voucher.
        </p>
        <Link href="/" className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white">
          Browse adventures
        </Link>
      </div>
      </main>
    </>
  );
}