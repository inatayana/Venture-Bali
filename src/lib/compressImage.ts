/**
 * Client-side photo compression.
 *
 * Review photos keep the simple fixed-quality pipeline (1600px, WebP).
 * Product media uses `compressToTarget`: an adaptive loop that guarantees a
 * single WebP master under the byte budget (see
 * `docs/MEMO_MEDIA_ARCHITECTURE.md`), so the server needs no image encoder.
 */
const MAX_EDGE = 1600;
const TARGET_QUALITY = 0.82;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Product master defaults (memo: 1 master + optimizer per device). */
export const PRODUCT_MAX_EDGE = 1600;
export const PRODUCT_MAX_BYTES = 300 * 1024;
/** Minimum source resolution gates, by product media slot. */
export const PRODUCT_MIN_SOURCE_EDGE = { hero: 1200, gallery: 1000 } as const;
const QUALITY_START = 0.82;
const QUALITY_MIN = 0.45;
const OUTPUT_EDGE_FLOOR = 800;
const EDGE_SHRINK = 0.85;
/** Product display slots crop to 3:2. */
export const PRODUCT_ASPECT_RATIO = 3 / 2;
/** Warn only when the 3:2 crop removes a meaningful share of the photo. */
const CROP_WARN_THRESHOLD = 0.15;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this photo.'));
    };
    image.src = url;
  });
}

function encodeWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
  });
}

export async function compressReviewPhoto(file: File): Promise<File> {
  const image = await loadImage(file);
  const { width, height } = planDimensions(image.width, image.height, MAX_EDGE);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not process this photo.');
  context.drawImage(image, 0, 0, width, height);

  const blob = await encodeWebp(canvas, TARGET_QUALITY);
  if (!blob) throw new Error('Could not process this photo.');
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error('Each photo must be under 5 MB.');

  const name = file.name.replace(/\.[^.]+$/, '') || 'review-photo';
  return new File([blob], `${name}.webp`, { type: 'image/webp' });
}

/** Target dimensions for a max edge, keeping the aspect ratio and never upscaling. */
export function planDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  const scale = Math.min(1, maxEdge / longest);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Descending WebP qualities tried at each edge, e.g. [0.82, 0.72, 0.62, 0.52, 0.45]. */
export function qualityLadder(start: number = QUALITY_START, min: number = QUALITY_MIN): number[] {
  const ladder: number[] = [];
  let quality = start;
  while (quality > min) {
    ladder.push(quality);
    quality = Math.round((quality - 0.1) * 100) / 100;
  }
  ladder.push(min);
  return [...new Set(ladder)];
}

/** Edges tried when quality alone cannot reach the byte budget (e.g. [1600, 1360, …, 800]). */
export function shrinkEdges(
  maxEdge: number = PRODUCT_MAX_EDGE,
  floor: number = OUTPUT_EDGE_FLOOR,
): number[] {
  const edges: number[] = [];
  let edge = Math.round(maxEdge);
  while (edge > floor) {
    edges.push(edge);
    edge = Math.round(edge * EDGE_SHRINK);
  }
  edges.push(floor);
  return edges;
}

/** Informative warning when the photo does not fit the 3:2 display slot. */
export function aspectCropWarning(
  width: number,
  height: number,
  ratio: number = PRODUCT_ASPECT_RATIO,
): string | null {
  if (width <= 0 || height <= 0) return null;
  const current = width / height;
  const deviation = current > ratio ? 1 - ratio / current : 1 - current / ratio;
  if (deviation < CROP_WARN_THRESHOLD) return null;
  const percent = Math.round(deviation * 100);
  if (current > ratio) {
    return `${width}×${height} — about ${percent}% of the sides is cropped by the 3:2 slot. Consider a 3:2 photo.`;
  }
  return `${width}×${height} — about ${percent}% of the top and bottom is cropped by the 3:2 slot. Consider a landscape photo.`;
}

export interface CompressTargetOptions {
  /** Longest side of the stored master (default 1600). */
  maxEdge?: number;
  /** Byte budget for the WebP master (default 300 KB). */
  maxBytes?: number;
  /** Reject sources whose longest side is below this (default 1200, hero). */
  minSourceEdge?: number;
  qualityStart?: number;
  qualityMin?: number;
  /** Smallest edge tried before giving up (default 800). */
  outputEdgeFloor?: number;
}

export interface CompressTargetResult {
  file: File;
  width: number;
  height: number;
  bytes: number;
  quality: number;
  /** Non-blocking 3:2 crop warning for non-conforming aspect ratios. */
  cropWarning: string | null;
}

/**
 * Compress one product photo to a single WebP master within the byte budget.
 *
 * Adaptive loop: at each edge (1600 → ×0.85 → … → 800) try the quality
 * ladder (0.82 → 0.45); accept the first result under budget. Throws
 * informative errors for sources that are too small or too detailed.
 */
export async function compressToTarget(
  file: File,
  options: CompressTargetOptions = {},
): Promise<CompressTargetResult> {
  const {
    maxEdge = PRODUCT_MAX_EDGE,
    maxBytes = PRODUCT_MAX_BYTES,
    minSourceEdge = PRODUCT_MIN_SOURCE_EDGE.hero,
    qualityStart = QUALITY_START,
    qualityMin = QUALITY_MIN,
    outputEdgeFloor = OUTPUT_EDGE_FLOOR,
  } = options;

  const image = await loadImage(file);
  const sourceEdge = Math.max(image.width, image.height);
  if (sourceEdge < minSourceEdge) {
    throw new Error(
      `Your photo is ${image.width}×${image.height}px — too small. The longest side must be at least ${minSourceEdge}px so it stays sharp on every device.`,
    );
  }

  const qualities = qualityLadder(qualityStart, qualityMin);
  const edges = shrinkEdges(maxEdge, outputEdgeFloor);

  for (const edge of edges) {
    const { width, height } = planDimensions(image.width, image.height, edge);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process this photo.');
    context.drawImage(image, 0, 0, width, height);

    for (const quality of qualities) {
      const blob = await encodeWebp(canvas, quality);
      if (blob && blob.size <= maxBytes) {
        const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
        return {
          file: new File([blob], `${name}.webp`, { type: 'image/webp' }),
          width,
          height,
          bytes: blob.size,
          quality,
          cropWarning: aspectCropWarning(width, height),
        };
      }
    }
  }

  throw new Error(
    `This photo is too detailed to compress under ${Math.round(maxBytes / 1024)} KB. Try a photo with a simpler scene, or a smaller photo.`,
  );
}
