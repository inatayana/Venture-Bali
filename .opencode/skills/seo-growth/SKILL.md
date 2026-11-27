---
name: seo-growth
description: Operate BaliWild's SEO/Growth loop — sense GSC/GA4 and crawl data, score opportunities, ship fixes/refreshes/links/expansions, and verify results against the playbook.
---

# SEO & Growth skill

Use this skill whenever the task is about organic traffic, rankings, indexing,
internal links, sitemaps, metadata, programmatic pages, content refresh or the
growth backlog.

## Read first

1. `docs/SEO_GROWTH_PLAYBOOK.md` — the operating manual and scoring formula.
2. `docs/SEO_STRATEGY.md` — what is already implemented.
3. `docs/SEO_TAXONOMY.md` — the only 9 allowed categories and destination facts.
4. `AGENTS.md` §9 — product guardrails.
5. `docs/PRODUCT_TITLE_CONSTITUTION.md` — title rules.

## The loop

```
SENSE → DECIDE → ACT → VERIFY
```

### SENSE

- Pull GSC (28 days) and GA4 with native `fetch`; never add an npm dependency.
- Run `npm run seo:check` and a crawl of the running app.
- Read `src/lib/growthMetrics.ts` for persisted catalogue/conversion numbers.
- Mark missing data `unknown`; never estimate traffic or rankings.

### DECIDE

Score every candidate with the playbook formula:

```
PagePriority = 100 × (
    0.30 × Demand
  + 0.25 × CTRGap
  + 0.20 × BusinessValue
  + 0.15 × FreshnessRisk
  + 0.10 × InternalAuthority
)
```

Order by `PagePriority / EffortWeight` (`S=1, M=2, L=3, XL=5`). Tie-break:
revenue → effort → risk.

### ACT — only four moves

1. **Fix** technical leaks (canonical, noindex, broken link, wrong query).
2. **Refresh** existing URLs before creating new ones.
3. **Link** every new page from at least two relevant pages.
4. **Expand** only through the quality gate.

### VERIFY

Check at 14, 28 and 56 days. Keep, rewrite or revert with the numbers recorded.
A change is not done until its verification date is logged.

## Hard rules

- Only the 9 adventure mega categories. No hotels, flights, transport,
  restaurants.
- Never invent reviews, ratings, prices, urgency, authors or partner names.
- Never put the brand name in product titles, meta titles or slugs.
- Product canonical is `/experiences/[id]/[slug]`.
- Category hubs query `category.short` (DB value), not the URL slug.
- No `noindex` URL in `/sitemap.xml`; `/explore` stays out of the index.
- Every indexed page needs a canonical, a sitemap entry and ≥ 2 internal links.
- One logical change per commit; run `lint`, `typecheck`, `test`, `seo:check`.
- New factual claims (legal entity, insurance, ownership) need owner approval.

## Quality gate

A destination guide is publishable only when it has:

- ≥ 2 real products in that destination;
- ≥ 1 approved review;
- a title that passes `src/lib/titleValidator.ts`;
- a deterministic, factual intro (no invented claims);
- canonical + sitemap entry + inbound links.

The gate lives in `src/lib/programmaticPages.ts` (`passesQualityGate`). Do not
bypass it in a route.

## Key files

| Concern | File |
| --- | --- |
| Taxonomy | `src/lib/taxonomy.ts` |
| Title rules | `src/lib/titleValidator.ts` |
| Metadata/schema | `src/lib/seo.ts`, `src/components/seo/JsonLd.tsx` |
| Sitemap | `src/lib/sitemap.ts`, `src/app/sitemap.xml/route.ts` |
| Programmatic pages | `src/lib/programmaticPages.ts`, `src/lib/adventurePages.ts` |
| Internal links in articles | `src/lib/aiContent.ts` |
| Persisted KPIs | `src/lib/growthMetrics.ts` |
| SEO CI | `scripts/seo/seo-ci-check.mjs` |

## Output format

Report in this shape:

```
SENSE   — sources, window, key numbers (or unknown)
DECIDE  — top items with score and effort
ACT     — files changed, commit SHAs
VERIFY  — check dates and the metric each change targets
```
