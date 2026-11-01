# BaliWild — Refund & Cancellation Policy

> **Version:** 2.0.0
> **Status:** MUST FOLLOW. Enforced by `src/lib/refundUtils.ts`.

## 1. Cancellation Rules

| Kapan dibatalkan | Kondisi | Hasil |
|------------------|---------|-------|
| **≥ 1 hari (24 jam) sebelum jam aktivitas** | Batal melalui sistem/WhatsApp | **Cancel fee 20%** → Refund 80% |
| **< 1 hari (24 jam) sebelum jam aktivitas** | Mau dibatalkan | **Tidak bisa cancel**, dianggap no-show jika tidak datang |

## 2. Reschedule (Perubahan Jadwal)

- Customer bisa reschedule **≥ 1 hari (24 jam) sebelum jam aktivitas**.
- Reschedule melalui WhatsApp/Telegram → sistem otomatis ubah jadwal.
- **< 1 hari sebelum aktivitas**: tidak bisa reschedule.

## 3. No-Show (Tidak Datang)

- Jika customer tidak datang dan **tidak ada konfirmasi ≥ 1 hari sebelum aktivitas**, dianggap **no-show**.
- No-show = cancel fee 100% (tidak ada refund).
- Konfirmasi: customer harus balas reminder WhatsApp/Telegram ≥ 1 hari sebelum aktivitas.

## 4. Refund Process

- Refund diproses dalam **3 hari kerja** setelah pembatalan dikonfirmasi.
- Refund dikembalikan ke metode pembayaran asal.
- Dana dikirim ke rekening/virtual account yang tercatat di Midtrans.

### 4.1 Implementasi aplikasi (v1)

- Tamu membatalkan sendiri dari `/my/bookings?token=…` (magic link). Sistem
  menghitung 80%/0% dari tanggal + jam slot di WITA.
- Pembatalan yang sah membuat row `Refund` (`PENDING`), membatalkan voucher,
  dan mengubah lifecycle booking menjadi `CANCELLED`. `paymentStatus` tetap
  `PAID` sampai uang benar-benar dikembalikan.
- Admin memproses di `/admin/refunds`:
  - **Refund via Midtrans** → memanggil `/v2/{order_id}/refund`, menyimpan
    `providerRef`, lalu set `PARTIALLY_REFUNDED`.
  - **Mark manual refund** → untuk transfer bank/manual di luar Midtrans.
- Setelah diproses, payment status menjadi `PARTIALLY_REFUNDED`; refund penuh
  (jika suatu saat diperlukan) menjadi `REFUNDED`.
- Reschedule mandiri tersedia di halaman yang sama (≥24 jam sebelum trip),
  gratis, dengan validasi kapasitas + blackout date, dan audit `BookingChange`.

## 5. Contoh

| Skenario | Kapan | Hasil |
|----------|-------|-------|
| Batal 48 jam sebelum | 2 hari lalu | Refund 80% |
| Batal 12 jam sebelum | Malam sebelum | Tidak bisa cancel (0%) |
| Tidak datang tanpa konfirmasi | Hari H | No-show (0%) |
| Reschedule 2 hari sebelum | 2 hari lalu | Gratis, ubah jadwal |
| Reschedule 6 jam sebelum | Pagi hari aktivitas | Tidak bisa reschedule |

## 6. Kriteria Produk "Free Cancellation"

Produk bisa menampilkan badge "Free Cancellation" jika mengikuti policy ini secara konsisten. Semua produk BaliWild mengikuti policy ini.