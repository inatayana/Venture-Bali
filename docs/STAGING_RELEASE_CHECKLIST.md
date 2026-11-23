# BaliWild — Staging Release Checklist

> **Version:** 1.0.0 · **Last updated:** 2026-11-23
> **Purpose:** satu urutan kerja yang tidak boleh dilompati, dari `staging` sampai produksi.
> **Rule:** jika satu langkah gagal, **STOP** — perbaiki, ulangi langkah itu sampai hijau, baru lanjut.
> Jangan pernah merge ke `main` dengan langkah yang masih kosong.

---

## 0. Status integrasi (isi centangnya)

| ID | Langkah | Owner | Status |
|---|---|---|---|
| S1 | `staging` berisi UI redesign + T1–T5 + T6 pagination + T7 i18n | Agent | ✅ |
| S2 | Semua branch task di-push ke `origin` | Agent | ✅ |
| S3 | Gate lokal hijau: lint, typecheck, test (869), build | Agent | ✅ |
| S4 | Env preview production diisi owner | Owner | ☐ |
| S5 | DB preview ter-seed, smoke otomatis lulus | Owner + Agent | ☐ |
| S6 | QA manual 8 sektor lulus | Owner + Agent | ☐ |
| S7 | CI PR `staging → main` hijau (termasuk `audit:check`) | CI | ☐ |
| S8 | PR di-review, squash merge, deploy produksi | Owner | ☐ |
| S9 | Smoke produksi (`BASE_URL=https://baliwild.com`) lulus | Owner | ☐ |

---

## 1. Siapkan environment preview (Owner)

Isi di Vercel → Project → Preview environment variables:

| Var | Catatan |
|---|---|
| `NEXT_PUBLIC_GTM_ID` **atau** `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Pilih salah satu. Jangan dua-duanya (double page view). |
| `CRON_SECRET` | Dipakai `/api/cron/content` dan cron lain. |
| `CONTENT_DAILY_ARTICLE_LIMIT` | Mulai konservatif (mis. `5`), naikkan setelah kualitas artikel awal diverifikasi. |
| `DATABASE_URL`, `DIRECT_URL`, `ADMIN_SESSION_SECRET`, `MIDTRANS_*`, `GEMINI_API_KEY`, `RESEND_API_KEY` | Pastikan sama dengan konfigurasi staging yang sudah dipakai. |

**Done when:** preview deploy sukses, tidak ada environment variable yang kosong di halaman Vercel.

**Jika gagal:** jangan lanjut. Lengkapi env, redeploy, ulangi.

---

## 2. Pastikan database preview tidak kosong

```bash
DATABASE_URL=<preview-pooler> DIRECT_URL=<preview-direct> npm run db:seed
```

`npm run smoke` sengaja gagal jika katalog kosong / login mati.

**Done when:** seed selesai tanpa error; halaman `/` menampilkan produk nyata.

---

## 3. Smoke otomatis (Agent)

```bash
BASE_URL=https://<preview-url> npm run smoke
```

Yang dicek (8 rute): `/`, `/admin/login`, `/experiences`,
`/experiences?sort=price-asc`, `/experiences?page=2`, `/activities/atv`,
`/blog`, `/refund`.

**Done when:** `Smoke check PASSED (8/8)`.

**Jika gagal:** baca baris `✗`, perbaiki rute tersebut, ulangi dari langkah 2 jika itu masalah DB/seed.

---

## 4. QA manual per sektor (Agent + Owner)

Centang satu per satu. Jangan tanda tangan sektor sebelum itemnya benar-benar terlihat.

### 4.1 UI/UX
- [ ] Homepage desktop: header hide-on-scroll, hero CTA, curated rows.
- [ ] Homepage mobile: bottom nav, filter sheet, tidak ada horizontal overflow.
- [ ] PDP: galeri, sticky booking bar, variant compare (maks. 3 paket).
- [ ] Tema light/dark konsisten; tidak ada teks yang hilang kontrasnya.

### 4.2 SEO & Catalogue (kode baru T4 + T6)
- [ ] `/activities/atv` breadcrumb mengarah ke `/activities/atv` (bukan `/?category=`).
- [ ] `/experiences?sort=price-asc` harga benar-benar ascending lintas halaman.
- [ ] `/experiences?page=2` menampilkan produk berbeda dari `page=1`.
- [ ] Structured data `ItemList` punya `numberOfItems` > 0 dan URL produk kanonik.
- [ ] Sitemap `/sitemap.xml` termuat, `robots.txt` sesuai.

### 4.3 Growth & Analytics (T2)
- [ ] Di browser, consent banner muncul; sebelum "Accept" tidak ada request ke GTM/GA.
- [ ] Setelah "Accept", network tab menunjukkan script GTM/GA4 termuat.
- [ ] Event `view_item` / `page_view` masuk ke `dataLayer`.
- [ ] `/admin/growth` menampilkan angka dari DB (bukan nol palsu).

### 4.4 AI Agent & CS (T1 + T5)
- [ ] Web chat: tanya harga → jawaban dari tool, bukan hafalan model.
- [ ] Web chat: bilang "mau booking" → **tidak boleh** ada klaim booking dibuat / kode `PENDING`.
- [ ] Web chat: tanya konfirmasi → agent bilang konfirmasi dikirim otomatis setelah bayar, bukan "sudah dikirim".
- [ ] `/admin/seo` → audit SEO menampilkan `score`, `checkedItems`, dan saran nyata; **bukan** sukses palsu.

### 4.5 Checkout & Payment (money path)
- [ ] PDP → pilih paket → checkout Midtrans **sandbox** → bayar → webhook settlement.
- [ ] Voucher QR terbit dan bisa diverifikasi.
- [ ] Cancel/reschedule ≥24 jam muncul dengan kalkulasi refund 80% (bukan 70%).

### 4.6 Admin & Ops
- [ ] Login admin berhasil; sidebar "Growth" muncul.
- [ ] `/admin/bookings`, `/admin/operations`, `/admin/reviews` tidak error.
- [ ] Driver assignment + check-in masih berfungsi.

### 4.7 Content Engine (T3)
- [ ] `GET /api/cron/content` dengan header `Authorization: Bearer <CRON_SECRET>` → 200.
- [ ] Respons berisi `planned`, `due`, `attempted`, `quotaExceeded`.
- [ ] Artikel bertambah maks. `CONTENT_DAILY_ARTICLE_LIMIT` per hari.
- [ ] Saat Gemini kuota habis, artikel tetap bertambah dari fallback katalog (tidak error).

### 4.8 Legal & Trust
- [ ] `/terms`, `/privacy`, `/refund` terjangkau dan tidak menampilkan "Free Cancellation" sebagai klaim.
- [ ] Tidak ada nama vendor/partner yang terekspos di halaman publik.

**Done when:** semua 8 sektor dicentang.
**Jika gagal:** catat sektor + langkah reproduksi, perbaiki di branch task terkait, push, fast-forward `staging`, ulangi langkah 3–4.

---

## 5. PR & CI

```text
https://github.com/inatayana/Venture-Bali/pull/new/staging   (base: main)
```

- [ ] PR dibuka, judul: `release/v1.1.0 — staging integration`.
- [ ] CI hijau: lint → typecheck → test → **audit:check** → build.
- [ ] Reviewer menyetujui (min. 1 approval).
- [ ] **Squash merge** ke `main`.

**Jika `audit:check` merah:** jangan merge. Ini gate keamanan; perbaiki dependency/baseline sesuai `SECURITY_PROTOCOL.md`.

---

## 6. Produksi & post-deploy

```bash
BASE_URL=https://baliwild.com npm run smoke
```

- [ ] Smoke produksi 8/8 lulus.
- [ ] Cek manual satu transaksi sandbox di produksi (atau verifikasi webhook terakhir).
- [ ] Cek GA4 realtime menerima event setelah consent.
- [ ] Verifikasi cron produksi jalan sesuai `vercel.json` (05:00 UTC untuk konten).
- [ ] Tag rilis `v1.1.0` dibuat.

---

## 7. Aturan lanjutan setelah rilis

1. **Satu task = satu branch = satu commit.** Jangan campur perubahan.
2. Gate wajib sebelum commit: `npm run lint && npm run typecheck && npm test`.
3. Push segera ke `origin` (backup policy).
4. Backlog berikutnya, **dikerjakan setelah rilis ini hijau**:
   - Media asli menggantikan placeholder SVG (pipeline `sharp` sudah ada).
   - Upgrade Next 15/16 + Prisma 6/7 + hapus exception `audit-baseline.json`.
   - Google Indexing API sungguhan dengan service account.
   - E2E money-path dan load test webhook.
5. Setiap selesai satu item backlog, tambahkan baris di tabel status §0 dan ulangi langkah 3–5.

> **Prinsip:** tidak ada "hampir selesai". Suatu langkah selesai hanya jika buktinya
> (output smoke / screenshot QA / log CI) ada dan bisa ditunjukkan.
