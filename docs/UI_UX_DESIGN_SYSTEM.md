# Venture Bali — UI/UX Design System & Flow

> **Version:** 2.0.0
> **Status:** MUST FOLLOW. Single source of truth untuk semua UI/UX decisions.
> **Reference:** Master blueprint (VENTURE_PRD_MASTER.md §6, §O), user flow Fase 1–10

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

## 4. Product Details Page (PDP) — REORDERED FOR CONVERSION

### Section 1: Header & Hero Gallery
- **Breadcrumb**: Home / Bali Adventures / Ubud / ATV Quad Bike
- **Title**: SEO optimized (45–60 char).
- **Action Buttons**: Share, Save to Wishlist.
- **Mobile**: Interactive Photo Carousel (swipeable) dengan indikator angka (1/5).
- **Desktop**: Asymmetric Photo Grid (1 foto utama besar + 4 foto pendukung).

### Section 2: Title + Rating + Review Count
- **Judul** besar dan jelas.
- **Rating**: ★ 4.92 / 5.0 (276 reviews) — social proof langsung.
- **Trust badges**: "✓ Instant Confirmation" + "Free Cancellation".

### Section 3: Quick Key Highlights (At a Glance)
Icon-based list ringkas:
- 📍 Location: Ubud, Bali
- ⏱️ Duration: Approx. 2 Hours
- 🗣️ Languages: English, Indonesian
- 🛡️ Equipment: Helmet, Boots, & Safety Gear Provided
- 🚗 Transfer: Optional Hotel Pickup Available

### Section 4: Sticky Booking Widget (Conversion Focus) ⚡ PENTING
- **Mobile (Fixed Bottom Bar)**:
  - Kiri: Harga mulai dari Rp XXX.XXX / guest (+ estimasi currency).
  - Kanan: CTA Button "Show dates" / "Book Now".
- **Desktop (Right Sticky Card)**:
  - Harga per orang, kalender singkat, pemilih waktu, tombol aksi cepat.
- **Trust indicators**: "🔒 Secure checkout" + "✓ Instant Confirmation" + payment logos.

### Section 5: Activity Overview & "What You'll Do"
- **Description Paragraph**: Penjelasan singkat yang menggugah.
- **Visual Itinerary / Timeline**:
  1. Registration & Safety Briefing
  2. ATV Ride through Rice Fields & Jungle
  3. Tunnel Exploration & Waterfall Action Spot
  4. Finish Point, Shower & Lunch / Refreshment

### Section 6: What's Included & Excluded (2 Kolom)

| Included ✅ | Excluded ❌ |
|-------------|-------------|
| Professional ATV Instructor / Guide | Personal Expenses & Souvenirs |
| Safety Equipment (Helmet & Boots) | Tipping for Instructor (Optional) |
| Locker, Shower Facilities, & Towel | Photos / Videos Service (Optional Add-on) |
| Insurance Coverage | — |
| Lunch & Mineral Water | — |

### Section 7: Social Proof & Reviews (URGENT — di atas Meeting Point)
- **Summary Badge**: Overall score (★ 4.92 / 5.0) dari total ulasan.
- **Review Cards**: Recent reviews secara horizontal (mobile carousel, desktop 2x2 grid).
- **Elemen card**: Nama reviewer, asal negara (dengan bendera), rating, tanggal, kutipan singkat.
- **Tombol**: "Show all X reviews" (modal popup, tidak pindah halaman).

### Section 8: Meeting Point & Map
- **Map Widget**: Google Maps interaktif dengan pin lokasi.
- **Address Details**: Alamat lengkap + tombol "Open in Google Maps".
- **Pickup Info Note**: Penjelasan jika memilih hotel transfer.

### Section 9: Things to Know (Accordion)
- **Cancellation Policy**: Free cancellation up to 24 hours before activity.
- **What to Bring**: Baju ganti, sunscreen, kantong plastik, uang tunai.
- **Safety & Restrictions**: Tidak direkomendasikan untuk hamil, di bawah umur, kondisi medis.

### Section 10: Related Adventures (Cross-Selling)
3–4 card aktivitas sejenis di daerah yang sama.

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
