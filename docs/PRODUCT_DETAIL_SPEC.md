# Venture Bali — Product Detail Spec

> **Version:** 1.0.0
> Defines the canonical data contract for venture products, matching `prisma/schema.prisma` and `src/types/venture.ts`.

## 1. Model Hierarchy

```
Venture (product) 1 ──► n Variant (tour option)
Variant 1 ──► n PriceTier (per-pax pricing by group size)
Variant 1 ──► n SlotTime (departure times + capacity)
Variant 1 ──► n Addon (optional extras)
```

## 2. Venture (Core)

| Field | Type | Notes |
|-------|------|-------|
| `id`, `slug`, `tenantId` | string | `slug` unique per tenant; `tenantId` required (multi-tenant) |
| `title`, `hook3Sec` | string | `hook3Sec` is the 3-second attention hook used as `description` in list views |
| `duration` | string | Human readable, e.g. `"2.5 hours"` — parsed to `durationHours` in view model |
| `category` | string | One of: `beach`, `mountain`, `culture`, `adventure`, `wellness` |
| `locationId` / `location` | relation | Optional core relation; view model carries `location` as display string |
| `highlights`, `inclusions`, `exclusions` | string[] | Displayed on detail page |
| `itinerary` | `{ time, activity }[]` | Ordered schedule |
| `essentialInfo` | `{ perfectFor, whatToBring, knowBeforeYouGo }` | string arrays |
| `languages` | string[] | ISO codes: `en`, `id`, `ja`, `zh` |
| `imageUrl`, `gallery` | string / string[] | Hero + gallery paths under `/images/` |
| `rating` | number | 0–5 |
| `badge` | string? | e.g. `"Best Seller"` |

## 3. Variant & Pricing

- `Variant`: `title`, `shortDescription`, `badge?`, `meetingType` (`MEETING_POINT` | `HOTEL_PICKUP`), `priceTiers[]`, `blackoutDates[]`.
- `PriceTier`: `minPax`, `maxPax`, `pricePerPax` (IDR integer). Tiers must not overlap; `minPax <= maxPax`.
- `SlotTime`: `time`, `maxCapacity`, `currentBookings`, `isAvailable`.
- `Addon`: `name`, `price`, `description?`.

## 4. View Model (`VentureItem`)

Used by list/card views, SEO, and detail pages. Derivation rules (implemented in data layer):

| Flat field | Derived from |
|------------|--------------|
| `description` | `hook3Sec` |
| `priceIdr` | LOWEST `pricePerPax` across variants' priceTiers ("starting from" price) |
| `durationHours` | parsed from `duration` string |
| `minParticipants` / `maxParticipants` | min of tier `minPax` / max of tier `maxPax` |
| `reviewCount` | count of approved reviews |
| `isAvailable` | all slots unbooked-out and no blackout today |
| `location` | display string, e.g. `"Ubud, Gianyar"` |

## 5. Booking Request (`BookingRequest`)

Produced by the booking form / agent tools; validated with `zod` before hitting the API:

- venture slug, variantId, date (ISO), paxCount, meetingType, hotelAddress (when pickup), selectedAddons.
- Price MUST be recalculated server-side from `priceTiers` — never trust client totals.

## 6. Localization

Customer-facing copy fields (`title`, `hook3Sec`) ship in `en` at minimum; `Article.title`/`metaDesc` use the `MultiLanguage` map (`en`, `id`, `ja`, `zh`).
