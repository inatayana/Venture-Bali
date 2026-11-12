# BaliWild — Technology Decision Log

> **Version:** 1.1.0
> **Last Updated:** November 2026
> **Status:** APPROVED — All team members must follow these decisions

---

## 1. Stack Decision: Next.js SSR + Supabase + Vercel

### Decision
- **Frontend/Backend Framework:** Next.js 14+ (App Router) with Server-Side Rendering (SSR)
- **Database:** Supabase PostgreSQL (cloud)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Initial Deployment:** Vercel (Free Tier)
- **Future Migration Target:** Hostinger VPS (when needed)

### Rationale
1. **Codebase already built** with Next.js App Router, API Routes, SSR, and dynamic metadata — rewriting to static export would discard ~70% of implemented features (booking flow, Midtrans webhook, voucher generation, SEO automation).
2. **Supabase provides** PostgreSQL + Auth + Storage + Realtime + REST API out of the box — no need to build custom backend.
3. **Vercel Free Tier** supports Next.js SSR, API Routes, and Edge Functions perfectly for initial launch with zero hosting cost.
4. **Hostinger Business Web Hosting** does not reliably support Next.js SSR + API Routes (per Hostinger support confirmation). It is suitable only for static exports or PHP apps.
5. **Migration path to VPS** is straightforward: same codebase, same Supabase database, only deployment target changes.

### Alternatives Considered & Rejected
| Option | Reason for Rejection |
|--------|---------------------|
| Next.js Static Export + Supabase on Hostinger Business | Loses API Routes, SSR, webhooks, server-side validation — breaks booking/payment flow |
| React + Vite SPA + Supabase on Hostinger Business | Requires full rewrite of server-side logic; not aligned with current codebase |
| MySQL on Hostinger + Next.js SSR | Requires VPS anyway; schema migration from PostgreSQL adds risk |
| Laravel + MySQL on Hostinger | Complete technology pivot; discards all existing TypeScript/Next.js work |

---

## 1.1 Brand & Domain: BaliWild / baliwild.com

### Decision
- Public brand: **BaliWild** (wordmark BALI + WILD, tagline **Own the wild.**).
- Canonical domain: **https://baliwild.com** (`NEXT_PUBLIC_APP_URL`).
- Palette: black `#000000` + Bali Flash Yellow `#FFEE00`, driven by
  `--brand` / `--brand-ink`; the accent is never hardcoded in components.
- All public brand strings live in `src/lib/brand.ts`.

### Rationale
1. The previous name read awkwardly for a global audience; BaliWild is short,
   memorable and matches the existing “Own the wild!” voice.
2. `baliwild.com` is owned and aligns with the adventure positioning.
3. Centralising the name lets a future change be one constants file plus env,
   rather than a template hunt.

### Migration
- No legacy domain is owned; no 301 is required. If an old host is acquired
  later, 301 it to the matching `baliwild.com` path.
- Tenant row, email sender, QR links, sitemap and canonical tags follow
  `NEXT_PUBLIC_APP_URL`; rebuild after changing it because public env is baked
  into the client bundle.

---

## 2. Database Provider: PostgreSQL (Supabase)

### Decision
- Keep `prisma/schema.prisma` with `provider = "postgresql"`
- Use Supabase as managed PostgreSQL provider
- Use Supabase connection pooler for production (transaction mode)

### Rationale
- Schema already designed for PostgreSQL (uses `Json`, `DateTime`, enums)
- Supabase is PostgreSQL — zero schema changes needed
- Connection pooling handles serverless/Vercel connection limits
- Row Level Security (RLS) available for future multi-tenancy

### Configuration
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 3. Environment Variables Strategy

### Decision
All secrets managed via deployment platform (Vercel/VPS), never committed. `.env.example` documents required variables without real values.

### Variable Classification

| Variable | Prefix | Scope | Where Configured |
|----------|--------|-------|------------------|
| `DATABASE_URL` | — | Server-only | Vercel/VPS |
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_` | Client + Server | Vercel/VPS |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_` | Client + Server | Vercel/VPS |
| `SUPABASE_SERVICE_ROLE_KEY` | — | **Server-only** | Vercel/VPS (never in repo) |
| `MIDTRANS_SERVER_KEY` | — | Server-only | Vercel/VPS |
| `MIDTRANS_CLIENT_KEY` | — | Server-only | Vercel/VPS |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | `NEXT_PUBLIC_` | Client + Server | Vercel/VPS |
| `GEMINI_API_KEY` | — | Server-only | Vercel/VPS |
| `TELEGRAM_BOT_TOKEN` | — | Server-only | Vercel/VPS |
| `WHATSAPP_*` | — | Server-only | Vercel/VPS |
| `EXCHANGERATE_API_KEY` | — | Server-only | Vercel/VPS |

### Security Rules
- **Never** prefix server-only secrets with `NEXT_PUBLIC_`
- **Never** commit `.env`, `.env.local`, or any file with real values
- Rotate keys immediately if accidentally exposed

---

## 4. Deployment Architecture

### Phase 1: Vercel (Current — Free Tier)
```
GitHub (main branch)
    ↓ Auto-deploy on push
Vercel Project
    ├── Next.js SSR + API Routes
    ├── Environment Variables (from Vercel Dashboard)
    └── Custom Domain (optional)
        ↓
Supabase Cloud
    ├── PostgreSQL (Database)
    ├── Auth (User Management)
    ├── Storage (Images, Vouchers)
    └── Realtime (Future: live availability)
```

### Phase 2: Hostinger VPS (Future Migration)
```
GitHub (main branch)
    ↓ CI/CD (GitHub Actions or manual)
Hostinger VPS (Ubuntu + Node.js + PM2/Docker)
    ├── Next.js SSR + API Routes (same build)
    ├── Nginx Reverse Proxy + SSL
    ├── Environment Variables (from .env on server)
    └── Custom Domain (A record to VPS IP)
        ↓
Supabase Cloud (unchanged)
```

---

## 5. Code Quality Gates (Non-Negotiable)

Per `AGENTS.md §2.3`, every commit must pass:
```bash
npm run lint        # zero errors
npm run typecheck   # zero errors
npm test            # all tests pass
```

### Enforcement
- GitHub Actions workflow runs on every PR to `main`
- No merge without all checks passing
- No `--force` push to `main` or `staging`

---

## 6. Branching & Release Strategy

Per `docs/DEVELOPMENT_WORKFLOW.md`:

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production | Protected, auto-deploys to Vercel |
| `staging` | Pre-production | Protected, auto-deploys to Vercel Preview |
| `feature/*` | New features | Not protected |
| `bugfix/*` | Bug fixes | Not protected |
| `hotfix/*` | Critical fixes | Not protected |
| `release/*` | Release prep | Not protected |

### Commit Message Format (Conventional Commits)
```
<type>(<scope>): <short summary in present tense>

Types: feat | fix | docs | chore | refactor | test | ci
Examples:
  feat(booking): add date validation to BookingForm
  fix(refund): correct 30-day cutoff calculation
  docs: add DEPLOYMENT_STRATEGY.md
```

---

## 7. Supabase-Specific Decisions

### Connection Pooling
- Use **Transaction Pooler** (port 6543) for serverless/Vercel
- Connection string format: `postgresql://postgres:<pwd>@db.<ref>.supabase.co:6543/postgres?pgbouncer=true`
- Direct connection (port 5432) only for migrations and local development

### Row Level Security (RLS)
- Enable RLS on all tables for future multi-tenant isolation
- Policies defined in Supabase Dashboard, not in Prisma

### Migrations
- `prisma migrate dev` for local development
- `prisma migrate deploy` in CI/CD for production
- Never run `prisma db push` in production

---

## 8. Supabase Auth Integration (Future)

When implementing authentication:
- Use Supabase Auth (email/password, OAuth: Google, Apple)
- JWT tokens validated in Next.js middleware / API routes
- User metadata stored in `Customer` table (linked via `auth.users.id`)

---

## 9. File Storage Strategy

- **Product images, voucher QR codes:** Supabase Storage (bucket: `venture-assets`)
- **Public CDN:** Supabase provides public URLs with caching
- **Private files (contracts, receipts):** Private bucket with signed URLs

### 9.1 Media Delivery — Single Master + Device-Appropriate Sizes (2026-11-03)

**Decision** (owner-approved, `docs/MEMO_MEDIA_ARCHITECTURE.md`):
- Store **one** compressed WebP master per photo in the public
  `venture-assets` bucket, organised by prefix:
  `products/`, `content/`, `reviews/` (single bucket, folder hierarchy).
- File names are **content hashes** (SHA-256 of compressed bytes) so
  identical uploads never create duplicates.
- Device-appropriate sizes come from the **Vercel image optimizer**
  (`/_next/image` via `next/image` + `sizes`), cached at the edge —
  variants are never stored in Supabase.
- Compression and validation happen **in the browser at file-pick time**
  (no server-side encoder, no new dependencies).

**Rationale:** avoids storing 3–4 duplicates per photo (multi-variant
srcset), avoids the Supabase Pro plan (image transformations), and reuses
the existing `next/image` display layer that already sets `sizes`/`priority`.

**Rejected alternatives:** multi-variant storage (duplicates the same
visual), Supabase Image Transform (paid plan), server-side `sharp`
(new dependency, against AGENTS.md §4 until approved).

**Known risks:** Vercel Hobby image-optimization quota (~1,000 unique
source images/month — sufficient for the current catalog); Phase 2 VPS will
need `sharp` installed on the server for the optimizer (decision deferred
to that time).

---

## 10. Monitoring & Observability (Future)

- **Vercel Analytics** for Web Vitals
- **Supabase Dashboard** for DB performance, auth logs
- **Sentry** (planned) for error tracking
- **Midtrans Dashboard** for payment monitoring

---

## 11. Decision Review Process

| Trigger | Action |
|---------|--------|
| New team member joins | Read this document + AGENTS.md + PROJECT_STRUCTURE.md |
| Major architecture change proposed | Create ADR (Architecture Decision Record) in `docs/adr/` |
| Quarterly review | Team reviews all decisions, updates if needed |
| Incident post-mortem | Document lessons learned, update relevant decisions |

---

## 12. Dependency Security Patch — November 2026

### Decision
- Pin `next` and `eslint-config-next` to **14.2.35** (latest 14.x) and
  `postcss` to **8.5.31**.
- Keep the major upgrade (Next 15/16, React 19, Tailwind 4, Prisma 7) in the
  dedicated upgrade sprint. It is not part of this patch.

### Rationale
- 14.2.5 was affected by CVE-2025-29927 (middleware authorization bypass) and
  the wider set of 14.x advisories.
- 14.2.35 closes the 14.x backports that are available on that branch,
  including the middleware bypass. It is a strict improvement over 14.2.5 and
  can ship while the major upgrade is planned, but it does not clear every
  advisory on the EOL branch.

### Residual risk (tracked)
- Next 14.x is end-of-life. `npm audit` still reports package-level
  critical/high advisories that are only patched in Next 15.5.28 / 16.4.1.
  The retained criticals that matter to this app are:
  - `GHSA-2464-fhr4-w9xw` — RCE in the Image Optimization API when SVG is used.
  - `GHSA-2xp9-vwfh-vxw4` — RCE in the Image Optimization API when AVIF is used.
  - `GHSA-p293-qw3h-jr36` — RCE on Windows-hosted servers (not applicable to
    Vercel Linux, but relevant to local Windows dev).
  `CVE-2025-29927` (middleware bypass) is fixed in 14.2.35.
- Mitigations in place today:
  - Production runs on Vercel (Linux) with the platform image optimizer.
  - No `remotePatterns` are configured, so the Image Optimizer cannot fetch
    external images.
  - `dangerouslyAllowSVG` is limited to local placeholder assets; the app has no
    user-supplied SVG upload path.
- **Gate:** do not migrate to the Hostinger VPS until the upgrade PR re-runs
  `npm audit` with zero critical/high and the money-path e2e suite exists.
  `>=15.5.28` / `>=16.4.1` are the current advisory bounds, not a permanent
  guarantee.
- `zod` 3.x has no non-breaking fix. Public arrays and their string items are
  bounded in `bookingSchema` and `experiences` as a compensating control.
- `npm audit fix` applied patch-level transitive bumps only (`source-map-js`,
  `postcss-selector-parser`, `brace-expansion`, `js-yaml`, `nanoid`,
  `ansi-regex`); no new packages were added.

### Enforcement
- `npm run audit:check` compares the audit report with
  `scripts/audit-baseline.json` advisory by advisory. It fails on a new
  high/critical package, a severity increase, or a new high/critical advisory.
- CI runs `npm run audit:check` before `npm run build` on every PR to `main`.

---

## 13. Related Documents

| Document | Location |
|----------|----------|
| Deployment Strategy | `docs/DEPLOYMENT_STRATEGY.md` |
| Project Structure | `docs/PROJECT_STRUCTURE.md` |
| Development Workflow | `docs/DEVELOPMENT_WORKFLOW.md` |
| Agent Rules | `AGENTS.md` |
| Prisma Schema | `prisma/schema.prisma` |
| Environment Template | `.env.example` |

---

## 13. Decision — Admin Area Cascade (Desa / Kecamatan / Kabupaten / Provinsi)

**Date:** 2026-11-04 · **Status:** Approved · **Owner:** Product

**Decision.** The admin product form replaces the flat 10-row Area select with a
four-level cascade: Provinsi (default **Bali**) → Kabupaten/Kota → Kecamatan →
Desa/Kelurahan. The option source is a vendored dataset,
`src/data/wilayah-bali.json` (9 kabupaten/kota, 57 kecamatan, 653 desa/kelurahan,
Kemendagri data via emsifa/api-wilayah-indonesia, fetched 2026-11-04) — no npm
dependency and no runtime network call. Because the cascade only shows the desa
of the already-selected kecamatan, the full official list stays usable without
overwhelming the admin.

**Behaviour.** Saving with a complete cascade resolves a `Location` via
`src/lib/locationResolve.ts`: reuse by hierarchy → adopt a legacy row with the
same composed name and heal its empty hierarchy → else create one. The composed
name keeps the legacy "Desa, Kecamatan, Kabupaten, Provinsi" format that
VentureCard, the PDP fallback and the JSON-LD address parser (`seo.ts`) rely on;
`region` stores the kabupaten. `Location.latitude/longitude` became nullable
(migration `20261104043732`) — desa rows are created without coordinates and
precise coordinates remain on `Venture.meetingPoint*`. Legacy payloads
(`locationId` only) and products without an area keep working unchanged.

**Alternatives rejected.** Full-Indonesia dataset (≈80k desa, needs a runtime
external API — too heavy for an admin booking surface); hard-coded kecamatan
centroids for new rows (fabricated data); constraining the cascade to the 10
seeded rows (admins could not add new areas).

**Consequences.** New desa rows have no coordinates until enriched; the dataset
file must be updated manually when Bali adds/renames areas; SEO keyword
synthesis continues to read `Location.name`, which stays stable in format.

---

## 14. Decision — Dependency Audit Baseline Extension (@sentry/nextjs, rollup)

**Date:** 2026-11-13 · **Status:** Approved · **Owner:** Engineering

**Decision.** Adopting the `hotfix/security-next-14-2-35` security hardening
(Next.js 14.2.35, report-only CSP, audit gate) onto the platform-hardening
branch added two production dependencies the original baseline did not know:
`@sentry/nextjs` (8.0.0 → 8.55.2, installed with `npm audit fix`) and
`rollup` 3.29.5 (transitive of `@sentry/nextjs`). Both stay flagged high;
the only fix path is the `@sentry/nextjs` 11.x major upgrade, which is
scheduled together with the Next 15/16 upgrade.

**Rationale.** The audit gate fails closed on unknown high/critical
advisories. Rather than weakening the gate, both packages are recorded in
`scripts/audit-baseline.json` with severity `high` (`@sentry/nextjs` with an
empty direct-advisory list because it is flagged through the rollup chain).
No deviation from the accepted-residual policy is introduced.

**Alternatives rejected.** Upgrading to `@sentry/nextjs` 11.x now (major
rewrite of instrumentation, out of scope for a patch-level hardening);
removing Sentry (loses production observability); leaving the gate red
(defeats the security hardening itself).

**Consequences.** CI passes with the extended baseline; when the Next 15/16
upgrade PR lands, regenerate the baseline and prune `next`, `postcss`, `zod`,
`@sentry/nextjs` and `rollup` together.

---

**Approved by:** BaliWild Engineering Team
**Date:** October 2026
**Next Review:** January 2027