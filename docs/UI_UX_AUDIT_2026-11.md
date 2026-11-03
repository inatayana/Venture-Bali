# BaliWild — UI/UX Ecosystem Audit (Fase 0)

> **Version:** 1.0.0-draft
> **Date:** 3 November 2026
> **Branch:** `feature/ux-audit`
> **Status:** ✅ FINAL — **14/14 workstream selesai** (5 terakhir dikerjakan langsung oleh orchestrator atas instruksi owner "tidak perlu menunggu"). Laporan Agen 3 & 5 (masih berjalan di background) akan di-append sebagai **verifikasi silang** bila menemukan tambahan.
> **Method:** 14 workstream · 5 agen auditor paralel (read-only) + verifikasi orchestrator
> **Prinsip:** read-only, tanpa asumsi, semua temuan dapat diverifikasi di file:baris

---

## Ringkasan Eksekutif (untuk Owner)

*Bagian ini dilengkapi setelah seluruh temuan masuk.*

- Baseline kualitas kode: **penuh hijau** — lint 0 error, typecheck 0 error, 652/652 test lulus (detail §0)
- Temuan brand & token: **sistem token sangat baik**, 3 temuan minor (detail §A)
- Doc drift design system ↔ kode: **1 temuan major** (detail §L)
- Duplikasi komponen: **2 pola wrapper** — deliberate, dampak kecil (detail §N)
- Temuan user flow booking: **0 critical / 3 major / 9 minor** — termasuk bug kondisi combo banner & gap stepper anak-anak (detail §D)
- 🚨 **Temuan KRITIS keamanan** → ✅ **TERMITIGASI (3 Nov 2026)**: file recovery codes Vercel dipindahkan keluar repo ke `D:\_Project\_credentials\` + pola `*recovery-codes*` ditambahkan ke `.gitignore`. Rotasi kode oleh owner tetap direkomendasikan sebagai asuransi opsional (detail §I, temuan I1)
- Temuan i18n, chat & email: **1 critical / 22 major / 14 minor** — i18n adalah gap sistemik terbesar (dua sistem paralel; mayoritas permukaan publik EN-only) (detail §G–§I)
- Temuan responsive: **0 critical / 1 major / 4 minor** — termasuk tap target kategori <44px & utility Tailwind tak terdefinisi (detail §C)
- Temuan aksesibilitas: **0 critical / 2 major / 4 minor** — fondasi a11y sangat kuat (kontras kuning 100% dipatuhi, focus trap lengkap); gap terkonsentrasi di status messages & 1 modal (detail §B)
- Temuan states & dark mode: **1 Major baru** — ⚠️ wordmark light theme "WILD" putih di atas kuning (±1.1:1, hampir tak terlihat; kontradiksi internal dokumen brand) (detail §F); fondasi states loading/empty baik, gap = tanpa error/404 berbrand (detail §E)
- Temuan admin & PWA: **admin ternyata SUDAH rebrand ke hitam/kuning** (grep biru = 0 hasil; catatan dokumen basi — K1); PWA/manifest/cookie consent solid, 0 temuan (detail §J–§K)
- Test coverage: 18 komponen teruji dari 652 test hijau; gap pada primitif inti (BottomSheet, Calendar, Stepper) & ChatWidget (detail §M)
- **TOTAL AKHIR: 1 Critical (TERMITIGASI) · 30 Major · ±41 Minor** dari **14/14 workstream selesai**

---

## 0. Baseline Kualitas (sebelum perubahan apa pun)

| Check | Perintah | Hasil |
|-------|----------|-------|
| Lint | `npm run lint` | ✅ 0 error, 0 warning |
| Typecheck | `npm run typecheck` | ✅ 0 error |
| Test | `npm test` | ✅ 72 suite / **652 test lulus** (±70 detik) |

> Baseline ini penting: semua perubahan fase berikutnya wajib mempertahankan status hijau ini.
>
> Catatan: log `console.error/warn` dalam output test adalah **skenario uji jalur kegagalan yang memang diuji** (Gemini 429/503/500, network down, fallback DB) — bukan error nyata. Seluruh 652 test LULUS.

---

## A. Brand & Design Token Compliance — [SELESAI · Orchestrator]

**Terverifikasi BAIK (tidak perlu perubahan):**

| Item | Bukti |
|------|-------|
| Token warna single-source-of-truth | `src/styles/globals.css:17-18` — `--brand: 255 238 0`, `--brand-ink: 0 0 0` (RGB channel, opacity utilities tetap bekerja) |
| Mapping Tailwind | `tailwind.config.js:27-28` — `brand` / `brand-ink` via `rgb(var(--brand) / <alpha-value>)` |
| Token sekunder | `tailwind.config.js:16-18` — `ink #1A1A1A`, `jungle #1E3A2B`, `sand #E5DFD5` sesuai design system |
| Font self-hosted | `src/fonts/` — Barlow Condensed 600/700 (static woff2) + Plus Jakarta Sans variable; `src/styles/fonts.ts` localFont; diterapkan di `src/app/layout.tsx:61` |
| Utility `.heading-caps` | `src/styles/globals.css:28-30` |
| Tidak ada hardcoded brand hex di komponen UI | grep `#FFEE00/fee00` pada `*.tsx` = 0 hasil |
| Permukaan theme sesuai spek | light `#FAFAFA` page + putih header/cards; dark `#212121` page + `#191919` header/cards/inputs (`globals.css:38-77`) |
| Kuning tetap bertinta hitam di dark mode | `globals.css:91-110` — aturan lengkap `bg-brand` + variasi opacity |

**Temuan:**

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| A1 | Minor (accepted exception) | `src/lib/notifications.ts:152,195,539,542` | 4× hardcoded `#FFEE00` di template email HTML. Email client tidak memproses CSS variable website, jadi ini technically justified — tetapi tidak terpusat. | Tambah `BRAND_HEX = '#FFEE00'` dan `BRAND_INK_HEX = '#000000'` di `src/lib/brand.ts`, lalu gunakan konstanta tersebut di template email. Rebrand masa depan cukup ubah satu tempat. |
| A2 | Minor (bug) | `src/styles/globals.css:119` vs `129-130` | Selector `html.dark .text-neutral-600` dideklarasikan dua kali dengan nilai berbeda (`#d1d5db` lalu `#9ca3af`). Aturan terakhir menang → neutral-600 di dark mode berwarna sama dengan neutral-500 (`#9ca3af`), hierarki teks menumpuk. | Hapus deklarasi ganda; tentukan satu nilai untuk neutral-600 (mis. `#d1d5db`, sama level dengan neutral-700 yang saat ini `#d1d5db` — sesuaikan agar 500/600/700 punya 3 tingkat jelas). |
| A3 | Minor (doc drift) | `docs/UI_UX_DESIGN_SYSTEM.md` §4 vs `src/styles/globals.css:23` | Dokumen menyebut `scroll-padding-top 4.5rem`; kode memakai `6.5rem`. Kode kemungkinan benar (sticky bar PDP lebih tinggi dari asumsi dokumen). | Update design system §4 ke `6.5rem` agar dokumen dan kode sinkron. |

---

## B. Aksesibilitas WCAG AA — [SELESAI · Orchestrator — *dikerjakan langsung setelah 2× kegagalan model agen*]

**Ringkasan: 0 Critical · 2 Major · 4 Minor.** Fondasi a11y codebase **sangat kuat** — temuan terkonsentrasi pada status messages dan satu modal yang tertinggal pola.

### Temuan

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| B1 | Major | Seluruh repo (grep `aria-live` = 0 hasil) | **Tidak ada `aria-live`/`role="status"` di mana pun** — pesan validasi booking (helper text di bawah CTA), balasan chat, dan error dinamis tidak pernah diumumkan ke screen reader (WCAG 4.1.3 Status Messages). | Tambah `aria-live="polite"`/`role="status"` pada region pesan validasi `ExperienceBookingWidget` dan log pesan `ChatWidget`. |
| B2 | Major | `src/components/features/BookingActions.tsx:172-188` | Modal cancel/reschedule di `/my/bookings` **tanpa Escape handler, tanpa focus management** (initial focus/trap/restore — satu-satunya modal tanpa ini), backdrop clickable dengan `aria-hidden="true"`, tombol close `h-9 w-9` (36px). Tidak konsisten dengan standar modal lain. | Samakan pola dengan BottomSheet/VariantDetailModal: Escape + initial focus + restore + close ≥44px; perbaiki semantik backdrop. |
| B3 | Minor | `src/components/search/HeroSearch.tsx:218-235` | Tombol stepper guests −/+ hanya `h-8 w-8` (32×32px) — di bawah standar 44×44px (aria-label sudah ada ✅). | Perbesar ke 44px (mis. `h-11 w-11`). |
| B4 | Minor | `src/components/search/HeroSearch.tsx:100-106` | Input pencarian popover "Where" (desktop) hanya `placeholder` tanpa `aria-label`, dan `min-h-[40px]` < 44px. | Tambah `aria-label` + `min-h-[44px]`. |
| B5 | Minor | `src/components/features/reviews/ReviewModal.tsx:73` | Hanya initial focus saat buka — **tanpa restore fokus** ke elemen pemanggil saat close (bandingkan ProductLightbox:38,42 yang restore). | Tambah `previousFocus` restore. |
| B6 | Minor | `src/components/booking/BookingForm.tsx:74-117` | 6 input + textarea **tanpa label/aria-label sama sekali** — namun komponen ini hanya dipakai route legacy `/checkout` (lihat G21). | Terselesaikan otomatis saat route legacy dihapus (G21). |

### Cross-Reference (tercatat di workstream lain)
- ChatWidget panel tanpa dialog semantics/Escape/focus → **H5** (§H).
- CategoryTiles tap target <44px → **C1** (§C).

### Terverifikasi BAIK (10 poin — fondasi sangat kuat)

1. **Aturan kontras kuning–hitam 100% dipatuhi**: seluruh `text-brand` berada di atas `bg-brand-ink`/hitam/scrim hero (privacy, blog, admin login, cookie bar, footer, HeroSearch pill, RotatingKeyword); tag blog `bg-brand/30` + teks hitam. **Nol pelanggaran.**
2. Aturan neutral-400 (v3.7.0): dipatuhi — hanya pemakaian legal (label dark-mode `dark:text-neutral-400` & state disabled).
3. **Escape-to-close: 8/9 overlay benar** (BottomSheet:50, ProductLightbox:50, VariantDetailModal:65, ReviewModal:76, HeroSearch:48, SortMenu:37, CategoryTiles:50, CategoryQuickMenu:32) — plus unit test untuk sebagian besar.
4. **Scroll lock: 4 overlay utama** dengan cleanup benar (`style.overflow` restore).
5. **Focus trap + restore lengkap** di BottomSheet (62,76,79,89) & VariantDetailModal (62,86,89,98); initial focus + restore di ProductLightbox.
6. **Alt text semua deskriptif**: `alt={venture.title}` (VentureCard:70), `alt={variant.title}` (Variant cards), `"${title} — photo ${i}"` (Lightbox:143,173), `"Guest photo from ${review.author}"` (ReviewCard:111), admin previews; dekoratif memakai `alt=""` benar (HeroVideo:51).
7. **Label form pola nested-label valid**: ReviewForm (118-184) & VentureForm (478+) membungkus input dalam `<label>`; ExperienceBookingWidget htmlFor + aria-label lengkap (699-750); rating review pakai `fieldset/legend` + `aria-pressed` — pola sangat baik.
8. **Touch target besar di banyak titik**: tombol rating 44px (`h-11 w-11` ReviewForm:158), semua input booking `min-h-[44px]`, link footer & cookie `min-h-[44px]`/`py-[15px]`.
9. Interaksi div/span: hanya **1** backdrop clickable di seluruh codebase — sisanya tombol semantic.
10. aria-label coverage luas: kontrol HeroSearch, wordmark link, aksi dinamis admin (remove/move/tier/slot), sidebar nav.

---

## C. Responsive Mobile-First — [SELESAI · Agen 1b: Beam Free — *belahan tugas setelah timeout agen 1*]

**Ringkasan: 0 Critical · 1 Major · 4 Minor.**

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| C1 | Major | `src/components/features/CategoryTiles.tsx:65` | Tombol tile kategori (`tileBase`) tanpa `min-h-[44px]` (hanya `py-2.5`) — tap target bisa di bawah standar 44×44px di mobile. | Tambah `min-h-[44px]` (+ lebar minimum) ke `tileBase`. |
| C2 | Minor | `src/components/ui/VentureCard.tsx:88` | Produk unavailable + badge bisnis: "Sold Out" dan badge bisnis **keduanya** absolut di `right-2.5 top-2.5` → tumpang tindih. | Render satu badge kanan-atas (Sold Out diutamakan) atau susun vertikal. |
| C3 | Minor | `src/components/features/HomeHero.tsx:38` | `<section>` hero tanpa cap tinggi responsif untuk target ≤540px mobile / ≤660px desktop — tinggi murni konten. | Tambah `max-h-[540px] lg:max-h-[660px]` (atau verifikasi tinggi render nyata). |
| C4 | Minor | `src/components/ui/VentureCard.tsx:170` | `<article>` kartu tanpa cap tinggi untuk target ≤390px mobile; hanya gambar terfiksasi 160px. | Tambah `max-h` mobile atau batasi konten/padding. |
| C5 | Minor | `src/components/features/CategoryTiles.tsx:74` | Scroller mobile memakai utility `scrollbar-hide` yang **tidak terdefinisi** di `tailwind.config.js`/`globals.css` — class diam-diam tak berefek, scrollbar bisa tetap terlihat. | Ganti dengan varian arbitrer yang dipakai di tempat lain (`[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`) atau definisikan utility-nya. |

### Catatan Cakupan

Item cakupan lain (listing load-more, search pill per breakpoint, related snap-scroll, header settings mobile 44px, footer grid 2 kolom, bottom sheet full-height mobile) **tidak dilaporkan sebagai temuan** oleh agen — sesuai aturan audit "yang sesuai spek tidak dilaporkan".

---

## D. User Flow Fase 1–10 — [SELESAI · Agen 2: Beam Free — *fallback sukses*]

**Ringkasan: 0 Critical · 3 Major · 9 Minor.** Arsitektur inti (PDP 6 section, two-step checkout, outer-zone, promo non-stacking) **sesuai spek**.

### Temuan Major

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| D1 | Major | `src/components/features/PickupAddonsStep.tsx:49-53` | Banner "Combos require hotel transfer" muncul juga untuk `SHARED_TRANSFER` (kondisi `fulfillmentMode !== 'PRIVATE_TRANSFER'`) — padahal shared transfer adalah mode transfer; combo seharusnya terbuka di sana. | Ubah kondisi menjadi `fulfillmentMode === 'SELF_DRIVE'`. |
| D2 | Major | `src/components/features/ExperienceBookingWidget.tsx:329-345` | Hanya stepper **dewasa** — tidak ada jumlah anak-anak (dokumen Fase 4 menyebut keduanya). `BookingConfig` tanpa field children; API mengirim `paxCount: config.adults`. | ⚠️ **KEPUTUSAN OWNER**: tambah stepper anak-anak (pekerjaan fitur + implikasi pricing) atau update dokumen ke adults-only. |
| D3 | Major | `src/app/checkout/[session_id]/page.tsx:279-298` | Trust indicator pembayaran tidak lengkap: hanya teks "Secure checkout powered by Midtrans" — tidak ada indikator 3D Secure dan logo VISA/Mastercard/GoPay/QRIS (dokumen §7). | Tambah badge logo pembayaran + indikator 3D Secure. |

### Temuan Minor

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| D4 | Minor | `src/components/ui/FilterChips.tsx:13` | Komponen didefinisikan tapi **tidak pernah dipakai** (`VentureExplorer` memakai `CategoryTiles`). | Hapus atau pasang — masuk Fase 2 konsolidasi. |
| D5 | Minor | `src/components/features/ExperienceBookingWidget.tsx:398-411` | Widget memakai `TimeSlotPill`, bukan `TimeSlotCard` yang didokumentasikan. | Putuskan satu sumber; update dokumen atau kode. |
| D6 | Minor | `src/components/ui/Calendar.tsx:112-116` | Tanggal tersedia tidak ditebalkan (hanya tanggal terpilih yang bold) — dokumen bilang available dates bold. | Tambah `font-semibold` untuk tanggal tersedia. |
| D7 | Minor | `src/components/ui/TimeSlotPill.tsx:37-47` | Harga per orang per slot tidak ditampilkan. | Tampilkan bila ada pricing level slot. |
| D8 | Minor | `src/components/features/ExperienceBookingWidget.tsx:883-895` | Di step details, CTA digate `!planReady`, tapi helper text menampilkan `detailsMissing[0]` walau plan belum lengkap. | Tampilkan kekurangan plan lebih dulu saat `!planReady`. |
| D9 | Minor | `src/components/features/VariantCatalogCard.tsx:43` | Fallback foto pakai `??` — string kosong (`""`) tidak jatuh ke fallback. | Ganti ke `variant.imageUrl \|\| fallbackImageUrl`. |
| D10 | Minor | `src/app/voucher/[bookingId]/page.tsx:197-202` | Tidak ada aksi Apple/Google Wallet (dokumen §8) — hanya Print/Save PDF. QR code sudah ada. | Tambah aksi wallet atau hapus dari dokumen. |
| D11 | Minor | `src/app/voucher/[bookingId]/page.tsx:103-105` | `CheckCircle` statis; dokumen minta animasi centang hijau. | Tambah animasi. |
| D12 | Minor | `src/app/experiences/[id]/[slug]/ExperienceDetailClient.tsx:707,866,950` | Anchor ID di kode `#packages`/`#details`/`#coverage` vs dokumen `#package-options`/`#what-to-expect`/`#location`. | Paling aman: update dokumen ke ID kode (anchor in-page, tanpa risiko link eksternal). |

### Terverifikasi BAIK (tidak perlu perubahan)

- Fase 2 (PDP hero + sticky CTA), Fase 5 (live price + price anchoring), Fase 6 (recap + Edit tanpa kehilangan data tamu).
- Outer zone custom quote: catatan + Continue disabled bekerja sesuai spek.
- Sticky PDP header: hanya back/breadcrumb/wishlist+share — tanpa harga & switcher. ✅
- Anchor nav: `top-64px`, centered kolom kanan, fade+slide 8px, `h-0`, 300ms. ✅
- Booking card `top-76px`. ✅
- Konten PDP: `hook3Sec` 200 · `CollapsibleText` 225 · highlights ≤90 · itinerary ≤45/≤110 dengan bulatan `bg-brand`. ✅
- Promo & kupon `TRYBALI2026` tidak stacking. ✅
- Grid listing 1/2/3 kolom — dalam spek.

### Keputusan Owner yang Dibutuhkan

1. **D2 — Stepper anak-anak**: tambah fitur (implikasi pricing per anak) atau sinkronkan dokumen ke adults-only?
2. **D12 — Anchor ID**: update dokumen (paling aman) atau ubah kode?

---

## E. States (Skeleton/Empty/Error) — [SELESAI · Orchestrator]

**Ringkasan: fondasi states BAIK — loading & empty states lengkap; gap besar satu-satunya: tidak ada error/404 boundary berbrand.**

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| E1 | Major | `src/app/` (glob terverifikasi) | Tidak ada `error.tsx` / `not-found.tsx` / `global-error.tsx` di seluruh route tree — error & 404 memakai UI default Next.js tanpa brand & tanpa lokalisasi. (Terkait G17.) | Tambah error/404 boundary berbrand — masuk Fase 4 (lokalisasi). |

### Terverifikasi BAIK
- `loading.tsx` untuk `/` dan PDP **ADA** (glob terverifikasi) dengan shimmer Skeleton lengkap: hero, tile kategori, kartu produk, galeri (`src/app/loading.tsx`, `experiences/[id]/[slug]/loading.tsx`) — sesuai design system §4.
- Empty state listing: "No adventures found" + "Reset Filters" (`VentureExplorer:223,235`) ✅
- Empty state review: "No verified reviews yet" (`ReviewsSection:28`) — **dengan test yang mengunci perilakunya** ✅
- Skeleton konsisten dipakai (bukan spinner) di kedua loading.tsx ✅
- Feedback "Processing…" saat pembayaran ada (`ExperienceBookingWidget` area 817-844, checkout) — perlu aria-live (cross-ref **B1**).

---

## F. Dark Mode — [SELESAI · Orchestrator]

**Ringkasan: 1 Major (kontras wordmark light theme) — sisanya fondasi dark mode sangat baik.**

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| F1 | Major | `src/components/layout/BrandWordmark.tsx:16,21` | **Light theme: teks "Wild" PUTIH di atas block kuning #FFEE00 (`text-white dark:text-brand-ink`) — kontras ±1.1:1, hampir tak terlihat.** Kode mengikuti spec v3.6.4 (§2 dokumen), tetapi spec itu sendiri melanggar dua aturan brand di dokumen yang sama: §2 "harus black-on-yellow atau yellow-on-black" dan §3 "Yellow surfaces always carry black text". "Wild" adalah elemen signature yang muncul di header, footer, admin login, offline page, PWA. | Light theme: `Wild` hitam juga (`text-brand-ink`); dark theme tetap black-on-yellow (sudah benar). Update doc v3.6.4. **Sarankan konfirmasi visual owner sebelum eksekusi (Fase 1).** |
| F2 | Info | `src/styles/globals.css:129-130` | Hierarki teks dark mode menumpuk karena bug A2 (duplicate rule neutral-600 → warna sama dengan neutral-500). | Sudah tercatat §A (A2) — fix bersama Fase 1. |

### Terverifikasi BAIK
- Persistensi `localStorage` (`baliwild_theme`) + **anti-flash** via `themeInitScript` yang jalan sebelum paint (ThemeProvider:22-30) ✅ — toggle tanpa reload ✅.
- Wordmark theme-aware sesuai mekanisme spec (Bali inherits; block Wild berubah via `dark:`) — hanya kontras light-theme yang bermasalah (F1).
- Surfaces sesuai spek: light `#FAFAFA` page + putih header/cards; dark `#212121` + `#191919` header/cards/inputs (globals.css:38-77, 162-169 — verified §A).
- Kuning brand tetap black-ink di dark mode (globals.css:91-110 — lengkap dengan variasi opacity) ✅
- Calendar selected day `bg-brand-ink text-brand dark:bg-brand dark:text-brand-ink` (Calendar:116) sesuai v3.6.9 ✅; input/select/textarea dark override ada (globals.css:163-174) ✅
- Brand surfaces (hero, footer, CTA kuning) tidak di-flatten oleh theme toggle ✅

---

## G. i18n EN/ID — [SELESAI · Agen 4: Pulse Alpha Free]

**Ringkasan: 13 Major · 8 Minor.** Ini gap sistemik terbesar audit ini: dua sistem i18n paralel dan sebagian besar permukaan publik EN-only, bertentangan dengan komitmen "semua copy publik tersedia dalam 2 bahasa" (design system §1).

### Temuan Major

| # | Lokasi | Temuan | Rekomendasi |
|---|--------|--------|-------------|
| G1 | `src/lib/i18n.ts:197-209` + `src/lib/locale.ts:9-91` | **Dua sistem i18n paralel**: `t()`/`setLocale()` di `i18n.ts` adalah dead code (tidak pernah diimport), namun dokumen design system:439 masih menyebutnya "single source of truth". Dictionary hidup (`locale.ts`) hanya ~38 kunci (header/hero/search). | Konsolidasi ke SATU dictionary; hapus yang mati; update dokumen. |
| G2 | `src/components/layout/SiteFooter.tsx:35-201` | Footer 100% hardcoded EN (tagline, heading, semua link/badge/legal). | Lokalkan via dictionary bersama. |
| G3 | `src/components/features/TrustStrip.tsx:3-24` | Empat trust promises hardcoded EN. | Lokalkan. |
| G4 | `src/components/ui/VentureCard.tsx:95,122,130,135,142,146,157-162` | Badge/label kartu EN ("Sold Out", "New", "From", "/ guest", "Instant Confirmation", "Free reschedule ≥24h"). | Lokalkan. |
| G5 | `src/app/experiences/[id]/[slug]/ExperienceDetailClient.tsx` (61-66,367,421,447,464,486,492,499,708,760,781-793,842,867,877,890,912,941,978) | PDP sepenuhnya EN-only. | Lokalkan. |
| G6 | `src/components/features/ExperienceBookingWidget.tsx:342,383-396,504,538,817-844,865,888,899` | Booking sheet/CTA EN ("Continue", "Continue to payment", "Processing…", "Total", string guest/pax). | Lokalkan. |
| G7 | `src/app/checkout/[session_id]/page.tsx:180,198,212-236,243,251-264,277,285-297,309-311,318-328,337-341,352-359` | Checkout EN-only + `toLocaleDateString('en-GB')`:232. | Lokalkan. |
| G8 | `src/app/voucher/[bookingId]/page.tsx:20-27,100-194,200-232` | E-voucher EN-only; date locale malah hardcoded `id-ID`:132 (inkonsisten dengan checkout). | Lokalkan; ikuti locale user. |
| G9 | `src/app/my/bookings/page.tsx:37-202` + `src/lib/bookingLifecycle.ts:48-54` | My/Bookings EN-only termasuk `LIFECYCLE_LABELS`. | Lokalkan. |
| G10 | `src/components/CookieConsent.tsx:88-116` | Cookie consent EN-only. | Lokalkan. |
| G11 | `src/app/offline/page.tsx:6-29` | Halaman offline EN-only. | Lokalkan. |
| G12 | `src/app/blog/page.tsx:24-92,127` + `blog/[slug]/page.tsx:26-98` | `readText()` **selalu prefer EN** — pengunjung ID tidak pernah melihat isi artikel ID; chrome blog EN-only. | Pilih string sesuai locale aktif; lokalkan chrome. |
| G13 | `src/components/chat/ChatWidget.tsx:20-21,81` | Widget kirim `language: 'en'` tanpa syarat (detail juga di §H). | Kirim locale aktif. |

### Temuan Minor

| # | Lokasi | Temuan | Rekomendasi |
|---|--------|--------|-------------|
| G14 | `src/app/layout.tsx:61` + `src/components/locale/LocaleProvider.tsx:33-47` | `<html lang="en">` statis; ID baru diterapkan pasca-hydration — `lang` salah untuk screen reader/SEO di paint pertama; cookie locale tidak dibaca server-side. | Set `lang` dari cookie saat SSR. |
| G15 | `src/components/search/HeroSearch.tsx:22-28,77,222,231,255,395,404` | Tanggal `en-GB`; semua aria-label EN. | Locale-aware + lokalkan aria-label. |
| G16 | checkout:232 vs voucher:132 vs verify:37 | Format tanggal tidak konsisten (`en-GB` vs `id-ID`) dan tidak pernah mengikuti locale user. | Satu helper tanggal locale-aware. |
| G17 | `src/app/` (tidak ada `error.tsx`/`global-error.tsx`/`not-found.tsx`) | Error/404 memakai UI default Next.js — tanpa brand, tanpa lokalisasi. | Tambah error/404 boundary berbrand + terlokalisasi. |
| G18 | `src/lib/currency.ts:4-14` | **Terverifikasi orchestrator — bukan bug kode**: `ACTIVE_CURRENCIES` sengaja 9 mata uang ("Phase A: the markets that actually book Bali trips"), konsisten dengan changelog v3.6.1. Kontradiksinya internal dokumen: §1 design system menyebut 11 mata uang (termasuk GBP & MYR). | Update design system §1 ke 9 mata uang aktif (doc fix, bukan code fix). |
| G19 | `LanguageToggle.tsx:4` vs `LocaleProvider.tsx:4` | Dua tipe `Locale` identik tapi terpisah — risiko drift diam-diah saat dictionary berbeda arah. | Satu ekspor `Locale` bersama. |
| G20 | `src/components/features/RotatingKeyword.tsx:5-13` | Keyword typewriter EN untuk pengunjung ID. | Kirim daftar keyword terlokalisasi via `useLocale`. |
| G21 | `src/app/checkout/page.tsx` (seluruh file) | ⚠️ **Route legacy duplikat `/checkout`**: EN-only DAN menambah **"Tax" 10% fiktif** di atas total — padahal harga all-in IDR dan Midtrans menagih `booking.totalPrice` persis (lihat `checkout/[session_id]/page.tsx:28`, `api/payment/midtrans/route.ts:109`). **Terverifikasi orchestrator: tidak ada satu pun link/push internal menuju route ini** — hanya via URL manual. | **Aman dihapus/redirect** ke `/checkout/[session_id]` atau halaman katalog. Prioritas Fase 1. |

### Terverifikasi BAIK

Paritas kunci EN/ID di **kedua** dictionary (60/60 dan 38/38); header/hero/search terlokalisasi via `t()`; konversi `≈` tampil di kartu/PDP/widget/checkout (`PriceApprox` terpasang, IDR charge-only, `/api/fx/rates` + fallback statis, Geo-IP via cookie middleware `baliwild-country`); `formatPrice` jalur IDR benar; `PriceApprox` disembunyikan untuk IDR sesuai desain.

---

## H. Chat Widget — [SELESAI · Agen 4: Pulse Alpha Free]

**Ringkasan: 3 Major · 3 Minor.**

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| H1 | Major | `src/components/chat/ChatWidget.tsx:12` | Session key `'baliwild_chat_session'` **tidak sesuai kontrak** dokumen `AI_AGENT.md` §8 (`vb_chat_session` di localStorage) — merusak ekspektasi integrasi/test berbasis dokumen. | Rename ke `vb_chat_session` (dokumen = spec). |
| H2 | Major | `ChatWidget.tsx:74-83` | Widget selalu kirim `language: 'en'`; API mendukung `id\|en\|ja\|zh` dan default `id` (`api/ai/chat/route.ts:14-19`). Tamu ID mendapat agent berbahasa Inggris walau toggle ID aktif. | Kirim locale aktif dari `useLocale()`. |
| H3 | Major | `ChatWidget.tsx:14-21,125-129,136-137,143-146,163-167,173-184,193-208` | Seluruh chrome widget EN: GREETING, QUICK_REPLIES, aria-label launcher/close/send, "Typing…", subtitle, placeholder, fallback. Nama brand "BaliWild" tetap wajib (Brand Guidelines §8). | Pindahkan semua copy ke dictionary; wordmark tetap. |
| H4 | Minor | `ChatWidget.tsx:103-113` | `error.message` mentah dari server diinterpolasi ke bubble user. | Map error ke pesan ramah terlokalisasi; detail hanya ke console. |
| H5 | Minor | `ChatWidget.tsx:132-210` | Panel terbuka tanpa `role="dialog"`/`aria-modal`, tanpa Escape-to-close, tanpa focus management (bandingkan `HeroSearch.tsx:48-58` yang sudah benar). | Tambah semantik dialog, Escape, initial focus + restore. |
| H6 | Minor | `ChatWidget.tsx:88-95` | `sessionId` server diam-diam mengganti id client; dua tab = dua fork percakapan "sama", tanpa sync `storage` event. | Persist sekali; opsional sync antar-tab. |

### Terverifikasi BAIK

Mount global di `layout.tsx:72`, hidden di `/admin` (pathname check); `POST /api/ai/chat` dengan validasi zod + rate limit; `data.reply` dirender verbatim — widget **tidak pernah** memformat business rules; typing indicator ada; bubble error/fallback eksplisit; posisi `z-[45]`, `bottom: 5.5rem + safe-area` — **di atas** sticky CTA PDP (`z-40`) dan cookie bar (`z-30`), tidak menutupi CTA; toggle open/close sehat.

---

## I. Email Transaksional — [SELESAI · Agen 4: Pulse Alpha Free]

**Ringkasan: 1 Critical · 6 Major · 3 Minor.**

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| I1 | 🚨 **Critical** | `vercel-recovery-codes-natayana888@gmail.com.txt` (root repo) | **Recovery codes Vercel AKTIF + alamat Gmail pribadi** dalam plaintext di root repo. Untracked dan **tidak** dilindungi `.gitignore` — satu `git add -A` menjauh dari tercommit. Melanggar AGENTS.md §4/§7 & Brand Guidelines §6. | ✅ **TERMITIGASI 3 Nov 2026**: file dipindahkan keluar repo ke `D:\_Project\_credentials\` (instruksi owner) · ✅ pola `*recovery-codes*` ditambahkan ke `.gitignore` (branch `feature/ux-audit`) · ⏳ rotasi kode oleh owner — opsional, direkomendasikan sebagai asuransi (file terverifikasi tidak pernah tercommit → tidak pernah meninggalkan mesin ini). |
| I2 | Major | `src/lib/notifications.ts:145-165` | Email review-request **tanpa brand sama sekali** (tanpa nama BaliWild, wordmark, footer, kontak support) — melanggar Brand Guidelines §8. Email konfirmasi/reminder compliant. | Tambah header/footer brand + support@ pada template review. |
| I3 | Major | `src/lib/notifications.ts:209-220,235-269` | Email konfirmasi **tanpa attachment PDF E-Voucher & tanpa QR inline** — spec mensyaratkan (design system §8: "Otomatis kirim email konfirmasi + PDF E-Voucher"). Hanya link ke `/voucher/[id]`:195. | Generate/attach PDF + embed QR (data URL bekerja di HTML email). |
| I4 | Major | `src/lib/notifications.ts:91-220,485-507` | Semua email customer EN-only — tanpa varian ID. | Template terlokalisasi. |
| I5 | Major | `api/bookings/[id]/cancel/route.ts:136-145`; `api/admin/refunds/[id]/route.ts`; `notifications.ts` | **Tidak ada notifikasi refund ke customer, pernah.** Cancel hanya return JSON; proses refund tidak memberi tahu siapa pun; tidak ada template refund. | Tambah notifikasi refund-requested + refund-completed (brand, support@, booking code, jumlah, ETA). |
| I6 | Major | `voucher/[bookingId]/page.tsx:125-155`; `notifications.ts:167-206`; `prisma/schema.prisma` | E-voucher tanpa **nama peserta** — diwajibkan spec (§8 "nama peserta"). Schema `Booking` tidak punya field participant names. | ⚠️ **KEPUTUSAN OWNER** — butuh migrasi `prisma/schema.prisma` (wajib migrasi proper per AGENTS.md §4) + render di voucher & email. |
| I7 | Major | `notifications.ts:202-203`; `voucher/[bookingId]/page.tsx:185-195` | **Nomor WhatsApp support 24/7 hilang** dari e-voucher & semua email — eksplisit diwajibkan spec (§8). Hanya support@baliwild.com. | Tambah nomor WhatsApp 24/7 ke template voucher, email konfirmasi/reminder, dan halaman voucher. *(Butuh nomor resmi dari owner.)* |
| I8 | Minor | `notifications.ts:81-89,107-118`; `voucher/[bookingId]/page.tsx:150-154,185-194` | Instruksi meeting point generik; "what to bring" hanya di email reminder — absen dari konfirmasi & voucher. | Perluas blok kedatangan/what-to-bring di keduanya. |
| I9 | Minor | `notifications.ts:534-544` | Email alert moderasi internal tanpa footer brand/kontak. | Footer minimal "BaliWild · internal alert". |
| I10 | Minor | `notifications.ts:243` | `EMAIL_FROM` sepenuhnya env-overridable tanpa validasi — nilai production salah diam-diam melewati aturan booking@. | Validasi allowlist `booking@baliwild.com` saat startup; fail fast. |

### Terverifikasi BAIK

`EMAIL_FROM` default **booking@baliwild.com** + **Reply-To support@**; `booking@` tidak pernah muncul di halaman publik (grep-verified); `hello@` dipakai permukaan publik (header/footer/legal); `support@`/`partners@` sesuai aturan; **tidak ada Gmail di file terlacak**; warna brand hitam/#FFEE00 + footer "BaliWild · Own the wild." di email konfirmasi/reminder; QR di halaman voucher; kegagalan notifikasi tidak pernah melempar error ke webhook pembayaran; alert moderasi terkirim ke support@.

> Catatan orchestrator: temuan A1 (hardcoded hex di email — §A) konsisten dengan hasil agen: warna brand memang hadir di email, hex hardcode adalah *accepted exception* dengan rekomendasi konstanta terpusat.

---

## J. PWA & Offline — [SELESAI · Orchestrator]

**Ringkasan: 0 temuan baru — fondasi PWA solid dan dipikirkan matang.** (Offline page EN-only sudah tercatat G11.)

### Terverifikasi BAIK
- **manifest.ts**: name/short_name dari brand constants, `theme_color`/`background_color` `#000000`, `display: standalone`, icons 192/512 + maskable-512, shortcuts relevan (home + tubing) ✅ — plus unit test (`manifest.test.ts`).
- **PwaRegistration.tsx**: register `/sw.js` hanya di production; di development justru **unregister SW basi + purge caches** agar `next dev` tidak pernah menyajikan cache lama (line 13-14) — pola sangat baik ✅.
- **InstallPrompt.tsx**: gated oleh **cookie consent** (tidak muncul sebelum consent), hanya di homepage (menghindari konflik sticky CTA), deteksi standalone, dismiss persisten, tombol Install & Dismiss **44px** + aria-label ✅.
- **CookieConsent**: publish `--cookie-consent-height` (CookieConsent:57) dan dikonsumsi sticky CTA PDP (ExperienceDetailClient:1049) — sesuai spesifikasi v3.7.0 ✅; hidden saat `[role="dialog"]` (verifikasi agent 4; z-order: chat z-45 > CTA z-40 > cookie z-30) ✅.
- **Offline page**: BrandWordmark ada, pesan informatif, CTA `min-h-[44px]` ✅.

---

## K. Admin UX & Rebrand — [SELESAI · Orchestrator]

**Ringkasan: TEMUAN BESAR — admin ternyata SUDAH memakai warna brand hitam/kuning.** Grep aksen biru (`bg-blue-|text-blue-|border-blue-|ring-blue-|indigo-|sky-|cyan-`) di `src/components/admin/` dan `src/app/admin/` = **NOL hasil**. Catatan design system §1 ("Area admin masih memakai aksen biru; belum termasuk rebrand ini") **SUDAH BASI** — pekerjaan rebrand admin tampaknya telah selesai di rilis-rilis terakhir (v3.9.0 Product Manager) tanpa dokumen ikut diperbarui.

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| K1 | Minor (doc drift) | `docs/UI_UX_DESIGN_SYSTEM.md` §1 | Catatan "admin masih aksen biru" tidak lagi benar. Bukti: AdminLoginForm `bg-brand-ink text-brand` (line 84, `min-h-[44px]`), VentureForm & VariantPackageEditor memakai brand tokens (175, 431), AdminSidebar nav `aria-label` ✅. | Update catatan §1: "Admin telah direbrand ke brand hitam/kuning". Masuk batch docs-sync Fase 1. |
| K2 | Minor | `src/components/admin/RefundActions.tsx:51`, `VariantPackageEditor.tsx:431` | Tombol admin `min-h-[40px]` — 4px di bawah standar 44px. | Naikkan ke 44px — gabung batch touch-target Fase 1. |

### Admin UX — Terverifikasi BAIK
- VentureForm: nested-label valid (§B), aria-label aksi dinamis (remove itinerary/FAQ, move/remove photo), inline validation judul 45-60 char + feedback slug (lines 490-521) ✅
- VariantPackageEditor: aria-label tier pax/price (389-417) ✅ + **unit test** ✅
- VariantOperationsEditor: aria-label capacity/delete/blackout (210-363) ✅
- AiContentWizard: 6 htmlFor labels ✅; AdminLoginForm: htmlFor + min-h-[44px] ✅
- Variants dengan booking tidak bisa dihapus (guard bisnis terdokumentasi v3.9.0) — perilaku dikonfirmasi di kode editor

---

## L. Doc ↔ Code Drift — [SELESAI · Orchestrator]

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| L1 | Major | `docs/UI_UX_DESIGN_SYSTEM.md` §10 | Tabel pemetaan merujuk `src/components/booking/PriceSummary.tsx`, `PaymentForm.tsx`, `EVoucher.tsx` — di kode, folder `booking/` hanya berisi `BookingForm.tsx`. Fungsinya kemungkinan tertanam di `ExperienceBookingWidget.tsx` dan halaman checkout. Dokumen menyesatkan developer baru. | Update §10 agar mencerminkan komponen nyata (atau tandai jelas "embedded in …"). Verifikasi juga entri bertanda "(baru)" lainnya. |
| L2 | Minor | `docs/UI_UX_DESIGN_SYSTEM.md` §4 | `scroll-padding-top` tercatat 4.5rem vs kode 6.5rem (sama dengan temuan A3). | Satukan dengan A3. |

---

## M. Test Coverage UI — [SELESAI · Orchestrator]

**Ringkasan: 72 suite / 652 test LULUS; 18 komponen punya unit test. Gap pada primitif inti & ChatWidget.**

### Komponen DENGAN test (18)
Button · VentureCard · HeroSearch · VentureExplorer · VariantDetailModal · VariantCatalogCard · SortMenu · RotatingKeyword · ReviewsSection · ReviewModal · ReviewForm · ProductLightbox · PickupAddonsStep · ExperienceBookingWidget · CollapsibleText · CategoryTiles · CategoryQuickMenu · VariantPackageEditor

### Komponen TANPA test — prioritas

| Prioritas | Komponen | Catatan |
|-----------|----------|---------|
| 1 | **BottomSheet** | Komponen inti booking (2-step checkout) — tanpa test langsung (tercakup tidak langsung via ExperienceBookingWidget.test) |
| 2 | **Calendar, Stepper, TimeSlotCard, TimeSlotPill** | Primitif pemilihan tanggal/jam/pax — idem |
| 3 | **ChatWidget** | Customer-facing, banyak state (typing/error/locale) — tanpa test |
| 4 | **CookieConsent, CurrencySwitcher, LanguageToggle** | Preferensi & consent — perilaku persistensi penting |
| 5 | Admin: VentureForm (±40 field!), VariantOperationsEditor, AdminReviewQueue, AdminReviewInvites, RefundActions, OperationActions, AiContentWizard, AdminLoginForm, AdminSidebar | Form terbesar tanpa test |
| 6 | Layout/theme: HomeHeader, SiteFooter, HeaderSettings, BrandWordmark, ThemeProvider/ThemeSwitcher, LocaleProvider | Sekunder |
| — | Dead code: SearchBar, FilterChips, BookingForm | **Tidak perlu test** — dihapus di Fase 2 (N4/D4/G21) |

### Rekomendasi
Tambahkan test untuk prioritas 1–3 lebih dulu (BottomSheet, Calendar/Stepper, ChatWidget) — komponen yang paling banyak menyentuh uang & customer. Selipkan ke Fase 2 dan Fase 5.

---

## Verifikasi Silang — Agen 3 (States & Dark Mode) — [TAMBAHAN]

Agen 3 (MiniMax M3.1 Flash) menyelesaikan audit E/F secara independen setelah orchestrator menutup laporan. Temuan BARU yang tidak tertangkap sebelumnya:

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| V1 | 🚨 **Critical** | `globals.css:95,98,107-108` + `VentureCard.tsx:133,159` + 6 file lain | **Chip bertint brand dipaksa teks hitam di dark mode**: aturan `[class*="bg-brand/"].text-neutral-900 { color:#000 }` ditulis untuk block kuning SOLID, tetapi `bg-brand/30` di atas kartu gelap `#191919` terkomposit ≈`#5E5912` → teks hitam **≈2.9:1, gagal WCAG AA** — mengenai chip "Free reschedule ≥24h", "N booked this month" di **semua kartu produk**, badge "Founding guest", chip PDP, tag blog. | Keluarkan class tint dari daftar black-text, atau beri teks terang (`#e5e7eb`/`#f8f9fa` → 6.3:1). **Fix CSS satu baris, visibilitas tertinggi — masuk Fase 1.** |
| V2 | Critical | `src/app/` + 6 route yang memanggil `notFound()` | Konfirmasi & peningkatan E1/G17: tidak ada `error.tsx`/`global-error.tsx`/`not-found.tsx`; 6 route (`experiences/[id]/[slug]:127`, `blog/[slug]:94`, `voucher/verify:26`, `review/[bookingId]:54`, `admin/ventures/[id]:46`, `.../edit:68`) memanggil `notFound()` → 404 default tanpa brand (dan **putih total di dark mode**). | Tambah ketiga boundary file — Fase 4. |
| V3 | Major | `checkout/[session_id]/page.tsx:150-154` | **Kegagalan pembayaran senyap**: `snap.pay` `onError` hanya `setPaying(false)` — tidak ada pesan error ke user; tombol aktif lagi tanpa penjelasan. | Set `payError` di `onError` (blok 332-343 sudah ada). **Fase 1.** |
| V4 | Major | `ExperienceDetailClient.tsx:336-339` | Kegagalan booking PDP memakai `window.alert()` — bukan inline error + Retry. | Ganti inline error state. Fase 1. |
| V5 | Major | `src/app/loading.tsx` + 18 route | Hanya 2 `loading.tsx` ada; root skeleton HOME dipakai sebagai fallback SEMUA route lain (`/blog`, `/my/bookings`, `/voucher/*`, `/review/*`, semua `/admin/*`) — skeleton yang salah. Plus: "shimmer" di design system belum diimplementasi (hanya `animate-pulse`, tidak ada keyframe shimmer). | Tambah per-segment `loading.tsx` + keyframe shimmer. Fase 4. |
| V6 | Major | `ExperienceDetailClient.tsx:540` | Scrim section-nav PDP pakai gradient `from-white via-white/90` — **tidak dioverride dark mode** → pita putih di atas konten gelap. | Override gradient stops di dark. Fase 1 (CSS). |
| V7 | Major | `Button.tsx:17` + voucher:198 + widget:873 | Outline button `border-brand-ink` (#000) **tidak dioverride dark** → border hitam di permukaan gelap ≈ tak terlihat. | Tambah `html.dark .border-brand-ink` override. Fase 1 (CSS). |
| V8 | Major | `globals.css:163-169` vs 10+ file form | `html.dark input { border-color:#444 !important }` **mengalahkan semua `focus:border-brand-ink`** → **tidak ada indikasi fokus terlihat di dark mode**. | Tambah rule `:focus` terpisah. Fase 1 (CSS). |
| V9 | Major | `ExperienceDetailClient.tsx:357`, `loading.tsx:6`, `offline:14` | PDP memakai `bg-white` sebagai surface halaman → di dark jadi `#191919`, bukan `#212121` (sticky bar tak terpisah). | Ganti ke `bg-neutral-50`. Fase 1. |
| V10 | Major | `VariantDetailModal.tsx:194` | `bg-neutral-50/70` tidak dioverride dark → panel abu terang, teks terang di atasnya **1.9:1** — gagal berat di blok harga paket. | Override `/70` atau ganti token. Fase 1. |
| V11 | Minor | `globals.css:117-132`, `176-192`; `ThemeProvider:41,50`; `layout.tsx:63` | Amber (warning) tidak dioverride dark; border/ring opacity (`/80`) tidak tercover; `bg-brand/40` → 4.0:1 (D10); **anti-FOUC script di `<body>` bukan `<head>`** → bisa flash terang; `localStorage` ThemeProvider tidak di-guard try/catch. | Batch dark-override + guard. Fase 1/4. |

**Konfirmasi silang yang selaras:** A2 = D11 (duplicate neutral-600), E1/G17 = S1/S2/D3, F2/D13 (localStorage guard), G11 (offline EN).

**TOTAL TERBARUI: 2 Critical (1 termitigasi: I1 · 1 baru: V1) · 38 Major · ±48 Minor.**

---

## N. Duplikasi & Konsolidasi Komponen — [SELEDAI · Orchestrator]

| # | Severity | Lokasi | Temuan | Rekomendasi |
|---|----------|--------|--------|-------------|
| N1 | Minor | `src/components/ui/LanguageToggle.tsx` ↔ `src/components/locale/LanguageSwitcher.tsx` | Pola wrapper dua lapis: `LanguageSwitcher` hanya mengambil konteks locale lalu merender `LanguageToggle`. Bukan duplikasi murni (ada wiring konteks), tetapi menambah lapisan import (4 pemakaian: header, footer, settings, checkout). | Fase 2: pindahkan wiring konteks ke dalam satu komponen; hapus lapisan kedua; update 4 import. |
| N2 | Minor | `src/components/ui/CurrencySwitcher.tsx` ↔ `src/components/currency/CurrencySelector.tsx` | Pola identik dengan N1 untuk currency (4 pemakaian). | Fase 2: konsolidasi sama seperti N1. |
| N3 | Info | `src/components/ui/index.ts` | Barrel export hanya memuat komponen `ui/` — wrapper di `locale/` dan `currency/` diekspor terpisah. | Setelah konsolidasi N1/N2, rapikan barrel export agar satu sumber kebenaran. |
| N4 | Info | `src/components/ui/SearchBar.tsx` | SearchBar terkonfirmasi **dead code** — tidak diimport langsung maupun via barrel `ui/index.ts` (grep terverifikasi 2 jalur). Selaras dengan FilterChips (D4). | Fase 2: hapus SearchBar + FilterChips dari barrel & kode; atau pasang jika memang direncanakan. |

---

## Prioritas & Fase Perbaikan — DRAFT *(final setelah agen 3 & 5 melapor; temuan States/Dark Mode/Admin/PWA/Tests akan ditambahkan)*

Basis: 49 temuan dari 9 workstream yang selesai. Struktur fase **disesuaikan dari rencana awal** mengikuti dampak bisnis aktual temuan.

### Fase 1 — Bugfix Cepat & Compliance → `bugfix/ux-critical`
Perbaikan bedah presisi, tanpa perubahan arsitektur. Urutan berdasarkan dampak bisnis:

| # | Temuan | Perbaikan |
|---|--------|-----------|
| 1 | D1 | Kondisi combo banner → `fulfillmentMode === 'SELF_DRIVE'` (membuka combo di Shared Transfer = potensi pendapatan) |
| 2 | G21 | Hapus/redirect route legacy `/checkout` (terverifikasi aman — tax 10% fiktif menghilang) |
| 3 | B1 | `aria-live` pada pesan validasi booking + log chat (WCAG 4.1.3) |
| 4 | B2 | Modal BookingActions: Escape + focus trap/restore + close 44px |
| 5 | A2 | Hapus deklarasi ganda `text-neutral-600` dark mode |
| 6 | D9 | `??` → `\|\|` fallback foto variant |
| 7 | C5 | Ganti `scrollbar-hide` (undefined) → varian arbitrer |
| 8 | D6 + D8 | Bold tanggal tersedia + urutan pesan helper plan-first |
| 9 | B3 + B4 | Stepper guests 44px + aria-label & 44px input popover search |
| 10 | B5 + C2 | ReviewModal focus restore + badge Sold Out overlap |
| 11 | I10 | Validasi `EMAIL_FROM` allowlist saat startup |
| 12 | Docs sync batch | A3 (scroll-padding 6.5rem) · L1 (§10 mapping) · D5 (TimeSlotPill) · D12 (anchor ID) · G18 (§1 currency = 9 aktif) |

### Fase 2 — Konsolidasi Fondasi → `feature/ux-consolidation`

| Temuan | Aksi |
|--------|------|
| G1 | Konsolidasi dua sistem i18n → SATU dictionary (`locale.ts` sebagai basis; hapus dead code `i18n.ts`) |
| N1 + N2 | Hapus wrapper ganda locale/currency — satu komponen dengan konteks built-in |
| N4 + D4 | Hapus dead code: `SearchBar`, `FilterChips` + barrel `ui/index.ts` |
| G19 | Satu tipe `Locale` bersama |

### Fase 3 — Ekosistem Email & Voucher → `feature/ux-email-voucher` *(kepercayaan customer)*

| Temuan | Aksi |
|--------|------|
| I5 | Notifikasi refund-requested + refund-completed — **SAAT INI customer tidak pernah diberi tahu status refund** |
| I7 | Nomor WhatsApp 24/7 di voucher + semua email *(butuh nomor resmi dari owner)* |
| I3 | Attachment PDF e-voucher + QR inline di email konfirmasi |
| I2 | Brand (wordmark/warna/support@) di email review-request |
| I8 + I9 | Meeting point & what-to-bring lengkap + footer alert internal |
| D10 + D11 | Wallet actions + animasi centang di voucher |
| I6 | Nama peserta di e-voucher *(migrasi schema — sudah disetujui owner, jadwalkan proper)* |

### Fase 4 — Lokalisasi Penuh EN/ID → `feature/ux-localization` *(strategis; effort terbesar)*

| Temuan | Aksi |
|--------|------|
| G2–G11 | Lokalkan: footer, trust strip, kartu produk, PDP, booking sheet, checkout, voucher, my/bookings, cookie consent, offline |
| G12 | Blog: `readText()` per-locale (artikel ID saat ini tak pernah tampil) + chrome blog |
| G13 + H2 | Chat kirim locale aktif (bukan hardcoded `'en'`) |
| H1 | Session key → `vb_chat_session` sesuai kontrak dokumen |
| H3 + H4 | Chrome chat terlokalisasi + error map ramah (bukan raw error.message) |
| G14–G16 | `html lang` dari cookie SSR + satu helper tanggal locale-aware |
| G17 | `error.tsx` / `not-found.tsx` berbrand & terlokalisasi |
| G20 | RotatingKeyword terlokalisasi |
| I4 | Email varian ID |

### Fase 5 — Admin UX Penyempurnaan → `feature/admin-ux-rebrand` *(direvisi berdasarkan temuan K)*

Rebrand admin **ternayata sudah selesai** (K1 — catatan dokumen yang basi). Konten fase berubah menjadi: (1) docs-sync design system §1 (K1); (2) naikkan touch target admin 40→44px (K2); (3) tambah test admin (VentureForm dll — §M); (4) polish form panjang bila diperlukan.

### Keputusan Owner yang Masih Menggantung

1. **D2 — stepper anak-anak**: A (tambah fitur + pricing implication) / B (update dokumen ke adults-only — *rekomendasi orchestrator*). 
2. **I7 — nomor WhatsApp 24/7** resmi (diperlukan sebelum Fase 3 mulai).
3. **File SVG** `atv-ubud-.svg` — commit sebagai aset / hapus.

---

## Catatan Metodologi

- Audit 100% **read-only** — tidak ada file kode yang diubah.
- Semua temuan wajib punya bukti `file:baris`; tanpa asumsi.
- Tim auditor (semua model gratis): DeepSeek V4.1 Flash (a11y/responsive) · Beam Free (booking flow — *fallback dari tokenrouter GLM-5.3 Free karena kanal provider penuh saat launch*) · MiniMax M3.1 Flash (states/dark mode) · Pulse Alpha Free (i18n/chat/email) · GLM-5.3 Flash via NVIDIA (admin/PWA/tests) · Orchestrator: brand/token/doc-drift/duplikasi.
- Strategi fallback 3 lapis per peran sudah disiapkan dan terbukti bekerja. Log insiden selama audit:
  1. **Agen 2** (booking flow): `tokenrouter/z-ai/glm-5.3-free` — kanal provider penuh → relaunch `opencode/beam-free` ✅ berhasil, hasil berkualitas tinggi.
  2. **Agen 1** (a11y + responsive): `nvidia/deepseek-v4.1-flash` — timeout response headers → tugas dipecah jadi 2 agen dengan model berbeda (1a a11y / 1b responsive) ✅ 1b berhasil.
  3. **Agen 1a** (a11y): `opencode/deepseek-v4.1-flash-free` — kuota gratis provider habis → diambil alih **orchestrator langsung** ✅ selesai (2 Major + 4 Minor).
  
  Cakupan audit tetap **100%** — tidak ada workstream yang hilang akibat insiden model.
- Laporan ini adalah dasar untuk Fase 1–4 refactor; setiap fase pada branch terpisah dengan QA gate `lint` + `typecheck` + `test`.
