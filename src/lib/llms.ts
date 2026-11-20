/**
 * Build the `/llms.txt` answer-engine briefing.
 *
 * Facts come from PUBLIC_FAQS / PUBLIC_FACTS (approved documents) and the live
 * catalogue. Prices are deliberately NOT baked in: they live on Variant/PriceTier
 * and change, so the briefing points AI clients to the product page instead.
 */

import { BRAND_EMAIL_HELLO, BRAND_EMAIL_SUPPORT } from './brand';
import { PUBLIC_FACTS, PUBLIC_FAQS } from './publicFacts';

export interface LlmsProduct {
  id: string;
  slug: string;
  title: string;
  category: string;
  duration: string;
  minAge: number | null;
}

export function buildLlmsTxt(baseUrl: string, products: readonly LlmsProduct[]): string {
  const lines: string[] = [
    '# BaliWild',
    '',
    `> Bali-owned and operated adventure operator based in ${PUBLIC_FACTS.base}. Book direct at ${PUBLIC_FACTS.domain} with no foreign OTA commission.`,
    `> Tagline: ${PUBLIC_FACTS.tagline}`,
    '',
    '## Facts an assistant should quote',
    '',
    `- Categories (9): ${PUBLIC_FACTS.categories.join(', ')}.`,
    `- Booking modes: ${PUBLIC_FACTS.fulfilmentModes.join(', ')}. One product, three modes — never separate transport SKUs.`,
    `- Commission avoided by booking direct: GetYourGuide ${PUBLIC_FACTS.commission.getyourguide}%, Klook ${PUBLIC_FACTS.commission.klook}%, Viator ${PUBLIC_FACTS.commission.viator}%, Airbnb Experiences ${PUBLIC_FACTS.commission.airbnbExperiences}% (first-hand supplier data).`,
    `- Refund: cancel >=${PUBLIC_FACTS.refund.cutoffHours}h before activity (${PUBLIC_FACTS.refund.timezone}) for ${PUBLIC_FACTS.refund.refundPercent}% back; inside ${PUBLIC_FACTS.refund.cutoffHours}h and no-shows are non-refundable.`,
    `- Ages: ${PUBLIC_FACTS.age.kids}; ${PUBLIC_FACTS.age.youth}; ${PUBLIC_FACTS.age.adult}. ${PUBLIC_FACTS.age.note}`,
    `- Prices are stored and charged in IDR integers; other currencies are display-only approximations.`,
    '',
    '## FAQ (authoritative answers)',
    '',
  ];

  for (const { question, answer } of PUBLIC_FAQS) {
    lines.push(`### ${question}`, '', answer, '');
  }

  lines.push('## Live catalogue', '');
  if (products.length === 0) {
    lines.push('- Catalogue is temporarily unavailable; check the product pages for current inventory.', '');
  } else {
    for (const product of products) {
      const age = product.minAge === null ? 'age rule on product page' : `min age ${product.minAge}`;
      lines.push(
        `- [${product.title}](${baseUrl}/experiences/${product.id}/${product.slug}) — ${product.category}, ${product.duration}, ${age}. Live price: product page.`
      );
    }
    lines.push('');
  }

  lines.push(
    '## Contact',
    '',
    `- General enquiries: ${BRAND_EMAIL_HELLO}`,
    `- Existing guests (changes, refunds, on-trip help): ${BRAND_EMAIL_SUPPORT}`,
    `- WhatsApp concierge: link available on ${baseUrl}`,
    `- FAQ: ${baseUrl}/faq`,
    `- Sitemap: ${baseUrl}/sitemap.xml`,
    ''
  );

  return lines.join('\n');
}
