# BaliWild — Customer Account Design

> **Version:** 1.0.0 · **Date:** 2026-11-25 · **Status:** APPROVED (CTO & Owner)  
> **Related:** [ADR-002](./ADR_CUSTOMER_ACCOUNT.md), [ADMIN_ACCESS_MODEL.md](./ADMIN_ACCESS_MODEL.md), [SECURITY_PROTOCOL.md](./SECURITY_PROTOCOL.md), [BOOKING_ARCHITECTURE.md](./BOOKING_ARCHITECTURE.md)  
> **Branch:** `feature/customer-account` · **Release target:** `v1.2.0`

---

## 1. Scope & actor model

BaliWild membedakan empat actor. Dokumen ini hanya mengatur actor **Customer**.

| Actor | Identitas | Tidak boleh |
|---|---|---|
| **Guest** | Tanpa akun; `localStorage` wishlist; magic link `cl1`/`bl1` | Mengakses data customer lain, session customer, atau admin |
| **Customer** | `CustomerAccount` + session `bw_customer`/`__Host-bw_customer` | Membaca/menulis session admin (`vb_admin_session`), mengelola produk/harga |
| **Field Ops** | Bagian dari operator panel | Memakai session customer |
| **Admin** | `vb_admin_session`, role `VIEWER`–`SUPER_ADMIN` | Memberi akses admin lewat session customer |

**Aturan emas:** identitas customer tidak pernah memberi akses admin, dan sebaliknya. Secret, cookie, DAL, dan middleware keduanya terpisah.

---

## 2. Keputusan yang dikunci (CTO & Owner, 2026-11-25)

1. **Login:** OTP email 6 digit via Resend, dikonfirmasi lewat **POST sekali pakai**. Password opsional menyusul Phase 4.
2. **Checkout:** `CustomerAccount` dibuat otomatis berstatus `PENDING`. Setelah pembayaran `PAID`, email berisi OTP/CTA *"Aktifkan Akun Saya"*. Akun menjadi `ACTIVE` dan cookie diterbitkan **hanya setelah verifikasi**. Tidak ada auto-login dari checkout.
3. **Wishlist:** `localStorage` (`baliwild-wishlist`) dipertahankan untuk guest dan di-merge ke `CustomerWishlist` saat login, **tanpa menghapus data lokal sebelum server menyimpannya**.
4. **Magic link `/trips` (`cl1`/`bl1`):** dipertahankan permanen. User login melihat seluruh booking akunnya tanpa token di URL; token lama tetap berlaku sampai kedaluwarsa.
5. **Dependency:** nol dependency baru — Web Crypto, `node:crypto` (`scrypt` N=2^17, r=8, p=1), Prisma, Resend, Zustand. `adminAuth` ikut di-upgrade ke parameter OWASP.
6. **Next.js 14 → 15:** menyusul setelah Phase 1–3 stabil, sebelum migrasi/deploy VPS (sesuai `SECURITY_PROTOCOL.md` §6).

---

## 3. Model data

```prisma
model CustomerAccount {
  id               String                @id @default(cuid())
  customerId       String                @unique
  customer         Customer              @relation(fields: [customerId], references: [id], onDelete: Cascade)
  tenantId         String
  tenant           Tenant                @relation(fields: [tenantId], references: [id])
  email            String                @unique
  status           CustomerAccountStatus @default(PENDING)
  passwordHash     String?               // Phase 4; null = passwordless
  emailVerifiedAt  DateTime?
  lastLoginAt      DateTime?
  failedLoginCount Int                   @default(0)
  lockedUntil      DateTime?
  sessions         CustomerSession[]
  authTokens       AuthToken[]
  wishlists        CustomerWishlist[]
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt

  @@index([tenantId])
  @@index([status])
}

model CustomerSession {
  id          String          @id @default(cuid())
  accountId   String
  account     CustomerAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  sessionHash String          @unique   // SHA-256 dari opaque session id
  expiresAt   DateTime
  lastSeenAt  DateTime        @default(now())
  revokedAt   DateTime?
  createdAt   DateTime        @default(now())

  @@index([accountId])
  @@index([expiresAt])
}

model AuthToken {
  id         String           @id @default(cuid())
  accountId  String
  account    CustomerAccount  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  tokenHash  String           @unique   // HMAC-SHA256 dari kode OTP
  purpose    AuthTokenPurpose
  expiresAt  DateTime
  consumedAt DateTime?
  createdAt  DateTime         @default(now())

  @@index([accountId, purpose])
  @@index([expiresAt])
}

model CustomerWishlist {
  id        String          @id @default(cuid())
  accountId String
  account   CustomerAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  tenantId  String
  tenant    Tenant          @relation(fields: [tenantId], references: [id])
  ventureId String
  venture   Venture         @relation(fields: [ventureId], references: [id], onDelete: Cascade)
  savedAt   DateTime        @default(now())

  @@unique([accountId, ventureId])
  @@index([tenantId])
}

enum CustomerAccountStatus { PENDING ACTIVE SUSPENDED }
enum AuthTokenPurpose      { ACTIVATE SIGN_IN RESET_PASSWORD }
```

`CustomerAccount` adalah **1:1 opsional** terhadap `Customer`: customer bisa tetap guest tanpa akun. `tenantId` wajib pada `CustomerAccount` dan `CustomerWishlist` untuk konsistensi multi-tenant; nilai diambil dari `venture.tenantId` saat dibuat dari booking, atau tenant context saat sign-up eksplisit.

---

## 4. Siklus hidup identitas

```text
checkout (guest)
  → Customer.upsert (existing)
  → CustomerAccount(status=PENDING, email dari checkout)
  → bayar PAID
  → email OTP 6 digit (CTA "Aktifkan Akun Saya")
  → POST /api/account/otp/verify { email, code }
  → token consumed + emailVerifiedAt + status=ACTIVE
  → issue CustomerSession + cookie
  → /profile
```

- Customer yang already `ACTIVE` melakukan booking tidak di-reset ke `PENDING`.
- Verify ulang/OTP baru membatalkan token lama untuk `purpose` yang sama.
- Akun `SUSPENDED` tidak bisa login meski OTP benar.

---

## 5. Alur OTP (passwordless)

| Langkah | Aturan |
|---|---|
| Request | `POST /api/account/otp/request` dengan `{ email }` (zod). Selalu balas generik: *"Jika email terdaftar, kami kirim kode."* |
| Rate limit | 5 request / 15 menit per IP **dan** per email (Upstash, fallback in-memory) |
| Kode | 6 digit, CSPRNG (`randomInt(0, 1_000_000)`), disimpan sebagai HMAC-SHA256 dengan `CUSTOMER_SESSION_SECRET` + label `otp:` — bukan plaintext, tidak di-log |
| TTL | `CUSTOMER_OTP_TTL_MINUTES` (default 10) |
| Single-use | `consumedAt` di-set dalam transaksi; verifikasi kedua gagal |
| Prefetch | Verifikasi **hanya lewat POST**. Link email mengarah ke halaman dengan form, bukan endpoint yang mengkonsumsi token saat di-GET |
| Cross-device | Cookie session memakai `SameSite=Lax` |
| Percobaan salah | Naikkan `failedLoginCount`; kunci 15 menit setelah 5 kegagalan (exponential backoff) |

Email dikirim lewat helper Resend yang sudah ada (`src/lib/notifications.ts` pattern, tanpa dependency baru). Subject memakai brand email transactional `EMAIL_FROM`.

---

## 6. Session security (OWASP mapping)

| Kontrol | Implementasi |
|---|---|
| OWASP: ID ≥64 bit, CSPRNG | `randomBytes(32)` → 256 bit, base64url, opaque (tanpa email/PII) |
| OWASP: isi cookie bermakna | Cookie hanya `cs1.<sid>.<sig>`; `sid` acak, `sig` HMAC Web Crypto. Tidak ada JSON/email di cookie (berbeda dengan placeholder lama) |
| OWASP: HttpOnly/Secure/SameSite | `HttpOnly`, `Secure` di production, `SameSite=Lax`, `Path=/` |
| OWASP: `__Host-` prefix | Production HTTPS → `__Host-bw_customer`; lokal HTTP (`NODE_ENV !== 'production'`) → `bw_customer` |
| OWASP: regenerasi saat login | Session baru dibuat setelah verifikasi OTP; session lama tidak dipakai ulang |
| OWASP: revokasi server-side | `CustomerSession.revokedAt` di-set saat logout; hapus cookie saja tidak cukup |
| OWASP: expiry | Absolute 30 hari; `lastSeenAt` diperbarui; perpanjang otomatis hanya jika sisa <7 hari |
| OWASP: verifikasi Edge | `customerSession.ts` memakai Web Crypto (`crypto.subtle`), bisa dipakai middleware |
| OWASP: password storage | `scrypt$<N>$<r>$<p>$<salt>$<derived>` dengan N=2^17, r=8, p=1, `maxmem` eksplisit; hash lama 3-bagian masih diverifikasi (N=2^14) |

`CUSTOMER_SESSION_SECRET` **wajib berbeda** dari `ADMIN_SESSION_SECRET` dan `CUSTOMER_LINK_SECRET`. Jika tidak ada secret, semua verifikasi gagal (*fail-closed*).

---

## 7. API surface (Phase 1)

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/account/me` | GET | Session terverifikasi → `{ accountId, customerId, name, email, whatsapp, countryCode, joinedAt, status }` atau `401`. Dipakai `useCustomerSession()` |
| `/api/account/otp/request` | POST | Kirim OTP (atau balas generik jika email tidak ada) |
| `/api/account/signup` | POST | Daftar eksplisit: buat `Customer` + `CustomerAccount=PENDING`, lalu kirim OTP |
| `/api/account/otp/verify` | POST | Konsumsi OTP sekali pakai → ACTIVE + session cookie + (Phase 3) wishlist merge hook |
| `/api/account/profile` | PATCH | Edit nama/WhatsApp/country code (email read-only, butuh verifikasi) |
| `/api/account/wishlist` | GET / POST | Baca daftar DB / merge item localStorage (tenant-scoped) |
| `/api/account/wishlist/toggle` | POST | Tambah/hapus satu item untuk akun yang login |
| `/api/account/password` | POST / DELETE | Pasang/ubah/hapus password opsional (scrypt N=2^17), revoke sesi lain |
| `/api/account/password/login` | POST | Login opsional dengan password; error generik sama seperti OTP |
| `/api/account/logout` | POST | Revoke session di DB + hapus cookie |

Semua body/query divalidasi `zod`; error generik untuk menghindari enumerasi user.

---

## 8. Route matrix

| Route | Guest | Customer ACTIVE |
|---|---|---|
| `/profile` | Redirect `/login?next=/profile` | Dashboard akun (nama, email terverifikasi, WA, preferensi, tautan fitur, Keluar) |
| `/login` | Form **Masuk** (OTP) + **Daftar** (OTP aktivasi) | Bisa dibuka, tetapi tidak perlu; `?next=` dibatasi path lokal |
| `/wishlists` | `localStorage` | Guest localStorage di-merge ke `CustomerWishlist` saat login; toggle/remove tersimpan di DB |
| `/trips` | Magic link `cl1`/`bl1` (30 hari) | Tanpa token → semua booking `customerId` akun; token `cl1` segar diterbitkan untuk aksi trip; magic link guest tetap diterima |
| `/reviews/mine` | Redirect `/trips` | Review berdasarkan `customerId` |
| `/messages`, `/notifications` | AI chat boleh; notifikasi minta login | Inbox akun |
| `/checkout` | Guest + terms/waiver wajib | Pre-fill data, password tidak diwajibkan |
| `/admin/**` | Diblokir middleware | Diblokir (butuh `vb_admin_session`) |

---

## 9. Wishlist sync policy

1. Saat sesi customer terdeteksi, hook `useCustomerSession()` mengirim seluruh item `baliwild-wishlist` ke `POST /api/account/wishlist`.
2. Server memfilter `ventureId` yang valid untuk `tenantId` akun, lalu `createMany({ skipDuplicates: true })` ke `CustomerWishlist` dan mengembalikan daftar lengkap dari DB.
3. Client mengganti state lokal dengan daftar server **hanya setelah server mengonfirmasi**; item lokal tidak dihapus lebih awal. Jika gagal, localStorage tetap utuh dan di-retry saat login berikutnya.
4. Toggle/remove setelah login melalui `POST /api/account/wishlist/toggle`, sehingga DB menjadi source of truth; guest tetap memakai localStorage.

---

## 10. Co-existence magic link

`verifyCustomerLinkToken` (`cl1`) dan `verifyBookingViewToken` (`bl1`) tidak diubah. `/trips` menerima dua sumber: a. token URL (guest), b. session customer (DAL). Jika keduanya ada, **session yang menang** — token URL diabaikan dan token `cl1` baru diterbitkan untuk customer session agar tautan voucher/waiver/invoice tetap berfungsi. Guest tetap memakai magic link 30 hari.

---

## 11. Verification gates

Sebelum commit tiap task: `npm run lint`, `npm run typecheck`, `npm test`, `npm run audit:check`.  
Sebelum rilis: `npm run db:seed` pada DB kosong + `npm run smoke`.

---

## 12. Phase plan

| Phase | Isi | Status |
|---|---|---|
| 1 | Schema + secret + DAL + OTP endpoints + logout + `useCustomerSession` | **selesai** (`a53d040`) |
| 2 | `/profile` nyata, `/login` (OTP + daftar), edit profil, sign in/out di nav | **selesai** (`7227054`) |
| 3 | Wishlist sync + `/trips` session access | **selesai** (`6e8266e`) |
| 4 | Password opsional (scrypt, zero-dep), Next 15.5.27 + migrasi async API, runbook VPS | **selesai** (`1c617e0`); Argon2id/passkey & eksekusi VPS menyusul (butuh approval & kredensial) |
