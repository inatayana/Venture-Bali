# Venture Bali — Refund & Cancellation Policy

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

## 5. Contoh

| Skenario | Kapan | Hasil |
|----------|-------|-------|
| Batal 48 jam sebelum | 2 hari lalu | Refund 80% |
| Batal 12 jam sebelum | Malam sebelum | Tidak bisa cancel (0%) |
| Tidak datang tanpa konfirmasi | Hari H | No-show (0%) |
| Reschedule 2 hari sebelum | 2 hari lalu | Gratis, ubah jadwal |
| Reschedule 6 jam sebelum | Pagi hari aktivitas | Tidak bisa reschedule |

## 6. Kriteria Produk "Free Cancellation"

Produk bisa menampilkan badge "Free Cancellation" jika mengikuti policy ini secara konsisten. Semua produk Venture Bali mengikuti policy ini.