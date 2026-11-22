# BaliWild — Technical Growth Audit (capability map & gaps)

> **Version:** 1.0.0
> **Date:** 2026-11-20
> **Status:** FACTUAL RECORD — reference for all teams
> **Method:** read-only exploration of the repository at `5d159a7` (plus working
> tree observation). No files were modified during the audit.
> **Companion:** `docs/GROWTH_STRATEGY_2026.md`

This document records **what actually exists** and **what is missing**, so no team
re-litigates the same investigation and no one builds something that already works.

---

## 1. SEO & discoverability

### Implemented
- **Root metadata** — `src/app/layout.tsx`: title/description from `src/lib/brand.ts`,
  `applicationName`, `appleWebApp`, OpenGraph, Twitter, icons, `Viewport`.
- **Metadata generators** — `src/lib/seo.ts`:
  - `generateVentureMetadata()` — title ≤60 (conditional ` | BaliWild` suffix),
    description ≤155, canonical `/experiences/[id]/[slug]`, OG `id_ID`,
    `summary_large_image`, `index/follow + noarchive/notranslate`.
  - `generateExperiencesMetadata()`, `generateCategoryMetadata()`
    (`[Canonical] Adventures in Bali | BaliWild`, canonical `/activities/[slug]`).
  - Blog metadata inline in `src/app/blog/[slug]/page.tsx:45-88` (60/155 caps).
- **JSON-LD** — `src/lib/seo.ts`:
  - `generateVentureStructuredData()`: `Product` (SKU = slug, brand, ≤8 images,
    IDR `Offer`, `InStock/SoldOut`, `AggregateRating` **only** when `reviewCount > 0`,
    ≤5 real `Review` nodes), `TouristAttraction`, `BreadcrumbList`,
    `FAQPage` only when `venture.faqs` is non-empty.
  - `generateWebsiteStructuredData()`: `Organization`, `WebSite` + `SearchAction`,
    `TravelAgency`.
  - `generateArticleStructuredData()`: `BlogPosting` + `BreadcrumbList` (author =
    editorial organisation, never a fabricated person).
  - `generateCategoryStructuredData()`: `ItemList` — **currently a stub**
    (`numberOfItems: 0`, empty `itemListElement`).
- `src/components/seo/JsonLd.tsx` — escapes `<` to `\u003c` (XSS-safe).
- **Sitemap** — `src/app/sitemap.xml/route.ts` (`force-dynamic`, SWR headers) +
  `src/lib/sitemap.ts`. Emits `/`, `/blog`, `/terms`, `/privacy`, `/refund`,
  every venture with `lastmod` + ≤8 image entries, and published articles.
  Falls back to `src/data/mockExperiences.ts` on DB failure.
- **Robots** — `src/app/robots.ts`: allows `/`, disallows `/checkout`, `/voucher`,
  `/admin`, `/api`.
- **PWA** — `src/app/manifest.ts`, `src/components/PwaRegistration.tsx`,
  `src/components/InstallPrompt.tsx`, `src/app/offline/page.tsx`.
- **Category landing pages** — `src/app/activities/[category]/page.tsx` (9 pages,
  SSR, in-memory sort/paginate, `CategoryQuickMenu`, `CatalogueSortMenu`).
- **Listings** — `src/app/experiences/page.tsx` (category/q filter, sort, 12/page).
- **Content engine** — `src/lib/aiContent.ts` (`addInternalLinks`, `saveArticle`),
  admin wizard `src/app/admin/content/page.tsx`, API `src/app/api/admin/content/route.ts`.
- **SEO agent** — `src/lib/seo-agent.ts`: `auditCatalogueSeo()` (title constitution),
  `suggestOrganicKeywords()`, `planBacklinkStrategy()`, `requestIndexing()`
  (**placeholder — logs only, returns `success: true`**). UI `src/app/admin/seo/page.tsx`.

### Gaps (verified)
1. **Article internal links are broken in two ways:**
   - `aiContent.ts#addInternalLinks()` emits `/experiences/${venture.slug}` but the
     real route is `/experiences/[id]/[slug]`.
   - `blog/[slug]/page.tsx:100-107` only converts heading/bold/italic/paragraph —
     markdown `[text](url)` is **not** rendered as an anchor. Inserted links never
     appear as links.
2. **Sitemap omits all 9 `/activities/[category]` pages and `/explore`**, although
   `robots.ts` allows them.
3. **Category `ItemList` JSON-LD is empty**, and `activities/[category]/page.tsx:91-94`
   injects it via a raw `<script>` with plain `JSON.stringify` instead of the
   escaping `JsonLd` component.
4. **No site-level FAQ page.** Product FAQ schema exists only when `venture.faqs`
   is populated.
5. **No AEO/GEO artifacts**: no `llms.txt`, no HowTo/VideoObject, no
   conversational-answer blocks. The AI chat is a booking concierge, not a
   content surface.
6. **No GTM/GA4 container in source** — `analytics.ts` only creates `dataLayer`
   plus DOM events; the tag manager must be injected externally.
7. **`/api/v1/*` is absent on this branch** despite `PLATFORM_CONSTITUTION.md` §2
   making API versioning mandatory (note: it exists on the `main` line).
8. No WebP/AVIF build pipeline; no A/B or experimentation layer.
9. No email capture / newsletter / lead magnet anywhere in the app.
10. ~~No location filter in the live UI~~ **Implemented** — `location` added to
    `CatalogueFilters`/`filterCatalogue` and wired through
    `ExploreFiltersProvider`, `ExploreFilterModal`, `ExploreControlBar`,
    `VentureExplorer` and `HomeCatalogue`.
11. No expert author schema / E-E-A-T author profiles (deferred in `SEO_STRATEGY.md` §3).

---

## 2. Content & AI

- `src/lib/aiContent.ts` — 600–900 word long-tail articles. `buildPrompt()` rules:
  exact title, primary keyword in first paragraph + one subheading, **no brand
  name, no operator/partner names**, no "Best/Cheapest/Discount/Free", no emoji,
  ends with "## Booking options" mentioning self-drive + private transfer.
  `validateGeneratedArticle()` enforces title constitution, slug, 9-category
  taxonomy, ≥300 chars, no emoji, no brand mention.
- `src/lib/gemini.ts` — REST `fetch`, no SDK. Default `gemini-3.8-flash`, 30s
  timeout, 3 retries with exponential backoff, 429 quota detection,
  `getLastFailure()`. **Free tier = 20 requests/day/model → ~15 articles/day,
  166 articles ≈ 9 days** (`docs/AI_AGENT.md` §5).
- `src/lib/contentLimits.ts` (`HOOK_MAX=200`, `HIGHLIGHT_MAX=90`),
  `src/lib/titleValidator.ts` (45–60 chars, keyword in first 25, Title Case,
  forbidden words, no emoji).
- Conversational agent: `agent.ts`, `agent-intent.ts`, `agent-service.ts`,
  `agentReply.ts`, `agentSessionStore.ts`; API `src/app/api/ai/chat/route.ts`
  (rate-limited; channels whatsapp/telegram/web; id/en/ja/zh);
  `src/components/chat/ChatWidget.tsx` mounted in root layout.
- **Guardrail already enforced:** "tools are the source of truth; the model only
  explains them" (`docs/AI_AGENT.md` §1). Prices, slots and policy never come from
  model memory. `createBooking` is **not persisted** by design.

### Gaps
- Article moderation is generation-time validation + `publish` boolean; there is
  no editorial review queue for AI articles (review moderation is separate and
  does exist).
- `requestIndexing()` reports false success (see above).
- Backlink strategy is generated but never executed (deferred, with good reason:
  legal/domain-reputation risk, `SEO_STRATEGY.md` §3).

---

## 3. Search & discovery UX

- `src/components/search/SearchProvider.tsx` — global `query/date/pax` (1–20),
  hydrated from URL `q/date/pax`, `submit()` uses `history.replaceState` and
  scrolls to `#results`. Mounted in root layout.
- `ExploreFiltersProvider.tsx` — `transferIncluded`, `selfDriveOnly`,
  `bestSellerOnly`, `selectedCategory`, `sortBy`, `resultCount`.
- `src/lib/filterCatalogue.ts` — pure shared filter/sort: text (title/location/
  description), category, Best Seller, transfer/self-drive, date+pax capacity
  with real cutoff logic, sorts `popular|price-low|price-high|rating|duration`.
  **No location/distance/difficulty filter.**
- UI: `SortMenu.tsx`, `CatalogueSortMenu.tsx`, `CategoryQuickMenu.tsx`,
  `ExploreFilterPills.tsx`, `ExploreFilterModal.tsx`, `ExploreSearchCard.tsx`
  (8 hardcoded hubs), `SearchModal.tsx` (recent searches in localStorage
  `baliwild_recent_searches`), `CategoryChips.tsx`, `FilterChips.tsx`.
- Cards: `VentureCard.tsx` (vertical/horizontal), `VentureListCard.tsx`,
  `VentureExplorer.tsx`.
- Wishlist: `src/store/wishlistStore.ts` — zustand + persist to localStorage
  `baliwild-wishlist`; page `src/app/wishlists/page.tsx`.

---

## 4. Commerce / conversion

- **Booking** — `bookingSchema.ts` (zod), `bookingService.ts` (serialisable
  transaction, `SELECT … FOR UPDATE`, capacity = PAID + active PENDING, coupon
  re-check, server `computeQuote()`, 3 retries, code `BK-…`), `bookingProgress.ts`.
- **UI** — `ExperienceBookingWidget.tsx` (plan → details → payment),
  `BookingActions.tsx`.
- **Slots/variants** — `src/lib/pricing.ts` (`getAvailableSlots`,
  `isDateAvailable`, `isSlotBookable`; SELF_DRIVE ≥2h, transfers D‑1 22:00 WITA),
  `src/app/api/availability/route.ts` (live `spotsLeft`, heatmap, `isFullyBooked`).
- **Fulfilment** — `SELF_DRIVE` (default), `SHARED_TRANSFER`, `PRIVATE_TRANSFER`
  — one SKU, never separate products (`BOOKING_ARCHITECTURE.md`).
- **Price** — `computeQuote()` single source of truth: list/promo, percent coupon,
  night surcharge 50k from 19:00 WITA, minimum-spend top-up, transfer fee by
  zone/class, add-ons × pax, age tiers. All IDR integers; FX display-only.
- **Coupons** — `Coupon` model, `src/app/api/coupons/validate/route.ts`
  (30/min rate limit); promo and coupon never stack.
- **Demand** — `src/lib/demand.ts` — badges from **real paid bookings only**
  (min 3, "hot" at 12). No invented urgency.
- **Payments** — `midtrans.ts`, `snapBilling.ts`, `paymentService.ts`
  (SHA512 verify, amount match, idempotent transaction, coupon consumption,
  voucher, `emitPurchaseEvent()`), webhook + reconcile cron.
- **Waiver** — `legal.ts` (`WAIVER_VERSION='2026-11-18'`), `WaiverSigning.tsx`,
  `SignaturePad.tsx`, HMAC-gated API.
- **Review invites** — `reviewInvite.ts` (HMAC `ri1`, URL + QR),
  `reviewSchema.ts` (`canReviewBooking`: PAID, COMPLETED, no prior review,
  activity day over), invite/review APIs and pages.
- **Holds** — `bookingLifecycle.ts` (`DEFAULT_HOLD_MINUTES=10`), `reap-holds`
  cron cancels stale PENDING + fires `sendHoldExpired()`.
- **WhatsApp** — `whatsapp.ts` Cloud API client, webhook with signature check,
  click-to-chat `wa.me/…` concierge links.

### Gaps
- **Cron cadence mismatch:** the `reap-holds` route comment says "every 10
  minutes" but `vercel.json` schedules it **once daily at 03:00 UTC**. A 10-minute
  hold is not reaped for up to 24h → capacity can stay blocked. (Ops issue —
  coordinate with the team owning `vercel.json`.)
- No abandoned-hold *recovery* message (only expire notification).
- No wishlist alerting.

---

## 5. Trust / brand

- `TrustStrip.tsx` — 4 promises (instant confirmation, free reschedule ≥24h,
  80% refund ≥24h, licensed local operators).
- Guarantee banner in `VentureExplorer.tsx:162-170`.
- `src/lib/brand.ts` — brand name, legal name "BaliWild Adventures", tagline,
  editorial author, emails, socials, Ubud/Gianyar address.
- `src/lib/legal.ts` — operating model: BaliWild / PT Natayana Bali Tours handles
  booking/payment/support; activities performed by licensed local providers whose
  identities/arrangements are confidential.
- Reviews: only approved reviews surfaced (`reviewFeed.ts` `isApproved: true`);
  sources `VERIFIED_BOOKING | FOUNDING_GUEST | IMPORTED`.
- **`/about` did not exist in this branch at audit time.** It has since been built
  on `feat/about-local-impact` (commit `1ec9cdd`) and is **pending merge**.
- ~~No homepage cross-site testimonial/public review section~~ **Implemented**:
  `src/components/features/HomeReviewsSection.tsx` renders the latest approved
  reviews via `latestApprovedReviews()` (`src/lib/reviewFeed.ts`) on the homepage.

---

## 6. Observability / analytics

- `analytics.ts` — consent-gated `track()`, pushes to `window.dataLayer` and
  dispatches `baliwild:analytics` + legacy `vb:analytics` DOM events.
- `AnalyticsPageView.tsx` — one `page_view` per pathname, re-fires on consent.
- Callsites: `view_item`, `select_package`, `begin_checkout` (PDP),
  `checkout_step_view/complete` (widget), server-side `purchase` on PAID webhook.
- Consent: `consent.ts`, `CookieConsent.tsx`.
- Errors: `error.tsx` (Sentry captureException, Bahasa copy), `global-error.tsx`
  (inline styles, shows `error.digest`), `not-found.tsx`, `loading.tsx`.
- Sentry: `sentry.ts` (`tracesSampleRate: 1.0`, noise filters), `instrumentation.ts`.
- Smoke: `scripts/smoke.mjs` checks `/` and `/admin/login`, retries 3×.

### Implemented
- **GTM/GA4 sink** — `src/components/GoogleTagManager.tsx` + `src/lib/gtm.ts`: consent-gated injection of `https://www.googletagmanager.com/gtm.js?id=<NEXT_PUBLIC_GTM_ID>`; mounted in `src/app/layout.tsx`; no-op when unset.

### Gaps
- No funnel dashboard or experiment layer.

---

## 7. i18n / currency

- `LocaleProvider.tsx` — `en|id`, localStorage + cookie + browser language,
  sets `document.documentElement.lang`.
- `CurrencyProvider.tsx` — 9 active currencies, localStorage + cookies + country,
  fetches `/api/fx/rates` with static fallback.
- `fx.ts` — 11 currencies, fallback USD = 16,000 IDR, `exchangerate-api.com`,
  24h cache, `formatCurrency` (Rp id-ID / symbol en-US).
- Dates in UI use hardcoded `en-GB`, not `Intl` driven by `LocaleProvider`.

---

## 8. Performance / architecture

- `revalidate = 60` on `/` and `/blog`; most listing/detail/admin/API routes
  `force-dynamic`; sitemap force-dynamic with SWR headers.
- `next.config.js` — dev/prod `distDir` split, `reactStrictMode`, image
  remotePatterns for Supabase, one 307 redirect, security headers (report-only
  CSP, HSTS in prod, COOP).
- `vercel.json` — 4 crons (reminders 01:00, review-requests 02:00,
  reap-holds 03:00, reconcile-payments 04:00 UTC).
- Images: Next optimiser + Supabase, client-side `compressImage.ts`,
  `productMedia.ts`, `ProductLightbox.tsx`. **No WebP/AVIF build pipeline.**
- No `next/dynamic` component code-splitting.
- Stack: Next 14.2.35 / React 18 / TS 5.5 strict / Tailwind 3.4 / Prisma 5.16 /
  zod / zustand / Sentry / Upstash / Radix.
- Tests: `jest.config.js` (next/jest, jsdom, `@/` alias), scripts
  `lint`/`typecheck`/`test`/`smoke`/`db:seed`.

---

## 9. Taxonomy (single source of truth: `src/lib/taxonomy.ts`)

- `MEGA_CATEGORIES` (9 fixed): ATV & Off-Road, Rafting, River Tubing, Cycling,
  Trekking & Hiking, Water Sports, Snorkeling & Diving, Extreme Adventures,
  Adventure Combo Packages.
- `MEGA_CATEGORY_SHORT_LABELS`: ATV, Rafting, Tubing, Cycling, Trekking,
  Water Sports, Snorkeling, Extreme, Combo — stored in `Venture.category`.
- `MEGA_CATEGORY_SLUGS`: `atv, rafting, tubing, cycling, trekking, water-sports,
  snorkeling, extreme, combo`.
- `CATEGORY_REGISTRY` (canonical/short/emoji/slug/aliases/SEO description),
  `CATEGORY_FILTERS`, `FORBIDDEN_CATEGORY_TOKENS` (hotels, flights, rentals,
  restaurants, spa…), `isAllowedCategory()`, `resolveCategory()`.
- `docs/SEO_TAXONOMY.md` mirror: subcategories, 8-destination graph, keyword
  library, badge system, filter list, difficulty/suitable-for enums.
- Location admin data: `wilayah.ts` + `wilayah-bali.json` (Kemendagri cascade).

---

## 10. How to use this document

- Before proposing a feature, check §1–§9: it may already exist.
- When a gap is closed, move it to "Implemented" **in the same commit** and add
  the file path + test.
- Do not copy external numbers into customer-facing copy — see
  `docs/GROWTH_STRATEGY_2026.md` §2.1.
