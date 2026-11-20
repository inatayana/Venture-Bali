import { buildLlmsTxt } from './llms';
import { PUBLIC_FACTS, PUBLIC_FAQS } from './publicFacts';

describe('buildLlmsTxt', () => {
  const products = [
    {
      id: 'vtr-001',
      slug: 'ubud-river-tubing',
      title: 'Ubud River Tubing Adventure',
      category: 'Tubing',
      duration: '4 hrs',
      minAge: 7,
    },
  ];

  it('states the local-operator identity and first-hand commission figures', () => {
    const text = buildLlmsTxt('https://baliwild.com', products);

    expect(text).toContain('Bali-owned and operated adventure operator');
    expect(text).toContain('GetYourGuide 30%');
    expect(text).toContain('Klook 30%');
    expect(text).toContain('Viator 25%');
    expect(text).toContain('Airbnb Experiences 20%');
  });

  it('includes every authoritative FAQ answer', () => {
    const text = buildLlmsTxt('https://baliwild.com', products);

    for (const { question, answer } of PUBLIC_FAQS) {
      expect(text).toContain(question);
      expect(text).toContain(answer);
    }
  });

  it('links products with the real route and avoids stale prices', () => {
    const text = buildLlmsTxt('https://baliwild.com', products);

    expect(text).toContain(
      '[Ubud River Tubing Adventure](https://baliwild.com/experiences/vtr-001/ubud-river-tubing)'
    );
    expect(text).toContain('min age 7');
    expect(text).toContain('Live price: product page.');
  });

  it('degrades gracefully when the catalogue is unavailable', () => {
    const text = buildLlmsTxt('https://baliwild.com', []);
    expect(text).toContain('temporarily unavailable');
  });

  it('never publishes the forbidden 100% ownership claim', () => {
    expect(buildLlmsTxt('https://baliwild.com', products)).not.toContain('100% Bali-owned');
    expect(PUBLIC_FACTS.refund.refundPercent).toBe(80);
  });
});
