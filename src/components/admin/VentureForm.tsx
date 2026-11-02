'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImagePlus,
  Loader2,
  Plus,
  Star,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { MEGA_CATEGORIES } from '@/lib/taxonomy';
import { buildVentureSlug } from '@/lib/slug';
import { isVentureSlugValid, validateVentureTitle } from '@/lib/titleValidator';
import { compressReviewPhoto } from '@/lib/compressImage';
import { cn } from '@/utils/cn';

const MAX_GALLERY = 8;
const DIFFICULTIES = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'CHALLENGING', label: 'Challenging' },
] as const;
const SUITABLE_FOR = [
  { value: 'KIDS', label: 'Kids' },
  { value: 'COUPLE', label: 'Couple' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'SOLO', label: 'Solo' },
  { value: 'GROUP', label: 'Group' },
] as const;

export interface VentureFormLocation {
  id: string;
  name: string;
  region: string;
}

export interface VentureFormInitial {
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  hook3Sec: string;
  shortDescription: string;
  longDescription: string;
  duration: string;
  difficulty: string;
  badge: string;
  locationId: string;
  meetingPoint: string;
  meetingPointLat: number | null;
  meetingPointLng: number | null;
  minAge: number | null;
  maxWeightKg: number | null;
  safetyBriefing: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  languages: string[];
  suitableFor: string[];
  itinerary: Array<{
    time: string;
    activity: string;
    duration: string;
    durationMinutes: number | null;
  }>;
  essentialInfo: {
    perfectFor: string[];
    whatToBring: string[];
    knowBeforeYouGo: string[];
  };
  faqs: Array<{ question: string; answer: string }>;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchTags: string[];
  imageUrl: string;
  gallery: string[];
  videoUrl: string;
}

interface VentureFormProps {
  mode: 'create' | 'edit';
  ventureId?: string;
  initial?: VentureFormInitial;
  locations: VentureFormLocation[];
  /** True when Supabase product-media storage is configured. */
  mediaUploadEnabled?: boolean;
}

const inputClass =
  'mt-1 block min-h-[44px] w-full rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 outline-none focus:border-brand-ink';
const textareaClass =
  'mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand-ink';
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-neutral-600';

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitCommas(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isAssetUrl(value: string): boolean {
  return value.startsWith('/') || /^https?:\/\//i.test(value);
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
      <h2 className="font-heading text-base font-bold text-neutral-900">{title}</h2>
      {description && <p className="mt-1 text-xs text-neutral-600">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function VentureForm({
  mode,
  ventureId,
  initial,
  locations,
  mediaUploadEnabled = false,
}: VentureFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? '');
  const [hook3Sec, setHook3Sec] = useState(initial?.hook3Sec ?? '');
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? '');
  const [longDescription, setLongDescription] = useState(initial?.longDescription ?? '');
  const [duration, setDuration] = useState(initial?.duration ?? '');
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 'EASY');
  const [badge, setBadge] = useState(initial?.badge ?? '');
  const [locationId, setLocationId] = useState(initial?.locationId ?? '');
  const [meetingPoint, setMeetingPoint] = useState(initial?.meetingPoint ?? '');
  const [meetingPointLat, setMeetingPointLat] = useState(
    initial?.meetingPointLat != null ? String(initial.meetingPointLat) : ''
  );
  const [meetingPointLng, setMeetingPointLng] = useState(
    initial?.meetingPointLng != null ? String(initial.meetingPointLng) : ''
  );
  const [minAge, setMinAge] = useState(initial?.minAge != null ? String(initial.minAge) : '');
  const [maxWeightKg, setMaxWeightKg] = useState(
    initial?.maxWeightKg != null ? String(initial.maxWeightKg) : ''
  );
  const [safetyBriefing, setSafetyBriefing] = useState(initial?.safetyBriefing ?? '');
  const [highlights, setHighlights] = useState((initial?.highlights ?? []).join('\n'));
  const [inclusions, setInclusions] = useState((initial?.inclusions ?? []).join('\n'));
  const [exclusions, setExclusions] = useState((initial?.exclusions ?? []).join('\n'));
  const [languages, setLanguages] = useState((initial?.languages ?? ['en', 'id']).join(', '));
  const [suitableFor, setSuitableFor] = useState<string[]>(initial?.suitableFor ?? []);
  const [itinerary, setItinerary] = useState(
    initial?.itinerary?.length
      ? initial.itinerary
      : [{ time: '', activity: '', duration: '', durationMinutes: null }]
  );
  const [perfectFor, setPerfectFor] = useState(
    (initial?.essentialInfo.perfectFor ?? []).join('\n')
  );
  const [whatToBring, setWhatToBring] = useState(
    (initial?.essentialInfo.whatToBring ?? []).join('\n')
  );
  const [knowBeforeYouGo, setKnowBeforeYouGo] = useState(
    (initial?.essentialInfo.knowBeforeYouGo ?? []).join('\n')
  );
  const [faqs, setFaqs] = useState(
    initial?.faqs?.length ? initial.faqs : [{ question: '', answer: '' }]
  );
  const [primaryKeyword, setPrimaryKeyword] = useState(initial?.primaryKeyword ?? '');
  const [secondaryKeywords, setSecondaryKeywords] = useState(
    (initial?.secondaryKeywords ?? []).join(', ')
  );
  const [searchTags, setSearchTags] = useState((initial?.searchTags ?? []).join(', '));
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? []);
  const [galleryDraft, setGalleryDraft] = useState('');
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '');
  const [uploading, setUploading] = useState<'hero' | 'gallery' | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<'hero' | 'gallery' | null>(null);
  const [draggingPhoto, setDraggingPhoto] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugTouched) setSlug(buildVentureSlug(title));
  }, [title, slugTouched]);

  const titleCheck = useMemo(
    () => validateVentureTitle({ title, primaryKeyword }),
    [title, primaryKeyword]
  );
  const slugValid = isVentureSlugValid(slug);

  const toggleSuitable = (value: string) => {
    setSuitableFor((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const addGallery = () => {
    const value = galleryDraft.trim();
    if (!value) return;
    if (!isAssetUrl(value)) {
      setMediaError('Gallery needs a /images/... path or an https:// URL.');
      return;
    }
    if (value === imageUrl.trim()) {
      setMediaError('The hero image is already the first photo; no need to add it again.');
      return;
    }
    if (gallery.includes(value)) {
      setMediaError('That photo is already in the gallery.');
      return;
    }
    if (gallery.length >= MAX_GALLERY) {
      setMediaError(`Gallery can hold up to ${MAX_GALLERY} photos.`);
      return;
    }
    setGallery([...gallery, value]);
    setGalleryDraft('');
    setMediaError(null);
  };

  const moveGallery = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[target]] = [next[target], next[index]];
    setGallery(next);
  };

  const moveGalleryTo = (targetIndex: number) => {
    if (draggingPhoto === null || draggingPhoto === targetIndex) {
      setDraggingPhoto(null);
      return;
    }
    const next = [...gallery];
    const [moved] = next.splice(draggingPhoto, 1);
    next.splice(targetIndex, 0, moved);
    setGallery(next);
    setDraggingPhoto(null);
  };

  const setHeroFromGallery = (photo: string) => {
    const previousHero = imageUrl.trim();
    const nextGallery = gallery.filter((url) => url !== photo);
    if (previousHero && previousHero !== photo && !nextGallery.includes(previousHero)) {
      nextGallery.unshift(previousHero);
    }
    setImageUrl(photo);
    setGallery(nextGallery.slice(0, MAX_GALLERY));
  };

  const uploadOne = async (file: File): Promise<string> => {
    if (!mediaUploadEnabled) {
      throw new Error(
        'Direct upload is not configured. Add the Supabase product-media bucket and env first, or paste an image URL.'
      );
    }
    const compressed = await compressReviewPhoto(file);
    const form = new FormData();
    form.set('file', compressed);
    const response = await fetch('/api/admin/product-media', { method: 'POST', body: form });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message ?? 'Could not upload the photo.');
    }
    return data.data.url as string;
  };

  const uploadFiles = async (files: FileList | File[], target: 'hero' | 'gallery') => {
    if (uploading) return;
    const images = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (images.length === 0) return;
    if (!mediaUploadEnabled) {
      setMediaError(
        'Direct upload is not configured. Add the Supabase project URL, service-role key and product-media bucket first.'
      );
      return;
    }

    setMediaError(null);
    setUploading(target);
    try {
      if (target === 'hero') {
        const url = await uploadOne(images[0]);
        setImageUrl(url);
      } else {
        const slots = MAX_GALLERY - gallery.length;
        if (slots <= 0) {
          setMediaError(`Gallery can hold up to ${MAX_GALLERY} photos.`);
          return;
        }
        if (images.length > slots) {
          setMediaError(`Only ${slots} more photo${slots === 1 ? '' : 's'} can be added.`);
        }
        const uploaded: string[] = [];
        for (const file of images.slice(0, slots)) {
          uploaded.push(await uploadOne(file));
        }
        setGallery((current) => {
          const next = [...current];
          for (const url of uploaded) {
            if (url !== imageUrl.trim() && !next.includes(url)) next.push(url);
          }
          return next.slice(0, MAX_GALLERY);
        });
      }
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : 'Could not upload the photo.');
    } finally {
      setUploading(null);
      setDragTarget(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (uploading) {
      setError('Wait for the photo upload to finish.');
      return;
    }

    if (!titleCheck.valid) {
      setError(titleCheck.errors[0] ?? 'Fix the product title before saving.');
      return;
    }
    if (!slugValid) {
      setError('Slug must use lowercase letters, numbers and hyphens.');
      return;
    }
    if (!isAssetUrl(imageUrl.trim())) {
      setError('Add a hero image using /images/... or an https:// URL.');
      return;
    }
    if (meetingPoint.trim() && (!meetingPointLat.trim() || !meetingPointLng.trim())) {
      setError('Add the meeting point latitude and longitude.');
      return;
    }
    if (itinerary.some((row) => (row.time.trim() || row.activity.trim()) && !(row.time.trim() && row.activity.trim()))) {
      setError('Each itinerary row needs both a time and an activity.');
      return;
    }
    if (faqs.some((row) => (row.question.trim() || row.answer.trim()) && !(row.question.trim() && row.answer.trim()))) {
      setError('Each FAQ needs both a question and an answer.');
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      category,
      subcategory: subcategory.trim() || undefined,
      hook3Sec: hook3Sec.trim(),
      shortDescription: shortDescription.trim() || undefined,
      longDescription: longDescription.trim() || undefined,
      duration: duration.trim(),
      difficulty,
      badge: badge.trim() || undefined,
      locationId: locationId || undefined,
      meetingPoint: meetingPoint.trim() || undefined,
      meetingPointLat: numberOrUndefined(meetingPointLat),
      meetingPointLng: numberOrUndefined(meetingPointLng),
      minAge: numberOrUndefined(minAge),
      maxWeightKg: numberOrUndefined(maxWeightKg),
      safetyBriefing: safetyBriefing.trim() || undefined,
      highlights: splitLines(highlights),
      inclusions: splitLines(inclusions),
      exclusions: splitLines(exclusions),
      languages: splitCommas(languages).length > 0 ? splitCommas(languages) : ['en', 'id'],
      suitableFor,
      itinerary: itinerary
        .filter((row) => row.time.trim() && row.activity.trim())
        .map((row) => ({
          time: row.time.trim(),
          activity: row.activity.trim(),
          duration: row.duration.trim() || undefined,
          durationMinutes: numberOrUndefined(String(row.durationMinutes ?? '')),
        })),
      essentialInfo: {
        perfectFor: splitLines(perfectFor),
        whatToBring: splitLines(whatToBring),
        knowBeforeYouGo: splitLines(knowBeforeYouGo),
      },
      faqs: faqs
        .filter((row) => row.question.trim() && row.answer.trim())
        .map((row) => ({ question: row.question.trim(), answer: row.answer.trim() })),
      primaryKeyword: primaryKeyword.trim() || undefined,
      secondaryKeywords: splitCommas(secondaryKeywords),
      searchTags: splitCommas(searchTags),
      imageUrl: imageUrl.trim(),
      gallery,
      videoUrl: videoUrl.trim() || undefined,
    };

    setSaving(true);
    try {
      const response = await fetch(
        mode === 'create' ? '/api/admin/ventures' : `/api/admin/ventures/${ventureId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Could not save the product');
      const id = data.data.id as string;
      router.push(`/admin/ventures/${id}?${mode === 'create' ? 'created=1' : 'saved=1'}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Section
        title="Basics"
        description="Title must be 45–60 characters, Title Case, with no brand or vendor name."
      >
        <label className={labelClass}>
          Product title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={45}
            maxLength={60}
            className={inputClass}
            placeholder="Ubud River Tubing: Hidden Canyon Adventure with Lunch"
          />
        </label>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className={cn(title.length >= 45 && title.length <= 60 ? 'text-green-700' : 'text-neutral-500')}>
            {title.length}/60 characters
          </span>
          {title.length > 0 &&
            titleCheck.errors.map((message) => (
              <span key={message} className="text-red-700">
                {message}
              </span>
            ))}
        </div>

        <label className={labelClass}>
          Slug
          <input
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            required
            className={inputClass}
            placeholder="ubud-river-tubing-hidden-canyon"
          />
        </label>
        <p className={cn('text-xs', slug.length === 0 || slugValid ? 'text-neutral-500' : 'text-red-700')}>
          {slug.length === 0
            ? 'Generated from the title. You can edit it before saving.'
            : slugValid
              ? 'Used in the product URL. Changing it breaks old links.'
              : 'Use lowercase letters, numbers and hyphens only.'}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass} required>
              <option value="">Choose category</option>
              {MEGA_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Subcategory (optional)
            <input
              value={subcategory}
              onChange={(event) => setSubcategory(event.target.value)}
              maxLength={60}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Duration
            <input
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              required
              maxLength={40}
              className={inputClass}
              placeholder="3 hours"
            />
          </label>
          <label className={labelClass}>
            Difficulty
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className={inputClass}>
              {DIFFICULTIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Badge (optional)
            <input
              value={badge}
              onChange={(event) => setBadge(event.target.value)}
              maxLength={30}
              className={inputClass}
              placeholder="Best Seller"
            />
          </label>
        </div>

        <label className={labelClass}>
          Hook (3 seconds)
          <input
            value={hook3Sec}
            onChange={(event) => setHook3Sec(event.target.value)}
            required
            minLength={10}
            maxLength={120}
            className={inputClass}
            placeholder="Float a hidden canyon, then lunch by the river."
          />
        </label>
        <label className={labelClass}>
          Short description (card + meta, max 200)
          <textarea
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            maxLength={200}
            rows={2}
            className={textareaClass}
          />
        </label>
        <label className={labelClass}>
          Long description
          <textarea
            value={longDescription}
            onChange={(event) => setLongDescription(event.target.value)}
            maxLength={8000}
            rows={6}
            className={textareaClass}
          />
        </label>
      </Section>

      <Section title="Location & safety">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Area
            <select value={locationId} onChange={(event) => setLocationId(event.target.value)} className={inputClass}>
              <option value="">Choose an area</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} · {location.region}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Meeting point name
            <input
              value={meetingPoint}
              onChange={(event) => setMeetingPoint(event.target.value)}
              maxLength={200}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Latitude
            <input
              type="number"
              step="any"
              value={meetingPointLat}
              onChange={(event) => setMeetingPointLat(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Longitude
            <input
              type="number"
              step="any"
              value={meetingPointLng}
              onChange={(event) => setMeetingPointLng(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Minimum age
            <input
              type="number"
              min={0}
              max={100}
              value={minAge}
              onChange={(event) => setMinAge(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Maximum weight (kg)
            <input
              type="number"
              min={20}
              max={300}
              value={maxWeightKg}
              onChange={(event) => setMaxWeightKg(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className={labelClass}>
          Safety briefing
          <textarea
            value={safetyBriefing}
            onChange={(event) => setSafetyBriefing(event.target.value)}
            maxLength={2000}
            rows={3}
            className={textareaClass}
          />
        </label>
      </Section>

      <Section title="Content">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={labelClass}>
            Highlights (one per line)
            <textarea
              value={highlights}
              onChange={(event) => setHighlights(event.target.value)}
              rows={5}
              className={textareaClass}
            />
          </label>
          <label className={labelClass}>
            Inclusions (one per line)
            <textarea
              value={inclusions}
              onChange={(event) => setInclusions(event.target.value)}
              rows={5}
              className={textareaClass}
            />
          </label>
          <label className={labelClass}>
            Exclusions (one per line)
            <textarea
              value={exclusions}
              onChange={(event) => setExclusions(event.target.value)}
              rows={5}
              className={textareaClass}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Languages (comma separated)
            <input
              value={languages}
              onChange={(event) => setLanguages(event.target.value)}
              className={inputClass}
              placeholder="en, id"
            />
          </label>
          <div>
            <span className={labelClass}>Suitable for</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUITABLE_FOR.map((option) => {
                const active = suitableFor.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleSuitable(option.value)}
                    className={cn(
                      'inline-flex min-h-[44px] items-center rounded-full border px-3 text-sm transition-colors',
                      active
                        ? 'border-brand-ink bg-brand-ink text-brand'
                        : 'border-neutral-300 text-neutral-800 hover:border-neutral-500'
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className={labelClass}>Itinerary</span>
            <button
              type="button"
              onClick={() =>
                setItinerary([...itinerary, { time: '', activity: '', duration: '', durationMinutes: null }])
              }
              className="inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-neutral-900 underline"
            >
              <Plus className="h-4 w-4" /> Add row
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {itinerary.map((row, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-neutral-200 p-2 sm:grid-cols-[110px_1fr_110px_90px_44px]">
                <input
                  value={row.time}
                  onChange={(event) => {
                    const next = [...itinerary];
                    next[index] = { ...next[index], time: event.target.value };
                    setItinerary(next);
                  }}
                  placeholder="08:00"
                  className="min-h-[44px] rounded-lg border border-neutral-300 px-2 text-sm"
                />
                <input
                  value={row.activity}
                  onChange={(event) => {
                    const next = [...itinerary];
                    next[index] = { ...next[index], activity: event.target.value };
                    setItinerary(next);
                  }}
                  placeholder="Hotel pickup"
                  className="min-h-[44px] rounded-lg border border-neutral-300 px-2 text-sm"
                />
                <input
                  value={row.duration}
                  onChange={(event) => {
                    const next = [...itinerary];
                    next[index] = { ...next[index], duration: event.target.value };
                    setItinerary(next);
                  }}
                  placeholder="45 min"
                  className="min-h-[44px] rounded-lg border border-neutral-300 px-2 text-sm"
                />
                <input
                  type="number"
                  value={row.durationMinutes ?? ''}
                  onChange={(event) => {
                    const next = [...itinerary];
                    next[index] = {
                      ...next[index],
                      durationMinutes: event.target.value ? Number(event.target.value) : null,
                    };
                    setItinerary(next);
                  }}
                  placeholder="Min"
                  className="min-h-[44px] rounded-lg border border-neutral-300 px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setItinerary(itinerary.filter((_, i) => i !== index))}
                  aria-label={`Remove itinerary row ${index + 1}`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-200 text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className={labelClass}>
            Perfect for (one per line)
            <textarea value={perfectFor} onChange={(event) => setPerfectFor(event.target.value)} rows={4} className={textareaClass} />
          </label>
          <label className={labelClass}>
            What to bring (one per line)
            <textarea value={whatToBring} onChange={(event) => setWhatToBring(event.target.value)} rows={4} className={textareaClass} />
          </label>
          <label className={labelClass}>
            Know before you go (one per line)
            <textarea
              value={knowBeforeYouGo}
              onChange={(event) => setKnowBeforeYouGo(event.target.value)}
              rows={4}
              className={textareaClass}
            />
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className={labelClass}>FAQs</span>
            <button
              type="button"
              onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
              className="inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-neutral-900 underline"
            >
              <Plus className="h-4 w-4" /> Add FAQ
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-neutral-200 p-2 sm:grid-cols-[1fr_2fr_44px]">
                <input
                  value={faq.question}
                  onChange={(event) => {
                    const next = [...faqs];
                    next[index] = { ...next[index], question: event.target.value };
                    setFaqs(next);
                  }}
                  placeholder="Do I need experience?"
                  className="min-h-[44px] rounded-lg border border-neutral-300 px-2 text-sm"
                />
                <input
                  value={faq.answer}
                  onChange={(event) => {
                    const next = [...faqs];
                    next[index] = { ...next[index], answer: event.target.value };
                    setFaqs(next);
                  }}
                  placeholder="No, the guide adjusts the route to the group."
                  className="min-h-[44px] rounded-lg border border-neutral-300 px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setFaqs(faqs.filter((_, i) => i !== index))}
                  aria-label={`Remove FAQ ${index + 1}`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-200 text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="Media"
        description={
          mediaUploadEnabled
            ? 'Drag & drop or browse a photo. Hero is the main image; gallery holds up to 8 more.'
            : 'Direct upload is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_PRODUCT_BUCKET (bucket must be public). URL paste still works.'
        }
      >
        <label className={labelClass}>
          Hero image URL
          <input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            required
            className={inputClass}
            placeholder="/images/hero-bali.jpg"
          />
        </label>

        {mediaUploadEnabled ? (
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragTarget('hero');
            }}
            onDragLeave={() => setDragTarget(null)}
            onDrop={(event) => {
              event.preventDefault();
              void uploadFiles(event.dataTransfer.files, 'hero');
            }}
            className={cn(
              'flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-3 text-center text-sm transition-colors',
              dragTarget === 'hero'
                ? 'border-brand-ink bg-brand/20'
                : 'border-neutral-300 text-neutral-600 hover:border-neutral-500'
            )}
          >
            {uploading === 'hero' ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            ) : (
              <UploadCloud className="h-6 w-6" aria-hidden="true" />
            )}
            <span>
              {uploading === 'hero' ? 'Uploading hero…' : 'Drag hero photo here or '}
              {uploading !== 'hero' && <span className="font-semibold underline">browse</span>}
            </span>
            <span className="text-xs text-neutral-500">JPG, PNG or WebP · max 5 MB · compressed to WebP</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                void uploadFiles(event.target.files ?? [], 'hero');
                event.target.value = '';
              }}
            />
          </label>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Upload belum aktif. Isi <code>NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
            <code>SUPABASE_SERVICE_ROLE_KEY</code>, dan buat bucket publik{' '}
            <code>product-media</code> (env <code>SUPABASE_PRODUCT_BUCKET</code>). Setelah itu
            restart server. Sementara ini gunakan URL paste di bawah.
          </p>
        )}

        {isAssetUrl(imageUrl.trim()) && (
          <div>
            <img
              src={imageUrl}
              alt="Hero preview"
              className="h-40 w-full rounded-lg border border-neutral-200 object-cover sm:w-72"
            />
            <p className="mt-1 text-xs text-neutral-500">Hero preview</p>
          </div>
        )}

        <div>
          <span className={labelClass}>Gallery ({gallery.length}/{MAX_GALLERY})</span>

          {mediaUploadEnabled && (
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragTarget('gallery');
              }}
              onDragLeave={() => setDragTarget(null)}
              onDrop={(event) => {
                event.preventDefault();
                void uploadFiles(event.dataTransfer.files, 'gallery');
              }}
              className={cn(
                'mt-2 flex min-h-[80px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-2 text-center text-sm transition-colors',
                dragTarget === 'gallery'
                  ? 'border-brand-ink bg-brand/20'
                  : 'border-neutral-300 text-neutral-600 hover:border-neutral-500',
                gallery.length >= MAX_GALLERY && 'pointer-events-none opacity-50'
              )}
            >
              {uploading === 'gallery' ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-5 w-5" aria-hidden="true" />
              )}
              <span>
                {uploading === 'gallery'
                  ? 'Uploading photos…'
                  : 'Drag gallery photos here or '}
                {uploading !== 'gallery' && <span className="font-semibold underline">browse</span>}
              </span>
              <span className="text-xs text-neutral-500">
                Add up to {MAX_GALLERY - gallery.length} more · drag cards to reorder
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => {
                  void uploadFiles(event.target.files ?? [], 'gallery');
                  event.target.value = '';
                }}
              />
            </label>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={galleryDraft}
              onChange={(event) => setGalleryDraft(event.target.value)}
              placeholder="/images/gallery/photo-1.jpg"
              className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 text-sm"
            />
            <button
              type="button"
              onClick={addGallery}
              disabled={gallery.length >= MAX_GALLERY}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-neutral-300 px-3 text-sm font-semibold disabled:opacity-50"
            >
              <ImagePlus className="h-4 w-4" /> Add URL
            </button>
          </div>

          {gallery.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {gallery.map((photo, index) => (
                <div
                  key={photo}
                  draggable
                  onDragStart={() => setDraggingPhoto(index)}
                  onDragEnd={() => setDraggingPhoto(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    moveGalleryTo(index);
                  }}
                  className={cn(
                    'overflow-hidden rounded-lg border border-neutral-200 bg-white transition-opacity',
                    draggingPhoto === index && 'opacity-50'
                  )}
                >
                  <div className="relative">
                    <img src={photo} alt={`Gallery ${index + 1}`} className="h-28 w-full object-cover" />
                    <span className="absolute left-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="absolute right-1 top-1 flex h-9 w-9 cursor-grab items-center justify-center rounded-full bg-black/60 text-white">
                      <GripVertical className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 p-1">
                    <button
                      type="button"
                      onClick={() => setHeroFromGallery(photo)}
                      className="inline-flex min-h-[44px] items-center gap-1 px-2 text-xs font-semibold text-neutral-800"
                    >
                      <Star className="h-4 w-4" /> Set hero
                    </button>
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => moveGallery(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move photo ${index + 1} up`}
                        className="flex h-11 w-11 items-center justify-center text-neutral-700 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGallery(index, 1)}
                        disabled={index === gallery.length - 1}
                        aria-label={`Move photo ${index + 1} down`}
                        className="flex h-11 w-11 items-center justify-center text-neutral-700 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGallery(gallery.filter((url) => url !== photo))}
                        aria-label={`Remove photo ${index + 1}`}
                        className="flex h-11 w-11 items-center justify-center text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {mediaError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {mediaError}
          </p>
        )}

        <label className={labelClass}>
          Video URL (optional)
          <input
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </label>
      </Section>

      <Section title="SEO">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Primary keyword
            <input
              value={primaryKeyword}
              onChange={(event) => setPrimaryKeyword(event.target.value)}
              maxLength={80}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Secondary keywords (comma separated)
            <input
              value={secondaryKeywords}
              onChange={(event) => setSecondaryKeywords(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className={labelClass}>
          Search tags (comma separated)
          <input
            value={searchTags}
            onChange={(event) => setSearchTags(event.target.value)}
            className={inputClass}
          />
        </label>
      </Section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 pt-4">
        <a
          href={mode === 'edit' ? `/admin/ventures/${ventureId}` : '/admin/ventures'}
          className="inline-flex min-h-[44px] items-center rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-800"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={saving || uploading !== null}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create product' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
