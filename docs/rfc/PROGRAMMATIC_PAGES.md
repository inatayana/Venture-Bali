# RFC — Quality-gated activity × destination pages

> **Status:** IMPLEMENTED — owner accepted all proposals on 2026-11-20;
> shipped in commit `4ca1e38` (quality gate, SSR page, sitemap integration).
> The approval checklist below is kept for audit history.
> **Author:** Senior UI/UX & growth engineering
> **Date:** 2026-11-20
> **Process:** `docs/PLATFORM_CONSTITUTION.md` §Governance (propose → 5 business
> days feedback → tech lead + owner approve → implement)
> **Related:** `docs/SEO_STRATEGY.md` §3, `docs/SEO_TAXONOMY.md` §2,
> `docs/GROWTH_STRATEGY_2026.md` Pillar 1

---

## 1. Problem

`docs/SEO_STRATEGY.md` §3 defers `/[activity]-[location]` pages because of a real
risk: thin/doorway pages, conflict with `/experiences/[id]/[slug]`, and the
9-category guardrail. Meanwhile the existing keyword library (7 primary keywords)
and 8-destination graph in `docs/SEO_TAXONOMY.md` are unused as a discovery surface.

We want the long-tail reach **without** publishing low-value pages.

---

## 2. Proposal

Generate candidate pages from the **approved taxonomy only**:

- Activities: the 9 slugs from `MEGA_CATEGORY_SLUGS` (`src/lib/taxonomy.ts`).
- Destinations: the 8 destinations from `docs/SEO_TAXONOMY.md` §2.
- URL shape: `/adventures/[activity]-in-[destination]`
  (distinct namespace — no collision with `/experiences/[id]/[slug]` or
  `/activities/[category]`).

Example: `/adventures/atv-in-ubud`, `/adventures/rafting-in-ayung`.

### 2.1 Quality gate (the core safeguard)

A candidate page is **published and indexed only if all of the following hold**:

| Gate | Threshold | Source |
|---|---|---|
| Real products | ≥ 2 ventures matching activity + destination | DB (`Venture` + location) |
| Social proof | ≥ 1 approved review across those ventures | `reviewFeed.ts` |
| Unique data | distinct price range, duration range and transfer modes | DB |
| Editorial intro | ≥ 120 words of unique, human-reviewed copy | CMS / article table |
| Destination facts | region, island, dominant activities | `SEO_TAXONOMY.md` §2 |
| Title constitution | passes `titleValidator.ts` | `src/lib/titleValidator.ts` |

If any gate fails: **do not render the page** (return 404) and **do not include it
in the sitemap**. No `noindex` thin placeholders.

### 2.2 Page content (all factual, no invented data)

1. H1 + unique intro (editorial).
2. "Why book this in [destination]" — from destination facts + local-ownership
   mission (`BUSINESS_BLUEPRINT §1.4`), phrased per `BRAND_GUIDELINES §5.1`.
3. Product grid — real `VentureCard`s with real prices.
4. Comparison block — direct price vs OTA commission using **owner's first-hand
   numbers only**, never "estimated".
5. Practical FAQ — min age **per product**, transfer modes, refund rule from
   `refundUtils.ts`, safety gear, meeting points.
6. `FAQPage` + `ItemList` + `BreadcrumbList` JSON-LD via the escaping `JsonLd`
   component.
7. Internal links: to the 9 `/activities/*` hubs, to `/about`, to `/faq`, and to
   every product on the page.

### 2.3 Guardrails

- No brand name in titles/slugs (`AGENTS.md` §9).
- No vendor/partner names (`OPERATION_CONTRACT.md`).
- No "100% Bali-owned" until legal status is confirmed (`BRAND_GUIDELINES §5.1`).
- No invented reviews/ratings/urgency.
- No products outside the 9 categories.
- No new npm dependencies.

---

## 3. Alternatives considered

| Option | Why rejected |
|---|---|
| Publish all 9 × 8 = 72 pages | Thin/doorway risk; would dilute quality and could trigger a manual action |
| Pure query-param pages (`/?category=x&location=y`) | No indexable URL, no editorial surface, no AEO value |
| Add location pages under `/activities/[category]/[location]` | Collides conceptually with the existing category hub; need a distinct namespace |
| Do nothing | Leaves the keyword library and destination graph unused while OTAs own the long tail |

---

## 4. Implementation plan (after approval)

1. `src/lib/programmaticPages.ts` — candidate builder + pure quality-gate function
   (unit tested; no DB in the gate function itself).
2. `src/app/adventures/[slug]/page.tsx` — SSR page, `generateMetadata`,
   structured data, `notFound()` when gate fails.
3. `src/lib/sitemap.ts` — include only pages that pass the gate.
4. Editorial-intro storage: reuse the `Article` table with a dedicated
   `pageType` marker (no schema migration needed — confirm field availability
   before implementation; if absent, use a seed fixture file instead).
5. Tests: gate logic, URL uniqueness, no collision with existing routes,
   sitemap inclusion/exclusion, schema validity.
6. Docs: update `SEO_STRATEGY.md` Phase 2 table and `GROWTH_STRATEGY_2026.md`
   status tracker.

---

## 5. Success criteria (directional, not vendor promises)

- 100% of published pages pass the quality gate in CI.
- 0 thin pages in the sitemap.
- Internal links from articles resolve to real 200 URLs (regression test).
- Weekly AI-visibility prompt log shows a rising trend of BaliWild being named
  for long-tail adventure prompts over 8 weeks.

---

## 6. Approval checklist

- [ ] Owner approves the URL namespace `/adventures/[activity]-in-[destination]`
- [ ] Owner confirms the quality-gate thresholds
- [ ] Owner confirms legal-entity status for ownership claims
- [ ] Tech lead confirms editorial storage approach (no schema migration unless RFC'd)
- [ ] 5 business-day feedback window completed
