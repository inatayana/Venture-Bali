# BaliWild — Handoff Memo (2026-11-07)

> Internal working file — do NOT commit. Delete when the steps below are fully worked through.
> Context written by the closing session; pair with `MEMO-NEXT-STEPS-2026-11-06.md` for the prior state.

## State at shutdown (verified)
- Branch `feat/api-versioning` — ahead of `origin/main` by commits:
  `e6f8698` (remove / guest duplication on product card)
  `9c360f3` (mojibake repair: ×, ·, —, −, …, ★, ≥ across booking widget & mapper tests)
  `8ff4295` (admin: pass pricingModel + kids/youth to editor; drop duplicate sidebar theme toggle)
  `4afe786` (runbook incident §7.1 for login 500: ADMIN_SESSION_SECRET/DB order)
  plus the two already referenced on `main` via PR #69 harness merge.
- `lint` 0 · `typecheck` 0 · `test` 679/679 · `smoke` PASS (localhost).
- Production domain: `https://baliwild-adv.vercel.app` (NOT `baliwild.com` — parked at Hostinger). Owner confirmed 2026-11-06 that this Vercel project points at Supabase production ap-northeast-1 (same env as local .env).
- Production `api/v1/ventures` and `/api/admin/login` returned **500** during owner testing today (2026-11-07): owner verified local login works — meaning prod Vercel env is missing/incorrect `ADMIN_SESSION_SECRET` or `DATABASE_URL`. Owner to check Vercel → Settings → Environment Variables (Production) and Vercel → Logs (`GET /api/v1/ventures error:`) to see the real Prisma code. If `ADMIN_SESSION_SECRET` is absent: generate one, redeploy, and re-test login with the admin account made via `npm run admin:create`.

## What was actually done during PR #69-driven incident
1. Dev server died; DB was empty (`0` rows everywhere including AdminUser) — owner had been working against an empty Supabase project without noticing for a long time.
2. Root cause: migration `20261105063842_add_tenant_id_to_all_models` added dead placeholder `tenantId NOT NULL` on every table while committed schema carried it on only 4 models — every insert failed; consequently the app showed fallback/mock content silently.
3. Recovery: `20261110110000_reconcile_tenant_columns` dropped the unused columns; re-seed restored 9 ventures / 23 variants / 4 pickup zones.
4. AGE_TIERED pricing restored + preserved in seed (`pricingModel` & kid/youth prices now carry across reseeds).
5. Seed persist now also preserves slot cut-off (`cutoffHours`) + `currentBookings` on reseeds.
6. Transfer mode pricing fixed: zone charter per vehicle (500K/700K/800K) vs shared shuttle seat fee per guest (0/224K/320K); vehicle-class delta re-based to charter difference (Innova +500K, Hiace +700K).
7. Mock admin login `admin@baliwild.local` removed; login now fail-closed.
8. Per-slot cut-off override shipped (`SlotTime.cutoffHours`), Tubing SELF_DRIVE slots set to 1h.
9. Admin editor bug found & fixed: page was sending tiers WITHOUT pricingModel, so Save was silently flipping all tiers to FLAT_PER_GUEST — caused "Age inputs disappeared from Tubing"; the page now passes pricingModel + kids/youth.
10. RUNBOOK_DEPLOY.md written; AGENTS DoD now requires live-smoke for DB-touching work; `scripts/smoke.mjs` + `npm run smoke` added.

## P0 items for tomorrow (owner actions)
1. **Production 500 fix** (LOCAL works, prod doesn't): check Vercel Production env for `ADMIN_SESSION_SECRET` and `DATABASE_URL` — copy values from local `.env` EXACTLY (prod == same Supabase project ap-northeast-1). Redeploy. Probe `https://baliwild-adv.vercel.app/api/v1/ventures` — must return 200 JSON. Login with the admin account made 2026-11-06.
2. **Open PR #70** (`feat/api-versioning` → `main`) — contains the four fixes above plus PR #69. Compare URL: `https://github.com/inatayana/Venture-Bali/compare/main…feat/api-versioning?expand=1`. Squash-merge after review.
3. **Set the actual production domain**: `baliwild.com` is parked at Hostinger; `https://baliwild-adv.vercel.app` is the only live host. Either add `baliwild.com` as a custom domain on Vercel (DNS A/CNAME planner in Hostinger) or accept `baliwild-adv.vercel.app` as canonical for now.

## P1 items for tomorrow (agent/owner)
4. **Gallery re-link**: `bucket=venture-assets` has 7 orphan webp photos at `products/2026-11/*` — assign hero+6 gallery in the tubing product editor in Admin (paste public URLs).
5. **Child/youth pricing policy**: follow the shared analysis (kids ~60%, youth = adult price; impacts promo/coupon/minimum spend; run a single Tubing pilot variant first).
6. **Kids price references** — `Kids (5-11 yo)` label vs youth ages `13-16 yo` — check consistency; and investigate whether "5-13" for kids would fit Indonesian norms better (confirm with owner's research — DO NOT decide unilaterally).
7. **Ops Phase 1** from the recommendation (see prior chat): pickupAt / pickupOffsetMinutes on transfer variants (Ubud 60m, South 2h, Batur Hello >1h); DB migration needed; float it through PR; keep scope 1 phase at a time.
8. **Review items from docs sweep** (all mojibake repaired 2026-11-07): keep an eye on search-replace output in case future patches re-introduce `Â` symbols.

## Deep-looking lessons for the architecture tracks
- Agent-driven development WITHOUT a hard env gate produces phantom successes; the "fallback to mock" pattern hid an empty DB for weeks. Onboarding must: (1) one command seeds a typed environment, (2) `smoke` gate must be part of every definition of done, (3) build failures from Prisma client/EBF DLL must be surfaced (we now regenerate client via `npx prisma generate`).
- A single stringly-typed multi-purpose field (`surchargeIdr`) will hide semantics forever; leave a two-column model where each has exactly one meaning.
- DO NOT attempt to repair a previous AI's incidents by layering more of the same — diagnose the causal chain with chronologically-ordered evidence, one fix at a time.
- Keep one line of direction at a time (human), gate it with tests (agent), and smoke it (both). Speed is a productivity of certainty, not of volume.

## Open decisions for tomorrow meeting
- Production domain (deb), kids pricing number, pickupAt scope, DB strategy (dev DB vs prod), backups/PITR verification, Playwright approval, PR #70 merge approval, build PNG pipeline approval for new incident (optimize next?).
- Roadmap for second brand — only start bill of Phase 0 finish checklist (`docs/RUNBOOK_DEPLOY.md` §1 map is owner's actions).

## Contact details — done today (2026-11-07)
- Typecheck/lint/tests: 679/679 PASS; smoke: PASS localhost.
- PRs squashed in `main`: #69 (feat/api-versioning) — links above.
- Unpushed commits: all branch work; push done through every step.
- Known outstanding tails: production env, gallery relink, kids pilot, pickup times, operations, second brand.
- Appendix: at shutdown, dev server (next dev -p 3002) is running on host; laptop to be shut down per owner's order — all windows to be closed by the OS shutdown.
