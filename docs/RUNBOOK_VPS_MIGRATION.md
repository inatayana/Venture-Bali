# BaliWild — VPS Migration Runbook (owner-executed)

> **Version:** 1.1.0 · **Date:** 2026-11-25 · **Status:** PREPARED — not executed by agents  
> **Related:** [RUNBOOK_DEPLOY.md](./RUNBOOK_DEPLOY.md), [DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md), [SECURITY_PROTOCOL.md](./SECURITY_PROTOCOL.md)  
> **Rule:** agents prepare artifacts only. Actual deployment requires owner credentials and owner sign-off.

---

## 0. Gate status (read first) — APPROVED

**CTO & Owner decision, 2026-11-25:** the security baseline is **Next.js `>=15.5.27`**. This supersedes the former `>=15.5.28`/`>=16.4.1` wording, which referenced versions not published on npm at that date. Phase 4 upgraded `14.2.35 → 15.5.27` (latest stable 15.x) and `npm run audit:check` passes, so the **Next.js gate is satisfied**.

**VPS execution is nevertheless DEFERRED** until `v1.2.0` is live and stable on Vercel. Do **not** provision servers, move DNS, or re-point webhooks until the Owner issues a separate go-ahead. This document is a prepared runbook only.

**Also deferred to `v1.3.0`:** Argon2id and passkeys. Keep scrypt (N=2^17) with zero new dependencies until that release.

---

## 1. Target topology

```
Internet → Caddy/Nginx (TLS) → Next.js standalone (systemd, 127.0.0.1:3000)
                                   ├── Supabase PostgreSQL (pooled 6543 runtime / 5432 migrations)
                                   ├── Resend (OTP + transactional mail)
                                   └── Midtrans / WhatsApp / Telegram webhooks
```

- HTTPS is **mandatory**: the customer session cookie is `__Host-bw_customer` in production and requires `Secure`, `Path=/`, no `Domain`. Over plain HTTP the app falls back to `bw_customer`, which is not acceptable in production.
- Node.js **22.x** (package `engines` requires `>=22.6.0`; seed uses native TS stripping).

---

## 2. Pre-flight (on Vercel first)

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run audit:check` all green.
- [ ] `npm run build` green on Node 22.
- [ ] `npx prisma migrate status` shows zero pending after `migrate deploy` on a **staging** database.
- [ ] `npm run db:seed` succeeds on an **empty staging** database — never on the production Supabase project.
- [ ] `npm run smoke` passes on the preview deployment.
- [ ] Manual customer drill: sign up → OTP email → `/profile` → wishlist merge → `/trips` without token → sign out; then guest magic link still opens `/trips`.
- [ ] Webhook URLs changed to the VPS domain only **after** DNS cutover (Midtrans, Meta, Telegram).

> Reminder from `RUNBOOK_DEPLOY.md §1`: the current local `.env` points at the **production** Supabase DB. Never seed or mutate schema from that machine.

---

## 3. VPS provisioning (owner)

1. Create VPS (≥2 vCPU / 4 GB RAM), Ubuntu 22.04+, firewall only 80/443/22.
2. Install Node 22 via nvm or NodeSource; verify `node -v`.
3. Clone repo to `/srv/baliwild`, checkout the release tag/commit, `npm ci`.
4. Create `/srv/baliwild/.env` from `.env.example` with **production** values. Mandatory for customer accounts:
   - `CUSTOMER_SESSION_SECRET` (≥16 random chars, **different** from `ADMIN_SESSION_SECRET` and `CUSTOMER_LINK_SECRET`)
   - `CUSTOMER_OTP_TTL_MINUTES=10`
   - `RESEND_API_KEY`, `EMAIL_FROM`
   - `DATABASE_URL` (pooler, 6543), `DIRECT_URL` (5432), `NEXT_PUBLIC_APP_URL=https://<domain>`
5. `chmod 600 /srv/baliwild/.env`; never add it to git.

---

## 4. Build & run

```bash
cd /srv/baliwild
npm ci
npx prisma generate
npx prisma migrate deploy          # uses DIRECT_URL
npm run build
```

systemd unit (standalone output is optional; `npm run start` is acceptable for the first cutover):

```ini
[Unit]
Description=BaliWild
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/srv/baliwild
EnvironmentFile=/srv/baliwild/.env
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable --now baliwild
journalctl -u baliwild -f
```

Caddy example:

```
baliwild.com {
  reverse_proxy 127.0.0.1:3000
}
```

---

## 5. Cutover order

1. Keep Vercel live; write DNS for the VPS with a low TTL.
2. Verify HTTPS + `curl -I https://<domain>/` returns 200.
3. `BASE_URL=https://<domain> npm run smoke` from a trusted machine.
4. Manual drill from §2 against the VPS domain.
5. Point Midtrans / Meta / Telegram webhooks at the new domain.
6. Watch logs + webhook delivery for 30 minutes.
7. Only then raise DNS TTL and, after the agreed observation window, retire Vercel.

---

## 6. Rollback

1. Restore webhook URLs to Vercel **first** (payments & notifications).
2. Flip DNS back to Vercel (low TTL makes this fast).
3. Keep the VPS running read-only for log/DB inspection — do not delete it.
4. If a bad migration was applied: restore the Supabase backup **before** re-pointing traffic; never run `migrate reset` on production.
5. Rotate `CUSTOMER_SESSION_SECRET` + `ADMIN_SESSION_SECRET` if any cookie/session leak is suspected — rotation logs everyone out, which is the intended fail-closed behavior.

---

## 7. Post-cutover verification

- [ ] `/profile` as guest → 307 to `/login?next=/profile`.
- [ ] OTP email arrives, POST verify activates and sets `__Host-bw_customer` with `Secure; HttpOnly; SameSite=Lax`.
- [ ] `/api/account/me` returns 200 for the session, 401 without it.
- [ ] Guest wishlist merges into `CustomerWishlist` once; heart toggles persist across two browsers.
- [ ] `/trips` loads without a token when signed in; the old emailed magic link still works.
- [ ] Optional password login works; changing it signs out other devices.
- [ ] Admin console still requires `vb_admin_session` — customer cookie grants no admin access.
- [ ] `npm run smoke` output attached to the sign-off PR/issue.

---

## 8. Sign-off

Record in the deployment issue: environment, DB used, commit SHA, migration list, smoke output, webhook re-point confirmation, and the owner's approval. No sign-off → treat the cutover as incomplete.
