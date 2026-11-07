# PR Notes — `feat/age-tiered-pricing` (Ready for Review Tomorrow)

## 📋 Summary
Complete age-tiered pricing rollout + private transfer booking flow overhaul for BaliWild adventure marketplace.

---

## ✅ **Completed This Session**

### 1. Age-Tiered Pricing Engine (Core)
- **Schema:** `PriceTier` + `kidsPricePerPax` / `youthPricePerPax` + `pricingModel` enum (FLAT_PER_GUEST | AGE_TIERED)
- **Migration:** `20261104073908_age_tiered_prices_and_infants`
- **Engine:** `calculateAgeTieredBreakdown()` uses admin-set flat prices (fallback = adult price, never above adult)
- **Promo/Coupon:** Discount ratio scales to kids/youth automatically
- **Tests:** 6 new engine tests pass; FLAT_PER_GUEST regression intact

### 2. Admin Editor (VariantPackageEditor)
- Pricing model toggle per variant (all tiers must match)
- 3 price inputs per tier: Adult / Kids(3-10) / Youth(11-16)
- Zod validation: kids/youth ≤ adult price
- `infantEnabled` toggle (infants free, never counted in capacity)

### 3. Booking Widget (ExperienceBookingWidget)
- Age steppers: Adults/Kids/Youth/Infants (conditional on AGE_TIERED)
- Validation: sum = paxCount, ≥1 adult required
- Persists `adultsCount`/`kidsCount`/`youthCount`/`infantCount` to Booking
- PDP price card shows age hints + volume discount line

### 4. Private Transfer Booking Flow Overhaul
**Pickup Zones (per vehicle):**
| Zone | Areas | Surcharge |
|------|-------|-----------|
| Core | Ubud & Gianyar | +Rp 500,000 |
| South 1 | Kuta, Seminyak, Canggu, Sanur | +Rp 700,000 |
| South 2 | Nusa Dua, Jimbaran, Uluwatu | +Rp 800,000 |
| Outer | Amed, Lovina, Pemuteran, Tulamben | **Disabled** |

**Vehicle Classes (per vehicle):**
| Class | Capacity | Delta |
|-------|----------|-------|
| Standard SUV | ≤5 pax | Rp 0 (included) |
| Premium MPV | ≤6 pax | +Rp 400,000 |
| Minivan | ≤14 pax | +Rp 1,000,000 |

**UI Changes:**
- Radio group (not dropdown) for zone selection
- Hotel address disabled until zone selected
- Outer area note: "Outer areas are beyond our daily transport coverage..."
- Transparent breakdown: `[Pax] × [Package]` | `Private Transfer (Zone)` | `Vehicle Upgrade (Class)` | `Total`

### 5. Visual/Trust Polish
- Red strikethrough on original price (`text-red-500`)
- "You Save" label (no minus sign) — unified across PDP + booking sheet
- Review badge: "Imported" → "Verified" (green badge)
- Kids/youth price hints with emojis on PDP

### 6. Database Fix
- ATV Private Transfer variant updated to `AGE_TIERED` with proper kids/youth prices (400k/450k)

---

## ⚠️ **Pending / Known Gaps**

| Item | Status | Notes |
|------|--------|-------|
| **Other variants with AGE_TIERED** | ❌ Not done | Only ATV variant updated. Other transfer variants need admin setup via VariantPackageEditor |
| **Shared Transfer pricing** | 🟡 Uses old per-guest model | Business decision needed: keep per-guest or migrate to per-vehicle? |
| **Admin Pickup Zone CRUD** | 🟡 Exists but not merged | `src/app/admin/zones/`, `src/components/admin/PickupZoneManager.tsx` exist as untracked files |
| **Booking API validation** | ✅ Partial | Zod schema accepts optional age breakdown; server re-computes in `computeQuote` — good |
| **Voucher/PDF price display** | ❓ Unknown | Need to verify age breakdown renders on voucher |
| **Email confirmations** | ❓ Unknown | Need to verify age breakdown in booking emails |
| **Analytics events** | ✅ Present | `checkout_step_view`, `checkout_step_complete` tracked |

---

## 🧪 **Verification Checklist for PR Review**

- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run lint` → 0 warnings/errors
- [ ] `npm test` → 676/676 pass
- [ ] Dev server: `http://localhost:3002/experiences/cmw0qo7op000jln2s76baz2pc/ubud-atv-jungle-ride`
  - [ ] Select ATV Private Transfer variant
  - [ ] Age steppers appear (Adults/Kids/Youth)
  - [ ] Pickup zone radio group works
  - [ ] Address disabled until zone selected
  - [ ] Vehicle class cards show correct deltas
  - [ ] Summary shows: Pax × Package | Private Transfer (Zone) | Vehicle Upgrade | Total
  - [ ] "You Save" label appears with promo
  - [ ] Red strikethrough on original price
- [ ] Admin: Create variant with AGE_TIERED, verify 3 price inputs per tier

---

## 📦 **Files Changed (Code)**

```
src/lib/pricing.ts                    # Engine + types
src/lib/pricing.test.ts               # 6 new age-tiered tests
src/types/venture.ts                  # PriceTier + Booking + Variant types
src/lib/adminVentureSchema.ts         # Zod schemas with pricingModel validation
src/lib/bookingSchema.ts              # Age breakdown validation
src/lib/bookingService.ts             # Persist adults/kids/youth/infant counts
src/lib/ventureMapper.ts              # Expose pricingModel + infantEnabled
src/components/admin/VariantPackageEditor.tsx  # Admin UI
src/components/features/ExperienceBookingWidget.tsx  # Booking widget (major)
src/app/experiences/[id]/[slug]/ExperienceDetailClient.tsx  # PDP price card
src/components/features/VariantCatalogCard.tsx  # Catalog age hints
src/components/features/VariantDetailModal.tsx  # Modal age hints
src/components/features/reviews/ReviewCard.tsx  # Verified badge
src/data/catalogue.ts                 # Pickup zones + vehicle classes
src/data/mockExperiences.ts           # Mock fixtures
src/data/catalogue.test.ts            # Updated zone tests
```

---

## 🔄 **Merge Strategy**
1. Squash-merge `feat/age-tiered-pricing` → `main` (protected, auto-deploy)
2. Post-merge: Admin sets AGE_TIERED on other transfer variants via UI
3. Consider separate PR for Shared Transfer per-vehicle pricing if business decides

---

## 📝 **Notes for Reviewer**
- **Breaking change:** `PriceTier` schema + Booking fields (`adultsCount`, `kidsCount`, `youthCount`, `infantCount`)
- **Backward compatible:** `bookingSchema` treats age breakdown as optional; defaults to FLAT_PER_GUEST behavior when absent
- **Migration applied:** Run `prisma migrate deploy` on staging/prod
- **No secrets:** All env vars in `.env.example`