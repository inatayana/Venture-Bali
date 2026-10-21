# Venture Bali — Deployment Guide

> **Version:** 2.0.0
> **Last Updated:** October 2026
> **Related:** `docs/DEPLOYMENT_STRATEGY.md` (full platform setup), `docs/TECH_DECISION_LOG.md` (why)

---

## 1. Target Platform

| Phase | Platform | Application | Database |
|-------|----------|-------------|----------|
| Current | **Vercel** (Free Tier) | Next.js SSR (Node.js runtime) | Supabase PostgreSQL |
| Future | Hostinger VPS | Next.js SSR via PM2 + Nginx | Supabase PostgreSQL |

> ⚠️ Hostinger **Business Web Hosting** (shared hosting) is **not** used for the
> application. It does not reliably support Next.js SSR + API Routes.
> See `docs/TECH_DECISION_LOG.md` §1 for the full rationale.

---

## 2. Environments

| Branch | Environment | Auto-deploy | Database |
|--------|-------------|-------------|----------|
| `main` | Production | Yes → Vercel | Supabase (prod pooler) |
| `staging` | Staging | Yes → Vercel | Supabase (prod pooler, separate schema recommended) |
| `feature/*`, `bugfix/*`, `hotfix/*` | Preview (per PR) | On push | Supabase (prod pooler) |

---

## 3. Required Environment Variables

Set **ALL** variables from `.env.example` in the host's secret manager
(Vercel Dashboard → Project → Settings → Environment Variables, or
`/home/deploy/Venture-Bali/.env` on VPS). **Never commit them to the repo.**

### Database & Supabase
- `DATABASE_URL` — Supabase Transaction Pooler (port `6543`) for production
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — **server only**, never `NEXT_PUBLIC_`

### App
- `NEXT_PUBLIC_APP_URL`

### Midtrans
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION`
- `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION`

### AI / Channels / FX
- `GEMINI_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_API_VERSION`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `EXCHANGERATE_API_KEY`

Values must match the target environment (production keys for production,
sandbox Midtrans keys for staging).

### Scope Rules (enforced by review)
| Rule | Detail |
|------|--------|
| `NEXT_PUBLIC_*` | Only for values that are safe to expose in the browser |
| Server-only secrets | `SUPABASE_SERVICE_ROLE_KEY`, `MIDTRANS_SERVER_KEY`, `GEMINI_API_KEY`, `DATABASE_URL` — never prefixed with `NEXT_PUBLIC_` |
| Rotation | If a secret is ever committed or leaked: report immediately, rotate the key, never just delete the file (`AGENTS.md` §7) |

---

## 4. Build & Run Commands

```bash
npm ci                # exact dependency install
npm run db:generate   # generate Prisma Client
npm run db:migrate    # create + apply migration (local dev only)
npm run db:deploy     # apply pending migrations (production)
npm run db:seed       # seed reference data + demo ventures
npm run build         # next build
npm start             # next start (or platform runtime)
```

---

## 5. Deploy Checklist (per release)

1. CI green on the release branch (`lint` + `typecheck` + `test`).
2. Database migrations applied **before** the new build goes live:
   `npm run db:deploy`.
3. Verify webhook URLs still valid after deploy (Midtrans notification URL,
   WhatsApp verification, Telegram `setWebhook`).
4. Smoke test: home page, one product detail page, checkout hand-off to
   Midtrans sandbox/Snap.
5. Monitor error logs for 15 minutes post-deploy.

### Post-Deploy Smoke Test
- [ ] `/` loads with product cards
- [ ] `/experiences/[id]/[slug]` loads and price updates when pax changes
- [ ] `/checkout` renders the order summary
- [ ] Midtrans Snap modal opens (sandbox key → test card number)
- [ ] Webhook endpoints return 200 (check platform logs)
- [ ] Supabase dashboard shows no connection errors

---

## 6. Rollback

1. Re-deploy the previous known-good commit (platform redeploy, or
   `git revert` + push).
2. Do **NOT** roll back the database automatically — schema migrations must
   stay forward-compatible. If a migration must be reversed, write a NEW
   forward migration and test it on staging first.
3. Report incidents per `docs/SECURITY_PROTOCOL.md` §7 when security-related.

---

## 7. Platform Quick Reference

### Vercel
- Build Command: `npm run build`
- Install Command: `npm ci`
- Node.js: 20.x LTS
- Production domain: configured in Vercel → Settings → Domains

### Hostinger VPS (future)
- See `docs/DEPLOYMENT_STRATEGY.md` §3 for the full PM2 + Nginx + Certbot setup.

---

**Related Documents:** `docs/DEPLOYMENT_STRATEGY.md`, `docs/TECH_DECISION_LOG.md`, `docs/SECURITY_PROTOCOL.md`, `.env.example`