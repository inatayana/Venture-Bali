# BaliWild — Deploy, Seed & Recovery Runbook

> **Version:** 1.0.0
> **Audience:** anyone deploying or recovering the platform (owner, agents, contractors).
> **Status:** MUST READ before any migration, seed, or environment change.
> **Trigger:** any time someone says "it's broken", "data hilang", "admin tidak bisa login", or "halaman kosong".

## 1. Environment Map — single source of truth (fill in before first use)

| Environment | DB host (Supabase pooler) | Web | Admin | Notes |
|---|---|---|---|---|
| Local dev | `aws-0-ap-northeast-1.pooler.supabase.com` (in `.env`) | `http://localhost:3002` | same | **Owner-confirmed 2026-11-06: this IS the BaliWild PRODUCTION DB.** It was found EMPTY on 2026-11-05 and repaired via reconcile migration + re-seed. Treat all hands on it as production actions — backups BEFORE any migration/seed. |
| Vercel preview | `DATABASE_URL` / `DIRECT_URL` in Vercel Preview envs | preview URL | same | |
| Vercel production | `DATABASE_URL` / `DIRECT_URL` in Vercel Production envs | domain | same | |

Rules:
- `.env.example` documents shape only — never secrets.
- Any change to the environment map MUST be recorded in this file in the same PR.
- The healthy outcome per environment is defined by §4 smoke, not by "build passed".

## 2. Deploy checklist (any migration / deploy)

1. **Backup first.** Supabase dashboard → Backups, or enable PITR for the project. For manual drills use `pg_dump` into `private/` (git-ignored) before anything destructive.
2. `npx prisma migrate deploy` — read every pending migration first (see §3).
3. `npx prisma generate` — STOP every node process holding the client DLL first, or this fails with EPERM on Windows.
4. `npm run db:seed` — idempotent (upserts). On a fresh DB this MUST succeed from zero.
5. `npm run lint && npm run typecheck && npm test` — zero tolerance (AGENTS.md §2).
6. Boot the app, then `npm run smoke` — see §4. A green build without a green smoke is **not** a deploy.
7. Sign-off comment includes the smoke output.

## 3. Migration review rule (mandatory)

Every new migration must answer, in the PR body:

- What happens to EXISTING ROWS? (backfill, drop, or unaffected)
- Does the seed still succeed on an empty DB afterwards?
- Does the Prisma schema still match afterwards? (`prisma migrate status` must show zero pending)
- Any NOT NULL column added without a default? → that's a breaking insert; block or backfill.

Precedent: `20261105063842_add_tenant_id_to_all_models` added NOT NULL `tenantId` to every table while
the schema carried it on only 4 models — every insert failed and the DB was unusable until
`20261110110000_reconcile_tenant_columns` dropped the unused columns.

## 4. Smoke test — definition of "alive"

```bash
npm run smoke                              # default http://localhost:3002
BASE_URL=https://<domain> npm run smoke    # against prod
```

PASS criteria: `/` returns 200 with the seeded catalogue marker, `/admin/login` returns 200.
FAIL → see §5. A full functional drill additionally requires: log in with a real admin account,
open a product, verify a booking flow page renders with prices.

## 5. Recovery — empty database / broken admin / site shows mock

Symptoms: catalogue empty, `/admin/login` says "Incorrect email or password" for known accounts,
or the site shows generic/mock content.

1. **Check the DB is not empty:** `psql "$DATABASE_URL" -f scripts/verify-seed.sql` (or `npx prisma studio`). If every table is 0 → reseed.
2. **Reseed:** `npm run db:seed` (idempotent). Then `npm run smoke`.
3. **Admin login still fails:** the account table may be empty → create one:
   `npm run admin:create -- <email> "<password>" SUPER_ADMIN`
   (Never reuse a password that was ever shared in chat. Never hardcode it.)
4. **Schema vs DB drift:** `npx prisma migrate status` — resolve pending migrations before anything else.
5. **Storage photos missing (hero/gallery vanish from pages):** photos live in Supabase Storage bucket
   (`venture-assets`, prefix `products/`), NOT in the DB. Verify the bucket exists and files respond
   with HTTP 200. If inaccessible: re-upload via Admin → product editor. DB rows referencing them
   (`Venture.gallery`, `Variant.imageUrl`) must point to `https://<project>.supabase.co/storage/v1/object/public/venture-assets/...`.

## 6. Admin seeding & secret hygiene

- Fresh DB: `ADMIN_SEED_EMAIL=<mail> ADMIN_SEED_PASSWORD=<strong-pass> npm run db:seed` provisions the first admin (min 12 chars). Do NOT commit these values.
- Otherwise use `npm run admin:create` interactively; output contains no secrets.
- CI must NEVER run seed against production with `ADMIN_SEED_*` set.
- Rotate any admin password that ever appeared in chat, ticket, or commit. Chat is not a vault.

## 7. Incident checklist (paste into the PR/issue)

- [ ] Which environment & which DB were affected? (from §1 map)
- [ ] Backup taken BEFORE any new migration
- [ ] `prisma migrate status` clean
- [ ] `db:seed` OK on empty DB
- [ ] `npm run smoke` PASS (attach output)
- [ ] Login with a real admin account verified manually
- [ ] Root cause written into docs/TECH_DECISION_LOG.md within 24h
