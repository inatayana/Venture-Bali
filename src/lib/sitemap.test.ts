import { renderSitemapXml } from './sitemap';

describe('renderSitemapXml', () => {
  it('lists URLs with lastmod, changefreq and priority', () => {
    const xml = renderSitemapXml([
      {
        url: 'https://baliwild.com/',
        lastModified: new Date('2026-11-01T00:00:00.000Z'),
        changeFrequency: 'daily',
        priority: 1,
      },
    ]);

    expect(xml).toContain('<loc>https://baliwild.com/</loc>');
    expect(xml).toContain('<lastmod>2026-11-01T00:00:00.000Z</lastmod>');
    expect(xml).toContain('<changefreq>daily</changefreq>');
    expect(xml).toContain('<priority>1</priority>');
    expect(xml).not.toContain('xmlns:image');
  });

  it('adds the image namespace and gallery URLs when products have images', () => {
    const xml = renderSitemapXml([
      {
        url: 'https://baliwild.com/experiences/v1/tubing',
        images: [
          'https://baliwild.com/images/tubing.svg',
          'https://baliwild.com/images/tubing-2.svg',
        ],
      },
    ]);

    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml.match(/<image:image>/g)).toHaveLength(2);
    expect(xml).toContain('<image:loc>https://baliwild.com/images/tubing-2.svg</image:loc>');
  });

  it('escapes XML-sensitive characters in URLs', () => {
    const xml = renderSitemapXml([
      { url: 'https://baliwild.com/?category=atv&sort=top' },
    ]);

    expect(xml).toContain('https://baliwild.com/?category=atv&amp;sort=top');
  });
});
