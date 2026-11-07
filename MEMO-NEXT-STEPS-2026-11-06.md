# BaliWild — Next Steps Memo (2026-11-06)

> Internal memo only — do NOT commit. Untracked by design.
> Verified state: branch `feat/api-versioning` fully pushed through `5af5d3b`.
> Failing nothing: lint/typecheck/test 679/679 pass, `npm run smoke` PASS (3002), dev DB = Supabase ap-northeast-1 (production per owner, DB was empty on 2026-11-05 and re-seeded).

## 1) PR to main — BLOCKED on owner decision (recommended: open & squash)
- Branch contents: age-tiered pricing everywhere + transfer zone split + vehicle upgrade delta fix + API v1 + tenancy foundation + admin UI suite + mock login removal + RUNBOOK/smoke + per-slot cut-off.
- Compare URL needs re-generating because the earlier one is stale. Fresh link will show full diff main...feat/api-versioning.
- Owner action: open PR → squash merge → then verify production after deploy: `BASE_URL=https://<domain> npm run smoke`.
- IMPORTANT: before merging, confirm `.env` pointed DB or the Vercel production env both refer to the intended production database — owner confirmed ap-northeast-1 IS BaliWild production DB (2026-11-06).

## 2) Age-tier discount analysis (owner asked — status: ANALYSIS, NOT done)
- Current safety rules already in place: AGE_TIERED everywhere (kids/youth default = adult price); promo applies the same ratio to adults/kids/youth; coupon cannot stack with promo (`COUPON_NOT_APPLICABLE_ON_PROMO`); `minimumSpendIdr` tops up AFTER all discounts; kid/youth prices must not exceed adult price; all IDR integers, 0–50_000_000.
- Recommendation from the analysis (see chat 2026-11-06):
  a. DO NOT blanket-discount. Decide per variant economics (kid marginal cost ≈ 0 for ATV/rafting guide ratio; may justify 10–30% off for packages including lunch/photo).
  b. When ready, pilot ONE variant (e.g. tubing family package) with kids ~ 40% off adult; test promo ON + coupon + minimumSpend manually before rollout.
  c. Age prices should stay above your per-person marginal cost — kids ride free under 2 only via infantEnabled toggle (never priced).
  d. Document each pilot's proven recipe in docs/BOOKING_ARCHITECTURE.md.
- Until then: kids/youth remain adult price (current behavior) — zero revenue risk.

## 3) Cut-off example pending (owner to set, or approve automated set)
- Tubing 08:00 AM slot with 5-hour cut-off: /admin → product editor → departure rows → Cut-off column → 5. Same approach for every variant you want per-slot.
- Engine already honors it in booking service + client UI + reschedule + listing; seed preserves it across reseeds.

## 4) Recovery notes for any REAL incident (docs/RUNBOOK_DEPLOY.md §5)
- Symptoms found on 2026-11-05: totally empty DB, browser showing generic/mock content, admin login failing (missing admin).
- Fixed by: reconcile migration (drop unused NOT NULL tenantId columns), re-seed, admin created via `npm run admin:create`.
- ALL previous owner customizations in the vanished DB are unrecoverable (ATV AGE_TIERED config was re-set to uniform by migration on 2026-11-06).

## 5) Re-link 7 orphan webp photos (owner action)
- Bucket `venture-assets` → `products/2026-11/` contains 7 files:
 08415bc2a19e.webp, 16e654d4fa49.webp, 6a142b75172e.webp, 721c7ecac9bd.webp, bb04f29a4ed2.webp, c992abdbcb32.webp, e605ca59ce12.webp
- Their product-to-photo mapping was lost; re-link in Admin → product editor (paste the public URLs; they keep identity).

## 6) Open decisions awaiting owner
1. Which DB is Vercel production (local .env shows ap-northeast-1; RUNBOOK §1 needs the real map filled).
2. Backup/PITR policy: restore from Supabase backups; define recovery expectation (RPO/RTO) before first real booking.
3. Playwright e2e in CI — requires owner approval of new dev dependency (`@playwright/test`).
4. Whether local dev should use a dedicated "scratch" Supabase project or the same ap-northeast-1 (currently single DB for everything = risk of accidental prod writes).
5. Brand #2 roadmap (separate instance vs full multi-tenant isolation "Phase 0 done" first).
