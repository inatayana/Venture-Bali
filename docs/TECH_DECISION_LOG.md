# Venture Bali — Technology Decision Log

> **Version:** 1.0.0
> **Last Updated:** October 2026
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

## 12. Related Documents

| Document | Location |
|----------|----------|
| Deployment Strategy | `docs/DEPLOYMENT_STRATEGY.md` |
| Project Structure | `docs/PROJECT_STRUCTURE.md` |
| Development Workflow | `docs/DEVELOPMENT_WORKFLOW.md` |
| Agent Rules | `AGENTS.md` |
| Prisma Schema | `prisma/schema.prisma` |
| Environment Template | `.env.example` |

---

**Approved by:** Venture Bali Engineering Team
**Date:** October 2026
**Next Review:** January 2027