# BaliWild — Access & Identity Model

> **Version:** 1.1.0 · **Last updated:** 2026-11-25
> **Purpose:** memisahkan secara tegas tiga dunia yang sebelumnya tercampur: **guest**, **customer account**, dan **operator/admin**.

---

## 1. Temuan investigasi

| Area | Kondisi sebelum perbaikan | Keputusan |
|---|---|---|
| Drawer mobile admin | `SheetContent` memakai `bg-background`, token tidak ada di Tailwind → transparan | Token semantic ditambahkan + background eksplisit di `sheet.tsx` |
| Tema admin | Memakai `baliwild_theme` yang sama dengan situs customer, palet kuning yang sama | Storage key terpisah `baliwild_admin_theme`, palet **indigo/slate** scoped `[data-admin='true']` |
| Identitas visual | Sidebar memakai wordmark publik + label "Operator Panel" | Header khusus: **"Operator console"**, badge role, email operator, ikon kunci |
| Role | `VIEWER/EDITOR/ADMIN/SUPER_ADMIN` ada di session, tapi tidak dipakai UI | Nav difilter oleh `role`; `VIEWER` melihat pesan read-only |
| Customer account | `useCustomerSession` sekarang membaca `/api/account/me`; tamu tetap pakai magic link | **Phase 1 selesai** di `feature/customer-account` — lihat [CUSTOMER_ACCOUNT_DESIGN.md](./CUSTOMER_ACCOUNT_DESIGN.md). Session customer terpisah dari `vb_admin_session` |

---

## 2. Tiga sisi yang harus dibedakan

### A. Guest (belum punya akun)
- **Bisa:** jelajahi katalog, lihat harga/slot, chat AI, simpan wishlist (localStorage), booking via magic link.
- **Tidak bisa:** melihat data tamu lain, mengelola produk, mengubah harga/status booking.
- Identitas: header publik, palet **kuning/hitam**, tagline *Own the wild.*

### B. Customer account (Phase 1 fondasi selesai)
- **Rencana:** login OTP email 6 digit (passwordless), melihat trip sendiri, review, invoice, waivers, riwayat pembayaran, wishlist tersinkron.
- **Status hari ini:** auth fondasi + `/profile` nyata + `/login` aktif; guest di-redirect ke `/login?next=/profile`, sign out me-revoke session. **Tidak boleh** membaca session admin.
- Identitas: cookie `__Host-bw_customer` (produksi) / `bw_customer` (lokal), secret `CUSTOMER_SESSION_SECRET`, DAL `requireCustomer()`. Tidak ada kode admin yang boleh memakai cookie ini.
- **Jangan** menaruh tautan fitur customer di sidebar admin.

### C. Operator / Admin
- **Bisa:** mengelola produk, variant, harga, slot, booking, refund, review, vendor, konten AI, SEO, dan melihat KPI.
- **Harus:** login dengan session bertanda tangan (`vb_admin_session`), role minimal `EDITOR` untuk semua halaman saat ini.
- Identitas: **Operator console**, palet **indigo/slate**, tidak memakai wordmark sebagai satu-satunya penanda.

> Aturan emas: **identity admin tidak boleh bocor ke sisi publik**, dan **session customer tidak boleh memberi akses admin**.

---

## 3. Matrix akses operator (implementasi saat ini)

| Menu | VIEWER | EDITOR | ADMIN | SUPER_ADMIN |
|---|:---:|:---:|:---:|:---:|
| Dashboard | — | ✅ | ✅ | ✅ |
| Products | — | ✅ | ✅ | ✅ |
| Bookings | — | ✅ | ✅ | ✅ |
| Operations | — | ✅ | ✅ | ✅ |
| Refunds | — | ✅ | ✅ | ✅ |
| Reviews | — | ✅ | ✅ | ✅ |
| Vendors | — | ✅ | ✅ | ✅ |
| Pickup Zones | — | ✅ | ✅ | ✅ |
| Revenue / Growth | — | ✅ | ✅ | ✅ |
| AI Content / SEO / Invites | — | ✅ | ✅ | ✅ |

Semua endpoint API admin saat ini memakai `requireAdminRole()` dengan minimum `EDITOR` untuk read dan sebagian `ADMIN` untuk write (lihat `src/app/api/admin/**`). Karena itu `VIEWER` sengaja **tidak diberi menu** — memberi tautan yang akan 401 adalah UX yang lebih buruk daripada pesan "read-only role".

### Status implementasi
- ✅ UI nav difilter berdasarkan role.
- ✅ Badge role + email operator ditampilkan.
- ✅ VIEWER mendapat pesan read-only, bukan menu rusak.
- ⏭️ Belum: halaman Settings/User Management untuk `SUPER_ADMIN`.
- ⏭️ Belum: read-only API untuk `VIEWER` (perlu penyesuaian `requireAdminRole` per method).

---

## 4. Urutan kerja ke depan

1. **Selesaikan auth customer** (OTP email + session cookie terpisah) sebelum menambahkan menu "akun saya" di sisi publik — sedang dikerjakan di `feature/customer-account`, lihat [CUSTOMER_ACCOUNT_DESIGN.md](./CUSTOMER_ACCOUNT_DESIGN.md).
2. **Tambah halaman User Management** (hanya `SUPER_ADMIN`) untuk mengubah role operator.
3. **Role-based API yang halus**: GET boleh `VIEWER`, POST/PUT/DELETE minimal `EDITOR`/`ADMIN`.
4. **Audit log**: setiap perubahan harga/status dicatat dengan `adminId`.
5. **Pisahkan domain/theme sepenuhnya** jika admin nanti dipindah ke subdomain terpisah (`ops.baliwild.com`).

---

## 5. Definition of Done untuk perubahan identitas

- [ ] Drawer mobile admin punya background solid dan overlay gelap.
- [ ] Tidak ada token Tailwind undefined yang dipakai komponen admin.
- [ ] Palet admin berbeda dari palet customer.
- [ ] Role ditampilkan dan nav mengikuti role.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` hijau.
