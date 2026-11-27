# BaliWild — SEO & Growth Playbook

> **Version:** 1.0.0
> **Status:** Active. This is the operating manual for the SEO/Growth function.
> **Audience:** the SEO/Growth agent, developers and the owner.
> **Guardrails:** `AGENTS.md` §9, `docs/PRODUCT_TITLE_CONSTITUTION.md`,
> `docs/SEO_STRATEGY.md`, `docs/SEO_TAXONOMY.md`.

This playbook turns growth from a list of opinions into a repeatable loop. Every
decision must be traceable to a number, a document or a real customer question.
Nothing here permits invented traffic, rankings, reviews or urgency.

---

## 1. The four-layer loop

```
SENSE  →  DECIDE  →  ACT  →  VERIFY
  ↑                              │
  └──────── feedback ────────────┘
```

The loop runs weekly. One layer never skips the next: a change without a
verification window is not "done", it is just deployed.

### 1.1 SENSE — collect evidence

| Source | What it answers | Cadence |
| --- | --- | --- |
| Google Search Console | impressions, clicks, CTR, average position, queries, pages | weekly, 28-day window |
| GA4 | organic sessions, engagement, conversion by landing page | weekly |
| `npm run seo:check` | sitemap/noindex/canonical/internal-link integrity | every commit + weekly |
| Crawl of the running app | orphan pages, broken links, duplicate titles | weekly |
| Database (`growthMetrics.ts`) | catalogue size, published articles, approved reviews, paid bookings | weekly |
| Customer questions (WhatsApp, email, reviews) | real demand and objections to answer | continuous |

Rules:

- Never estimate a number that a source can provide. If GSC/GA4 is not
  connected, mark the metric `unknown` and prioritise connecting it — do not
  fill the gap with a guess.
- Record the query, page, country and device for every opportunity.
- Store raw pulls under `data/gsc/` (git-ignored) and only commit aggregates.

### 1.2 DECIDE — score and order the backlog

Every candidate gets a **Page Priority** score from 0–100:

```
PagePriority = 100 × (
    0.30 × Demand          // normalised impressions, 28 days
  + 0.25 × CTRGap          // expected CTR at current position − actual CTR
  + 0.20 × BusinessValue   // booking value of the intent behind the query
  + 0.15 × FreshnessRisk   // decay score / 100 (see §3)
  + 0.10 × InternalAuthority // internal links pointing at the page
)
```

Sub-scores are normalised to `0–1` before weighting:

- **Demand** — `min(1, impressions28d / p95(impressions28d))`.
- **CTRGap** — `max(0, expectedCTR(position) − actualCTR)`, where
  `expectedCTR` uses the site's own 90-day curve, not an industry blog post.
- **BusinessValue** — `1.0` core category/booking intent, `0.7` commercial
  investigation, `0.4` informational, `0.2` navigational/brand.
- **FreshnessRisk** — the decay score from §3 divided by 100.
- **InternalAuthority** — `min(1, inboundInternalLinks / 10)`.

Tie-breakers, in order: revenue potential → effort → risk.

**Effort tiers** (used to pick the smallest change that moves the metric):

| Tier | Change | Typical time |
| --- | --- | --- |
| S | title, meta description, H1, internal links | < 1 hour |
| M | refresh body copy, add FAQ/schema, fix cannibalisation | < 1 day |
| L | new programmatic page or new article | 1–3 days |
| XL | new template, integration or taxonomy change | > 3 days |

The backlog is ordered by `PagePriority / EffortWeight` where
`EffortWeight` is `1, 2, 3, 5` for `S, M, L, XL`.

### 1.3 ACT — the four allowed moves

1. **Fix** — technical leak: broken link, wrong canonical, noindex in sitemap,
   empty category query, missing `lastmod`.
2. **Refresh** — update facts, prices, policies, internal links and examples on
   an existing URL. Prefer refresh over a new URL when the intent is unchanged.
3. **Link** — add contextual internal links from high-authority pages to the
   page that should rank. Every new page needs at least two inbound links
   before it is considered published.
4. **Expand** — create a new page only when the quality gate passes (§4).

Never do two unrelated moves in one commit. Every move states the metric it is
expected to change and the date it will be checked.

### 1.4 VERIFY — prove or revert

- Check at **14, 28 and 56 days** after the change.
- A change is **kept** when the target metric improves or holds while the
  secondary metric (CTR, conversion) does not regress.
- A change is **reverted or rewritten** when the target metric falls for two
  consecutive checks with no confounder (seasonality, outage, algorithm update).
- Log the result in the growth log with the commit SHA and the raw numbers.

---

## 2. Data contract

- **One definition per metric.** Impressions, clicks, CTR and position always
  come from GSC; sessions and conversions always come from GA4.
- **Attribution window:** 28 days for SEO, 7 days for conversion checks.
- **Timezone:** Asia/Makassar (WITA, UTC+8) for all reporting.
- **Currency:** IDR integers; USD is display-only.
- **No PII** in any growth dataset or commit.

---

## 3. Content decay and refresh rules

### 3.1 Decay score

```
DecayScore = 100 × min(1,
    0.40 × (daysSinceUpdate / refreshInterval)
  + 0.30 × max(0, −trafficTrend28d)      // 0.20 drop = 0.20
  + 0.20 × max(0, −positionDelta / 5)    // 5-place drop = 0.20
  + 0.10 × brokenLinkRatio
)
```

`trafficTrend28d` is the fractional change in clicks versus the previous 28
days (e.g. `-0.18`). `brokenLinkRatio` is broken internal links divided by total
internal links on the page.

### 3.2 Refresh intervals

| Content type | Interval | Owner |
| --- | --- | --- |
| Product page (`/experiences/[id]/[slug]`) | 90 days | catalogue |
| Category hub (`/activities/[category]`) | 60 days | growth |
| Destination guide (`/adventures/[slug]`) | 90 days | growth |
| Evergreen blog article | 180 days | content |
| Time-sensitive article | 30 days | content |
| Legal/policy pages | 180 days or on policy change | owner |

### 3.3 Mandatory refresh triggers

Refresh immediately, regardless of the interval, when any of these is true:

- clicks or impressions fall more than **20%** month over month;
- average position falls more than **3 places** on the primary query;
- CTR falls more than **15%** at a stable position;
- price, refund policy, age rule, insurance or legal entity changes;
- a new product makes an existing guide incomplete;
- the page loses an inbound link or gains a broken outbound link;
- two URLs compete for the same query (cannibalisation);
- the quality gate would now fail (fewer than 2 products, no approved review).

### 3.4 Refresh checklist

1. Re-read the source document; never re-invent a fact.
2. Update prices, availability, age rules, refund and transport facts.
3. Add the missing internal links (product → guide → hub).
4. Re-run `npm run seo:check` and the quality gate.
5. Update `lastModified` in the sitemap via the data, not by hand.
6. Record the change and the expected metric movement.

---

## 4. Quality gates (hard stops)

A page may be indexed only when all of these are true:

- **Taxonomy:** one of the 9 adventure mega categories, no hotels/flights/
  transport/restaurants.
- **Title:** passes `src/lib/titleValidator.ts` (45–60 chars, keyword in the
  first 25, Title Case, no forbidden words, no emoji, no brand name).
- **Substance:** at least **2 real products** and **1 approved review** for a
  destination guide; no invented copy.
- **Canonical:** exactly one absolute canonical, matching the served URL.
- **Indexability:** not `noindex`; present in `/sitemap.xml`; at least two
  internal links pointing to it.
- **Internal links:** zero broken internal links; product links use
  `/experiences/[id]/[slug]`.

Failing any gate means the page stays out of the index and out of the sitemap.

---

## 5. Weekly operating cadence

| Day | Layer | Output |
| --- | --- | --- |
| Monday | SENSE | fresh GSC/GA4 pull, crawl, `seo:check` |
| Tuesday | DECIDE | updated scored backlog, top 5 chosen |
| Wed–Thu | ACT | ship the top 5 as atomic commits |
| Friday | VERIFY | check changes from 14/28/56 days ago, log results |
| Friday | REVIEW | one paragraph: what moved, what did not, next bet |

If a week has no data (integration down), the default action is technical
hygiene: fix links, canonicals and sitemap coverage. Never invent demand.

---

## 6. Roles and boundaries

- **Growth agent:** sense, score, propose, implement approved technical fixes,
  write the log. It does **not** publish new claims or change prices.
- **Owner:** approves new claims, legal/insurance statements, new categories and
  any change to the refund/age rules.
- **Developer:** reviews schema, migrations and anything touching bookings.

The agent must stop and ask when a task would require a new factual claim, a new
dependency, a schema change or a policy change.

---

## 7. Definition of done for a growth task

- [ ] The move maps to a scored backlog item and a target metric.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` and `npm run seo:check`
      pass.
- [ ] New behaviour has a regression test.
- [ ] Internal links are added in both directions where relevant.
- [ ] Sitemap and canonical are correct; no noindex URL is listed.
- [ ] The verification date is recorded.
- [ ] Committed and pushed as one atomic conventional commit.
