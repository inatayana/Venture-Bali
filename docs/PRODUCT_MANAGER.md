# Product Manager — Admin

> **Status:** Implemented (v3.9.0)
> **Scope:** create/edit a product's core fields, media and SEO. Packages,
> prices, slots and add-ons stay on the product detail page.

## Routes

| Route | Purpose |
|---|---|
| `/admin/ventures` | Catalogue list + **New product** |
| `/admin/ventures/new` | Create product |
| `/admin/ventures/[id]` | Packages, operations, edit entry point |
| `/admin/ventures/[id]/edit` | Edit core product fields and gallery |
| `POST /api/admin/ventures` | Create (EDITOR+) |
| `PATCH /api/admin/ventures/[id]` | Update (EDITOR+) |
| `POST /api/admin/product-media` | Upload one hero/gallery photo (EDITOR+) |

`POST /api/experiences` is now **admin-only** too. Its `GET` remains public.

## Create flow

1. Admin → Ventures → **New product**.
2. Fill the product basics, location, content, media and SEO.
3. Save → redirected to the product detail page.
4. Add the **first package** (price, slots, pickup) so the product is bookable.
5. Click **View public** to check the PDP.

Creating a product without a package is allowed and is useful for drafting, but
it cannot be booked until a variant exists.

## Fields

- **Basics:** title (45–60, Title Case), slug, category (9 only), subcategory,
  duration, difficulty, badge, hook, short/long description.
- **Location & safety:** area (`Location`), meeting point name + coordinates,
  min age, max weight, safety briefing.
- **Content:** highlights, inclusions, exclusions, languages, suitable-for,
  itinerary rows, essential info (`perfectFor`, `whatToBring`,
  `knowBeforeYouGo`), FAQs.
- **Media:** hero image URL, gallery up to **8** photos, video URL.
- **SEO:** primary keyword, secondary keywords, search tags.

## Validation

Server-side (`src/lib/adminVentureSchema.ts`):

- Title 45–60 characters and must pass `validateVentureTitle`.
- Category must resolve to one of the 9 mega categories.
- Slug lowercase/hyphen only, unique, no brand name.
- Hero and gallery accept `/images/...` or `https://` only.
- Gallery max 8; hero is de-duplicated from gallery.
- Meeting point name and coordinates must be provided together.
- Location id must exist.
- Tenant is resolved server-side; rating is never edited here (it comes from
  real reviews).

Errors return `{ success: false, error: { message, fields } }`; the form shows
the first actionable message.

## Media upload (v3.9.0)

The form supports both direct upload and URL paste:

- **Hero:** drag & drop a file or browse; a paste field is always available.
- **Gallery:** drag & drop multiple files or browse; paste a URL individually.
- **Reorder:** drag cards, or use the up/down buttons.
- **Hero selection:** “Set hero” on any gallery card swaps it with the current hero.
- **Remove:** delete any gallery photo before saving.
- **Limits:** 8 gallery photos, 5 MB each, JPG/PNG/WebP, compressed to WebP.

Uploads go to the public Supabase bucket named by `SUPABASE_PRODUCT_BUCKET`
(default `product-media`). Create the bucket in Supabase Storage and set:

```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_PRODUCT_BUCKET=product-media
```

If storage is not configured, the dropzones are hidden and the form shows a
short setup note; URL paste still works.

Orphaned files can exist if an admin uploads and then abandons the form; they
are harmless and can be cleaned from the bucket later.

## Revalidation

Create/update revalidates `/`, `/admin/ventures`, the product page (old and new
slug) and `/sitemap.xml`.
