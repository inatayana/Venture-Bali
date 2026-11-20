# Content Growth Architect — Phases 1 & 2

> Version: 1.0 · Status: Phase 1 (web article producer, draft, human-gated) + Phase 2 (multi-format producer, in-memory)

## 1. Overview

The growth system produces autonomously driven web content (articles) that support
SEO and brand discovery. Phase 1 is the **article producer**:

`brief → deterministic gate → Gemini generation → compliance gate → draft`

- Pure pipeline modules in `src/lib/growth/` — no DB writes.
- Persistence uses the existing `Article` table — no new tables yet (§13.2).
- Entry point: `GET /api/cron/growth/publish-articles` (Vercel Cron, see `vercel.json`).
- Phase 2 produces in-memory multi-format assets (§8) — no persistence yet.

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

## 8. Fase 2 — Multi-Format Producer

`produceAsset(brief: AssetBrief): Promise<AssetOutcome>` (`src/lib/growth/produce.ts`) extends the
pipeline with format-specific outputs:

- `AssetBrief` — `ArticleBrief` + `format` (`ARTICLE` | `VIDEO_SCRIPT` | `SHORT_HOOK` |
  `SOCIAL_POST` | `FAQ_BLOCK`) + optional `platform` (`YOUTUBE` default for `VIDEO_SCRIPT`;
  otherwise `WEB`).
- `AssetOutcome = { status: 'generated' | 'rejected' | 'failed', reason, payload, contentHash }`.
- Modules (`src/lib/growth/formats/`, barrel `formats/index.ts`):
  - `videoScript.ts` — `generateVideoScript` → YouTube script payload (`title`, `intro`,
    `sections[{title, duration, summary}]`, `cta`, `estimatedDuration`, `keywords`, `tags`).
  - `shortHook.ts` — `generateShortHook` → short hook payload for social channels.
  - `socialPost.ts` — `generateSocialPost` → platform caption payload.
  - `faqBlock.ts` — `generateFaqBlock` → FAQ entries payload.
- All generators call Gemini (`generateJson` via `@/lib/gemini`) and re-run the deterministic
  `gateGrowthArticle` on the payload before it is returned.
- Phase 2 assets are **in-memory** — not persisted (the ContentAsset table awaits the
  owner-approved migration, §13.2). The `ARTICLE` format routes through the Phase 1
  pipeline (`produceArticle`, persisted as draft).
- Cron entry: `GET /api/cron/growth/publish-articles?format=VIDEO_SCRIPT|SHORT_HOOK|
  SOCIAL_POST|FAQ_BLOCK` — invalid formats → 400 `VALIDATION_ERROR`; non-article formats
  return `{ asset, contentHash }` in `data`.

## 9. Fase 3 — Growth tables + Fase 3b persistence wiring

Phase 3 adds the persistence layer the Phase 2 pipeline needs. The Prisma models and the
SQL migration are **committed but not yet applied** to the live Supabase database; the
owner runs `npm run db:deploy` when ready (safe `migrate deploy`, no drift reset).

**Prisma models** (`prisma/schema.prisma`): `GrowthTopic`, `ContentAsset`, `ContentVersion`,
`FactSource`, `PlatformPublish`, `ApprovalRequest`, `MetricSnapshot`, `AuditEvent`.
They mirror `GROWTH_TABLES` in `src/lib/growth/schema.ts` (snake_case columns ↔ camelCase
Prisma fields). `ContentAsset.currentVersionId` is a plain scalar (the DB FK is in the
migration) to avoid a circular Prisma relation.

**Migration:** `prisma/migrations/20261120210000_add_growth_tables/migration.sql`
(`CREATE TABLE IF NOT EXISTS` + indexes + FKs; idempotent, additive only).

**Fase 3b — Persist wiring:**
`src/lib/growth/persist.ts` → `persistGrowthAsset({ brief, payload, format, platform,
status, actor, tenantId })` creates: GrowthTopic → ContentAsset → ContentVersion →
AuditEvent (GENERATE) → ApprovalRequest (PENDING) → PlatformPublish (DRAFT). Publication
stays human-gated (autoPersist creates the draft approval/publish chain; `autoPublish=true`
remains the Phase 1 manual override for the Article format).

**Deploy procedure (owner):**
1. `npm run db:deploy` — applies the new tables.
2. `npm run db:seed` — must succeed on the migrated DB.
3. `npm run smoke` — must pass against the running app.

Until deployed, `produceAsset({ autoPersist: true })` still builds the outcome in-memory;
the persistence call is ready to hit the newly created tables.

## 10. Testing

`produce.test.ts`, `schema.test.ts`, `state.test.ts` (`npm test`).

## 13. Migration backlog (§13.2)

- `GrowthTopic` / `ContentAsset` / `ContentVersion` / `FactSource` / `PlatformPublish` /
  `ApprovalRequest` / `MetricSnapshot` / `AuditEvent` — schema + migration file committed;
  **deployment pending owner `npm run db:deploy`** (§9).
- Persisting `produceAsset` output to `ContentAsset` rows — pending deployment.
- Monitor/decay pipeline (metric ingestion → `NEEDS_REFRESH`) — pending.
- Backlink outreach + multi-tenancy — pending.
- Auto-publish pipeline — pending.
