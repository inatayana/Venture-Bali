# Venture Bali — Booking Flow (End-to-End)

> **Version:** 1.0.0
> **Status:** MUST FOLLOW for booking lifecycle, confirmation, redemption, and settlement logic.
> **Reference:** PRD Flow Detail (Booking Confirmation, Variants, Slot Time, Provider Notification, On-Site Redemption, Post-Activity Flow)
> **Related docs:** `BOOKING_ARCHITECTURE.md` (pricing & fulfillment modes), `REFUND_POLICY.md`, `NO_SHOW_POLICY.md`, `OPERATION_CONTRACT.md`

## 1. Booking Lifecycle Overview

```
[Customer Booking & Payment]
        |
        v
[Payment Gateway Success?] --No--> [Booking Failed → Notify Customer]
        |
       Yes
        v
[Booking Confirmation]
   - Generate Voucher (QR/Code)
   - Send Confirmation (Email/WhatsApp)
   - Include Meeting Point, Slot Time, Safety Notes
   - Insurance & Liability Info (Included)
        |
        v
[Provider Notification]
   - Provider receives booking ID, participants, date, voucher, variants/add-ons
        |
        v
[On-Site Redemption]
   - Customer shows voucher
   - Provider validates (scan/enter code)
   - Status → Redeemed
        |
        v
[Activity Execution]
   - Provider delivers service
   - Add-ons applied (transfer, photo/video, meal, private guide, combo)
        |
        v
[Post-Activity Flow]
   - Provider marks activity completed
   - Customer receives review/feedback request
   - Venture Bali logs transaction
        |
        v
[Settlement & Reporting]
   - Venture Bali generates financial report
   - Settlement to provider sesuai kontrak
   - Audit trail stored
```

## 2. Status Model (Audit Trail)

Setiap booking memiliki **ID unik** (`Booking.id` + `bookingCode`) dan status tercatat di sistem:

| Status | Arti | Dipicu oleh |
|--------|------|-------------|
| `PENDING` | Booking dibuat, menunggu pembayaran | `POST /api/booking` (capacity hold 15 menit) |
| `PAID` (Confirmed) | Pembayaran sukses via Midtrans webhook | `processMidtransWebhook()` |
| `REDEEMED` | Voucher divalidasi provider di lokasi | Provider scan/input manual (Phase 3B) |
| `COMPLETED` | Aktivitas selesai, provider menandai selesai | Provider completion (Phase 3C) |
| `CANCELLED` | Booking dibatalkan / kadaluarsa / refund | Refund policy / no-show policy |

**Prinsip:** satu-satunya jalur ke `PAID` adalah webhook Midtrans terverifikasi (bukan redirect browser). Status hanya bergerak maju: `PENDING → PAID → REDEEMED → COMPLETED` (atau ke `CANCELLED`).

## 3. Booking Confirmation (Trigger: Pembayaran Sukses)

Saat webhook Midtrans menghasilkan `PAID`:

1. **Generate voucher digital** — record `Voucher` (QR code data + kode unik), tercantum di `processMidtransWebhook()` (`src/lib/paymentService.ts`).
2. **Kirim konfirmasi ke customer** (Email + WhatsApp, multi-channel) berisi:
   - Voucher digital (QR code/kode unik)
   - Detail aktivitas: nama, tanggal, jam slot, jumlah peserta
   - Meeting point (alamat + Google Maps link)
   - Safety notes singkat
   - Info bahwa insurance & public liability **included** oleh provider
3. **Notifikasi provider** (Tenant) berisi data operasional: booking ID, jumlah peserta, tanggal, voucher code, variant/add-ons.
4. Semua notifikasi tercatat di `NotificationLog` (audit trail).

**Aturan produk:**
- Insurance & liability SELALU included, ditampilkan di produk — **tidak dijual sebagai add-on**.
- Vendor/partner name TIDAK diekspos ke customer (lihat `OPERATION_CONTRACT.md`); notifikasi provider adalah jalur internal.

## 4. Variants & Add-ons (Ditentukan saat Checkout)

Variants dipilih saat checkout dan otomatis masuk ke provider notification:

| Variant/Add-on | Tipe | Implementasi |
|----------------|------|--------------|
| Datang langsung ke lokasi | Basic | Mode `SELF_DRIVE` (default) |
| Transfer antar-jemput (roundtrip) | Pick-up & drop-off | Mode `PRIVATE_TRANSFER` + `PickupZone` + `VehicleClass` |
| Foto & video package | Pre-order / on-site | `Addon` (non-transfer) |
| Private guide / meal / equipment upgrade | Add-ons | `Addon` (per `requiresTransfer`) |
| Combo adventure (rafting+ATV, tubing+jungle swing, dll.) | Combo | `Addon` dengan `isCombo=true`, `requiresTransfer=true` (dependent matrix) |

Detail lengkap: `BOOKING_ARCHITECTURE.md` §1–2b.

## 5. Slot Time & Availability

- **Slot time** = jam meeting point & jam penjemputan, jelas di PDP dan voucher.
- **Cut-off time** (enforced server-side via `isBookable()`, `src/lib/pricing.ts`):
  - `SELF_DRIVE`: minimal 2 jam sebelum slot
  - `PRIVATE_TRANSFER`: maksimal 22:00 WITA pada D-1
- **Availability control**: produk bisa buka/tutup sesuai kalender provider via `blackoutDates` (libur, maintenance) dan `SlotTime.maxCapacity` vs booked pax (full booked).

## 6. On-Site Redemption — QR Code System

### 6.1 QR Code Generation
- **Trigger:** booking berhasil & pembayaran sukses.
- QR code unik tertaut ke URL verifikasi: `{baseUrl}/redeem/{bookingId}`.
- QR dikirim ke customer (voucher digital) & admin Venture Bali (dashboard).
- **Data embedded:** booking ID, jumlah peserta, produk, variants/add-ons.

### 6.2 Customer Presentation
- Customer menunjukkan QR di lokasi aktivitas (smartphone atau print voucher).
- QR adalah bukti booking valid.

### 6.3 Provider Scan & Validation
- Provider/front desk scan QR dengan smartphone → halaman verifikasi terbuka:
  - Detail booking (aktivitas, jumlah peserta, add-ons)
  - Status pembayaran (Confirmed)
- Provider klik **"Redeem"** untuk validasi.
- **Backup:** jika QR tidak bisa di-scan → input kode booking manual.

### 6.4 System Update & Logging
Setelah Redeem:
- Status booking → `REDEEMED`.
- Log transaksi: booking ID, waktu redeem, provider ID.
- Notifikasi otomatis ke admin Venture Bali.

### 6.5 Prinsip Keamanan Redemption
| Prinsip | Implementasi |
|---------|--------------|
| **One-time redeem** | QR hanya bisa dipakai sekali; redeem kedua ditolak (409) |
| **Provider accountability** | Provider wajib scan & submit hasil ke sistem, bukan sekadar melihat voucher |
| **Transparency** | Customer tahu booking valid karena voucher terverifikasi langsung |
| **Backup** | Input manual kode booking jika QR gagal di-scan |

## 7. Settlement & Reporting

- Semua redeem tercatat di sistem Venture Bali (audit trail).
- **Settlement ke provider HANYA untuk booking berstatus `REDEEMED`.**
- Laporan keuangan digenerate Venture Bali; settlement sesuai kontrak (`OPERATION_CONTRACT.md`).
- Audit trail: setiap booking punya ID unik, status tercatat `Confirmed → Redeemed → Completed`.

## 8. Prinsip Keamanan & Kejelasan (Global)

| Prinsip | Implementasi |
|---------|--------------|
| Insurance & liability | Selalu included, ditampilkan di produk |
| Audit trail | Semua booking punya ID unik, tercatat di sistem |
| Transparency | Customer tahu meeting point, jam, provider; pembayaran tetap ke Venture Bali |
| Provider accountability | Booking valid hanya dengan voucher |
| Customer trust | Notifikasi multi-channel (Email + WhatsApp) |

## 9. Implementasi Berphase

| Phase | Scope | Status |
|-------|-------|--------|
| 3A | Booking confirmation: voucher lengkap (meeting point, safety, insurance), QR asli, notifikasi multi-channel saat PAID | In progress (`feature/booking-confirmation`) |
| 3B | On-site redemption: `POST /api/voucher/verify` + `POST /api/voucher/redeem`, halaman `/redeem/[bookingId]`, input manual, one-time guard | Planned |
| 3C | Post-activity: status COMPLETED (Prisma migration), review request, provider completion endpoint, laporan settlement | Planned |
