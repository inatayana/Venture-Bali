# Venture Bali — Booking Architecture

> **Version:** 1.1.0
> **Status:** MUST FOLLOW for booking flow, pricing, and checkout logic.
> **Reference:** Master blueprint (VENTURE_PRD_MASTER.md §2)
> **Changelog v1.1.0:** Tambah dimensi kelas kendaraan (VehicleClass) untuk PRIVATE_TRANSFER + aturan combo add-on dependen transfer (Klook-style configurator).

## 1. Dual Fulfillment Mode (1 Product = 2 Options)

DILARANG membuat SKU/produk terpisah untuk pickup dan non-pickup. Setiap produk memuat 2 opsi booking pada PDP:

| | MODE 1: SELF DRIVE (default) | MODE 2: PRIVATE TRANSFER |
|---|---|---|
| Cara datang | Meet at activity location | Private hotel pickup & drop-off |
| Harga | Base price | Base price + zone surcharge |
| Cut-off | H-2 jam sebelum mulai | H-1 / 22:00 WITA |
| Booking | Instant | Instant + pickup schedule |

Implementasi: mode adalah **booking option** (`Booking.fulfillmentMode`), BUKAN Variant/SKU terpisah.

## 2. Pricing Formula

```
Final Price (IDR) = (Base Price × Pax)
                  + ((Zone Surcharge + VehicleClass Delta) × VehicleCount)
                  + (Combo Add-on Price × Pax)
VehicleCount      = ceil(Pax / vehicleClass.vehicleMaxPax)   // SUV=4, MPV=6, Minivan=12
```

- Semua harga disimpan sebagai **IDR integer** (tanpa sen) — Midtrans menagih IDR.
- **USD hanya display** melalui `src/lib/fx.ts` (estimasi konversi, bukan harga tagihan).
- Base price berasal dari `PriceTier.pricePerPax` sesuai pax (tier lookup).
- Kelas kendaraan (SUV/MPV/Minivan) adalah **pilihan di dalam mode PRIVATE_TRANSFER**, bukan SKU terpisah; `SELF_DRIVE` tidak kena vehicle class & zone surcharge.
- Harga WAJIB dihitung ulang di server saat checkout — total dari client tidak dipercaya.

## 2b. Dependent Combo Add-ons (Klook-style Configurator)

- Add-on dengan flag `requiresTransfer = true` (mis. Rafting combo, Tubing, Lunch upgrade) **hanya bisa dipilih saat mode PRIVATE_TRANSFER**.
- UI: saat `SELF_DRIVE` ("No Transfer"), combo add-on **disabled/grayed-out** dengan helper "Requires hotel transfer".
- Add-on non-transfer (mis. Photographer) tetap tersedia di kedua mode.
- Validasi server: payload yang memuat add-on `requiresTransfer` tanpa `fulfillmentMode = PRIVATE_TRANSFER` → ditolak (400).

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
| PRIVATE_TRANSFER | 22:00 WITA pada D-1 | Slot besok pagi harus dipesan maksimal 22:00 WITA hari ini |

Implementasi murni di `src/lib/pricing.ts` (`isBookable`, cutoff functions) — timezone Bali diperlakukan sebagai offset UTC+8 tetap (tanpa DST), diuji dengan test kasus batas.

## 5. Booking Flow

```
PDP → pilih tanggal & slot
    → pilih mode: Self Drive | Private Transfer (+ zone picker)
    → pilih pax + addons → kalkulasi harga live (client) 
    → POST /api/v1/booking/checkout (server re-calculate + zod + cut-off check)
    → Booking PENDING + Midtrans Snap token → bayar → PAID → voucher
```

Aturan checkout (server):
1. Validasi payload dengan zod (`src/lib/schemas/booking.ts`).
2. Recalculate: tier lookup + zone surcharge + vehicle count.
3. Reject jika melewati cut-off mode terpilih, slot penuh, atau blackout date.
4. Simpan `fulfillmentMode`, `pickupZoneId`, `zoneSurchargeIdr`, `vehicleCount` di Booking.
5. Midtrans Snap dibuat server-side (`MIDTRANS_SERVER_KEY` tidak pernah ke client).

## 6. Product Card Priority (listing)

Urutan visual (OTA standard): **Title → Duration → Location → Instant tag → Price → Transfer note** → Free Cancellation → "Pickup available from …".

## 7. Refund & No-Show

Kebijakan pembatalan mengikuti `docs/REFUND_POLICY.md` (≥72h 100%, 48–72h 70%, 24–48h 30%, <24h 0%) dan `docs/NO_SHOW_POLICY.md`. Badge "Free Cancellation" hanya untuk produk yang mengikuti kebijakan tersebut.