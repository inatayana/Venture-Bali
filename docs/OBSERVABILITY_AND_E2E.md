# BaliWild — Observability & Money-Path E2E

> **Version:** 1.0.0
> **Last Updated:** November 2026
> **Owner:** Money-path / platform track

## 1. Structured logger

`src/lib/logger.ts` is a dependency-free JSON logger:

- One JSON object per line: `time`, `level`, `scope`, `message`, plus context.
- Sensitive keys are redacted before serialization: passwords, tokens,
  authorization headers, cookies, emails, WhatsApp numbers, phone numbers,
  addresses and guest names.
- Stack traces are only included outside production.
- Child scopes keep lines attributable:
  `logger.child('payments')`, `logger.child('midtrans-webhook')`,
  `logger.child('booking')`.
- `reportError(error, { requestId })` normalises unknown thrown values and logs
  them once.

Rules:

- Log identifiers and statuses, never customer PII or credentials.
- Do not log raw webhook payloads; log `orderId`, status and voucher state.
- Use `logger`, not `console.*`, on the critical path.

## 2. Health endpoint

`GET /api/health` reports liveness and database readiness:

- `200` with `data.status = "ok"` when `SELECT 1` succeeds.
- `503` with `data.status = "degraded"` when the database is unavailable.
- `Cache-Control: no-store`; no configuration or error details are exposed.

It is used by Playwright's `webServer` readiness check and can be wired to an
uptime monitor.

## 3. Money-path E2E

`tests/e2e/money-path.spec.ts` covers:

1. `/api/health` and database readiness.
2. Home and PDP render, including a real optimized image (`naturalWidth > 0`).
3. Booking API → pending `Payment` row → signed Midtrans webhook → `PAID`
   booking → `ACTIVE` voucher with QR → voucher page.

Not covered yet:

- Snap token creation against live Midtrans (needs sandbox credentials).
- Real payment-channel UI.
- Email/WhatsApp delivery (notifications are best-effort after settlement).

## 4. Running locally

Prerequisites:

- Node.js 22+.
- Docker with the shared `baligo-pg-ci` Postgres container on
  `127.0.0.1:55432` (`postgres` / `postgres`), or set `E2E_PG_CONTAINER`.
- Chrome installed (or set `PLAYWRIGHT_CHANNEL`).

```bash
npm run test:e2e
```

The runner:

1. Creates an isolated `baliwild_e2e_<timestamp>` database.
2. Runs `prisma migrate deploy` and `prisma db seed`.
3. Builds the app.
4. Runs Playwright.
5. Drops the database.

It never touches the shared `baligo_test` database. Reuse an existing build with:

```bash
E2E_SKIP_BUILD=1 npm run test:e2e
```

## 5. CI

`.github/workflows/e2e.yml` runs on every PR to `main`:

- PostgreSQL 17 service.
- `npm ci`, `prisma generate`, `prisma migrate deploy`, `prisma db seed`.
- `npm run build`.
- Playwright Chromium.
- `playwright test`.

`npm run test:e2e:ci` is the same sequence without the local Docker wrapper.

## 6. Sharp

`sharp@0.35.5` is a production dependency:

- `next/image` needs it for production image optimization.
- It is the documented workaround for the Next 14 image-optimizer RCE advisory
  (`GHSA-2464-fhr4-w9xw`). Keep it at `>=0.35.5` until Next is upgraded.

## 7. Next steps

- Add Sentry once a project/DSN exists; wire `report-to` into the CSP at the
  same time.
- Add e2e for refunds/reschedule and admin voucher redemption.
- Replace placeholder SVG art with raster photography, then remove
  `dangerouslyAllowSVG`.
