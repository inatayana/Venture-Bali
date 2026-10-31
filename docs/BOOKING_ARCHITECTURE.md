# Venture Bali — Booking Architecture

> **Version:** 1.2.0
> **Status:** MUST FOLLOW for booking flow, pricing, and checkout logic.
> **Reference:** Master blueprint (VENTURE_PRD_MASTER.md §2)
> **Changelog v1.2.0 (2026-10-31):** Tambah mode `SHARED_TRANSFER`, promo price + coupon (no stacking), night surcharge ≥19:00, hotel address / TBA wajib untuk semua mode transfer.
> **Changelog v1.1.0:** Tambah dimensi kelas kendaraan (VehicleClass) untuk PRIVATE_TRANSFER + aturan combo add-on dependen transfer (Klook-style configurator).

## 1. Three Fulfillment Modes

DILARANG membuat produk (SKU) terpisah untuk pickup dan non-pickup. Setiap produk memuat opsi booking pada PDP; varian boleh mengemas mode + durasi + aktivitas sebagai **variant** di bawah satu produk.

| | SELF DRIVE (default) | SHARED TRANSFER | PRIVATE TRANSFER |
|---|---|---|---|
| Cara datang | Meet at activity location | Hotel shuttle pool (shared) | Private hotel pickup & drop-off |
| Harga | Base price | Base price + zone surcharge **per pax** | Base price + (zone surcharge + vehicle delta) **per vehicle** |
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
             | SHARED      → zone.surchargeIdr × Pax
             | PRIVATE     → (zone.surchargeIdr + vehicle delta) × ceil(Pax / vehicleMaxPax)
Addons       = Σ addon.price × Pax
── Final Price (IDR) = Subtotal − CouponDiscount + NightFee + Transfer + Addons
```

- Semua harga disimpan sebagai **IDR integer** (tanpa sen) — Midtrans menagih IDR.
- **USD hanya display** melalui `src/lib/fx.ts` (estimasi konversi, bukan harga tagihan).
- Base price berasal dari `PriceTier.pricePerPax` sesuai pax (tier lookup).
- **Promo dan coupon TIDAK PERNAH menumpuk.** Coupon yang dikirim saat promo aktif ditolak `COUPON_NOT_APPLICABLE_ON_PROMO`.
- Discount & surcharge disnapshot ke `Booking.discountIdr`, `Booking.appliedCouponCode`, `Booking.nightSurchargeIdr` agar bisa diaudit setelah promo berakhir.
- Harga WAJIB dihitung ulang di server saat checkout (`computeQuote` di `src/lib/pricing.ts`) — total dari client tidak dipercaya.

## 2b. Dependent Combo Add-ons (Klook-style Configurator)

- Add-on dengan flag `requiresTransfer = true` (mis. Rafting combo, Tubing, Lunch upgrade) **hanya bisa dipilih saat mode transfer** (`SHARED_TRANSFER` atau `PRIVATE_TRANSFER`).
- UI: saat `SELF_DRIVE` ("No Transfer"), combo add-on **disabled/grayed-out** dengan helper "Requires hotel transfer".
- Add-on non-transfer (mis. Photographer) tetap tersedia di semua mode.
- Validasi server: payload yang memuat add-on `requiresTransfer` tanpa mode transfer → ditolak (400).

## 3. Zone Surcharge Matrix (per vehicle)

| Zone | Area | USD | IDR (rate 16.000) |
|------|------|-----|-------------------|
| Zone 1 | Core Area — Ubud/Gianyar | $0 | Rp 0 (included) |
| Zone 2 | South 1 — Kuta, Seminyak, Canggu, Sanur | $14 | Rp 224.000 |
| Zone 3 | South 2 — Nusa Dua, Jimbaran, Uluwatu | $20 | Rp 320.000 |
| Zone 4 | Outer — Amed, Lovina, Pemuteran, dst. | Custom Quote | Custom Quote |

- Zone tersimpan sebagai data (`PickupZone` model), bukan hardcode — admin bisa menambah area tanpa deploy.
- Zone 4 (`isCustomQuote = true`) tidak bisa di-book instant: UI menampilkan "Request Quote" (via WhatsApp + log), bukan checkout.

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
- Booking dengan status `PAID` selalu memakai capacity. Booking `PENDING` memakai capacity selama 15 menit sebagai payment hold; hold yang lebih lama tidak lagi menghitung availability.
- Harga, vehicle count, pickup surcharge, dan add-on yang dipilih selalu dihitung ulang dari data database di server. Nilai total dari browser tidak pernah dipercaya.

## 6. Product Card Priority (listing)

Urutan visual (OTA standard): **Title → Duration → Location → Instant tag → Price → Transfer note** → Free Cancellation → "Pickup available from …".

## 7. Refund & No-Show

Kebijakan pembatalan mengikuti `docs/REFUND_POLICY.md` (≥72h 100%, 48–72h 70%, 24–48h 30%, <24h 0%) dan `docs/NO_SHOW_POLICY.md`. Badge "Free Cancellation" hanya untuk produk yang mengikuti kebijakan tersebut.
