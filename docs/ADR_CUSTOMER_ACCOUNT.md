# ADR-002: Customer Account — Passwordless OTP with Separate Session Domain

**Status:** ACCEPTED  
**Date:** 2026-11-25  
**Deciders:** CTO, Owner  
**Tags:** authentication, customer-account, multi-tenancy, owasp

---

## Context

`/profile`, `/wishlists`, dan `/trips` saat ini berjalan tanpa identitas customer:

- `/profile` menampilkan data hardcode ("I Ketut"), bukan data pengguna.
- `Customer` di Prisma hanya menyimpan data transaksional (`email`, `name`, `whatsapp`) tanpa kredensial atau status akun.
- `useCustomerSession()` melakukan decode base64 cookie `baliwild-customer` yang tidak pernah diset dan tidak ditandatangani.
- `/trips` bergantung pada magic link `cl1`/`bl1` berbasis HMAC; `/wishlists` hanya `localStorage`.
- `ADMIN_ACCESS_MODEL.md` menyatakan auth customer belum diimplementasikan dan urutan kerja #1 adalah menyelesaikannya.

Branch lama `feat/customer-auth-v1.2` mencoba magic-link auth dengan dependency baru (`bcryptjs`, `jose`) dan tidak pernah diintegrasikan ke `staging`. Pendekatan itu ditolak karena melanggar aturan zero-new-dependency serta tidak memenuhi kebutuhan verifikasi identitas yang kuat.

---

## Decision

1. **Dua lapis identitas.** `Customer` tetap menjadi profil transaksional. `CustomerAccount` (1:1 opsional, `tenantId` wajib) menjadi identitas actor Customer dengan status `PENDING → ACTIVE → SUSPENDED`.

2. **Passwordless OTP sebagai faktor utama.** Kode 6 digit dikirim via Resend, disimpan sebagai HMAC-SHA256, single-use, TTL 10 menit, dan **diverifikasi hanya lewat POST** (menghindari prefetch email scanner). Password menjadi fitur opsional Phase 4.

3. **Tidak ada auto-login dari checkout.** Booking membuat `CustomerAccount=PENDING`; aktivasi dan penerbitan cookie terjadi setelah verifikasi OTP saat pembayaran `PAID`. Ini mengikuti pola OTA (Agoda membuat "Trips account" otomatis, tetapi akun penuh memerlukan verifikasi) sekaligus mencegah akun atas email yang belum terbukti dimiliki pengguna.

4. **Domain session terpisah dari admin.** Cookie produksi `__Host-bw_customer` (lokal: `bw_customer`), secret `CUSTOMER_SESSION_SECRET`, DAL `requireCustomer()`, dan middleware terpisah. Session berisi ID opaque 256 bit yang ditandatangani Web Crypto; hanya hash SHA-256-nya yang disimpan di `CustomerSession`, sehingga bisa direvoke server-side. `vb_admin_session` tidak pernah disentuh.

5. **Guest tetap didukung.** `localStorage` wishlist dipertahankan dan di-merge ke `CustomerWishlist` setelah login; magic link `cl1`/`bl1` dipertahankan permanen untuk akses lapangan.

6. **Nol dependency baru.** Web Crypto + `node:crypto` scrypt (N=2^17, r=8, p=1), Prisma, Resend, Zustand. `adminAuth` di-upgrade ke parameter OWASP yang sama dengan dukungan hash legacy.

7. **Upgrade Next.js 14 → 15 ditunda** sampai Phase 1–3 stabil, sebelum pindah VPS (sesuai `SECURITY_PROTOCOL.md` §6).

---

## Alternatives considered

| Alternatif | Alasan ditolak |
|---|---|
| Auto-login dari data checkout | Email belum terverifikasi → account takeover/fraud; menambah friction konversi |
| Magic-link-only login | Token bisa dikonsumsi prefetch; cross-device `SameSite` rentan; bukan pengganti verifikasi identitas |
| Supabase Auth (`@supabase/ssr`) | Butuh dependency baru; risiko refresh-token reuse pada Next 14; timing tidak sesuai zero-dep lock |
| Memakai ulang `ADMIN_SESSION_SECRET` | Melanggar pemisahan actor; rotasi secret admin akan mengelogout customer |

---

## Consequences

**Positif**

- Identitas customer terbukti (email terverifikasi) sebelum data booking/wishlist bisa diakses lintas perangkat.
- Session bisa direvoke nyata (DB), bukan sekadar hapus cookie.
- Sesuai OWASP Session/Password/Authentication Cheat Sheet dan Next.js DAL guidance.
- Siap multi-tenant (`tenantId` di `CustomerAccount` dan `CustomerWishlist`).

**Negative / trade-off**

- Satu langkah ekstra (buka email + masukkan kode) saat aktivasi.
- Tabel session dan token menambah write DB pada login (satu insert + satu update).
- `scrypt` N=2^17 memakai ~128 MiB per verifikasi; `maxmem` harus di-set eksplisit.

---

## Follow-up

- Phase 1: schema + `customerSession.ts`, `customerGuard.ts`, `customerAuth.ts`, endpoint OTP/me/logout.
- Phase 2: `/profile` aktual.
- Phase 3: wishlist sync + `/trips` session.
- Phase 4: password opsional/Argon2id (perlu approval), passkey, Next 15, VPS.

Detail implementasi: [CUSTOMER_ACCOUNT_DESIGN.md](./CUSTOMER_ACCOUNT_DESIGN.md).
