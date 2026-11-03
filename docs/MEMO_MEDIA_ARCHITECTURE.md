# Memo — Arsitektur Media BaliWild (1 Master + Optimizer per Perangkat)

> **Status:** Approved — siap implementasi (produk dulu)
> **Date:** 2026-11-03
> **Menggantikan:** `docs/MEMO_PRODUCT_MEDIA_COMPRESSION.md` (digabung ke sini)
> **Owner:** Product / Engineering
> **Terkait:** `docs/PRODUCT_MANAGER.md`, `docs/TECH_DECISION_LOG.md` §9,
> `docs/DEPLOYMENT_STRATEGY.md` §2.3, `src/lib/compressImage.ts`,
> `src/lib/productMedia.ts`, `src/lib/reviewPhotos.ts`,
> `src/app/api/admin/product-media/route.ts`, `next.config.js`

## Keputusan owner (2026-11-03)

1. **Delivery:** simpan **satu file WebP master** per foto; ukuran per perangkat
   disajikan otomatis oleh Vercel Image Optimization lewat `next/image`.
   Tidak menyimpan varian per perangkat di storage.
2. **Scope:** hirarki folder lengkap ditetapkan sekarang; implementasi kode
   dimulai dari **media produk** (hero + gallery). `content/` dan `reviews/`
   menyusul.
3. **Standar ukuran:** tabel standar di bawah disetujui.
4. **Validasi informatif:** standar diterapkan ketat. File yang tidak memenuhi
   syarat **ditolak saat dipilih** (bukan setelah save) dengan pesan yang
   menyebut angka aktual foto admin dan angka minimal yang harus dipenuhi.
5. **Rasio bukan 3:2:** diterima + **preview crop 3:2 + peringatan** presentase
   yang terpotong — bukan ditolak.
6. **Struktur foto produk:** maks **7 foto per produk** — 1 main cover
   (wajib) + 6 foto gallery yang mengikuti urutan highlight itinerary.
7. **Varian tanpa gallery:** varian boleh punya **0–1 cover opsional**
   yang di-reuse dari 7 foto produk (bukan upload baru); tanpa cover →
   fallback ke main cover produk.

## Prinsip

- Simpan **satu** file WebP master per foto di Supabase Storage.
- Perangkat pengunjung mendapat ukuran pas otomatis dari optimizer
  `/_next/image` (di-cache di edge) — varian tidak pernah disimpan di storage.
- Kompresi terjadi **di browser saat admin memilih file**, bukan setelah
  submit — admin melihat hasil akhir sebelum menyimpan.
- Upload boleh dari folder sumber mana saja; sistem yang menormalkan
  (format, dimensi, rasio tampilan, byte).
- Brand asset (logo, OG default, favicon) tetap di repo `public/` — terikat
  deploy, bukan konten dinamis.

## Hirarki penyimpanan

Satu bucket public `venture-assets` (selaras `DEPLOYMENT_STRATEGY.md` §2.3
dan `TECH_DECISION_LOG.md` §9):

```
venture-assets/                        ← 1 bucket public, cache immutable
├── products/                          ← MEDIA PRODUK (terikat Venture)
│   └── 2026-11/
│       └── <sha256-12>.webp           ← hash konten hasil kompresi
├── content/                           ← MEDIA PENDUKUNG (non-produk)
│   ├── hero/                          ← banner homepage
│   ├── banners/                       ← promo / section landing
│   └── articles/                      ← guide / blog (menyusul)
└── reviews/                           ← FOTO REVIEW TAMU (terikat booking)
    └── 2026-11/
        └── <sha256-12>.webp
```

- **Penamaan content hash** (12 hex awal SHA-256 dari byte WebP hasil
  kompresi): upload ulang foto identik menghasilkan path yang sama → tidak
  ada duplikat tersimpan untuk hal yang sama.
- Upload memakai `x-upsert: true` (idempotent) + `cache-control: 31536000`
  (sudah berlaku di kode saat ini).

### Migrasi bucket

| Media | Kondisi | Aksi |
|---|---|---|
| `products/` | Upload belum dipakai di production — tidak ada data | Langsung pindah ke `venture-assets`, tanpa migrasi |
| `content/` | Belum ada | Mulai fresh di `venture-assets` |
| `reviews/` | Upload review **sudah live** — mungkin ada foto tamu tersimpan | `SUPABASE_REVIEW_BUCKET` tetap dipakai dulu; migrasi via script satu kali (copy objek + rewrite URL di DB) sebagai PR terpisah |

Env: perkenalkan `SUPABASE_ASSETS_BUCKET` (default `venture-assets`) untuk
product/content media; `SUPABASE_REVIEW_BUCKET` dipertahankan sampai migrasi
reviews selesai. Semua env didokumentasikan di `.env.example` saat implementasi
(AGENTS.md §7).

## Struktur media produk (disetujui)

Maks **7 foto per produk** (master ±2,1 MB per produk) dengan peran jelas
untuk tiap foto:

| Slot | Jumlah | Peran | Sumber |
|---|---|---|---|
| Main cover (`imageUrl`) | 1, wajib | Money shot: card, hasil pencarian, related products, OG image | Upload admin |
| Gallery (`gallery`) | maks 6 | Highlight itinerary — urut mengikuti urutan itinerary; tampil di slider mobile + lightbox | Upload admin |
| Variant cover (`Variant.imageUrl`) | 0–1, opsional | Lead photo saat paket dipilih; hanya jika paket tampak fisik berbeda (kendaraan private, alat, ukuran grup) | **Reuse** salah satu dari 7 foto produk — picker, bukan upload baru |

Alasan analisis:

- PDP desktop hanya menampilkan 4 tile (1 besar + 3 kecil); foto ke-5 dst.
  hanya muncul di lightbox — dengan 7 foto, semua slot punya tujuan tampil.
- Produk rata-rata punya 4–6 langkah itinerary (katalog saat ini: 46 langkah
  / 10 produk) → aturan "1 foto per highlight" memberi admin panduan konten
  yang jelas, bukan tebak-tebakan.
- Kurasi 6 foto memaksa memilih visual terbaik — lebih powerfull daripada
  8 foto campuran, dan jumlah seragam antar produk menjaga PDP konsisten.
- Reuse variant cover = nol file tambahan di storage.

### Varian

- **Tanpa gallery per varian** — varian adalah paket dari pengalaman yang
  sama; gallery duplikat per varian melanggar prinsip tanpa-duplikat dan
  membebani admin.
- Variant cover **harus reuse** foto produk (picker dari 7 foto). Jika
  paket tidak tampak beda, biarkan kosong — fallback ke main cover sudah
  bekerja di `VariantDetailModal` dan `VariantCatalogCard`
  (`variant.imageUrl ?? fallbackImageUrl`).
- **Gap yang harus ditutup:** form admin belum bisa meng-set
  `Variant.imageUrl` (`adminVentureSchema` tidak memuatnya di skema
  varian) — tambahkan picker di editor paket saat implementasi.

## Standar ukuran (disetujui)

| Role | Rasio | Max edge (master) | Min edge | Max byte | Format |
|---|---|---|---|---|---|
| Product hero | 3:2 | 1600 px | 1200 px | 300 KB | WebP |
| Product gallery | 3:2 | 1600 px | 1000 px | 300 KB | WebP |
| Homepage hero | 16:9 | 1920 px | 1280 px | 400 KB | WebP |
| Content/banner | 16:9 | 1920 px | 1200 px | 350 KB | WebP |
| Review photo | bebas | 1280 px | 480 px | 200 KB | WebP |
| OG image | 1200×630 | fixed | fixed | 150 KB | WebP |

Konsistensi visual ("semua serentak dan sama saat ditampilkan") dicapai lewat
tiga lapis: **(1)** gate ukuran minimal di upload, **(2)** slot display pakai
rasio tetap + `object-cover`, **(3)** target byte per role agar berat halaman
bisa diprediksi.

## Validasi informatif saat upload (produk)

Standar ditampilkan di dropzone **sebelum** admin memilih file:

> Hero: minimal 1200px sisi terpanjang · rasio 3:2 · JPG/PNG/WebP ·
> otomatis dikompres ke WebP ≤ 300 KB

Validasi berjalan di browser **saat file dipilih**:

| Pemeriksaan | Standar | Jika gagal |
|---|---|---|
| Format input | JPG/PNG/WebP | Tolak: "Format tidak didukung. Gunakan JPG, PNG, atau WebP." |
| Resolusi minimal | Hero ≥ 1200px, gallery ≥ 1000px (sisi terpanjang) | Tolak dengan angka aktual: "Foto Anda **800×600** — terlalu kecil untuk hero. Minimal **1200px** sisi terpanjang agar tajam di semua perangkat." |
| Ukuran file mentah | ≤ 15 MB | Tolak dengan ukuran aktual ditampilkan |
| Hasil kompresi | ≤ 300 KB (WebP) | Tolak: "Foto terlalu padat detail untuk dikompres ke 300 KB. Pergi ke ukuran lebih kecil atau foto dengan latar lebih sederhana." |
| Jumlah gallery | maks 6 foto (+1 main cover = 7 per produk) | Tolak foto ke-7: "Maksimal 6 foto gallery — 1 main cover + 6 foto itinerary per produk." |
| Rasio aspek | 3:2 | **Terima** + preview crop 3:2 + peringatan: "Foto 1080×1920 (portrait) — di slot 3:2 sekitar 40% bagian atas/bawah akan terpotong. Pertimbangkan foto landscape." Admin bebas lanjut atau mengganti foto |

Setelah lolos, UI menampilkan hasil final sebelum save:
`WebP · 245 KB · 1600×1067 · lolos standar`.

## Alur upload produk

1. Admin pilih/drag file dari folder mana pun (JPG/PNG/WebP, hingga 15 MB mentah).
2. Browser: decode (hormati orientasi EXIF), validasi tabel di atas, resize
   max edge 1600 px (aspect ratio dipertahankan), encode WebP **adaptif**
   ke target ≤ 300 KB:
   - quality 0.82 → 0.72 → 0.62 → 0.52 → 0.45 (bertahap);
   - jika masih > 300 KB: perkecil edge ×0.85 (1600 → 1360 → 1156 → …,
     minimum 800 px) lalu ulangi loop quality;
   - jika masih > 300 KB pada edge 800 / quality 0.45: tolak dengan pesan.
3. UI menampilkan ukuran akhir, dimensi, dan preview crop; error tampil
   inline di section Media (bukan hanya di bawah form).
4. Submit → `POST /api/admin/product-media` hanya menerima `image/webp`
   ≤ 300 KB (413 `FILE_TOO_LARGE` jika lebih); batas request mentah tetap.
5. Server hitung SHA-256, path `products/YYYY-MM/<hash12>.webp`,
   upsert ke bucket `venture-assets`.
6. Tampilan: `next/image` + `sizes` (sudah dipakai semua komponen) →
   optimizer Vercel menyajikan varian per perangkat dari edge cache.

## Perubahan kode (checklist PR implementasi)

1. [ ] `next.config.js`: tambah `images.remotePatterns` untuk host Supabase
       (dari `NEXT_PUBLIC_SUPABASE_URL`, pathname
       `/storage/v1/object/public/**`) — **blokade utama delivery**
2. [ ] `src/lib/compressImage.ts`: `compressToTarget()` + gate resolusi
       minimal + test unit (dimensi, pilihan quality, batas 300 KB)
3. [ ] `src/components/admin/VentureForm.tsx`: pakai `compressToTarget`,
       tampilkan `WebP · KB · dimensi` di kartu media, preview crop 3:2,
       error inline, standar terlihat di dropzone, gate maks 6 foto gallery
4. [ ] `src/lib/adminVentureSchema.ts`: gallery `.max(8)` → `.max(6)`
       dengan pesan baru + update test
5. [ ] Editor paket varian: picker variant cover (pilih dari 7 foto
       produk, opsional) — tutup gap `Variant.imageUrl` yang belum bisa
       di-set dari admin
6. [ ] `src/lib/productMedia.ts`: bucket `venture-assets` (env
       `SUPABASE_ASSETS_BUCKET`), path content-hash, `x-upsert: true`,
       hanya `image/webp` ≤ 300 KB
7. [ ] `POST /api/admin/product-media`: hanya `image/webp`, tolak > 300 KB
       dengan 413 `FILE_TOO_LARGE`
8. [ ] `.env.example` + `docs/DEPLOYMENT_STRATEGY.md`: env baru
9. [ ] `docs/PRODUCT_MANAGER.md`: bagian Media upload disesuaikan
10. [ ] Uji manual: JPG 10 MB, PNG transparan, foto < 1200px (pesan jelas),
        foto portrait (preview crop), 6 foto + main cover, EXIF miring,
        mobile 390px
11. [ ] Aset Jambe: re-upload 5 foto via admin (Opsi A memo lama, tetap
        berlaku — tanpa dependency baru), lalu hapus JPG besar dari
        `public/images/` setelah referensi berganti

## Risiko & catatan

- **Kuota Vercel image optimization** (Hobby ±1.000 gambar sumber unik/bulan)
  — cukup untuk katalog saat ini; pantau di Vercel Analytics → Usage.
- **Phase 2 (VPS):** optimizer `next start` butuh `sharp` di server —
  keputusan dependency saat itu, perlu persetujuan owner (AGENTS.md §4).
- **Tanpa encoder server:** browser adalah satu-satunya encoder (tidak
  menambah `sharp` ke app). Endpoint non-browser/API harus ditolak.
- **PNG transparan** menjadi WebP lossy — alpha dipertahankan, kualitas
  alpha bisa turun sedikit; verifikasi hasil pada uji manual.
- **LCP:** hero pakai `priority` (sudah berlaku); optimizer menambah latensi
  kecil pada request pertama per varian, lalu di-cache di edge.

## Out of scope

- Kompresi video (hero video tetap URL embed)
- AI upscaling / background removal
- Supabase Image Transform (plan Pro) — dicabut dari opsi
- CDN transform lain
- Migrasi foto review lama (PR terpisah, lihat §Migrasi bucket)

## Acceptance criteria

- [ ] Semua upload produk menghasilkan **tepat 1 file** WebP ≤ 300 KB di
      `venture-assets/products/YYYY-MM/`
- [ ] Foto identik tidak menyimpan duplikat (content hash)
- [ ] Foto di bawah resolusi minimal ditolak dengan pesan yang menyebut
      angka aktual + angka minimal
- [ ] Foto non-3:2 diterima dengan preview crop + peringatan
- [ ] Mobile (390px) memuat hero ≤ ±80 KB via optimizer, bukan master 300 KB
- [ ] Slot display seragam (rasio tetap, `object-cover`)
- [ ] Server menolak non-WebP / > 300 KB
- [ ] 6 foto gallery + main cover (7 total), reorder, set hero, delete
      tetap berfungsi
- [ ] Varian tanpa gallery; cover varian hanya bisa di-reuse dari 7 foto
      produk; tanpa cover → fallback ke main cover
- [ ] Tidak ada dependency baru tanpa persetujuan owner
