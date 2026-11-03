# Memo — Product Media Compression (WebP < 300 KB)

> **Status:** Backlog — belum diimplementasikan
> **Date:** 2026-11-03
> **Priority:** High, sebelum admin memakai upload galeri di production
> **Owner:** Product / Engineering
> **Terkait:** `docs/PRODUCT_MANAGER.md`, `src/components/admin/VentureForm.tsx`,
> `src/lib/compressImage.ts`, `src/lib/productMedia.ts`,
> `src/app/api/admin/product-media/route.ts`

## Tujuan

Admin cukup **drag & drop atau browse** foto produk. Sistem otomatis:

1. Mengompres ke **WebP**
2. Batas akhir **≤ 300 KB per foto**
3. Tetap tajam untuk hero/gallery (max edge 1600 px)
4. Menampilkan ukuran akhir di UI
5. Menolak file yang masih terlalu besar setelah kompresi

Tidak boleh ada langkah manual "kompres dulu di luar" untuk admin.

## Kondisi saat ini

- `ReviewPhotoUploader` dan `VentureForm` memakai `compressReviewPhoto`:
  - max edge **1600 px**
  - WebP quality **0.82**
  - output dicek ≤ **5 MB**
- `POST /api/admin/product-media` menerima JPG/PNG/WebP sampai **5 MB**
- Belum ada loop kualitas, belum ada target 300 KB, dan server belum
  memverifikasi ukuran akhir.
- Aset lama `public/images/bali-wild-jambe*.jpg` berukuran ±0,34–3,12 MB.

## Rancangan implementasi

### 1. Kompresi adaptif di browser

Tambahkan fungsi baru di `src/lib/compressImage.ts`:

```ts
compressToTarget(file, {
  maxEdge: 1600,
  maxBytes: 300 * 1024,
  qualityStart: 0.82,
  qualityMin: 0.45,
  minEdge: 800,
}): Promise<{
  file: File;       // image/webp
  width: number;
  height: number;
  bytes: number;
  quality: number;
}>
```

Algoritma:

1. Decode gambar, hormati orientasi EXIF.
2. Hitung dimensi target (aspect ratio dipertahankan, max edge 1600).
3. Render ke canvas, ekspor WebP kualitas 0.82.
4. Jika > 300 KB: turunkan quality bertahap (0.72, 0.62, 0.52, 0.45).
5. Jika masih > 300 KB: perkecil edge 85% (1600 → 1360 → 1156 → …,
   minimum 800) lalu ulangi quality loop.
6. Jika masih > 300 KB pada edge 800/quality 0.45: tolak dengan pesan jelas.
7. Strip metadata (canvas export otomatis).
8. Kembalikan ukuran akhir untuk ditampilkan di UI.

### 2. UI admin

- Hero dan gallery memakai `compressToTarget`.
- Selama upload: spinner + "Optimising…".
- Setelah upload: tampilkan `WebP · 245 KB · 1600×1067`.
- Jika gagal: error inline di section Media, bukan hanya di bawah form.
- Batas 8 foto gallery tetap.
- Reorder/set hero/delete tetap seperti sekarang.

### 3. Validasi server

`POST /api/admin/product-media`:

- Hanya menerima `image/webp` (setelah kompresi browser).
- Tolak `file.size > 300 * 1024` dengan `413 FILE_TOO_LARGE`.
- Tetap batasi ukuran request mentah (mis. 5 MB) sebelum membaca file.
- Simpan `Content-Type: image/webp`.
- Path Supabase tetap `products/YYYY-MM/<uuid>.webp`.

Catatan: server tidak melakukan kompresi (tidak menambah Sharp); browser adalah
satu-satunya encoder. Jika kelak ada upload non-browser/API, endpoint terpisah
harus menolak atau menambahkan worker kompresi.

### 4. Aset lama

Ada dua opsi, perlu keputusan owner:

**Opsi A — re-upload melalui admin (rekomendasi, tanpa dependency baru)**
- Setelah Supabase `product-media` aktif, admin upload ulang 5 foto Jambe.
- Sistem mengompres ke WebP < 300 KB.
- Ganti URL di produk ke URL Supabase.
- File JPG besar di repo bisa dihapus setelah tidak dipakai.

**Opsi B — script build-time**
- Butuh encoder server (mis. `sharp`) yang belum ada di dependencies.
- AGENTS.md §4 melarang menambah dependency tanpa persetujuan owner.
- Jika disetujui: script `scripts/optimize-product-images.ts` mengubah
  `public/images/products/*` ke WebP dan memperbarui referensi.

Default memo ini: **Opsi A**.

### 5. Test

- Unit test fungsi murni: hitung dimensi, pilih quality, batas 300 KB.
- Test API: menolak file > 300 KB dan non-WebP.
- Manual browser:
  - upload JPG 10 MB → hasil ≤ 300 KB, WebP, tampil di preview
  - upload PNG transparan → tetap WebP
  - upload 8 foto → semua lolos atau pesan jelas
  - foto miring (EXIF) → orientasi benar

## Acceptance criteria

- [ ] Drag & drop dan browse berfungsi untuk hero dan gallery
- [ ] Semua hasil upload adalah `image/webp`
- [ ] Setiap file hasil upload **≤ 300 KB**
- [ ] Max edge 1600 px, aspect ratio tidak berubah
- [ ] UI menampilkan ukuran akhir dan dimensi
- [ ] Server menolak file > 300 KB / non-WebP
- [ ] Foto gagal kompresi menampilkan pesan yang bisa ditindaklanjuti
- [ ] 8 foto gallery, reorder, set hero, delete tetap berfungsi
- [ ] Tidak ada dependency baru tanpa persetujuan owner

## Out of scope

- Kompresi video
- AI upscaling / background removal
- Konversi aset review (bisa menyusul dengan target berbeda)
- CDN transform di Supabase

## Checklist PR berikutnya

1. [ ] Implement `compressToTarget` + test
2. [ ] Ganti pemakaian di `VentureForm`
3. [ ] Tampilkan ukuran akhir di kartu media
4. [ ] Perketat validasi `POST /api/admin/product-media`
5. [ ] Update `docs/PRODUCT_MANAGER.md`
6. [ ] Uji 10 MB JPG, PNG, 8 foto, mobile 390px
7. [ ] Putuskan Opsi A/B untuk aset Jambe
