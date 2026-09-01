# Venture Bali — Operation Contract (Internal)

> **Version:** 1.0.0
> **Status:** INTERNAL. Isi dokumen ini TIDAK BOLEH terekspos ke customer, halaman publik, API publik, atau booking flow.
> **Audience:** Engineering, operations, AI squad (internal).

## 1. Vendor Masking (WAJIB)

- Vendor lokal adalah **fulfillment partner**, bukan brand yang dijual.
- Seluruh komunikasi customer, instruksi penjemputan, voucher, dan branding menggunakan nama **Venture Bali**.
- DILARANG menampilkan nama vendor, kontak vendor, logo vendor, atau struktur kemitraan di:
  - Halaman produk (PDP, cards, listing)
  - Booking flow & checkout
  - Email/WhatsApp konfirmasi ke customer
  - Metadata SEO & structured data

## 2. Data Model

- Field vendor/penyedia (jika ada) hanya hidup di tabel internal (mis. `Tenant` untuk tenant/vendor scoping) dan TIDAK pernah masuk payload API publik (`/api/v1/adventures/*`).
- View model publik (`VentureItem`) tidak memuat field vendor.
- AI content agent juga dilarang menyertakan nama vendor pada title, slug, description, atau JSON produk final.

## 3. Alur Internal Venture ↔ Partner

```
Customer → Venture Bali (booking + bayar)
         → sistem internal membuat instruction sheet (voucher internal)
         → diteruskan ke fulfillment partner via channel internal (WhatsApp/email operasional)
Partner menjalankan aktivitas atas nama Venture Bali
```

- Partner menerima: tanggal, slot, pax, meeting point / alamat pickup, catatan khusus.
- Partner TIDAK menerima: data pembayaran, margin internal, data customer lain.

## 4. Koordinasi Operasional

- Perubahan jadwal/pembatalan dari partner → diproses oleh sistem internal → notifikasi ke customer dikirim sebagai Venture Bali.
- Keluhan customer ditangani support Venture Bali; partner tidak boleh menghubungi customer langsung di luar eksekusi aktivitas.

## 5. Audit

- Setiap perubahan pada halaman publik yang menyentuh konten produk WAJIB melewati title validator + review manual untuk memastikan tidak ada kebocoran informasi vendor.