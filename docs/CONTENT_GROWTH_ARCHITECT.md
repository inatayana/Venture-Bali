# Content Growth Architect — Phase 1

> Version: 1.0 · Status: Phase 1 — web article producer (draft, human-gated)

## 1. Overview

The growth system produces autonomously driven web content (articles) that support
SEO and brand discovery. Phase 1 is the **article producer**:

`brief → deterministic gate → Gemini generation → compliance gate → draft`

- Pure pipeline modules in `src/lib/growth/` — no DB writes.
- Persistence uses the existing `Article` table — no new tables yet (§13.2).
- Entry point: `GET /api/cron/growth/publish-articles` (Vercel Cron, see `vercel.json`).

## 2. Guardrail — 9 mega categories only

BaliWild sells only the 9 adventure mega categories (`src/lib/taxonomy.ts`,
`docs/SEO_TAXONOMY.md`). Growth content must pass `isAllowedCategory`; product titles
must pass `src/lib/titleValidator.ts` and never expose "BaliWild".

## 3. Schema (§4) — `src/lib/growth/schema.ts`

Database-agnostic data contracts: enums (`SEARCH_INTENTS`, `CONTENT_FORMATS`,
`PLATFORMS`, `APPROVAL_STATUSES`, `PUBLISH_STATUSES`) and interfaces for `GrowthTopic`,
`ContentAsset` and audit logs. Backing tables land with the owner-approved migration (§13.2).

## 4. State machine (§5) — `src/lib/growth/state.ts`

Pure transition tables:

- Topics: `DISCOVERED → TRIAGED → BRIEFED → IN_PRODUCTION → IN_REVIEW → APPROVED →
  SCHEDULED → PUBLISHED → MONITORED → NEEDS_REFRESH → ARCHIVED`
- Assets: `DRAFT → FACT_CHECK → STYLE_CHECK → BRAND_LEGAL_CHECK → READY → APPROVED →
  SCHEDULED → PUBLISHED → MEASURED → REFRESH → ARCHIVED`

Helpers: `canTransitionTopic` / `assertTopicTransition` / `planTopicTransition` (+ asset
variants), `InvalidTransitionError`, `computeContentHash` for dupe detection. Pure —
callers persist and append `AuditEvent`s.

## 5. Produce pipeline — `src/lib/growth/produce.ts` + `gate.ts`

1. **`gateBrief`** — deterministic pre-flight on the brief: title constitution
   (`validateVentureTitle`) + category (§2). The gate runs before the model is called,
   so a violating title never burns a Gemini request.
2. **`generateArticle`** — Gemini via the existing producer (`src/lib/aiContent.ts`).
3. **`gateGrowthArticle`** — full deterministic gate on generated content (rules 1–12:
   title length 45–60, keyword in first 25 chars, destination, Title Case, ≤1 separator,
   ≤1 benefit phrase, forbidden words/brand, ≤1 emoji, ≥300 words, category, structure).
4. **`saveArticle`** — persists the `Article` row (existing table).

`produceArticle({ title, primaryKeyword, category, destination?, language? = 'id',
autoPublish? = false })` → `{ status: 'drafted' | 'published' | 'rejected' | 'failed',
reason, slug, articleId }`.

## 6. Cron entry — `src/app/api/cron/growth/publish-articles/route.ts` (§6.2–§6.4, Fase 1)

- Vercel Cron (see `vercel.json`): `0 4 * * *` — produces one gated article as draft
  (`autoPublish=false`).
- Auth: `Authorization: Bearer $CRON_SECRET` (`CRON_SECRET`, empty in `.env.example`).
- Inputs are query params for now (`title`, `primaryKeyword`, `category`, `destination`,
  `language`, `autoPublish`). Once the `GrowthTopic` table lands, the route reads TRIAGED
  topics from it (§13.2).

## 7. Approval gate (§7.1)

Default `autoPublish=false`: the job stores a draft; publication is human-gated
(admin panel / later workflow).

## 10. Testing

`produce.test.ts`, `schema.test.ts`, `state.test.ts` (`npm test`).

## 13. Migration backlog (§13.2)

- `GrowthTopic` / `ContentAsset` tables + audit — pending owner approval.
- Auto-publish pipeline — pending.
