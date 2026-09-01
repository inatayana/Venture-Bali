# Venture Bali — SEO Taxonomy

> **Version:** 1.0.0
> **Status:** Canonical taxonomy. Single source of truth di kode: `src/lib/taxonomy.ts`. Dokumen ini adalah mirror untuk manusia.
> **Reference:** Master blueprint (bagian 12, 13, M, N)

## 1. Mega Categories (9, FIXED)

| # | Category | Subcategories |
|---|----------|---------------|
| 1 | ATV & Off-Road | Quad Bike, Jungle ATV, Cave ATV, Waterfall ATV, UTV Buggy |
| 2 | Rafting | Ayung River, Telaga Waja |
| 3 | River Tubing | River Tubing, Cave Tubing |
| 4 | Cycling | Downhill, Village Cycling |
| 5 | Trekking & Hiking | Mount Batur Sunrise, Jungle Trekking, Waterfall Trekking |
| 6 | Water Sports | Jet Ski, Parasailing, Banana Boat, Flyboard |
| 7 | Snorkeling & Diving | Snorkeling, Scuba Diving, Freediving |
| 8 | Extreme Adventures | Canyoning, Zipline, Paragliding, Cliff Jumping |
| 9 | Adventure Combo Packages | ATV + Rafting, Multi-Activity, Full-Day Combo |

- Tidak boleh ada kategori ganda atau kategori di luar daftar ini.
- 1 produk = strictly 1 category + 1 subcategory.

## 2. Destination Graph (ringkas)

| Destination | Aktivitas dominan |
|-------------|-------------------|
| Ubud / Gianyar | ATV, Rafting (Ayung), River Tubing (Pakerisan), Cycling, Swing |
| Kintamani / Bangli | Trekking (Batur), Downhill Cycling, Jeep Sunrise |
| Nusa Dua / Tanjung Benoa | Water Sports (Jet Ski, Parasailing, Banana Boat, Flyboard) |
| Nusa Penida / Klungkung | Snorkeling (Manta), Day Trip |
| East Bali | Telaga Waja Rafting, Blue Lagoon Snorkeling, Amed, Tulamben |
| North Bali | Sekumpul Waterfall, Lovina, Menjangan, Pemuteran, Gitgit Canyoning |
| South Bali | Uluwatu, Water Sports, Paragliding (Timbis) |
| West Bali | West Bali National Park Trekking, Menjangan Diving |

Destination hierarchy: `Destination (Ubud) • Region (Gianyar) • Island (Bali)`.

## 3. Keyword Library (canonical per category)

| Primary Keyword | Secondary Keywords |
|-----------------|--------------------|
| Bali ATV | Quad Bike Bali, ATV Ride Ubud, Jungle ATV Bali, Gorilla Cave ATV |
| Bali Rafting | Ayung River Rafting, White Water Rafting Bali, Ubud Rafting |
| Bali River Tubing | Pakerisan Tubing, Jungle Tubing Bali, River Adventure Bali |
| Bali Cycling | Kintamani Cycling, Downhill Bike Bali, Ubud Cycling Tour |
| Mount Batur Trekking | Sunrise Hike Bali, Volcano Trek Bali, Batur Sunrise Tour |
| Bali Water Sports | Jet Ski Bali, Parasailing Bali, Banana Boat Bali, Flyboard Bali |
| Bali Snorkeling | Blue Lagoon Snorkeling, Nusa Penida Snorkeling, Manta Snorkeling Bali |

## 4. Badge System (fixed, jangan sembarangan)

| Badge | Kapan dipakai |
|-------|---------------|
| Best Seller | Top 10 booking |
| Free Cancellation | Semua produk yang refundable (sesuai REFUND_POLICY.md) |
| Instant Confirmation | Booking realtime |
| Hotel Pickup Available | Ada opsi Private Transfer |
| Family Friendly | Cocok anak-anak |
| Small Group | Maksimal 10–12 orang |
| Private Experience | Private booking |

## 5. Filters (listing & booking system)

| Filter | Nilai |
|--------|-------|
| Adventure Type | ATV, Rafting, Tubing, Cycling, Water Sports, … (9 mega category) |
| Location | Ubud, Gianyar, Nusa Dua, Kintamani, Payangan, … |
| Transfer | Self Drive / Private Transfer |
| Duration | 1–2h, Half Day, Full Day |
| Difficulty | Easy, Moderate, Challenging |
| Suitable For | Kids, Couples, Family, Solo, Groups |
| Instant Confirmation | Yes |

## 6. Difficulty & Suitable For

- `Difficulty`: `EASY` | `MODERATE` | `CHALLENGING`
- `Suitable For`: subset dari `KIDS | COUPLE | FAMILY | SOLO | GROUP`

## 7. Naming Pattern Library

| Category | Pattern |
|----------|---------|
| ATV | Destination + ATV Ride + Highlight |
| Rafting | River + White Water Rafting + Benefit |
| Tubing | Destination + River Tubing + Highlight |
| Cycling | Origin → Destination + Cycling Tour |
| Trekking | Mountain + Sunrise Trek + Breakfast |
| Water Sports | Destination + Water Sports Package |