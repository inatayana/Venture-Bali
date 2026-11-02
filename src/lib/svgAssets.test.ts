import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const imagesDir = join(process.cwd(), 'public', 'images');
const svgFiles = readdirSync(imagesDir).filter((file) => file.endsWith('.svg'));

/**
 * The Next image optimizer parses SVGs with librsvg. A raw `&` in text content
 * makes the whole file invalid XML, so the image silently fails in production.
 * Keep the asset set parseable.
 */
describe('SVG assets', () => {
  it.each(svgFiles)('%s has no unescaped ampersands', (file) => {
    const source = readFileSync(join(imagesDir, file), 'utf8');
    expect(source).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9A-Fa-f]+;)/);
  });
});
