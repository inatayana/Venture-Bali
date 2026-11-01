# BaliWild — Security Protocol

> **Version:** 1.0.0
> **Status:** MUST FOLLOW for all agents and developers

## 1. Secrets Management

- Real secrets live ONLY in local `.env` (git-ignored) or the host's secret manager (e.g., Vercel environment variables).
- Every env var used in code MUST be listed in `.env.example` with an empty value.
- NEVER commit, log, or paste secrets into issues, PRs, or chat.
- If a secret is committed: report immediately, rotate the key, then clean history.

## 2. Webhook Security

- **WhatsApp** (`src/app/api/webhooks/whatsapp/`): verify `X-Hub-Signature-256` against `WHATSAPP_APP_SECRET`-derived HMAC and validate `WHATSAPP_WEBHOOK_VERIFY_TOKEN` on GET verification. Never trust payload content without signature verification.
- **Telegram** (`src/app/api/webhooks/telegram/`): validate `X-Telegram-Bot-Api-Secret-Token` header when `TELEGRAM_WEBHOOK_SECRET` is configured.
- Webhook handlers MUST validate input with `zod` before processing.

## 3. Input Validation

- ALL API routes validate request bodies/query with `zod` schemas before use.
- Reject unknown/oversized payloads with 400-level responses; never reflect raw payloads in errors.

## 4. Payments (Midtrans)

- `MIDTRANS_SERVER_KEY` is server-side ONLY — never expose to the client (`NEXT_PUBLIC_` is forbidden for it).
- Always verify transaction status server-to-server (Midtrans API / notification signature) before marking a booking PAID.
- Treat all payment notifications as untrusted until signature check passes.

## 5. Data Protection

- Customer PII (email, WhatsApp number, hotel address) is accessed on a need-to-know basis; never logged.
- Database credentials never appear in code, logs, or client bundles.
- Multi-tenant isolation: every query MUST be scoped by `tenantId` where the model supports it.
- Analytics and marketing tags only run after **Accept all** in the cookie banner (`baliwild_cookie_consent`). Essential storage always works.
- Privacy policy: `/privacy` (data collected, processors, retention, rights).

## 5.1 Transport & abuse protection

- Security headers in `next.config.js`: `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS in production.
- In-memory rate limits (`src/lib/rateLimit.ts`) on booking, coupons, AI chat,
  reviews, cancellation/reschedule and admin login. This is best-effort per
  serverless instance; move to Upstash/Redis before scaling.
- Admin login is limited to 5 attempts / 15 minutes per IP. Add 2FA before
  onboarding more operators.
- Supabase migrations use `DIRECT_URL` (port 5432); runtime uses the pooled
  `DATABASE_URL`.

## 6. Dependency & Code Hygiene

- No new dependencies without owner approval.
- TypeScript strict mode, no `any` — types are the first security layer.
- Run `npm audit` periodically; report high/critical findings to the owner.

## 7. Incident Response

1. Stop the bleeding (revoke/rotate keys, disable the affected webhook).
2. Report to owner with timeline and impact.
3. Document root cause in a `docs/` postmortem entry.
