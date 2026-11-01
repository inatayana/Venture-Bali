# Venture Bali — UI/UX Design System & Flow

> **Version:** 3.2.0
> **Status:** MUST FOLLOW. Single source of truth untuk semua UI/UX decisions.
> **Reference:** Master blueprint (VENTURE_PRD_MASTER.md §6, §O), user flow Fase 1–10, Klook-style PDP pattern
> **Changelog v3.0.0:** PDP direfactor ke pola Klook — Inline Package Options Configurator (desktop), full-height bottom sheet konfigurasi (mobile), Sticky Anchor Nav Bar, dependent transfer + combo add-ons, real-time multi-pax pricing.
> **Changelog v3.1.0:** Font Pairing System — Barlow Condensed (heading) + Plus Jakarta Sans (body), design token warna `ink`/`jungle`/`sand`, utility `.heading-caps`.
> **Changelog v3.2.0:** Checkout dua langkah — **Plan your trip** (guests, date, time, pickup, promo, add-ons) lalu **Guest details & pay** (recap + Edit, lead traveller, terms/waiver) dengan total sticky dan CTA berjenjang.

## 1. Design Principles

### Mobile-First (WAJIB)
- Semua komponen dirancang untuk **mobile dulu**, lalu desktop.
- Pola **Bottom Sheet** untuk pemilihan tanggal, jumlah traveler, dan edit pesanan — zero page reload.
- **Sticky Bar** di bagian bawah layar selalu terlihat (CTA "Show dates" / "Confirm & Pay").
- Touch target minimum **44×44px** untuk semua tombol interaktif.

### Multi-Currency & Language Toggle
- **Language Switcher**: EN/ID toggle di header. Semua copy publik tersedia dalam 2 bahasa.
- **Currency Switcher**: IDR sebagai basis, pilihan AUD, CNY, EUR, GBP, INR, JPY, KRW, MYR, SGD, USD.
- **Estimasi Konversi**: Tampilkan nilai konversi estimasi di samping nominal IDR (mis. "Rp 550.000 ≈ US$34").

### Visual Language
- Tipografi bersih, kontras tinggi untuk teks, spacing lega.
- Badge status di pojok kiri atas kartu produk.
- Wishlist icon (hati) di pojok kanan atas.

### Tipografi (Font Pairing System)
Dua font self-hosted via `next/font/google` (zero render-blocking, mendukung KPI Lighthouse >90):
- **Heading & CTA**: `Barlow Condensed` — weight 600 (SemiBold) & 700 (Bold). Untuk judul banner, nama paket, tombol aksi utama, dan angka harga. Token Tailwind: `font-heading`.
- **Body & UI**: `Plus Jakarta Sans` — weight 400 (Regular), 500 (Medium), 600 (SemiBold). Untuk deskripsi, form, navigasi, teks rinci. Token Tailwind: `font-sans` (default).

Hirarki ukuran mobile:
| Elemen | Font | Ukuran |
|--------|------|--------|
| Judul paket | Barlow Condensed Bold (700) | 22–28px |
| Label / Tag | Barlow Condensed SemiBold (600), ALL-CAPS + `tracking-wider` | 12–14px |
| Deskripsi & detail | Plus Jakarta Sans Regular (400) | 14–16px |

Aturan penerapan:
- Heading kategori/paket gunakan utility `.heading-caps` (ALL-CAPS + letter-spacing 0.05em) agar terlihat premium.
- Angka harga gunakan `tabular-nums` agar tidak bergeser saat pax berubah.
- **Warna brand = satu variabel CSS**: `src/styles/globals.css` → `--brand` (default `255 238 0` = #FFEE00) dan `--brand-ink` (default `0 0 0` = #000000). Tailwind memetakannya ke utility `brand` / `brand-ink`; mengubah satu baris itu mengganti seluruh UI (tombol, chip aktif, badge, wordmark, garis header, ring fokus). Nilai ditulis sebagai kanal RGB agar `bg-brand/30` tetap bekerja. Token lain: `ink` `#1A1A1A`, `jungle` `#1E3A2B`, `sand` `#E5DFD5`.
- **Aturan kontras kuning–hitam** (v1.4.0): `brand` hanya boleh dipakai sebagai **latar dengan teks hitam** atau **teks di atas hitam**. Jangan pernah memakai `brand` sebagai warna teks di atas putih (kontras ±1.1:1).
  - Aksen: wordmark (BALI di-highlight), garis 2px bawah header sticky, chip kategori aktif (`bg-brand-ink text-brand`), badge paket/promo, pill kategori, kode promo.
  - CTA utama: `bg-brand-ink text-brand` (`Button` variant primary, "Show dates", "Create package").
  - Status fungsional tetap semantik: hijau = included/instant, merah = error/hapus; `brand` bukan pengganti warna status.
  - Area admin masih memakai aksen biru; belum termasuk rebrand ini.

### Trust & Conversion Signals
- **Payment badges**: logo VISA, Mastercard, GoPay, QRIS visible di bawah harga.
- **SSL indicator**: "🔒 Secure checkout powered by Midtrans" di sticky CTA.
- **Instant Confirmation**: "✓ Instant Confirmation" visible di card DAN PDP.
- **Social proof real-time**: "X orang melihat ini sekarang" atau "X booking dalam 24 jam terakhir".
- **Price anchoring**: strikethrough harga asli jika ada diskon (mis. "~~Rp 800.000~~ Rp 550.000").

---

## 2. User Flow (Fase 1–10)

| Fase | Langkah | Komponen UI Utama | Responsivitas |
|------|---------|-------------------|---------------|
| 1 | Discovery | Card Grid, Filter Bar, Currency Switcher | Mobile: 1-2 kolom; Desktop: 3-4 kolom |
| 2 | Detailing | Photo Grid, Overview, Sticky Floating CTA | Mobile: fixed bottom bar; Desktop: sidebar |
| 3 | Select Date & Time | Calendar Picker, Time Cards | Full-screen Bottom Sheet on mobile |
| 4 | Select Travelers | Stepper (- / +) Dewasa/Anak-anak | Full-screen Bottom Sheet on mobile |
| 5 | Total Price | Summary Card, Quick-Edit Triggers | Micro-interaction modal & live calculation |
| 6 | Review & Edit | Summary Card, Quick-Edit Triggers | Modal popup edit (no page reload) |
| 7 | Payment Selection | Radio Payment Methods, Card Forms | Auto-tabbing input, responsive |
| 8 | Payment Details | Accordion/Radio Payment, Card Forms | Auto-format card number, exp date |
| 9 | Confirmation | Success Screen, Booking ID | Animasi sukses (centang hijau) |
| 10 | E-Voucher | PDF/QR E-Voucher, Email Trigger | Wallet integration, print/save PDF |

---

## 3. Product Card (Listing Page)

### Urutan Visual (OTA Standard)
1. **Foto** (4:3 atau 1:1 rasio) — optimized image loading, skeleton placeholder.
2. **Badge** (pojok kiri atas): Best Seller, Trending, Instant Confirmation.
3. **Wishlist** (pojok kanan atas): ikon hati.
4. **Judul aktivitas** (Title Case, SEO optimized, 45–60 char).
5. **Rating** (★ + angka + jumlah review).
6. **Lokasi** (ikon pin).
7. **Durasi** (ikon jam).
8. **Harga** "From Rp XXX.XXX / guest" + estimasi USD + strikethrough jika diskon.
9. **Transfer badge**: "Hotel Pickup Available" atau "Self Drive".
10. **Urgency**: "🔥 X booking dalam 24 jam terakhir".

### Responsivitas
- **Mobile**: 1–2 kolom, card height konsisten.
- **Tablet**: 3 kolom.
- **Desktop**: 4 kolom grid.

### Skeleton Loading
```
┌──────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← image skeleton
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓      │ ← title skeleton
│ ▓▓▓▓▓▓▓▓▓▓          │ ← rating skeleton
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │ ← price skeleton
└──────────────────────┘
```

### Empty State (No Results)
```
┌──────────────────────┐
│     🔍               │
│ No adventures found  │
│ Try another filter   │
│ [Reset Filters]      │
└──────────────────────┘
```

### Error State
```
┌──────────────────────┐
│     ⚠️               │
│ Something went wrong │
│ [Retry]              │
└──────────────────────┘
```

---

## 4. Product Details Page (PDP) — KLOOK-STYLE ARCHITECTURE (v3.0.0)

### Arsitektur 6 Section

| Section | Isi | Anchor ID |
|---------|-----|-----------|
| 1 | Hero Gallery & Quick Overview (Title, Rating, Wishlist/Share) | — |
| 2 | Sticky "Package Options" Widget (Core Booking Engine) | `#package-options` |
| 3 | Floating Anchor Nav Bar (jump scroll) | — |
| 4 | Detailed Activity Information & Visual Gallery (Itinerary, Food, Equipment) | `#what-to-expect` |
| 5 | Customer Reviews & Media Proof (ratings breakdown, foto/video review) | `#reviews` |
| 6 | Location / Meeting Point Map & Related Adventures | `#location` |

### Sticky Header & Breadcrumb Bar
- **Home hero (v1.8.0)**: latar gelap dengan **layer foto sinematik** (`/images/hero-bali.jpg`, tinggal drop asetnya) + **scrim gradien** agar headline tetap kontras. Headline dua baris: `Book the [keyword]` (typewriter) dan `Own the wild!`. Di bawah search ada **micro-bar trust** (rating/review bila ada, 9 kategori, instant confirmation, 80% refund, secure checkout).
- **Search pill** desktop memakai glassmorphism dengan glow aksen saat hover (`hover:border-brand/60` + shadow aksen).
- **Home**: brand header menempel di atas (`sticky top-0`, backdrop blur) saat halaman di-scroll, dengan tinggi ringkas agar grid produk tetap terlihat.
- **PDP**: bar sticky setinggi 56px berisi tombol "All adventures", breadcrumb `Home › Kategori › Nama produk`, dan harga paket terpilih per guest (desktop). Bar tetap terlihat saat scroll, jadi user bisa kembali atau pindah halaman tanpa scroll ke atas.
- **Section nav mengambang**: pill `Packages · What to expect · Reviews · Location` diposisikan **di tengah kolom konten kanan** (bukan full-width), `sticky top-64px`, dengan scrim gradien putih agar teks di bawahnya memudar. Pill **tidak tampil saat halaman dibuka**; muncul (fade + slide 8px) ketika section `#packages` mencapai header, dan memudar perlahan saat scroll kembali ke atas (`opacity/visibility` transition 300ms, `h-0` supaya tidak menyisakan ruang).
- **Kategori = dropdown**: crumb kategori (`CategoryQuickMenu`) membuka 9 mega kategori beserta emoji; tiap item menuju `/?category=<slug>` (mis. `/?category=tubing`). `VentureExplorer` membaca query itu setelah hydration (homepage tetap statis) dan langsung menandai chip kategori terkait. Tutup dengan klik luar atau Escape.
- Booking card kolom kiri (desktop) memakai `top: 76px` agar tidak tertutup bar; anchor section memakai `scroll-padding-top` 4.5rem.

### Hero Gallery
- **Desktop**: mosaic asimetris (1 foto besar + 3 tile) seperti sebelumnya.
- **Mobile**: slider swipe (`scroll-snap`) satu foto 4:3 penuh dengan badge `1 / 4` dan dot indicator; baris thumbnail kecil di bawah hero **tidak** ditampilkan agar header konten berikutnya naik.
- **Lightbox**: foto besar + tombol panah + counter `n of m`; strip thumbnail di bagian bawah dihapus (mode "all photos" tetap tersedia lewat tombol grid).


### Section 2: Klook-style "Package Options" Widget ⚡ CORE BOOKING ENGINE

**Desktop & mobile**: paket dipilih dari kartu paket di PDP (lihat "Package selector" di bawah). Tombol **Show dates** pada kartu / sticky CTA membuka satu **bottom sheet checkout dua langkah** (di desktop tampil sebagai panel tengah, di mobile full-height). Sheet memakai `ExperienceBookingWidget`.

**Two-step checkout (v3.2.0):**

- **Step 1 of 2 — Plan your trip** (`step = 'plan'`): guests, date (quick Today/Tomorrow + kalender), departure time, pickup/meeting point, promo code, dan add-ons. Ringkasan harga + total menempel di bawah dengan CTA **Continue**.
- **Step 2 of 2 — Guest details & pay** (`step = 'details'`): recap perjalanan ringkas (tanggal · jam, guests, pickup/meeting point, add-on, kupon) dengan tombol **Edit** yang kembali ke Step 1 tanpa menghapus data tamu; lalu lead traveller (nama, email, negara, WhatsApp) dan persetujuan terms + waiver. CTA **Continue to payment** memanggil alur pembayaran yang sudah ada.
- **Validasi dipisah**: Step 1 hanya memeriksa tanggal, slot, pickup/alamat/kelas kendaraan; Step 2 hanya memeriksa kontak dan persetujuan. Pesan bantuan di bawah CTA menampilkan kekurangan pertama pada langkah aktif.
- **Progress**: dua batang tipis `Plan` → `Guest details`; langkah aktif memakai warna `brand`, langkah selesai `brand-ink`.
- **Zone Outer (custom quote)**: tidak bisa dibayar online. Step 1 menampilkan catatan bahwa area luar butuh quote manual dan CTA **Continue** tetap nonaktif sampai tamu memilih area lain.
- Data tamu tidak hilang saat bolak-balik langkah, dan berpindah paket mereset checkout ke Step 1.

**Package selector — two-tier interaksi (v3.1.0, Airbnb Services style):**

- **Tier 1 — Package card** (`VariantCatalogCard`): foto persegi di kiri, judul + badge, deskripsi maksimal 2 baris, chip durasi / transport / jumlah fasilitas, lalu baris harga `From … / guest` + minimum spend + tombol `Select` dan `Show dates`. Hover elevation halus; klik card membuka detail.
- **Tier 2 — Detail modal** (`VariantDetailModal`): backdrop gelap + `backdrop-blur`; di desktop split 2 kolom (foto kiri, deskripsi lengkap + include/exclude + harga kanan) dengan CTA "Show dates" menempel di bawah; di mobile satu kolom scrollable agar thumb-friendly. Tutup lewat tombol X, klik backdrop, atau Escape (focus trap + body scroll lock).
- **Promo**: paket dengan promo price menampilkan badge "Promo" / "Promo price applied"; kupon `TRYBALI2026` hanya ditampilkan pada paket harga list karena promo dan kupon tidak stacking (BOOKING_ARCHITECTURE §5). Foto paket yang kosong memakai foto utama produk.
- **Pickup di kartu**: baris kecil di bawah harga, mis. `Ubud · Pickup included` atau `South Bali · +Rp 224.000/guest`; self drive menampilkan `Meeting point · Make your own way`. Modal detail memakai baris yang sama di dalam blok harga.
- **Admin**: paket (variant) bisa dibuat/diubah/dihapus dari `/admin/ventures/[id]` — judul, deskripsi, mode, locked pickup zone, durasi, badge, minimum spend, sort order, dan price tier. Paket yang sudah punya booking tidak bisa dihapus.

### Section 4: Detailed Activity Information (What To Expect)
- **Hook di bawah galeri**: memakai `hook3Sec` (bukan `shortDescription`), dibatasi **200 karakter** (`clampText`, potong di batas kata). `shortDescription` tetap dipakai untuk kartu & meta SEO — tidak lagi diduplikasi di PDP.
- **Full description**: kolom `longDescription` (teks panjang ±500–700 karakter, tone: about → what to expect → what you get → what we expect from you). Ditampilkan collapsed **225 karakter** + tombol **Read more / Read less** (accordion in-place, tanpa layout shift). Komponen `CollapsibleText`.
- **Highlights**: section tersendiri **tepat di atas "Safety & requirements"**, minimal **5 poin**, tiap poin dibatasi **90 karakter** (`HIGHLIGHT_MAX`) agar maksimal dua baris di mobile; grid 1 kolom (mobile) / 2 kolom (desktop).
- **Itinerary timeline**: bulatan bernomor 1..n dengan latar warna aksen `brand` dan angka `brand-ink`, dihubungkan garis vertikal 3px. Tiap langkah menampilkan waktu, judul (maks **45 karakter**, dipotong di batas kata) dan deskripsi singkat (maks **110 karakter**) — helper `itineraryStepDisplay` di `src/lib/itineraryDisplay.ts`.
- What's Included/Excluded 2 kolom + Things to Know (accordion) + FAQ.

### Section 5: Reviews & Media Proof
- Ratings breakdown (bar per bintang) + summary badge + review cards (mobile carousel / desktop grid) + foto/video dari reviewer.
- **Rating diturunkan dari review nyata**: bila ada review `isApproved`, `rating` = rata-rata (1 desimal) dan `reviewCount` = jumlahnya; rating editorial seed hanya dipakai saat belum ada review.
- **Alur review pasca-trip (v1.5.0)**:
  1. Tamu membuka `my/bookings?token=…` (magic link) → tombol **Write a review** muncul hanya untuk booking `PAID` yang tanggalnya sudah lewat dan belum pernah direview.
  2. Form `/review/[bookingId]?token=…`: rating 1–5 bintang + komentar 20–1000 karakter; token membuktikan kepemilikan booking, tanpa akun.
  3. Review tersimpan `isApproved = false` + `bookingId` (unik, satu review per booking) → muncul di `/admin/reviews` untuk **Approve/Reject**.
  4. Setelah disetujui, review tampil di PDP dengan badge **Verified trip**.
- **Empty state**: bila `reviewCount = 0`, jangan tampilkan angka rating maupun histogram — tampilkan kartu "No verified reviews yet" (ikon bintang abu-abu + ajakan review setelah trip). Baris rating di header berubah menjadi chip "New · no reviews yet".

### Section 6: Location & Related Adventures
- **Harga & badge di kartu (v1.8.0)**: harga tampil `From Rp ... / guest` + **perkiraan USD** (`≈ $34 / person`, rate fallback 16.000), diikuti dua badge: **Instant Confirmation** (hijau) dan **Free reschedule ≥24h** (aksen).
- **Skeleton loading**: rute `/` dan PDP punya `loading.tsx` dengan shimmer (hero, tile kategori, kartu produk, galeri) agar navigasi terasa instan.
- Map widget + address + "Open in Google Maps" + pickup info note + 3-4 related cards.
- **Related (v1.6.0)**: `getRelated` mengambil maksimal 3 produk dari kategori yang sama; karena tiap kategori masih 1 produk, sisanya diisi produk rating tertinggi lain agar section tidak kosong. Section `#related` ("More") ikut masuk anchor nav.
- **Social proof (v1.6.0)**: kartu produk dan header PDP menampilkan chip `N booked this month` — jumlah **pax** dari booking `PAID` bulan berjalan (`getMonthlyGuestCounts`), hanya tampil bila > 0.
- **Cron review request**: `/api/cron/review-requests` (02:00 UTC = 10:00 WITA) mengirim WhatsApp + email ke tamu yang tripnya kemarin dan belum mereview; idempoten lewat `NotificationLog`.

> **Aturan konversi lama (v2.0.0) tetap berlaku**: trust badges, skeleton/empty/error states, touch target 44×44px, social proof, price anchoring.

---

## 5. Bottom Sheet Components (Booking Flow)

### Single Bottom Sheet — Two-Step Checkout
SATU bottom sheet dengan dua langkah di dalamnya (bukan sheet terpisah):

```
┌─────────────────────────────────┐
│  ▬▬▬▬▬▬▬▬  ▬▬▬▬▬▬▬▬              │ ← Plan / Guest details
│  Plan your trip      Step 1 of 2│
│                                 │
│  1 · Guests         [- 2 +]     │
│  2 · Date           [calendar]  │
│  3 · Departure time [08:00 ...] │
│  4 · Pickup / meeting point     │
│  Promo code · Add-ons           │
│                                 │
│  Total: Rp 1.100.000            │
│  [           Continue          ]│
└─────────────────────────────────┘
               ↓ Continue
┌─────────────────────────────────┐
│  Guest details & pay Step 2 of 2│
│  Your trip: Sat, 8 Nov · 08:00  │
│  2 guests · Ubud     [Edit]     │
│                                 │
│  Lead traveller                 │
│  [Name] [Email] [Country]       │
│  [WhatsApp]                     │
│  ☑ booking terms                │
│  ☑ safety waiver                │
│                                 │
│  Total: Rp 1.100.000            │
│  [Back] [Continue to payment]   │
└─────────────────────────────────┘
```

### UX Interactions
- **Swipe down**: drag sheet ke bawah untuk close.
- **Backdrop tap**: tap di luar sheet = close.
- **Step indicator**: dua batang `Plan` → `Guest details`; langkah aktif memakai warna `brand`.
- **Back / Edit**: kembali ke Step 1 tanpa menghapus data tamu.
- **Live price update**: total harga berubah real-time saat guests/date/pickup/add-on berubah.

### Date Picker
- Kalender interaktif (bulan × tanggal).
- Tanggal yang tersedia ditebalkan.
- Tanggal unavailable dicoret/abu-abu.

### Time Slot Cards
- Pilihan jam (08:00, 09:00, 10:00, dst.).
- Indikator sisa kuota (contoh: "8 spots available").
- Harga per orang per slot.

### Traveler Stepper
- Dewasa: stepper (- / +).
- Anak-anak: stepper (- / +).
- Batas: minPax dan maxPax dari data produk.

---

## 6. Listing, Search & Filter

### Search Bar
- **Hero search (v1.7.0)**: destinasi, tanggal, dan jumlah tamu menyatu di dalam hero.
  - Desktop: kartu kaca horizontal (Where / When / Guests + tombol Search) dengan popover destinasi (Nearby & popular hubs + Suggested adventures) dan popover kalender.
  - Mobile: pil ringkas yang membuka **bottom sheet** berisi destinasi, kalender, dan stepper tamu + CTA "Search adventures".
  - State dibagi lewat `SearchProvider`; parameter `?q=&date=&pax=` ditulis ke URL saat submit dan dibaca kembali saat load.
- Tidak ada lagi blok pencarian terpisah di bawah hero.

### Filter Chips (Horizontal Scrollable)
```
[All] [ATV] [Rafting] [Tubing] [Cycling] [Trekking] [Water Sports] [Snorkeling] [Extreme] [Combo]
```
- Selected tile: warna ink dengan teks aksen. Unselected: putih + outline.
- Scroll horizontal pada mobile, satu baris pada desktop. Heading "Browse by category" dihapus agar viewport bersih.

### Sort Options
- Sort **menyatu di tile "All"**: label kecil di bawah "All" menunjukkan urutan aktif (mis. "Recommended"). Klik membuka menu berisi **All categories** (jika ada kategori aktif) + 5 opsi urutan; opsi aktif bertanda centang.
- Tidak ada dropdown sort terpisah di header katalog.

### Filter Panel (Bottom Sheet)
- **Transfer**: Self Drive / Private Transfer
- **Duration**: 1–2h, Half Day, Full Day
- **Difficulty**: Easy, Moderate, Challenging
- **Suitable For**: Kids, Couple, Family, Solo, Group
- **Instant Confirmation**: Yes

---

## 7. Payment Flow

### Metode Pembayaran
- Kartu Kredit/Debit: VISA, Mastercard.
- E-Wallet: GoPay, OVO, DANA.
- QRIS (QR Code).
- Bank Transfer: BCA, Mandiri, BNI, BRI.
- Apple Pay (jika tersedia).

### Form Validasi
- Auto-format card number (4 digit per grup): `4242 4242 4242 4242`
- Auto-format exp date (MM/YY): `12/28`
- CVV 3 digit.
- Billing address (ringkas).
- Logo SSL + 3D Secure indicator.

### Trust Indicators
```
🔒 Secure checkout powered by Midtrans
✓ 3D Secure Verified
✓ VISA / Mastercard / GoPay / QRIS
```

---

## 8. Confirmation & E-Voucher

### Success Screen
- Animasi centang hijau.
- Booking ID (contoh: VB20260901ABC).
- Detail: aktivitas, tanggal/jam, lokasi meeting point.
- Tombol: "Download PDF", "Add to Apple/Google Wallet".

### E-Voucher Content
- QR Code unik untuk check-in di lokasi.
- Detail: nama aktivitas, tanggal, jam, jumlah pax, nama peserta.
- Instruksi kedatangan (meeting point, yang perlu dibawa).
- Nomor WhatsApp support (24/7).

### Email Notification
- Otomatis kirim email konfirmasi + PDF E-Voucher ke customer.
- Email vendor/fulfillment partner (opsional).

---

## 9. Accessibility Standards

| Aspek | Standar |
|-------|---------|
| **Touch Target** | Minimum 44×44px untuk semua tombol interaktif |
| **Color Contrast** | WCAG AA (4.5:1 untuk teks, 3:1 untuk grafis) |
| **Font Size** | Minimum 14px untuk body text, 16px untuk input |
| **Keyboard Navigation** | Semua elemen bisa diakses via Tab/Enter |
| **Screen Reader** | Alt text untuk gambar, label untuk form |
| **Loading State** | Skeleton loading untuk image & konten (bukan spinner) |
| **Error State** | Pesan error jelas + tombol Retry |
| **Empty State** | "No adventures found" + tombol Reset Filters |

---

## 10. Pemetaan ke Komponen Code

| Section UI | Source Data | Komponen Code |
|------------|-------------|---------------|
| Card Grid | `mockExperiences` / API | `src/components/ui/VentureCard.tsx` |
| PDP Hero | `VentureItem` | `src/app/experiences/[id]/[slug]/ExperienceDetailClient.tsx` |
| Sticky CTA | Harga + CTA | `src/components/features/ExperienceBookingWidget.tsx` |
| Bottom Sheet (2-step checkout) | Slot times + pax + guest details | `src/components/ui/BottomSheet.tsx` |
| Calendar | Slot times | `src/components/ui/Calendar.tsx` (baru) |
| Time Slots | SlotTime data | `src/components/ui/TimeSlotCard.tsx` (baru) |
| Traveler Stepper | paxCount | `src/components/ui/Stepper.tsx` (baru) |
| Price Summary | calculateFinalPrice | `src/components/booking/PriceSummary.tsx` (baru) |
| Payment Form | Midtrans Snap | `src/components/booking/PaymentForm.tsx` (baru) |
| E-Voucher | Booking + QR | `src/components/booking/EVoucher.tsx` (baru) |
| Currency Switcher | fx rates | `src/components/ui/CurrencySwitcher.tsx` (baru) |
| Language Toggle | i18n | `src/components/ui/LanguageToggle.tsx` (baru) |
| Search Bar | filter params | `src/components/ui/SearchBar.tsx` (baru) |
| Filter Chips | categories | `src/components/ui/FilterChips.tsx` (baru) |
| Skeleton Loader | — | `src/components/ui/Skeleton.tsx` (baru) |

---

## 11. Referensi

- `docs/BOOKING_ARCHITECTURE.md` — pricing & zone rules
- `docs/PRODUCT_TITLE_CONSTITUTION.md` — title & SEO rules
- `docs/SEO_TAXONOMY.md` — categories & filters
- `docs/REFUND_POLICY.md` — cancellation rules
- `docs/NO_SHOW_POLICY.md` — no-show rules
- `src/lib/i18n.ts` — EN/ID dictionary
- `src/lib/fx.ts` — multi-currency rates
