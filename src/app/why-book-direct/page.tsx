import { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { PriceCalculator } from './PriceCalculator';
import { PUBLIC_FACTS, TRUST_BADGES, COMMISSION_COMPARISON, REFUND_POLICY_SUMMARY } from '@/lib/publicFacts';
import { getBaseUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Why Book Direct with BaliWild? Save 20-30% vs OTAs',
  description: 'Compare BaliWild direct prices vs GetYourGuide, Klook, Viator. No commissions. Licensed operators. Instant confirmation. Fair refund policy.',
  alternates: {
    canonical: 'https://baliwild.com/why-book-direct',
    languages: {
      en: 'https://baliwild.com/en/why-book-direct',
      id: 'https://baliwild.com/id/why-book-direct',
    },
  },
  openGraph: {
    title: 'Why Book Direct with BaliWild? Save 20-30% vs OTAs',
    description: 'Compare BaliWild direct prices vs GetYourGuide, Klook, Viator. No commissions. Licensed operators. Instant confirmation.',
    images: [{ url: '/og/why-book-direct.jpg', width: 1200, height: 630 }],
    type: 'website',
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Why Book Direct with BaliWild? Save 20-30% vs OTAs',
      description: 'Compare BaliWild direct prices vs GetYourGuide, Klook, Viator. No commissions. Licensed operators. Instant confirmation. Fair refund policy.',
      mainEntity: {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Is it safe to book direct with BaliWild?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. We are a licensed Indonesian PT (PT Natayana Bali Tours). Your payment is processed by Midtrans (Bank Indonesia licensed). All activities are covered by JRP Public Liability Insurance.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the refund policy?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '80% refund when cancelled ≥24 hours before activity. Non-refundable if cancelled <24 hours. Free reschedule ≥24 hours.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do you offer hotel pickup?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! Shared transfer (per person) or Private transfer (per vehicle) from all Bali zones. Or self-drive to meeting point.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I pay in my currency?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'We charge in IDR (best rate). Display shows estimated USD/EUR/AUD/SGD/CNY/INR/KRW/JPY for reference only.',
            },
          },
        ],
      },
    }),
  },
};

export default function WhyBookDirectPage() {
  const baseUrl = getBaseUrl();

  const ownershipFacts = PUBLIC_FACTS.filter((f) => f.category === 'ownership' || f.category === 'licensing' || f.category === 'insurance');
  const commissionFacts = PUBLIC_FACTS.filter((f) => f.category === 'commission');
  const refundFacts = PUBLIC_FACTS.filter((f) => f.category === 'refund');
  const safetyFacts = PUBLIC_FACTS.filter((f) => f.category === 'safety');
  const localImpactFacts = PUBLIC_FACTS.filter((f) => f.category === 'local-impact');

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Why Book Direct', item: `${baseUrl}/why-book-direct` },
    ],
  };

  // Sample activity for calculator (first ATV product)
  const sampleActivity = { name: 'ATV Ubud Jungle', basePrice: 800000 };

  return (
    <>
      <JsonLd data={structuredData} />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative bg-brand-ink text-white py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Link href="/" className="inline-block mb-8" aria-label="BaliWild home">
                <BrandWordmark className="text-3xl lg:text-4xl" />
              </Link>
              <h1 className="font-heading text-3xl lg:text-5xl font-bold mb-4 leading-tight">
                Own the Wild — Book Direct, Save 20-30%
              </h1>
              <p className="text-brand/80 text-lg lg:text-xl mb-8 max-w-2xl mx-auto">
                No OTA commissions. No hidden fees. Direct from Bali.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/experiences"
                  className="min-h-[48px] px-8 py-3 rounded-xl bg-brand text-brand-ink font-semibold text-lg hover:bg-brand/90 transition-colors"
                >
                  Explore Adventures
                </Link>
                <Link
                  href="#calculator"
                  className="min-h-[48px] px-8 py-3 rounded-xl border-2 border-brand text-brand font-semibold text-lg hover:bg-brand/10 transition-colors"
                >
                  See Price Comparison
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: OTA Commission Reality */}
        <section className="container mx-auto px-4 py-16 lg:py-24" aria-labelledby="commission-title">
          <h2 id="commission-title" className="font-heading text-2xl lg:text-3xl font-bold text-center mb-4">
            What You Pay vs What Stays in Bali
          </h2>
          <p className="text-center text-neutral-600 mb-8 max-w-2xl mx-auto">
            *Data: First-hand from owner (supplier on all platforms above)
          </p>
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white max-w-4xl mx-auto">
            <table className="w-full text-left" role="table">
              <thead className="bg-brand-ink text-brand">
                <tr>
                  <th className="px-4 py-3 font-semibold">Platform</th>
                  <th className="px-4 py-3 font-semibold text-right">Fee</th>
                  <th className="px-4 py-3 font-semibold text-right">Your $100 Booking</th>
                  <th className="px-4 py-3 font-semibold text-right">Bali Keeps</th>
                </tr>
              </thead>
              <tbody>
                {COMMISSION_COMPARISON.map((ota) => (
                  <tr
                    key={ota.platform}
                    className={`border-t border-neutral-100 ${
                      ota.platform === 'BaliWild (Direct)' ? 'bg-brand/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {ota.platform === 'BaliWild (Direct)' && (
                        <span className="inline-flex items-center gap-2 text-brand-ink">
                          <span aria-hidden="true">🟢</span>
                        </span>
                      )}
                      {ota.platform}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {ota.commissionPct === 0 ? (
                        <span className="text-green-600">0%*</span>
                      ) : (
                        <span className="text-red-600">{ota.commissionPct}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {ota.commissionPct === 0 ? (
                        <span className="text-green-600">$100 to Bali</span>
                      ) : (
                        <span className="text-red-600">${100 - ota.commissionPct} to Bali</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {ota.commissionPct === 0 ? (
                        <span className="text-green-600">$100</span>
                      ) : (
                        <span className="text-red-600">${100 - ota.commissionPct}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm text-neutral-500 mt-4">
            *Direct margin model — not commission. Every Rupiah stays in Bali.
          </p>
        </section>

        {/* Section 2: What Direct Means */}
        <section className="container mx-auto px-4 py-16 lg:py-24 bg-neutral-50" aria-labelledby="direct-title">
          <h2 id="direct-title" className="font-heading text-2xl lg:text-3xl font-bold text-center mb-4">
            Direct = We&apos;re Here, Not in Singapore or Amsterdam
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: '🛡️', title: 'Safety First', desc: 'SOP + Mystery Guest + JRP Insurance on every activity' },
              { icon: '🤝', title: 'Flexible Logistics', desc: 'Self-drive / Shared / Private Transfer + TBA hotel confirmation' },
              { icon: '🚑', title: 'Emergency Support', desc: '24/7 Local Team + WhatsApp in English & Bahasa Indonesia' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 lg:p-8 border border-neutral-200 hover:shadow-lg transition-shadow">
                <span className="text-4xl mb-4 block" aria-hidden="true">{item.icon}</span>
                <h3 className="font-heading text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-neutral-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Interactive Price Calculator */}
        <section id="calculator" className="container mx-auto px-4 py-16 lg:py-24" aria-labelledby="calculator-title">
          <PriceCalculator
            basePriceIdr={sampleActivity.basePrice}
            activityName={sampleActivity.name}
          />
        </section>

        {/* Section 4: Trust Signals */}
        <section className="container mx-auto px-4 py-16 lg:py-24 bg-neutral-50" aria-labelledby="trust-title">
          <h2 id="trust-title" className="font-heading text-2xl lg:text-3xl font-bold text-center mb-4">
            Why Travelers Trust BaliWild
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-6 lg:p-8 border border-neutral-200 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {TRUST_BADGES.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                    <span className="text-2xl" aria-hidden="true">{badge.icon}</span>
                    <span className="font-medium text-neutral-900">{badge.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-neutral-600">
                <span>⭐ 4.9/5 from verified reviews</span>
                <span>🛡️ Licensed operators • Safety briefings • Insurance included</span>
                <span>⚡ Instant confirmation • Free reschedule ≥24h • 80% refund ≥24h</span>
                <span>💬 WhatsApp support in English & Bahasa Indonesia</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/experiences"
                className="min-h-[48px] px-8 py-3 rounded-xl bg-brand-ink text-brand font-semibold hover:bg-neutral-900 transition-colors"
              >
                Read Verified Reviews
              </Link>
              <Link
                href="/experiences"
                className="min-h-[48px] px-8 py-3 rounded-xl border-2 border-brand-ink text-brand-ink font-semibold hover:bg-brand/10 transition-colors"
              >
                See Safety Standards
              </Link>
            </div>
          </div>
        </section>

        {/* Section 5: How It Works */}
        <section className="container mx-auto px-4 py-16 lg:py-24" aria-labelledby="how-title">
          <h2 id="how-title" className="font-heading text-2xl lg:text-3xl font-bold text-center mb-4">
            Book in 3 Steps — No Account Needed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { step: 1, icon: '🎯', title: 'Pick Adventure', desc: 'Choose your adventure, date, time, and pickup option' },
              { step: 2, icon: '📝', title: 'Fill Details', desc: 'Enter guest info + TBA hotel confirmation if needed' },
              { step: 3, icon: '💳', title: 'Pay & Go', desc: 'QRIS / Card / VA / e-Wallet → Instant QR voucher' },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-2xl p-6 lg:p-8 border border-neutral-200 text-center">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-ink text-brand text-3xl font-bold w-12 h-12 rounded-full flex items-center justify-center">
                  {item.step}
                </span>
                <div className="mt-6">
                  <span className="text-4xl mb-3 block" aria-hidden="true">{item.icon}</span>
                  <h3 className="font-heading text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-neutral-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-neutral-600 mt-8">
            Instant QR voucher • WhatsApp confirmation • 24/7 support
          </p>
        </section>

        {/* Section 6: FAQ */}
        <section className="container mx-auto px-4 py-16 lg:py-24 bg-neutral-50" aria-labelledby="faq-title">
          <h2 id="faq-title" className="font-heading text-2xl lg:text-3xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <dl className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Is it safe to book direct?',
                a: 'Yes. We are a licensed Indonesian PT (PT Natayana Bali Tours). Your payment is processed by Midtrans (Bank Indonesia licensed). All activities are covered by JRP Public Liability Insurance.',
              },
              {
                q: 'What if I need to cancel?',
                a: '≥24 hours before = 80% refund. <24 hours = no refund (guide already committed). Free reschedule ≥24 hours.',
              },
              {
                q: 'Do you offer hotel pickup?',
                a: 'Yes! Shared (per person) or Private (per vehicle) from all Bali zones. Or self-drive to meeting point.',
              },
              {
                q: 'Can I pay in my currency?',
                a: 'We charge in IDR (best rate). Display shows estimated USD/EUR/AUD/SGD/CNY/INR/KRW/JPY for reference.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-neutral-200">
                <dt className="font-semibold text-neutral-900 mb-2">{item.q}</dt>
                <dd className="text-neutral-600">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Section 7: CTA Footer */}
        <section className="bg-brand-ink text-white py-16 lg:py-24" aria-labelledby="cta-title">
          <div className="container mx-auto px-4 text-center">
            <h2 id="cta-title" className="font-heading text-2xl lg:text-3xl font-bold mb-4">
              Ready for Your Bali Adventure?
            </h2>
            <p className="text-brand/80 mb-8 max-w-xl mx-auto">
              Book direct. Save 20-30%. Support local.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/experiences"
                className="min-h-[48px] px-8 py-3 rounded-xl bg-brand text-brand-ink font-semibold text-lg hover:bg-brand/90 transition-colors"
              >
                Explore All Adventures
              </Link>
              <a
                href="https://wa.me/6281234567890?text=Hi%20BaliWild%2C%20I%20have%20a%20question%20about%20booking%20direct."
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] px-8 py-3 rounded-xl border-2 border-white text-white font-semibold text-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.252-1.74-1.514-.164-.165-.72-.39-1.225-.764-.504-.373-.785-.557-.877-.637-.09-.08-.174-.193-.174-.343 0-.15.09-.253.164-.344.078-.093.177-.22.252-.32.207-.277.666-.83.82-1.134.282-.54.24-.872.11-1.15-.12-.256-.95-.947-2.03-2.59-1.29-1.903-1.412-2.052-1.412-2.052-.298-.196-.54-.196-.839 0-.285.18-1.113.824-1.195.853-.082.03-.594.168-1.077.352-.482.184-.97.31-1.43.392-.462.082-.93.136-1.39.18-.46.043-.926.077-1.384.15-.457.073-.922.177-1.294.44-.382.27-.71.595-.855.963-.146.367-.172.76-.117 1.256.055.496.258.918.545 1.269.287.352.77.74 1.075 1.28.305.54.514.889.54.936.028.048.44.803.934 1.23.472.405 1.023.714 1.678.924.582.19 1.163.267 1.68.267.435 0 .87-.047 1.3-.14.415-.09.78-.243 1.05-.423.27-.18.52-.41.65-.707.137-.3.18-.65.18-1.073 0-.463-.13-.977-.382-1.328-.25-.35-.65-.777-.99-1.234-.34-.457-.575-.78-.72-1.01-.15-.24-.23-.5-.23-.767 0-.244.08-.493.19-.717.11-.224.37-.57.73-.97.36-.4.76-.833 1.065-1.137.304-.304.515-.515.55-.55.034-.034.416-.284.693-.428.276-.143.552-.288.828-.432.277-.144.555-.287.834-.43.277-.143.553-.287.83-.429.276-.142.552-.287.828-.427.277-.142.554-.287.83-.427.277-.141.555-.287.83-.427.277-.141.556-.286.83-.425" />
                </svg>
                WhatsApp Us
              </a>
              <a
                href="https://t.me/BaliWildBot"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] px-8 py-3 rounded-xl border-2 border-white text-white font-semibold text-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M.757 6.112a.98.98 0 0 1 0-1.168 1.055 1.055 0 0 1 1.342.19l4.397 3.264a1.09 1.09 0 0 1 .054 1.36l-.539 6.055a1.05 1.05 0 0 0 1.55 1.09l6.133-3.254a1.09 1.09 0 0 1 1.32-.05l6.065 4.363a1.05 1.05 0 0 0 1.57-.08l2.758-5.926a1.09 1.09 0 0 0 .11-1.43l-3.086-5.325a1.05 1.05 0 0 0-1.58-.12l-5.628 4.352a1.1 1.1 0 0 1-1.36-.12L7.85.81a1.09 1.09 0 0 0-1.32.06l-3.355 2.538a1.05 1.05 0 0 0-.15 1.21l.605 5.547Z" />
                </svg>
                Telegram Bot
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}