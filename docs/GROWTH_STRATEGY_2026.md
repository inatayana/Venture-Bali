# BaliWild — Growth & Competitive Strategy 2026

> **Version:** 1.0.0
> **Status:** APPROVED AS DIRECTION — owner accepted all proposals on 2026-11-20
> **Audience:** All teams (Engineering, Product, Operations, Marketing, Owner)
> **Companion docs:** `docs/TECHNICAL_GROWTH_AUDIT.md` (factual capability map + gaps),
> `docs/rfc/PROGRAMMATIC_PAGES.md` (URL architecture RFC)
> **Guardrails:** `AGENTS.md` §9, `docs/TEAM_WORKING_AGREEMENT.md` §4 & mission guardrails 9–14,
> `docs/BRAND_GUIDELINES.md` §5.1, `docs/BUSINESS_BLUEPRINT.md` §1.4

---

## 1. Executive summary — the thesis

BaliWild does **not** beat international OTAs by outspending them on ads. OTAs win
*discovery*, not quality. BaliWild already owns the things OTA cannot fabricate:
field control in Bali, real prices, real approved reviews, and a direct guest
relationship.

> **Strategic goal: make the 20–30% OTA commission structurally unnecessary**, by
> turning every booking, every page and every interaction into an asset that
> generates the next booking — **without any affiliate/referral/commission
> programme** (explicitly prohibited by the business rules).

Aset yang sudah dibangun belum membentuk *loop*. Pekerjaan strategis kita adalah
menyambungkannya, bukan menambah fitur baru secara acak.

---

## 2. Evidence base

### 2.1 OTA commission — first-hand data remains authoritative

Angka **first-hand owner** (GYG 30%, Klook 30%, Viator 25%, Airbnb Experiences 20%)
adalah **sumber kebenaran internal**. Data industri 2026 mengonfirmasi angka itu
berada di rentang wajar — jangan pernah menyebutnya "perkiraan":

| Platform | First-hand (owner) | Industry benchmark 2026 (independent) |
|---|---|---|
| GetYourGuide | 30% | 20–30% by country (OTA Playbook, Nov 2026); some operators 20% → 30% (Arival, Jun 2025) |
| Klook | 30% | 15–25% / 15–35% reported (Bókun 2026, Magpie) |
| Viator | 25% | 20–30%, typically 25% (SambaHQ, Oct 2026) |
| Airbnb Experiences | 20% | 20% typical / published service fee (Airbnb Help Centre) |

Sumber: Bókun OTA Booking Guide (Dec 2025), SambaHQ OTA Supplier Guide (re-checked
Oct–Nov 2026), OTA Playbook (Jul/Oct 2026), tourify.digital (Oct 2026), dmcquote
(Nov 2026), Arival (Jun 2025). **External figures are corroboration only — never
replace the owner's numbers in customer-facing copy.**

Economics: direct booking typically costs ~12–15% of revenue to acquire
(illustrative planning figure, SambaHQ) versus a fixed 20–30% commission forever,
with no mechanism to improve the rate. Direct also keeps the customer relationship.

### 2.2 AI search reshapes the *planning* stage

| Finding | Implication for BaliWild |
|---|---|
| Travel-site traffic referred by AI quadrupled YoY, but still <1% of room nights (Booking Q2 2026) | Battleground is **planning/inspiration**, not agentic booking yet |
| Only **16%** of travel operators have an active GEO/AEO strategy (Vamoos, May 2026) | Early-mover window is open |
| Own sites are only **8%** of AI citations; booking sites ~21%, review sites ~11% (Milestone, 1.38M answers, Q3 2026) | We must become a *citable* source, not just a rankable one |
| Google AI Overviews cites own sites more (15%) and OTAs less (7%) | Structured, factual, consistent owned content pays off |
| **68%** prefer booking with a trusted travel brand over AI agents (Expedia/YouGov, Mar 2026) | Local operator identity is a defensible advantage |
| 53% happy for AI to *suggest*, only 8% comfortable booking via AI (same survey) | Invest in "AI-readable + human-trusted", not autonomous checkout yet |

**AEO is an emerging layer, not a replacement for SEO/direct-booking optimisation.**
Attribution is immature — measure directionally (trend of prompts mentioning us),
not with vendor promises of precise AI-attributed revenue.

---

## 3. Five strategic pillars

### Pillar 1 — AEO/GEO: become the source AI can quote
- `llms.txt` + factual Markdown endpoints: price, per-product min age, transfer
  modes, refund rule, meeting point, safety gear — **deterministic from DB and
  policy files, never from LLM improvisation**.
- Product `FAQPage`/`Offer` schema from real data; `AggregateRating` only from
  approved reviews.
- **Quality-gated** programmatic `/[activity]-[destination]` pages: publish only
  when ≥2 real products + ≥1 approved review + unique editorial intro +
  destination data from `taxonomy.ts`. Otherwise do not index. This directly
  answers the "thin/doorway page" objection in `docs/SEO_STRATEGY.md` §3.
- Expand `addInternalLinks()` from articles → products with the **correct**
  `/experiences/[id]/[slug]` route and real markdown-link rendering.

### Pillar 2 — Compounding conversion loop (no ads, no commission)
- Abandoned-hold recovery via the `notification:send` extension point +
  existing WhatsApp client (opt-in).
- Wishlist → availability/price alerts (`wishlistStore` already persists locally).
- Review → proof → schema → AI citation → direct booking → review again.
- PDP "why book direct" objection block using first-hand local-ownership facts,
  safety standards and per-product age rules — factual, never invented urgency.

### Pillar 3 — Agentic bookability (future-proofing)
- `/api/v1/*` contracts with OpenAPI 3.1 + Zod (mandated by
  `docs/PLATFORM_CONSTITUTION.md` §2, currently not present on this branch) —
  expose products, availability, pricing, policies.
- The AI agent's tools are already DB-grounded (`src/lib/tools.ts`). One owner
  decision remains: may the agent persist a booking? (`createBooking` currently
  returns `persisted: false` by design.)
- Chat widget is already global; connect it to checkout with session context.

### Pillar 4 — Self-measuring, self-correcting
- Funnel analytics on `analytics.ts`: `view_item → select_package →
  begin_checkout → step_complete → purchase → review`.
- CI checks: schema validity, broken internal links, duplicate titles,
  thin-page detection.
- Weekly AI-visibility audit: 10 representative Bali prompts × 5 engines,
  logged as a trend (manual first, no paid API needed).

### Pillar 5 — Corroboration & expansion (owner/team decisions required)
- Google Business Profile, `/press` assets, consistent NAP, genuine external
  reviews. These are not purely scriptable; engineering can prepare the assets.
- Platform is multi-tenant ready (`PLATFORM_CONSTITUTION.md`, `EXTENSION_POINTS.md`).
  Bali → Nusa Tenggara → broader tourism segments is architecturally possible,
  **but the 9-category guardrail must be changed via RFC + owner approval first**.

---

## 4. Non-negotiable guardrails

Never do the following without an explicit owner decision:

- ❌ Referral / affiliate / commission programmes (`TEAM_WORKING_AGREEMENT` §11)
- ❌ "Zero foreign vendors" or "no middleman at all" (§12, `BRAND_GUIDELINES` §5.1)
- ❌ Invented reviews, ratings, authors, urgency or scarcity
- ❌ "100% Bali-owned" before the legal-entity status is confirmed by the owner
  (`BRAND_GUIDELINES` §5.1)
- ❌ Vendor/partner names exposed to customers (`OPERATION_CONTRACT.md`)
- ❌ Products outside the 9 adventure mega categories
- ❌ New npm dependencies without owner approval (`AGENTS.md` §4)
- ❌ Touching another team's uncommitted work

---

## 5. Priority & status tracker

> Update this table whenever work lands. `DONE` means lint + typecheck + tests pass
> and the change is committed.

| Priority | Item | Pillar | Status | Owner decision needed? |
|---|---|---|---|---|
| P0 | Hydration fix (`5d159a7`) | Foundation | **DONE** | No |
| P0 | Fix article internal links (correct URL + markdown rendering) | 1 | **DONE** (`5511a77`) | No |
| P0 | Sitemap: include `/activities/*`, `/explore`, `/faq` | 1 | **DONE** (`5511a77`, `572d93f`) | No |
| P0 | Fill category `ItemList` schema + use escaping helper | 1 | **DONE** (`5511a77`) | No |
| P0 | Make `requestIndexing()` honest (no fake success) | 4 | **DONE** (`5511a77`) | No |
| P1 | `llms.txt` factual briefing from approved sources | 1 | **DONE** (`572d93f`) | No |
| P1 | Real `/faq` page + FAQPage JSON-LD | 1 | **DONE** (`572d93f`) | No |
| P1 | Abandoned-hold recovery + wishlist alerts | 2 | PLANNED | **Yes** — sending domain / WA template approval |
| P1 | Funnel analytics + SEO CI checks | 4 | PLANNED | Team coordination (event callsites owned by other work) |
| P1 | `/api/v1` public contracts | 3 | PLANNED | Team coordination (present on `main`, absent on this branch) |
| P2 | Agent may persist bookings | 3 | BLOCKED | **Yes** |
| P2 | Programmatic activity–destination pages | 1 | RFC | **Yes** — URL map |
| P2 | Expert author schema / E-E-A-T profiles | 1 | BLOCKED | **Yes** — real named experts |
| P2 | Expansion beyond Bali / beyond 9 categories | 5 | BLOCKED | **Yes** — RFC + owner |

---

## 6. Decisions requested from the owner

1. Approve the URL map in `docs/rfc/PROGRAMMATIC_PAGES.md`.
2. Confirm legal-entity status before any "100% Bali-owned" claim is published.
3. Decide whether the AI agent may persist bookings (`createBooking`).
4. Approve sending domain + WhatsApp template for recovery/alert messages.
5. Choose the next phase after P0/P1: AEO artifacts (Pillar 1) or conversion
   loop (Pillar 2). *(Owner accepted all proposals on 2026-11-20; sequencing
   remains at the owner's discretion.)*

---

## 7. Maintenance

This document is a **living strategy record**. Any team changing behaviour in a
tracked item must update the status table and the relevant companion doc in the
same commit. Investigations and evidence should be appended, not overwritten.
External figures must carry a source and a retrieval date.
