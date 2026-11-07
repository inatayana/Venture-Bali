# 📌 MEMO — Next Session Continuation

**Branch:** `feat/age-tiered-pricing` | **Base:** `main` | **Last commit:** `82a7b38`

---

## 🎯 Immediate Next Steps (Priority Order)

### 1. **Admin: Configure remaining variants as AGE_TIERED** ⏳
- Only ATV Private Transfer updated in DB so far
- Other transfer variants need pricing model toggle + kids/youth prices via **VariantPackageEditor**
- Action: Login admin → Ventures → Edit variant → set `AGE_TIERED` + 3 prices/tier

### 2. **Shared Transfer pricing decision** 🤔
- Currently per-guest (old model)
- Business choice: migrate to per-vehicle (like private) or keep per-guest?
- If per-vehicle: update `PICKUP_ZONES` surcharges to per-vehicle in catalogue + recalc

### 3. **Admin Pickup Zone CRUD** 📁 (untracked files)
```
src/app/admin/zones/
src/app/api/admin/pickup-zones/
src/components/admin/PickupZoneManager.tsx
src/lib/adminPickupZoneSchema.ts
```
- Exists but not committed
- Separate PR recommended after this one merges

### 4. **Voucher/Email age breakdown verification** ✉️
- Check `src/app/voucher/` and email templates
- Ensure age-tiered prices render correctly on PDF/email

### 5. **Analytics: track age breakdown selection** 📊
- Current: `checkout_step_view`, `checkout_step_complete`
- Add: `age_mix_selected` event with adults/kids/youth counts

---

## 🧠 Context to Remember

| What | Where |
|------|-------|
| Age-tiered engine logic | `src/lib/pricing.ts:430-518` |
| Admin Zod validation | `src/lib/adminVentureSchema.ts:45-85` |
| Booking widget age steppers | `src/components/features/ExperienceBookingWidget.tsx:353-389` |
| Private transfer breakdown | `src/components/features/ExperienceBookingWidget.tsx:923-937` |
| Pickup zone radio group | `src/components/features/ExperienceBookingWidget.tsx:515-540` |
| DB variant to update | `cmw0qod000013ln2spsq8p8fc` (ATV) — **done** |

---

## 🚀 Quick Start Tomorrow

```bash
cd D:\_Project\venture-bali
git checkout feat/age-tiered-pricing
npm run dev -- -p 3002
# Open http://localhost:3002/experiences/cmw0qo7op000jln2s76baz2pc/ubud-atv-jungle-ride
# Test: age steppers → zone radio → vehicle class → summary breakdown
```

---

## 💡 Discussion Points for Team

1. **Shared Transfer per-vehicle?** — affects pricing engine + zone surcharges
2. **Outer Area UX** — currently disabled; maybe show "Contact us" CTA instead?
3. **Infant pricing** — currently free + not counted; confirm business rule holds
4. **Promo on age-tiered** — scales discount ratio to kids/youth; verify with marketing

---

*Generated: 2026-11-05 — Session end*