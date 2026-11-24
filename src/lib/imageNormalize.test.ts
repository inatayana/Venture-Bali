import sharp from 'sharp';
import {
  ImageNormalizeError,
  normalizeImageToWebp,
  shrinkEdges,
} from './imageNormalize';

/** Deterministic noise: compresses poorly, so the byte budget is exercised. */
function noisePng(width: number, height: number): Promise<Buffer> {
  const pixels = Buffer.alloc(width * height * 3);
  let seed = 42;
  for (let i = 0; i < pixels.length; i += 1) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    pixels[i] = seed % 256;
  }
  return sharp(pixels, { raw: { width, height, channels: 3 } }).png().toBuffer();
}

describe('normalizeImageToWebp', () => {
  it('re-encodes a photo to a WebP master inside the edge and byte limits', async () => {
    const source = await sharp({
      create: { width: 2400, height: 1600, channels: 3, background: { r: 20, g: 140, b: 90 } },
    })
      .jpeg({ quality: 92 })
      .toBuffer();

    const result = await normalizeImageToWebp(source);

    expect(result.buffer.subarray(0, 4).toString()).toBe('RIFF');
    expect(result.buffer.subarray(8, 12).toString()).toBe('WEBP');
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(1600);
    expect(result.bytes).toBeLessThanOrEqual(300 * 1024);
    expect(result.bytes).toBe(result.buffer.length);
  });

  it('honours EXIF orientation and strips metadata', async () => {
    const source = await sharp({
      create: { width: 120, height: 60, channels: 3, background: { r: 200, g: 30, b: 30 } },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const result = await normalizeImageToWebp(source);
    const meta = await sharp(result.buffer).metadata();

    // Orientation 6 means "rotate 90°": the stored master is portrait.
    expect(result.width).toBe(60);
    expect(result.height).toBe(120);
    expect(meta.orientation === undefined || meta.orientation === 1).toBe(true);
    expect(meta.exif).toBeUndefined();
  });

  it('shrinks edge and quality until the byte budget is met', async () => {
    const source = await noisePng(600, 400);
    const budget = 25 * 1024;

    const result = await normalizeImageToWebp(source, {
      maxEdge: 600,
      edgeFloor: 300,
      maxBytes: budget,
    });

    expect(result.bytes).toBeLessThanOrEqual(budget);
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(600);
  });

  it('rejects files that are not decodable photos', async () => {
    await expect(normalizeImageToWebp(Buffer.from('definitely not an image'))).rejects.toBeInstanceOf(
      ImageNormalizeError
    );
  });

  it('rejects sources below the requested minimum resolution with real numbers', async () => {
    const small = await sharp({
      create: { width: 400, height: 300, channels: 3, background: '#fff' },
    })
      .jpeg()
      .toBuffer();

    await expect(normalizeImageToWebp(small, { minSourceEdge: 1200 })).rejects.toThrow(
      /400×300.*1200/
    );
  });

  it('tries descending edges down to the floor', () => {
    const edges = shrinkEdges(1600, 800);

    expect(edges[0]).toBe(1600);
    expect(edges[edges.length - 1]).toBe(800);
    expect(edges).toEqual([...edges].sort((a, b) => b - a));
    expect(new Set(edges).size).toBe(edges.length);
  });
});
