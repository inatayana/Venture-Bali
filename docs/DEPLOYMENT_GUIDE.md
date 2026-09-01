# Venture Bali — Deployment Guide

> **Version:** 1.0.0

## 1. Environments

| Branch | Environment | Auto-deploy |
|--------|-------------|-------------|
| `main` | Production | Yes |
| `staging` | Staging | Yes |
| `feature/*`, `bugfix/*`, `hotfix/*` | Preview (per PR) | On push |

## 2. Required Environment Variables

Set ALL variables from `.env.example` in the host's secret manager (never in the repo):

- `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`
- `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`
- `GEMINI_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_API_VERSION`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

Values must match the target environment (production keys for production, sandbox Midtrans keys for staging).

## 3. Deploy Checklist (per release)

1. CI green on the release branch (lint + typecheck + test).
2. Run database migrations BEFORE the new build goes live: `npx prisma migrate deploy`.
3. Verify webhook URLs still valid after deploy (WhatsApp verification, Telegram `setWebhook`).
4. Smoke test: home page, one venture detail page, checkout hand-off to Midtrans sandbox/snap.
5. Monitor error logs for 15 minutes post-deploy.

## 4. Rollback

1. Re-deploy the previous known-good commit (platform redeploy or `git revert` + push).
2. Do NOT roll back the database automatically — schema migrations must stay forward-compatible. If a migration must be reversed, write a NEW forward migration and test it on staging first.
3. Report incidents per `docs/SECURITY_PROTOCOL.md` §7 when security-related.

## 5. Build Commands

```bash
npm ci            # exact dependency install
npm run build     # next build
npm start         # next start (or platform runtime)
```
