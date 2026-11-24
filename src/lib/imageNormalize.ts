import sharp from 'sharp';

/**
 * Server-side image normalisation with sharp.
 *
 * The admin form already compresses photos in the browser (see
 * `src/lib/compressImage.ts`), but the server must not trust the uploaded
 * bytes: this module re-decodes every upload, honours EXIF orientation, strips
 * all metadata (GPS, device, timestamps) and re-encodes a single WebP master
 * under the byte budget. Anything that is not a decodable photo is rejected.
 *
 * Runtime: Node only (route handler / server component). Never import from a
 * client component.
 */

/** Longest side of the stored master, matching the media memo. */
export const NORMALIZED_MAX_EDGE = 1600;
/** Byte budget for the stored WebP master. */
export const NORMALIZED_MAX_BYTES = 300 * 1024;
/** Smallest edge tried when quality alone cannot reach the budget. */
export const NORMALIZED_EDGE_FLOOR = 800;

const QUALITY_LADDER = [0.82, 0.72, 0.62, 0.52, 0.45] as const;
const EDGE_SHRINK = 0.85;

export class ImageNormalizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageNormalizeError';
  }
}

export interface NormalizedImage {
  buffer: Buffer;
  width: number;
  height: number;
  bytes: number;
  /** WebP quality (0–100) that fit the byte budget. */
  quality: number;
}

export interface NormalizeOptions {
  maxEdge?: number;
  maxBytes?: number;
  edgeFloor?: number;
  /** Reject sources whose longest side is below this. */
  minSourceEdge?: number;
}

/** Edges tried, e.g. [1600, 1360, 1156, 982, 835, 800]. */
export function shrinkEdges(maxEdge: number, floor: number): number[] {
  const edges: number[] = [];
  let edge = Math.round(maxEdge);
  while (edge > floor) {
    edges.push(edge);
    edge = Math.round(edge * EDGE_SHRINK);
  }
  edges.push(floor);
  return [...new Set(edges)];
}

/**
 * Decode any photo buffer and return one WebP master within the byte budget.
 * Throws `ImageNormalizeError` with a human-readable message.
 */
export async function normalizeImageToWebp(
  input: Buffer,
  options: NormalizeOptions = {}
): Promise<NormalizedImage> {
  const {
    maxEdge = NORMALIZED_MAX_EDGE,
    maxBytes = NORMALIZED_MAX_BYTES,
    edgeFloor = NORMALIZED_EDGE_FLOOR,
    minSourceEdge,
  } = options;

  let sourceWidth: number | undefined;
  let sourceHeight: number | undefined;
  try {
    // `rotate()` without arguments applies the EXIF orientation; metadata is
    // read first only to validate the source and gate its resolution.
    const metadata = await sharp(input, { failOn: 'error' }).metadata();
    sourceWidth = metadata.width;
    sourceHeight = metadata.height;
  } catch {
    throw new ImageNormalizeError('That file is not a readable photo.');
  }

  if (!sourceWidth || !sourceHeight) {
    throw new ImageNormalizeError('That file is not a readable photo.');
  }
  if (minSourceEdge && Math.max(sourceWidth, sourceHeight) < minSourceEdge) {
    throw new ImageNormalizeError(
      `Your photo is ${sourceWidth}×${sourceHeight}px — too small. The longest side must be at least ${minSourceEdge}px.`
    );
  }

  for (const edge of shrinkEdges(maxEdge, edgeFloor)) {
    let resized: Buffer;
    try {
      resized = await sharp(input, { failOn: 'error' })
        .rotate()
        .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    } catch {
      throw new ImageNormalizeError('That file is not a readable photo.');
    }

    for (const quality of QUALITY_LADDER) {
      const { data, info } = await sharp(resized)
        .webp({ quality: Math.round(quality * 100), effort: 4 })
        .toBuffer({ resolveWithObject: true });

      if (info.size <= maxBytes) {
        return {
          buffer: data,
          width: info.width,
          height: info.height,
          bytes: info.size,
          quality: Math.round(quality * 100),
        };
      }
    }
  }

  throw new ImageNormalizeError(
    `This photo is too detailed to compress under ${Math.round(maxBytes / 1024)} KB. Try a simpler scene or a smaller photo.`
  );
}
