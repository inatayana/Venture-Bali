/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { compressReviewPhoto } from '@/lib/compressImage';

const PHOTO_LIMIT = 3;

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  /** Uploads one compressed file and returns its public URL. */
  uploadFile: (file: File) => Promise<string>;
  onUploadingChange?: (uploading: boolean) => void;
}

/** Shared guest-photo picker for booking reviews and founding-guest invites. */
export function PhotoUploader({
  photos,
  onChange,
  uploadFile,
  onUploadingChange,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = PHOTO_LIMIT - photos.length;
    if (remaining <= 0) {
      setError('You can add up to 3 photos.');
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      setError(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} allowed.`);
    }

    setUploading(true);
    onUploadingChange?.(true);
    for (const file of selected) {
      try {
        if (!file.type.startsWith('image/')) throw new Error('Use a JPG, PNG or WebP photo.');
        const compressed = await compressReviewPhoto(file);
        const url = await uploadFile(compressed);
        onChange([...photos, url].slice(0, PHOTO_LIMIT));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not upload the photo.');
      }
    }
    setUploading(false);
    onUploadingChange?.(false);
  };

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        Photos <span className="font-normal normal-case tracking-normal">(optional, up to 3)</span>
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={photo} className="relative overflow-hidden rounded-xl bg-inset">
            <img
              src={photo}
              alt={`Review photo ${index + 1}`}
              className="aspect-[4/3] w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(photos.filter((url) => url !== photo))}
              aria-label={`Remove photo ${index + 1}`}
              className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-overlay/70 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {photos.length < PHOTO_LIMIT && (
          <label
            className={cn(
              'flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong text-xs font-medium text-foreground-secondary transition-colors hover:border-line-control',
              uploading && 'pointer-events-none opacity-60'
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
            )}
            {uploading ? 'Uploading…' : 'Add photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => {
                void handleFiles(event.target.files);
                event.target.value = '';
              }}
              className="sr-only"
            />
          </label>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
