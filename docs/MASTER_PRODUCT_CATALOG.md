# Venture Bali — Master Product Catalog

> **Version:** 1.0.0
> **Status:** Launch blueprint. Data produk aktual (single source of truth) hidup di database/seed JSON (`prisma/seed/*.json`); dokumen ini mendefinisikan struktur, jumlah, dan urutan peluncuran.

## 1. Product System (Final Constitution)

Venture hanya memiliki **9 Mega Categories** (lihat `docs/SEO_TAXONOMY.md`):

| Mega Category | Jumlah produk blueprint |
|---------------|------------------------|
| ATV & Off-Road | 28 |
| Rafting | 18 |
| River Tubing | 12 |
| Cycling | 10 |
| Trekking & Hiking | 18 |
| Water Sports | 24 |
| Snorkeling & Diving | 20 |
| Extreme Adventures | 12 |
| Adventure Combo Packages | 24 |
| **Total** | **166 produk OTA-ready** |

## 2. Universal Product Formula (wajib semua produk)

| Field | Wajib |
|-------|-------|
| Product Title (45–60 char, sesuai TITLE_CONSTITUTION) | Ya |
| Primary Keyword | Ya |
| Secondary Keywords (5–10) | Ya |
| Destination Hierarchy | Ya |
| Short Description (≤160 karakter SEO) | Ya |
| Highlights (5 poin) | Ya |
| What's Included / Not Included | Ya |
| Transfer Options (Self Drive + Private Transfer) | Ya |
| Duration | Ya |
| Difficulty (Easy/Moderate/Challenging) | Ya |
| Suitable For | Ya |
| Cancellation Policy (REFUND_POLICY.md) | Ya |
| Booking Labels (Instant, Free Cancellation, Hotel Pickup Available) | Ya |

## 3. Hero ATV Product Template (standar konten)

| Field | Standard |
|-------|----------|
| SEO Title | Ubud Jungle ATV Quad Bike Adventure with Private Transfer |
| Slug | /adventures/ubud-jungle-atv-quad-bike-adventure |
| Meta Description | Ride through jungle trails, caves, rivers, rice terraces, and waterfalls on Ubud's best ATV adventure. Self-drive or hotel pickup available. |
| Duration | 2–2.5 Hours |
| Difficulty | Easy–Moderate |
| Transfer | Self Drive / Private Transfer |
| Highlights | Cave, Waterfall, Tunnel, River Crossing, Rice Terrace |

## 4. Catalog per Category (ringkasan)

### ATV & Off-Road (28)
Top 15 core, termasuk: Ubud Jungle ATV Quad Bike Adventure with Private Transfer, Ubud ATV Ride Through Gorilla Cave & Waterfall, Bali ATV Adventure in Ubud with Lunch Included, Ubud Quad Bike Ride Through Jungle Tunnel & River, Ubud ATV Sunrise Adventure Through Rice Terraces, Private Ubud ATV for Couples, Off-Road UTV Buggy Adventure in Ubud.

### Rafting (18)
Ayung River White Water Rafting with Hotel Pickup, Ayung River Rafting with Lunch Included, Telaga Waja White Water Rafting in East Bali, Extreme Telaga Waja Rafting, Private Ayung Rafting, Sunset Rafting. Highlights: Class II–III rapids, waterfalls, jungle canyon, buffet lunch, shower & locker, insurance.

### River Tubing (12)
Ubud Jungle River Tubing with Hotel Pickup, Pakerisan River Tubing, Bali River Tubing Through Hidden Jungle Canyons, Family-Friendly Tubing, Private Tubing.

### Cycling (10)
Kintamani to Ubud Downhill Cycling, Ubud Downhill with Rice Terrace Views, Kintamani Volcano Downhill with Lunch, Village Cycling, Private Downhill.

### Trekking & Hiking (18)
Mount Batur Sunrise Trekking (breakfast + pickup), Batur Sunrise + Hot Springs, Mount Batur Jeep Sunrise, West Bali NP Jungle Trekking, Sekumpul Waterfall Trekking, Hidden Canyon Beji Guwang, Campuhan Ridge Walk.

### Water Sports (24)
Nusa Dua Water Sports Package with Hotel Pickup, Jet Ski Nusa Dua, Parasailing, Flyboard Tanjung Benoa, Banana Boat, Combo packages (Jet Ski + Parasailing + Banana Boat).

### Snorkeling & Diving (20)
Blue Lagoon Snorkeling, Nusa Penida Manta Ray Snorkeling, Amed Coral Reef, Menjangan Island, Tulamben Shipwreck Diving.

### Extreme Adventures (12)
Gitgit Canyoning, Timbis Paragliding, Ubud Zipline, UTV Buggy, Cliff Jumping.

### Adventure Combo Packages (24)
ATV + Rafting, ATV + Rafting + Swing, ATV + Tubing + Coffee Plantation, Rafting + Kintamani Cycling, Batur Sunrise + Hot Springs, Nusa Penida Combo, Water Sports + Uluwatu Sunset, Ultimate Ubud Adventure.

## 5. Launch Order (Priority Matrix)

| Wave | Isi | Target |
|------|-----|--------|
| **Wave 1** (launch) | 30 Hero Products: Ubud Jungle ATV, Ayung Rafting, ATV+Rafting Combo, Mount Batur Sunrise Trekking, Nusa Dua Water Sports Package, Blue Lagoon Snorkeling + sisa hero | 30 |
| **Wave 2** | River Tubing, Cycling, Jeep Sunrise, Diving, Canyoning, UTV Buggy, Paragliding | +60 |
| **Wave 3** | Long-tail destinations: Sidemen, Munduk, Lovina, Amed, Menjangan, Pemuteran | +76 |

## 6. Cara Kerja Pipeline Konten

1. Wave 1 di-seed via `prisma/seed/` (JSON, tervalidasi `titleValidator` + zod).
2. Wave 2–3 di-generate via AI content agent (system prompt di `docs/ai/catalog-agent-prompt.md`) → output JSON sesuai schema → lolos validator → masuk seed/DB.
3. `scripts/validate-catalog.ts` memvalidasi seluruh katalog di CI — satu title invalid = build gagal.

## 7. PDP Checklist (16 section)

Hero Gallery → SEO Title → Rating+Reviews → Price+Booking Option → Mode Toggle (Self Drive/Transfer) → Highlights → About → What's Included → Meeting Point/Pickup Areas → Schedule & Availability → Traveler Requirements → Cancellation Policy → FAQ → Reviews → Related Adventures → SEO Knowledge Hub (internal links).

Progressive build: section inti (1–12) dulu; FAQ/Reviews/Knowledge Hub menyusul konten.