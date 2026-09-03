# Venture Bali — UI/UX Design System & Flow

> **Version:** 3.1.0
> **Status:** MUST FOLLOW. Single source of truth untuk semua UI/UX decisions.
> **Reference:** Master blueprint (VENTURE_PRD_MASTER.md §6, §O), user flow Fase 1–10, Klook-style PDP pattern
> **Changelog v3.0.0:** PDP direfactor ke pola Klook — Inline Package Options Configurator (desktop), full-height bottom sheet konfigurasi (mobile), Sticky Anchor Nav Bar, dependent transfer + combo add-ons, real-time multi-pax pricing.
> **Changelog v3.1.0:** Font Pairing System — Barlow Condensed (heading) + Plus Jakarta Sans (body), design token warna `ink`/`jungle`/`sand`, utility `.heading-caps`.

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
- **Warna brand (design token Tailwind)**: `ink` `#1A1A1A` (teks utama), `jungle` `#1E3A2B` (aksen/latar gelap), `sand` `#E5DFD5` (latar terang). Hindari warna neon.

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

### Sticky Anchor Nav Bar (Quick Scroll)
- Sub-header sticky muncul saat scroll melewati hero: `[Package Options] | [What To Expect] | [Reviews] | [Location]`.
- Anchor aktif di-highlight (scroll-spy). Tap = smooth scroll, tanpa reload.

### Section 2: Klook-style "Package Options" Widget ⚡ CORE BOOKING ENGINE

**Desktop**: Inline Configurator Card di kolom kanan sticky — SEMUA langkah terlihat di satu card, tanpa modal.

**Mobile**: Fixed Bottom CTA "Select Options" (kiri: harga mulai-dari + estimasi FX; kanan: tombol). Sekali tap membuka **full-height bottom sheet** berisi seluruh konfigurasi: Package → Date → Pax → Transport → Book Now.

Langkah konfigurasi (berlaku untuk desktop inline & mobile bottom sheet):

- **Step A — Package Type** (Radio Cards): variant produk, mis. "Single Ride", "Tandem Ride", "VIP Private Package". Card menampilkan badge + delta harga.
- **Step B — Date & Time**: tombol cepat Today / Tomorrow + trigger Calendar inline; diikuti pilihan slot time (time cards + sisa slot).
- **Step C — Travellers**: Stepper (−/+) Dewasa/Anak.
- **Step D — Transport** (Radio Group, dependency-aware):
  1. No Transfer (Meeting Point Only) — Rp 0 → `SELF_DRIVE` (default)
  2. Standard SUV (4 pax/vehicle) — delta per kendaraan
  3. Premium MPV (6 pax/vehicle) — delta per kendaraan
  4. Minivan (12 pax/vehicle) — delta per kendaraan
  - Memilih transfer membuka **Zone Picker** (Core Ubud = included, South 1, South 2, Outer = "Request Quote" — tidak bisa instant book).
  - Label armada pakai **kelas generik** (tanpa nama vendor — OPERATION_CONTRACT §1).
- **Step E — Combo Add-ons** (Conditional): hanya tampil/aktif jika transfer dipilih. Checkbox: aktivitas combo (Rafting, Tubing), upgrade makan. Add-on ber-flag `requiresTransfer` **disabled/grayed-out** saat "No Transfer" + helper text "Requires hotel transfer". Pilihan eksplisit "None (Base Package Only)".
- **Real-Time Price Calculation**: Total = (Base × Pax) + Transfer Fee + (Combo × Pax). Re-render instan saat pax/transport/combo berubah + **estimasi FX** (mis. "≈ US$98.50"). Detail breakdown expandable sebelum CTA.
- **CTA**: "Book Now" di dalam widget (desktop) / footer bottom sheet (mobile). Zone Outer → CTA berubah "Request Quote" (WhatsApp).

### Section 4: Detailed Activity Information (What To Expect)
- Description + visual itinerary timeline + What's Included/Excluded 2 kolom + Things to Know (accordion) + FAQ.

### Section 5: Reviews & Media Proof
- Ratings breakdown (bar per bintang) + summary badge + review cards (mobile carousel / desktop grid) + foto/video dari reviewer.

### Section 6: Location & Related Adventures
- Map widget + address + "Open in Google Maps" + pickup info note + 3–4 related cards.

> **Aturan konversi lama (v2.0.0) tetap berlaku**: trust badges, skeleton/empty/error states, touch target 44×44px, social proof, price anchoring.

---

## 5. Bottom Sheet Components (Booking Flow)

### Single Bottom Sheet — 3-Step Wizard
SATU bottom sheet dengan 3 step di dalamnya (bukan sheet terpisah):

```
┌─────────────────────────────┐
│         ● ● ●              │ ← step indicators
│                             │
│ Step 1: Select Date         │
│ ┌─────────────────────┐     │
│ │   [Kalender]        │     │
│ └─────────────────────┘     │
│                             │
│ [Back]              [Next]  │
└─────────────────────────────┘
         ↓ tap Next
┌─────────────────────────────┐
│         ● ● ●              │
│                             │
│ Step 2: Select Time         │
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │08:00 │ │09:00 │ │10:00 │ │
│ │8 left│ │5 left│ │12lft │ │
│ └──────┘ └──────┘ └──────┘ │
│                             │
│ [Back]              [Next]  │
└─────────────────────────────┘
         ↓ tap Next
┌─────────────────────────────┐
│         ● ● ●              │
│                             │
│ Step 3: How Many Travellers?│
│ Adults    [- 2 +]           │
│ Children  [- 0 +]           │
│                             │
│ Total: Rp 1.100.000         │
│                             │
│ [Back]        [Confirm & Pay]│
└─────────────────────────────┘
```

### UX Interactions
- **Swipe down**: drag sheet ke bawah untuk close.
- **Backdrop tap**: tap di luar sheet = close.
- **Step indicator**: dots ● ● ● menunjukkan progress.
- **Back button**: kembali ke step sebelumnya.
- **Live price update**: total harga berubah real-time saat stepper diubah.

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
- Di atas filter, placeholder "Search adventures in Bali..."
- Icon 🔍 di kiri, tombol clear ✕ di kanan.

### Filter Chips (Horizontal Scrollable)
```
[ATV] [Rafting] [Tubing] [Cycling] [Trekking] [Water Sports] [Snorkeling] [Extreme] [Combo]
```
- Selected chip: warna solid. Unselected: outline.
- Scroll horizontal pada mobile, wrap pada desktop.

### Sort Options
- "Recommended" (default)
- "Price: Low to High"
- "Price: High to Low"
- "Rating"
- "Duration"

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
| Card Grid | `mockVentures` / API | `src/components/ui/VentureCard.tsx` |
| PDP Hero | `VentureItem` | `src/app/ventures/[slug]/VentureDetailClient.tsx` |
| Sticky CTA | Harga + CTA | `src/components/booking/BookingForm.tsx` |
| Bottom Sheet (3-step) | Slot times + pax | `src/components/ui/BottomSheet.tsx` (baru) |
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
