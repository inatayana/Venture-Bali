import {
  addInternalLinks,
  validateGeneratedArticle,
  type ArticleRequest,
  type GeneratedArticle,
} from './aiContent';

const request: ArticleRequest = {
  title: 'Ubud ATV Jungle Ride through Rice Terraces and Waterfalls',
  primaryKeyword: 'Ubud ATV',
  category: 'ATV',
  destination: 'Ubud',
};

function makeArticle(overrides: Partial<GeneratedArticle> = {}): GeneratedArticle {
  return {
    title: request.title,
    slug: 'ubud-atv-jungle-ride-guide',
    metaDescription: 'A guide to the Ubud ATV jungle ride through rice terraces and waterfalls.',
    keywords: ['Ubud ATV', 'quad bike Bali'],
    tags: ['atv', 'ubud'],
    content: `${'Ride through the rice terraces of Ubud on a quad bike. '.repeat(
      12
    )}\n\n## Booking options\n\nMeet the operator at the location, or choose private transfer.`,
    ...overrides,
  };
}

describe('validateGeneratedArticle', () => {
  it('accepts a compliant article', () => {
    expect(validateGeneratedArticle(makeArticle(), request)).toBeNull();
  });

  it('rejects an article without content', () => {
    expect(validateGeneratedArticle(makeArticle({ content: '' }), request)).toContain(
      'no title or no content'
    );
  });

  it('rejects a title that breaks the length rule', () => {
    const rejection = validateGeneratedArticle(makeArticle({ title: 'Short title' }), request);
    expect(rejection).toContain('Product Title Constitution');
  });

  it('rejects a title with a forbidden word', () => {
    const rejection = validateGeneratedArticle(
      makeArticle({ title: 'Best Ubud ATV Jungle Ride through Rice Terraces and Waterfalls' }),
      request
    );
    expect(rejection).toContain('forbidden');
  });

  it('rejects a title that misses the primary keyword window', () => {
    const rejection = validateGeneratedArticle(
      makeArticle({ title: 'Explore the Rice Terraces of Bali on a Morning Adventure Ride' }),
      request
    );
    expect(rejection).toContain('first 25 characters');
  });

  it('rejects an invalid slug', () => {
    const rejection = validateGeneratedArticle(
      makeArticle({ slug: 'Ubud ATV Guide!' }),
      request
    );
    expect(rejection).toContain('slug');
  });

  it('rejects a category outside the 9 mega categories', () => {
    const rejection = validateGeneratedArticle(
      makeArticle(),
      { ...request, category: 'Hotel' }
    );
    expect(rejection).toContain('9 adventure mega categories');
  });

  it('rejects a very short article', () => {
    const rejection = validateGeneratedArticle(
      makeArticle({ content: 'Too short.' }),
      request
    );
    expect(rejection).toContain('too short');
  });

  it('rejects an article that mentions the brand', () => {
    const rejection = validateGeneratedArticle(
      makeArticle({ content: `${'Adventure content. '.repeat(40)} Venture Bali is great.` }),
      request
    );
    expect(rejection).toContain('brand name');
  });

  it('rejects an article that contains emoji', () => {
    const rejection = validateGeneratedArticle(
      makeArticle({ content: `${'Adventure content. '.repeat(40)} 🏍️` }),
      request
    );
    expect(rejection).toContain('emoji');
  });
});

describe('addInternalLinks', () => {
  it('links every mention of a product title', () => {
    const ventures = [
      { title: 'Ubud ATV Jungle Ride through Rice Terraces and Waterfalls', slug: 'ubud-atv-jungle-ride' },
    ];

    const result = addInternalLinks(
      'Try the Ubud ATV Jungle Ride through Rice Terraces and Waterfalls today.',
      ventures
    );

    expect(result).toContain(
      '[Ubud ATV Jungle Ride through Rice Terraces and Waterfalls](/experiences/ubud-atv-jungle-ride)'
    );
  });

  it('leaves the content alone when nothing matches', () => {
    const content = 'A paragraph about Bali.';
    expect(addInternalLinks(content, [{ title: 'Other Product', slug: 'other' }])).toBe(content);
  });

  it('ignores entries without a title or slug', () => {
    const content = 'A paragraph about Bali.';
    expect(
      addInternalLinks(content, [
        { title: '', slug: 'x' },
        { title: 'Something', slug: '' },
      ])
    ).toBe(content);
  });

  it('links several products', () => {
    const ventures = [
      { title: 'Product One', slug: 'product-one' },
      { title: 'Product Two', slug: 'product-two' },
    ];

    const result = addInternalLinks('Product One and Product Two are great.', ventures);

    expect(result).toContain('(/experiences/product-one)');
    expect(result).toContain('(/experiences/product-two)');
  });
});
