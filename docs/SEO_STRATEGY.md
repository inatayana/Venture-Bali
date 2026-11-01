# BaliWild — Technical SEO Strategy

> **Version:** 1.0.0 (Phase 1)
> **Status:** Implemented for product pages, home and blog. Phase 2 is backlog.
> **Guardrails:** `AGENTS.md` §9 — only the 9 adventure mega categories, no invented
> ratings, reviews, authors, addresses or credentials.

## 1. Brand & domain

**Decided:** the site now trades as **BaliWild** on **baliwild.com**. Every
SEO-facing name lives in `src/lib/brand.ts`, and every canonical, sitemap and
QR URL comes from `NEXT_PUBLIC_APP_URL` (`src/lib/seo.ts#getBaseUrl`).

Brand line: **Own the wild.** Positioning: raw, confident Bali adventure —
licensed local operators, instant confirmation, honest pricing.

Before switching the live host:

1. Point `NEXT_PUBLIC_APP_URL` at `https://baliwild.com` in production and
   redeploy (Next bakes public env at build time).
2. No legacy domain is owned (`venture-bali.com` / `venturebali.com` were never
   registered), so no 301 is needed. If a legacy host appears later, 301 it to
   the matching `baliwild.com` path.
3. Re-submit `/sitemap.xml` and check canonical tags on product, blog and home.
4. Update Google Business Profile, email sender (`EMAIL_FROM`), WhatsApp
   templates and any external booking links to the new brand.

Domain names are a weak ranking factor; brand searches, content, reviews and
technical health matter more. Do not run both brands on the same inventory.

## 2. Phase 1 — implemented

### Metadata
- Product meta title is capped at **60 characters**: the ` | BaliWild`
  suffix is dropped when it would overflow (`generateVentureMetadata`).
- Product meta description is capped at **155 characters**.
- Blog meta title/description use the same limits and derive the canonical from
  `NEXT_PUBLIC_APP_URL` instead of a hardcoded host.

### JSON-LD (`src/lib/seo.ts`)
- **Product**: name, description, SKU, brand, all gallery images (max 8),
  IDR offer, `InStock`/`SoldOut`, `AggregateRating` only when real approved
  reviews exist, and up to 5 real `Review` nodes (author + date + body).
- **TouristAttraction**: location-based attraction entity.
- **BreadcrumbList**: Home → category (`/?category=<slug>`) → product.
- **FAQPage**: only when the product has FAQs.
- **Website graph** on the homepage: `Organization`, `WebSite` with
  `SearchAction`, and `TravelAgency`.
- **BlogPosting** + breadcrumb on articles. Author/publisher is the editorial
  organization, never a fabricated person.

`JsonLd` (`src/components/seo/JsonLd.tsx`) escapes `<` so user-generated review
text cannot break out of the script tag.

### Sitemap & images
`/sitemap.xml` is now a route handler (`src/app/sitemap.xml/route.ts`) because
Next 14's metadata sitemap ignores image entries. It emits:
- home and `/blog`
- every product with `lastmod` and up to 8 `<image:image>` entries
- every published article with `lastmod`

### Internal linking
Generated articles already turn product-title mentions into product links
(`src/lib/aiContent.ts#addInternalLinks`), and every article has a related
adventure block. Category and product URLs are stable.

## 3. Phase 2 — not built yet (needs a decision)

| Module | Why it is deferred | Prerequisite |
|---|---|---|
| Programmatic `/[activity]-[location]` pages | Risk of thin/doorway pages; conflicts with `/experiences/[id]/[slug]` and the 9-category guardrail | Approved URL map + unique copy/data per page |
| Review-harvested FAQs | Would publish unmoderated UGC claims | Moderation rules + canonical FAQ ownership |
| Image compression to WebP/AVIF | Needs an upload pipeline | Storage decision (Supabase) + dependency approval |
| Auto-301 broken links | A wrong redirect can hide real pages | Analytics/404 log + review queue |
| Backlink outreach agent | Sending mail and scraping directories has legal/domain-reputation risk | Sending domain, outreach policy, approval |
| Expert author schema | No real author profiles exist | Real named experts + consent |

## 4. Verification

```bash
npm run lint
npm run typecheck
npm test

# After starting the app:
curl -s http://localhost:3002/sitemap.xml | grep image:loc
curl -s http://localhost:3002/experiences/<id>/<slug> | grep -o "BreadcrumbList"
```

Then validate a product URL and a blog URL with Google's Rich Results Test and
confirm the sitemap in Search Console. Re-run after changing
`NEXT_PUBLIC_APP_URL` or the brand constants.
