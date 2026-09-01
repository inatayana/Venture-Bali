# Venture Bali — No-Show Policy

> **Version:** 2.0.0
> **Status:** MUST FOLLOW.

## 1. Definisi No-Show

Customer dianggap **no-show** jika:

1. Tidak datang ke aktivitas pada jadwal yang sudah dipesan.
2. **Tidak ada konfirmasi** (balas reminder) ≥ 1 hari (24 jam) sebelum jam aktivitas dimulai.

## 2. Konsekuensi

- **Cancel fee 100%** — tidak ada refund.
- Booking status berubah ke `CANCELLED` (no-show).
- Voucher tidak dapat digunakan.

## 3. Reminder System

Sistem mengirim reminder via WhatsApp/Telegram:

| Waktu | Isi |
|-------|-----|
| **H-2 (2 hari sebelum)** | Pengingat jadwal + link reschedule |
| **H-1 (1 hari sebelum, pagi)** | Konfirmasi kehadiran (balas YA/TIDAK) |
| **H-1 (malam, 20:00 WITA)** | Deadline konfirmasi jika belum balas |

## 4. Konfirmasi Kehadiran

- Customer cukup balas `YA` atau `HADIR` di WhatsApp/Telegram.
- Jika balas `TIDAK` atau `TIDAK BISA` → sistem proses pembatalan dengan cancel fee 20% (jika ≥ 1 hari).
- Jika tidak balas sama sekali sampai deadline → no-show.

## 5. Vendor Notification

- H-1 pukul 21:00 WITA: sistem notifikasi vendor daftar peserta yang sudah konfirmasi.
- H-0 pagi: vendor menerima manifest final (nama, jumlah pax, slot time).