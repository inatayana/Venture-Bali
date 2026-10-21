# Venture Bali — Product Title Constitution V1

> **Version:** 1.0.0
> **Status:** MUST FOLLOW. Enforced by `src/lib/titleValidator.ts`, zod schemas, and the catalog ingestion pipeline.
> **Reference:** Master blueprint (VENTURE_PRD_MASTER.md §1.2, §4, §11)

## 1. Positioning

- Venture Bali adalah **Adventure Booking Platform for Bali** — bukan OTA umum.
- HANYA menjual 9 kategori *Adventure & Activities* (lihat `docs/SEO_TAXONOMY.md`).
- DILARANG menjual hotel, tiket pesawat, transportasi murni (rent car/scooter), atau restoran.
- Promise: *"Book your Bali adventure in minutes. Choose self-drive or private transfer."*

## 2. Title Rules (WAJIB)

| # | Rule | Detail |
|---|------|--------|
| 1 | Length | **45–60 karakter** (strict, mobile SERP & OTA cards) |
| 2 | Structure | `[Destination] + [Adventure Experience] + [Intent Keyword] + [Benefit]` |
| 3 | First 25 chars | Wajib berisi **Primary Keyword** (mis. *Ubud ATV*, *Ayung Rafting*) |
| 4 | Destination | Wajib disebut eksplisit di title |
| 5 | Casing | **Title Case** (contoh: *Ubud Jungle ATV Ride with Cave and Waterfall Falls*). Kata kecil yang sah (*with*, *and*, *the*, *to*, *through*, …) tetap lowercase kecuali di posisi pertama/terakhir |
| 6 | Separators | Maksimal 1 simbol: hanya titik dua `:` atau dash `–`/`-`. Simbol lain (termasuk `&`) **tidak boleh** dipakai — gunakan kata sambung |
| 7 | Max benefit | Maksimal satu benefit (Private Transfer / Hotel Pickup / Lunch Included / Small Group) |
| 8 | Forbidden words | "Best", "No.1", "Top", "Cheap", "Discount", "Free", nama brand "Venture Bali", nama vendor, emoji |

Validasi dilakukan oleh `validateVentureTitle()` di `src/lib/titleValidator.ts` (port + perluasan dari validator blueprint: menambah cek first-25-char keyword, Title Case, dan emoji yang tidak ada di versi Python). Failing title **menolak disimpan** — bukan hanya peringatan.

## 3. Keyword Hierarchy

| Priority | Keywords |
|----------|----------|
| P1 (volume tertinggi) | Bali ATV, Bali Rafting, Bali Swing, Bali Water Sports, Bali Quad Bike |
| P2 | Ubud ATV, Ayung Rafting, Ubud Cycling, River Tubing Bali |
| P3 | Hotel Pickup ATV Bali, Private ATV Bali, Family ATV Bali |
| P4 | Jungle ATV Bali, Cave ATV Bali, Waterfall ATV Bali |

Judul selalu memakai urutan P1 → P2 → Benefit.

## 4. Title Formula per Category (contoh canonical — semua sudah lolos validator)

| Category | Contoh title final |
|----------|-------------------|
| ATV | *Ubud ATV Jungle Ride through Rice Terraces and Waterfalls* |
| ATV (emotional) | *Ubud Jungle Waterfall Ride through the Rice Fields Today* |
| Rafting | *Ayung Rafting White Water Adventure with Hotel Pickup* |
| River Tubing | *Ubud Tubing Adventure through Jungle Canyons and Rapids* |
| Cycling | *Ubud Cycling Downhill Tour through Villages to the Coast* |
| Trekking | *Mount Batur Trekking Sunrise Adventure with Breakfast* |
| Water Sports | *Nusa Dua Water Sports Adventure with Hotel Pickup* |
| Snorkeling | *Nusa Penida Snorkeling with Manta Rays and Lunch* |
| Extreme | *Sayan Canyoning Adventure with Abseil and Cliff Jumping* |
| Combo | *Ubud ATV and Ayung Rafting Adventure Full Day Combo* |

> Judul canonical di atas adalah referensi yang **sudah divalidasi** oleh
> `src/lib/titleValidator.ts`. Jangan mengubahnya tanpa menjalankan validator.

## 5. Slug Rules

- Format: `<destination>-<activity-name>` (tanpa prefix).
- Lowercase, hyphen only, tanpa underscore, tanpa ID produk, tanpa nama brand.
- **Penyimpanan:** DB menyimpan slug TANPA prefix; prefix path disusun di routing layer.
- Validator `isVentureSlugValid()` memvalidasi bentuk slug saat ingest.
- Routing halaman produk: `/experiences/[id]/[slug]`.

| Produk | Slug | URL |
|--------|------|-----|
| Ubud Jungle ATV Ride | `ubud-atv-jungle-ride` | `/experiences/<id>/ubud-atv-jungle-ride` |
| Ayung River Rafting | `ayung-river-white-water-rafting` | `/experiences/<id>/ayung-river-white-water-rafting` |
| Kintamani Cycling | `kintamani-ubud-downhill-cycling` | `/experiences/<id>/kintamani-ubud-downhill-cycling` |
| Nusa Dua Water Sports | `nusa-dua-water-sports-package` | `/experiences/<id>/nusa-dua-water-sports-package` |

## 6. Product Metadata Formula (struktur tetap per produk)

| Field | Contoh |
|-------|--------|
| Product Title | Ubud Jungle ATV Ride with Cave & Waterfall |
| Primary Keyword | Ubud ATV Ride |
| Secondary Keywords | Bali ATV Adventure, Quad Bike Bali, Jungle ATV Bali |
| Search Tags | ATV, Quad Bike, Jungle, Cave, Waterfall, Ubud |
| Destination | Ubud • Gianyar • Bali |
| Experience Type | Adventure |
| Transfer Option | Self Drive / Private Transfer |

## 7. Brand Guardrails

- DILARANG mencantumkan "Venture Bali" pada Title Produk, Meta Title, atau Slug.
- Nama brand hanya muncul di UI Header/Footer dan Email Confirmation.
- Vendor lokal = fulfillment partner; tidak pernah tampil di halaman publik (lihat `docs/OPERATION_CONTRACT.md`).

## 8. Contoh Salah vs Benar

```
❌ Bali ATV Adventure Quad Bike ATV Ubud Jungle Cave Waterfall Best Tour
   (keyword stuffing, 66 char, kata terlarang "Best")

✅ Ubud Jungle Waterfall Ride through the Rice Fields Today
   (50 char, destination + activity + benefit, Title Case, keyword "Ubud" di 5 char pertama)
```

## 9. Enforcement

| Layer | Mechanism |
|-------|-----------|
| Seed / ingestion | `assertSeedCompliance()` di `prisma/seed.ts` — gagal fast sebelum menyentuh DB |
| Admin save flow | `validateVentureTitle()` di `src/lib/titleValidator.ts` |
| Unit test | `src/lib/titleValidator.test.ts` (34 kasus) |
| Kategori | `src/lib/taxonomy.ts` — 9 kategori, bloklist hotel/flight/restaurant |