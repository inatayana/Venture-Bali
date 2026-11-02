/**
 * Client-side review photo compression.
 *
 * Keeps uploads small and consistent (max 1600px, WebP) without adding an
 * image-processing dependency to the server.
 */
const MAX_EDGE = 1600;
const TARGET_QUALITY = 0.82;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

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

function encodeWebp(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', TARGET_QUALITY);
  });
}

export async function compressReviewPhoto(file: File): Promise<File> {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not process this photo.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await encodeWebp(canvas);
  if (!blob) throw new Error('Could not process this photo.');
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error('Each photo must be under 5 MB.');

  const name = file.name.replace(/\.[^.]+$/, '') || 'review-photo';
  return new File([blob], `${name}.webp`, { type: 'image/webp' });
}
