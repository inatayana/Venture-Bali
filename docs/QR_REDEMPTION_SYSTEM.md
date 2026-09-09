# Venture Bali — QR Code Redemption System

> **Version:** 1.0.0
> **Status:** MUST FOLLOW untuk QR generation, validasi on-site, dan audit redemption.
> **Parent doc:** `BOOKING_FLOW.md` (lifecycle lengkap). Dokumen ini merinci subsistem redemption QR.

## 1. QR Code Generation

**Trigger:** booking berhasil & pembayaran sukses (webhook Midtrans `PAID`).

**System action:**
1. Generate QR code unik → tertaut ke URL verifikasi: `{baseUrl}/redeem/{bookingId}`.
2. QR dikirim ke customer (voucher digital di `/voucher/[bookingId]`) & admin Venture Bali (dashboard).
3. Data embedded: booking ID, jumlah peserta, produk, variants/add-ons.

**Format payload QR** (`generateQRCodeData()` di `src/lib/voucher.ts`):

```
{baseUrl}/redeem/{bookingId}?code={bookingCode}
```

- `bookingId` → identitas booking (primary lookup).
- `bookingCode` (`BK-XXXX-XXXXXX`) → kode yang bisa di-input manual sebagai backup.

## 2. Customer Presentation

- Customer menunjukkan QR code di lokasi aktivitas (via smartphone atau print voucher).
- QR code berfungsi sebagai **bukti booking valid** — satu-satunya instrumen yang diterima provider.

## 3. Provider Scan & Validation

Provider/front desk scan QR dengan smartphone → halaman verifikasi terbuka (`/redeem/[bookingId]`):

**Halaman verifikasi menampilkan:**
- Detail booking: aktivitas, jumlah peserta, add-ons
- Status pembayaran (Confirmed/`PAID`)
- Tombol **"Redeem"** untuk validasi

**Flow validasi:**
```
Scan QR ──> /redeem/{bookingId} ──> tampilkan detail ──> [Redeem] ──> status REDEEMED
                                              |
Fallback: input kode booking manual (bookingCode)
```

## 4. System Update & Logging

Setelah provider klik Redeem:

| Aksi | Implementasi |
|------|--------------|
| Status booking → `REDEEMED` | `Voucher.status = REDEEMED`, `Voucher.redeemedAt`, `Voucher.redeemedBy` (provider ID) |
| Log transaksi | Booking ID, waktu redeem, provider ID tercatat |
| Notifikasi admin | Venture Bali admin menerima notifikasi otomatis |

## 5. Audit Trail & Settlement

- Semua redeem tercatat di sistem Venture Bali.
- **Settlement ke provider hanya untuk booking berstatus `REDEEMED`.**
- Audit trail per booking: `Confirmed → Redeemed → Completed` (ID unik, semua transisi tercatat).

## 6. Prinsip Keamanan

| Prinsip | Aturan |
|---------|--------|
| **One-time redeem** | QR hanya bisa dipakai sekali; attempt kedua → ditolak (409), log attempt tetap tercatat |
| **Provider accountability** | Provider wajib scan & kirim hasil ke sistem, bukan sekadar melihat voucher |
| **Transparency** | Customer tahu booking valid karena voucher diverifikasi langsung oleh provider |
| **Backup** | Input manual kode booking jika QR tidak bisa di-scan |
| **Payment truth** | Status Confirmed hanya dari webhook Midtrans; halaman verifikasi membaca status dari DB, tidak dari QR payload |

## 7. API Specification (Phase 3B)

| Endpoint | Method | Fungsi | Response utama |
|----------|--------|--------|----------------|
| `/api/voucher/verify` | POST | Validasi booking ID + kode; kembalikan detail booking & status voucher | `{ status, booking, voucherState }` |
| `/api/voucher/redeem` | POST | Tandai REDEEMED (guard: harus `PAID` + voucher `ACTIVE`) | `{ success, redeemedAt }` — 409 jika sudah redeemed |

**Aturan:**
- Redeem hanya valid untuk voucher `ACTIVE` + booking `PAID`.
- Semua request ter-audit (siapa, kapan, hasil).

## 8. Implementasi Berphase

| Phase | Scope | Status |
|-------|-------|--------|
| 3A | QR asli (lib `qrcode`), voucher digital lengkap, notifikasi konfirmasi | In progress |
| 3B | Endpoint verify/redeem + halaman `/redeem/[bookingId]` + input manual + one-time guard | Planned |
| 3C | Post-activity (COMPLETED), settlement report | Planned |
