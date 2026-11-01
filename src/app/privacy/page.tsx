import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { SiteFooter } from '@/components/layout/SiteFooter';
import {
  BRAND_EMAIL_HELLO,
  BRAND_EMAIL_SUPPORT,
  BRAND_LEGAL_NAME,
} from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Privacy policy | BaliWild',
  description:
    'How BaliWild collects, uses and protects your personal data when you book a Bali adventure.',
};

const SECTIONS = [
  {
    title: '1. Who we are',
    body: [
      `${BRAND_LEGAL_NAME} operates baliwild.com, a booking platform for adventure activities in Bali. We arrange the reservation, payment and customer support; the activity itself is delivered by a licensed local activity partner.`,
    ],
  },
  {
    title: '2. Data we collect',
    body: [
      'Contact details: name, email, WhatsApp number and country. Booking details: activity, date, departure time, guests, pickup area and hotel address. Payment data is processed by Midtrans; we never store full card numbers.',
      'Technical data: IP address, browser/device information, pages viewed, and security logs. Reviews and photos you choose to submit. Messages you send to our support team or AI assistant.',
    ],
  },
  {
    title: '3. Why we use it',
    body: [
      'To create and manage your booking, coordinate pickup and issue the e-voucher; to take payment and handle refunds; to answer support requests and safety emergencies; to send the review request after your trip; to improve the site and prevent fraud.',
      'Optional analytics is only enabled after you choose “Accept all” in the cookie banner. Essential cookies and storage are always used to keep checkout, security and your preferences working.',
    ],
  },
  {
    title: '4. Who we share it with',
    body: [
      'The activity partner receives only the information needed to deliver the trip (date, time, guests, pickup point and safety notes). They do not receive your payment details.',
      'Service providers process data on our behalf: Midtrans (payments), Supabase (database), Resend (email), WhatsApp Cloud API (messages), Google Gemini (AI assistant) and our hosting provider. We do not sell personal data.',
    ],
  },
  {
    title: '5. Retention',
    body: [
      'Booking, invoice and legal records are kept as long as required for accounting, tax and dispute resolution. Analytics data is retained in aggregate. You can ask us to delete data that we are not legally required to keep.',
    ],
  },
  {
    title: '6. Your rights',
    body: [
      'You may request access, correction, deletion or a copy of your personal data, and you may withdraw analytics consent at any time. Some records may be retained where the law requires it.',
      `Send requests to ${BRAND_EMAIL_HELLO} (general) or ${BRAND_EMAIL_SUPPORT} (existing booking). We may need to verify that the request comes from the guest on the booking.`,
    ],
  },
  {
    title: '7. Security',
    body: [
      'Access to the operator panel is restricted and signed sessions expire. Data is transmitted over HTTPS. Payment card data is handled by Midtrans, which is PCI DSS certified. No system is completely secure, so report anything suspicious to support immediately.',
    ],
  },
  {
    title: '8. Children and changes',
    body: [
      'Bookings for children must be made by a parent or guardian. We may update this policy when our services or the law change; the latest version is always published on this page.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="bg-brand-ink text-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" aria-label="BaliWild home">
            <BrandWordmark className="text-2xl" />
          </Link>
          <Link href="/" className="text-sm font-semibold text-brand hover:text-white">
            Explore adventures →
          </Link>
        </div>
        <div className="container mx-auto px-4 pb-14 pt-6">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-brand">
            Trust & transparency
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold uppercase tracking-wide">
            Privacy policy
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
            How we handle your data when you book, travel and review a BaliWild adventure.
          </p>
        </div>
      </header>

      <article className="container mx-auto max-w-3xl px-4 py-10">
        <div className="space-y-8 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-neutral-900">
                {section.title}
              </h2>
              <div className="mt-2 space-y-2">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-neutral-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <p className="border-t border-neutral-200 pt-4 text-xs text-neutral-500">
            This policy is a plain-language summary and should be reviewed by Indonesian counsel
            before launch. It does not limit any rights you have under applicable data-protection law.
          </p>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
