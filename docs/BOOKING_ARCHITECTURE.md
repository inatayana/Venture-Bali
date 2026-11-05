# BaliWild — Booking Architecture

> **Version:** 1.4.0
> **Status:** MUST FOLLOW for booking flow, pricing, and checkout logic.
> **Reference:** Master blueprint (VENTURE_PRD_MASTER.md §2)
> **Changelog v1.4.0 (2026-11-05):** Zona punya DUA harga yang terpisah — `surchargeIdr` = charter per kendaraan (PRIVATE), `surchargePerPaxIdr` = fee per orang (SHARED). Delta kelas kendaraan = selisih carter vs standar, bukan carter penuh.
> **Changelog v1.2.0 (2026-10-31):** Tambah mode `SHARED_TRANSFER`, promo price + coupon (no stacking), night surcharge ≥19:00, hotel address / TBA wajib untuk semua mode transfer.
> **Changelog v1.1.0:** Tambah dimensi kelas kendaraan (VehicleClass) untuk PRIVATE_TRANSFER + aturan combo add-on dependen transfer (Klook-style configurator).

## 1. Three Fulfillment Modes

DILARANG membuat produk (SKU) terpisah untuk pickup dan non-pickup. Setiap produk memuat opsi booking pada PDP; varian boleh mengemas mode + durasi + aktivitas sebagai **variant** di bawah satu produk.

### Zone-locked packages (v1.3.0)
- Varian boleh menyimpan `pickupZoneId` untuk mengunci area pickup, mis. "South Bali: Shared Pickup" → Zone 2.
- Efeknya: sheet booking otomatis memilih zona itu (`config.zoneId`), menampilkan baris zona read-only (nama + fee) dan tetap memberi tombol **Change** kalau tamu menginap di area lain.
- **Fee tetap dihitung sekali** oleh `computeQuote` dan mode menentukan angkanya:
  - **SHARED** membaca `zone.surchargePerPaxIdr` (fee per orang).
  - **PRIVATE** membaca `zone.surchargeIdr` (charter per kendaraan) + delta kelas.
  - Mesin TIDAK PERNAH mencampur dua angka ini. Harga tier `pricePerPax` juga **tidak boleh** sudah memuat fee zona — kalau dimasukkan, terjadi double charge.
- Kartu paket menampilkan ringkasan pickup dengan label yang benar (`Ubud · Pickup included`, `South Bali · +Rp 224.000/guest` untuk shared, `+Rp 500.000/vehicle` untuk private).
- Admin dapat mengelola ini lewat CRUD paket (mode + locked zone + price tier) di `/admin/ventures/[id]`; paket dengan booking tidak bisa dihapus.

| | SELF DRIVE (default) | SHARED TRANSFER | PRIVATE TRANSFER |
|---|---|---|---|
| Cara datang | Meet at activity location | Hotel shuttle pool (shared) | Private hotel pickup & drop-off |
| Harga | Base price | Base price + zone fares `surchargePerPaxIdr` **per pax** | Base price + (zone charter `surchargeIdr` + vehicle delta) **per vehicle** |
| Vehicle class | — | Tidak dipakai (ditolak server) | Wajib (SUV / MPV / Minivan) |
| Cut-off | H-2 jam sebelum mulai | H-1 / 22:00 WITA | H-1 / 22:00 WITA |
| Booking | Instant | Instant + pickup schedule | Instant + pickup schedule |

Implementasi: mode adalah **booking option** (`Booking.fulfillmentMode`), BUKAN produk terpisah. `Variant.fulfillmentMode` menentukan mode yang dijual oleh varian; server menolak payload yang modenya tidak cocok dengan varian.

## 2. Pricing Formula

```
PromoActive  = promoPriceIdr != null && promoPriceIdr < tier.pricePerPax
UnitPrice    = PromoActive ? promoPriceIdr : tier.pricePerPax
Subtotal     = UnitPrice × Pax
Discount     = (tier.pricePerPax − UnitPrice) × Pax        // promo
             + round(Subtotal × coupon.discountPercent/100) // coupon, HANYA jika promo tidak aktif
NightFee     = slot.time ≥ 19:00 WITA ? 50.000 × Pax : 0
Transfer     = SELF_DRIVE   → 0
             | SHARED      → zone.surchargePerPaxIdr × Pax        (fee kursi shuttle per orang)
             | PRIVATE     → (zone.surchargeIdr + vehicle delta) × ceil(Pax / vehicleMaxPax)
Addons       = Σ addon.price × Pax
── Final Price (IDR) = Subtotal − CouponDiscount + NightFee + Transfer + Addons
```

- Semua harga disimpan sebagai **IDR integer** (tanpa sen) — Midtrans menagih IDR.
- **USD hanya display** melalui `src/lib/fx.ts` (estimasi konversi, bukan harga tagihan).
- Base price berasal dari `PriceTier.pricePerPax` sesuai pax (tier lookup).
- Harga SHARED per orang dihitung **per grup pemesan** (tier varian), bukan per kursi terisi nyata — dua grup berbeda naik shuttle yang sama tetap masing-masing membayar tarif kursinya. Keputusan bisnis ini dipegang di data, bukan mesin.
- **Promo dan coupon TIDAK PERNAH menumpuk.** Coupon yang dikirim saat promo aktif ditolak `COUPON_NOT_APPLICABLE_ON_PROMO`.
- Discount & surcharge disnapshot ke `Booking.discountIdr`, `Booking.appliedCouponCode`, `Booking.nightSurchargeIdr` agar bisa diaudit setelah promo berakhir.
- Harga WAJIB dihitung ulang di server saat checkout (`computeQuote` di `src/lib/pricing.ts`) — total dari client tidak dipercaya.

## 2b. Dependent Combo Add-ons (Klook-style Configurator)

- Add-on dengan flag `requiresTransfer = true` (mis. Rafting combo, Tubing, Lunch upgrade) **hanya bisa dipilih saat mode transfer** (`SHARED_TRANSFER` atau `PRIVATE_TRANSFER`).
- UI: saat `SELF_DRIVE` ("No Transfer"), combo add-on **disabled/grayed-out** dengan helper "Requires hotel transfer".
- Add-on non-transfer (mis. Photographer) tetap tersedia di semua mode.
- Validasi server: payload yang memuat add-on `requiresTransfer` tanpa mode transfer → ditolak (400).

## 3. Zone Pricing Matrix (dua angka per zona)

Setiap zona menyimpan dua harga yang berbeda dan dipakai oleh mode yang berbeda — **jangan pernah dicampur**:

| Zone | Area | Charter per kendaraan `surchargeIdr` (PRIVATE) | Fee per orang `surchargePerPaxIdr` (SHARED) |
|------|------|-----------------------------------------------|---------------------------------------------|
| Zone 1 | Core Area — Ubud/Gianyar | Rp 500.000 (carter) | Rp 0 (pickup included di harga tier) |
| Zone 2 | South 1 — Kuta, Seminyak, Canggu, Sanur | Rp 700.000 | Rp 224.000 |
| Zone 3 | South 2 — Nusa Dua, Jimbaran, Uluwatu | Rp 800.000 | Rp 320.000 |
| Zone 4 | Outer — Amed, Lovina, Pemuteran, dst. | Custom Quote | Custom Quote |

- Charter per kendaraan = harga nyata operator (driver + BBM + tol) — tamu solo membayar mobil penuh; UI solo menampilkan nudge ke shared.
- Fee per orang = tarif kursi shuttle. Mesin SHARED memakai angka ini saja; angka charter tidak pernah dibagi/ratakan ke tamu shuttle.
- Zona tersimpan sebagai data (`PickupZone`), bukan hardcode — admin bisa menambah area tanpa deploy.
- Zone 4 (`isCustomQuote = true`) tidak bisa di-book instant: UI menampilkan "Request Quote" (via WhatsApp + log), bukan checkout.

### 3.1 Vehicle class delta = SELISIH carter (anti double-charge)

`VehicleClass.deltaIdr` harus diisi **selisih carter terhadap kendaraan standar (Avanza/Xenia)**:

| Kelas | Carter pasar | `deltaIdr` yang benar | Contoh total (Ubud) |
|-------|--------------|----------------------|---------------------|
| STANDARD_SUV | Rp 500.000 | 0 | 500.000 |
| PREMIUM_MPV (Innova) | Rp 1.000.000 | Rp 500.000 | 500K charter + 500K delta = 1.000.000 |
| MINIVAN (HIACE 15 seat) | Rp 1.200.000 | Rp 700.000 | 500K charter + 700K delta = 1.200.000 |

Admin yang memasukkan **carter penuh** ke `deltaIdr` membuat tamu membayar kendaraan dasar dua kali — dilarang. Screen admin menuntinggalkan hint "selisih carter"; upgrade dijual per kendaraan (mengganti kelas), bukan per orang.

## 4. Cut-off Rules (WITA, UTC+8)

| Mode | Cut-off | Artinya |
|------|---------|---------|
| SELF_DRIVE | Mulai − 2 jam | Bisa pesan sampai 2 jam sebelum slot |
| SHARED_TRANSFER | 22:00 WITA pada D-1 | Sama dengan private: armada shuttle dijadwalkan H-1 |
| PRIVATE_TRANSFER | 22:00 WITA pada D-1 | Slot besok pagi harus dipesan maksimal 22:00 WITA hari ini |

Implementasi murni di `src/lib/pricing.ts` (`isBookable`, cutoff functions) — timezone Bali diperlakukan sebagai offset UTC+8 tetap (tanpa DST), diuji dengan test kasus batas.

## 5. Booking Flow

```
PDP → pilih varian (varian menentukan mode) + tanggal & slot
    → pilih pax, pickup zone (+ vehicle class hanya untuk Private)
    → isi alamat hotel/villa atau centang "TBA — konfirmasi H-1"
    → opsional: promo/coupon → kalkulasi harga live (client)
    → POST /api/booking (server re-calculate + zod + cut-off check)
    → Booking PENDING + Midtrans Snap token → bayar → PAID → voucher
```

Aturan checkout (server):
1. Validasi payload dengan zod (`src/lib/bookingSchema.ts`).
2. Recalculate: tier lookup + promo/coupon + night surcharge + zone/vehicle fee.
3. Reject jika melewati cut-off mode terpilih, slot penuh, atau blackout date.
4. Simpan `fulfillmentMode`, `pickupZoneId`, `hotelAddress` / `isTba`, `zoneSurchargeIdr`, `vehicleCount`, `discountIdr`, `appliedCouponCode` di Booking.
5. Midtrans Snap dibuat server-side (`MIDTRANS_SERVER_KEY` tidak pernah ke client).

### 5.1 Reservation and Capacity Protection

- `Booking` adalah source of truth untuk reservation; UI mock dan in-memory state tidak boleh dipakai untuk membuat atau membaca booking produksi.
- Server mengunci `SlotTime` dan menghitung pax pada kombinasi tanggal + slot di dalam transaksi PostgreSQL `Serializable` sebelum membuat booking baru.
- Hold inventaris dimulai **saat booking dibuat** (Step 2 hybrid checkout), bukan saat payment sheet dibuka — menutup celah oversell antara pengisian data tamu dan pembayaran.
- `Booking.expiresAt` = sekarang + `BOOKING_HOLD_MINUTES` (default **10 menit**). Booking `PENDING` hanya memakai capacity selama `expiresAt > now()`.
- Payment session kadaluarsa **tidak boleh dibayar**: `/api/payment/midtrans` menolak dengan `410 HOLD_EXPIRED` dan membatalkan booking; Snap juga diberi `expiry` yang sama.
- Cron `/api/cron/reap-holds` (setiap 10 menit) membatalkan booking `PENDING` yang lewat hold.
- Harga, vehicle count, pickup surcharge, dan add-on yang dipilih selalu dihitung ulang dari data database di server. Nilai total dari browser tidak pernah dipercaya.

### 5.2 Lifecycle & Job Order

- `Booking.lifecycleStatus`: `AWAITING_PAYMENT` → `CONFIRMED` (webhook PAID) → `COMPLETED` (voucher di-redeem) | `NO_SHOW` | `CANCELLED`.
- Manifest lapangan: `/admin/operations` per tanggal aktivitas, dikelompokkan per slot; menampilkan pax, varian, tier kendaraan, pickup/TBA, dan tombol WhatsApp.
- Menutup job order (`POST /api/admin/bookings/[id]/status`) hanya boleh dari `CONFIRMED`; `COMPLETED` menandai voucher `REDEEMED` (`redeemedAt`, `redeemedBy`), `NO_SHOW` menandai voucher `CANCELLED` sesuai `docs/NO_SHOW_POLICY.md`.
- Pembeli tetap **guest** (tanpa password). Setelah PAID, tautan magic yang ditandatangani (30 hari) dikirim lewat email/WhatsApp menuju `/my/bookings`.

## 6. Product Card Priority (listing)

Urutan visual (OTA standard): **Title → Duration → Location → Instant tag → Price → Transfer note** → Free Cancellation → "Pickup available from …".

## 7. Refund & No-Show

Kebijakan pembatalan mengikuti `docs/REFUND_POLICY.md` v2 dan **satu-satunya implementasi** `src/lib/refundUtils.ts`: ≥24 jam sebelum aktivitas → cancel fee 20% (refund 80%); <24 jam → tidak bisa cancel (0%). Reschedule gratis ≥24 jam. UI wajib membaca `REFUND_WINDOWS`, bukan menulis ulang angkanya.

## 8. Notifications & Reminders

| Event | Timing | Channel | Implementasi |
|-------|--------|---------|--------------|
| Booking settled (PAID) | Instan setelah webhook commit | WhatsApp + email | `notifyBookingPaid()` dipanggil di `processMidtransWebhook` |
| Reminder H-24 | 09:00 WITA setiap hari | WhatsApp + email | Cron `GET /api/cron/reminders` (Vercel Cron `0 1 * * *`) |

- Semua percobaan ditulis ke `NotificationLog` (status `SENT`/`FAILED`, `errorMessage`), termasuk saat kredensial belum dikonfigurasi.
- Idempotensi memakai subject stabil (`Booking confirmed`, `Reminder H-24`) + status `SENT`; webhook berulang atau cron ganda tidak mengirim pesan dobel.
- WhatsApp memakai Cloud API (`WHATSAPP_*`). Email memakai **Resend HTTP API via `fetch`** (`RESEND_API_KEY`, `EMAIL_FROM`) — tanpa SDK/dependency tambahan.
- Kegagalan notifikasi **tidak pernah** menggagalkan webhook pembayaran atau cron; error hanya dicatat.
- Cron diamankan dengan header `Authorization: Bearer $CRON_SECRET`; tanpa secret yang cocok responsnya 401.
- QR voucher mengarah ke halaman verifikasi publik `/voucher/verify/[bookingCode]` (read-only, `noindex`), bukan ke data internal.

## 9. Legal acceptance & billing

- Checkout wajib mencentang **Booking Terms** (`/terms`) dan **Activity Safety Waiver** (`/waiver`). Server menolak booking tanpa keduanya (`zod literal true`).
- Acceptance disimpan per booking: `termsAcceptedAt`, `waiverAcceptedAt`, `waiverVersion` — versi mengikuti `src/lib/legal.ts` (`TERMS_VERSION`, `WAIVER_VERSION`).
- Billing address wajib (nama, street, city, postal code, country) dan disimpan di `Booking.billingAddress`, lalu diteruskan ke Midtrans sebagai `customer_details.billing_address`.
- `item_details` Snap dipecah per komponen (paket, evening surcharge, transfer, add-on) dan **selalu berjumlah sama dengan `totalPrice`**; bila baris lama tidak bisa dipecah, dipakai satu baris jujur.
- Teks legal masih **DRAFT** (`docs/TERMS.md`, `docs/SAFETY_WAIVER.md`) dan wajib direview counsel Indonesia sebelum publish.
