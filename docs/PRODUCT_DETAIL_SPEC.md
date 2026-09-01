# Venture Bali — Product Detail Spec

> **Version:** 2.0.0
> Defines the canonical data contract for venture products, matching `prisma/schema.prisma` and `src/types/venture.ts`.
> **Reference:** Master blueprint (VENTURE_PRD_MASTER.md §3), `docs/BOOKING_ARCHITECTURE.md`, `docs/PRODUCT_TITLE_CONSTITUTION.md`

## 1. Model Hierarchy

```
Venture (product) 1 ──► n Variant (tour option)
Variant 1 ──► n PriceTier (per-pax pricing by group size)
Variant 1 ──► n SlotTime (departure times + capacity)
Variant 1 ──► n Addon (optional extras)
PickupZone (standalone) ◄── Booking (fulfillmentMode + pickupZoneId)
```

## 2. Venture (Core)

| Field | Type | Notes |
|-------|------|-------|
| `id`, `slug`, `tenantId` | string | `slug` unique; disimpan TANPA prefix `/adventures/`; `tenantId` required (internal, tidak tampil ke publik) |
| `title` | string | **45–60 char**, tervalidasi `titleValidator` (TITLE_CONSTITUTION) |
| `hook3Sec` | string | 3-second hook = `description` di view model |
| `shortDescription` | string | ≤160 karakter SEO (meta description) |
| `duration` | string | Human readable, `"2.5 hours"` — parsed ke `durationHours` di view model |
| `category` | string | 1 dari 9 mega category (`src/lib/taxonomy.ts`) |
| `subcategory` | string? | Sesuai SEO_TAXONOMY.md |
| `primaryKeyword` | string | P1/P2 keyword |
| `secondaryKeywords`, `searchTags` | string[] | SEO metadata |
| `difficulty` | enum | `EASY` \| `MODERATE` \| `CHALLENGING` |
| `suitableFor` | enum[] | subset `KIDS` \| `COUPLE` \| `FAMILY` \| `SOLO` \| `GROUP` |
| `locationId` / `location` | relation | Optional; view model memuat `location` display string |
| `highlights`, `inclusions`, `exclusions` | string[] | Detail page |
| `itinerary` | `{ time, activity }[]` | Ordered schedule |
| `essentialInfo` | `{ perfectFor, whatToBring, knowBeforeYouGo }` | string arrays |
| `faqs` | `{ question, answer }[]` | PDP section 13 |
| `languages` | string[] | `en`, `id`, `ja`, `zh` |
| `imageUrl`, `gallery`, `videoUrl` | string / string[] / string? | Hero gallery 6–12 foto + video |
| `rating` | number | 0–5 |
| `badge` | enum-ish string | Hanya dari badge system (SEO_TAXONOMY §4) |

## 3. Variant & Pricing (semua harga Int IDR)

- `Variant`: `title`, `shortDescription`, `badge?`, `priceTiers[]`, `blackoutDates[]`, `slotTimes[]`, `addons[]`. Mode fulfillment TIDAK lagi di Variant (pindah ke Booking).
- `PriceTier`: `minPax`, `maxPax`, `pricePerPax` (Int IDR). Tiers tidak overlap; `minPax <= maxPax`.
- `SlotTime`: `time`, `maxCapacity`, `currentBookings`, `isAvailable`.
- `Addon`: `name`, `price` (Int IDR), `description?`.

## 4. Fulfillment & Pickup Zones

- Enum `FulfillmentMode`: `SELF_DRIVE` (default) | `PRIVATE_TRANSFER` — di level **Booking**, bukan Variant (1 produk = 2 opsi, bukan SKU terpisah).
- Model `PickupZone`: `name`, `areaType` (ZONE_1..ZONE_4), `surchargeIdr` (Int, per vehicle), `isCustomQuote` (Zone 4), `vehicleMaxPax` (default 4), `isActive`.
- Matrix zone: lihat `docs/BOOKING_ARCHITECTURE.md` §3.

## 5. View Model (`VentureItem`)

| Flat field | Derived from |
|------------|--------------|
| `description` | `hook3Sec` |
| `priceIdr` | LOWEST `pricePerPax` across variants' priceTiers ("starting from" price) |
| `durationHours` | parsed dari `duration` string |
| `minParticipants` / `maxParticipants` | min tier `minPax` / max tier `maxPax` |
| `reviewCount` | count of approved reviews |
| `isAvailable` | slots tersedia dan tidak blackout |
| `location` | display string, `"Ubud, Gianyar"` |

## 6. Booking Request (`BookingRequest`)

Diproduksi booking form / agent tools; tervalidasi zod (`src/lib/schemas/booking.ts`):

- venture slug, variantId, date (ISO), paxCount, `fulfillmentMode`, pickupZoneId (wajib saat TRANSFER), hotelAddress (saat pickup), selectedAddons.
- Price WAJIB dihitung ulang server-side: tier lookup + zone surcharge × `vehicleCount = ceil(pax/vehicleMaxPax)`.
- Cut-off dicek server: Self Drive H-2; Transfer 22:00 WITA D-1.

## 7. API Contract (v1)

| Endpoint | Fungsi |
|----------|--------|
| `GET /api/v1/adventures` | List + filter (category, location, transfer, duration, difficulty, instant) |
| `GET /api/v1/adventures/[slug]` | Detail produk lengkap |
| `POST /api/v1/booking/checkout` | Zod + recalc price + cut-off check → Booking PENDING + Snap token |

## 8. Localization

Copy publik minimum `en`; `Article.title`/`metaDesc` pakai `MultiLanguage` (`en`, `id`, `ja`, `zh`).