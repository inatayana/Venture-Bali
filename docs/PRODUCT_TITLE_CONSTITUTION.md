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
| 5 | Casing | **Title Case** (contoh: *Ubud Jungle ATV Ride with Cave & Waterfall*) |
| 6 | Separators | Maksimal 1 simbol: hanya titik dua `:` atau dash `–`/`-` |
| 7 | Max benefit | Maksimal satu benefit (Private Transfer / Hotel Pickup / Lunch Included / Small Group) |
| 8 | Forbidden words | "Best", "No.1", "Top", "Cheap", "Discount", "Free", nama brand "Venture Bali", nama vendor, emoji |

Validasi dilakukan oleh `validateVentureTitle()` di `src/lib/titleValidator.ts` (port + perluasan dari validator blueprint: menambah cek first-25-char keyword, Title Case, dan emoji yang tidak ada di versi Python).

## 3. Keyword Hierarchy

| Priority | Keywords |
|----------|----------|
| P1 (volume tertinggi) | Bali ATV, Bali Rafting, Bali Swing, Bali Water Sports, Bali Quad Bike |
| P2 | Ubud ATV, Ayung Rafting, Ubud Cycling, River Tubing Bali |
| P3 | Hotel Pickup ATV Bali, Private ATV Bali, Family ATV Bali |
| P4 | Jungle ATV Bali, Cave ATV Bali, Waterfall ATV Bali |

Judul selalu memakai urutan P1 → P2 → Benefit.

## 4. Title Formula per Category (contoh canonical)

| Category | Contoh title final |
|----------|-------------------|
| ATV | *Ubud Jungle ATV Quad Bike Adventure with Private Transfer* |
| ATV (emotional) | *Ubud Jungle ATV Ride with Cave & Waterfall* |
| Rafting | *Ayung River White Water Rafting with Hotel Pickup* |
| River Tubing | *Ubud River Tubing Adventure through Jungle Canyons* |
| Cycling | *Kintamani to Ubud Downhill Cycling Adventure* |
| Trekking | *Mount Batur Sunrise Trekking with Breakfast & Hotel Pickup* |
| Water Sports | *Nusa Dua Water Sports Adventure Package with Hotel Pickup* |
| Snorkeling | *Blue Lagoon Snorkeling Adventure with Hotel Pickup* |
| Extreme | *Bali Waterfall Canyoning Adventure in Gitgit* |
| Combo | *Ubud ATV Quad Bike & Ayung River Rafting Adventure* |

## 5. Slug Rules

- Format: `/adventures/[destination]-[activity-name]`
- Lowercase, hyphen only, tanpa underscore, tanpa ID produk, tanpa nama brand.
- **Penyimpanan:** DB menyimpan slug TANPA prefix (`ubud-jungle-atv-ride`); prefix `/adventures/` disusun di routing layer.
- Validator memvalidasi bentuk composed path saat ingest.

| Produk | Slug |
|--------|------|
| Ubud Jungle ATV Ride | `/adventures/ubud-jungle-atv-ride` |
| Ayung River Rafting | `/adventures/ayung-river-white-water-rafting` |
| Kintamani Cycling | `/adventures/kintamani-ubud-downhill-cycling` |
| Nusa Dua Water Sports | `/adventures/nusa-dua-water-sports-package` |

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

✅ Ubud Jungle ATV Ride with Cave & Waterfall
   (51 char, destination + activity + benefit, Title Case)
```