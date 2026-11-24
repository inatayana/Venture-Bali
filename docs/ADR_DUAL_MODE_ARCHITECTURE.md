# ADR-001: Dual-Mode Architecture (Vertical Operator → Marketplace Platform)

**Status:** ACCEPTED  
**Date:** 2026-11-17  
**Deciders:** Founder, CTO, Tech Lead  
**Tags:** architecture, strategy, future-proofing

---

## Context

BaliWild saat ini beroperasi sebagai **Vertical Operator** (menjual, mengoperasikan, bertanggung jawab penuh). Namun visi jangka panjang adalah berkembang menjadi **Marketplace Platform** (seperti Airbnb Experiences) ketika skala & kematangan operasional tercapai.

Arsitektur harus:
1. **Support Vertical Operator hari ini** — zero overhead, full control
2. **Enable Marketplace di masa depan** — tanpa rewrite, tanpa dual codebase
3. **Single Source of Truth** — satu schema, satu service layer, configurable

---

## Decision

### 1. Unified Data Model dengan Mode-Aware Fields

Semua entitas utama (`Venture`, `Booking`, `Vendor`, `Payment`) menggunakan **satu schema Prisma** dengan field yang conditional:

```prisma
model Venture {
  // Core fields (always)
  id          String   @id @default(cuid())
  title       String
  capacity    Json     // Real-time capacity config
  
  // Vertical Operator fields (always active)
  vendorId        String?
  vendorContract  VendorContract?
  sopVersion      String?
  qaScore         Float?
  
  // Marketplace fields (nullable, activated via feature flag)
  operatorId      String?
  operatorStatus  OperatorStatus?
  platformFeePct  Float?
  autoPayout      Boolean?
  commissionType  CommissionType?
}
```

**Rule:** Field marketplace `nullable` dan `default: null`. Hanya diisi saat `mode = MARKETPLACE_PLATFORM`.

---

### 2. Strategy Pattern untuk Business Logic

Semua logic yang beda antara mode diimplementasikan sebagai **Strategy** yang di-inject via factory:

```typescript
// Core interface
interface AssignmentStrategy {
  assign(booking: Booking): Promise<VendorAssignment>;
}

// Vertical Operator implementation (current)
class VerticalOperatorAssignment implements AssignmentStrategy {
  async assign(booking: Booking) {
    // BaliWild decides: zone, capacity, skill, vendor availability
  }
}

// Marketplace implementation (future)
class MarketplaceAssignment implements AssignmentStrategy {
  async assign(booking: Booking) {
    // Operator manages own calendar; platform matches
  }
}

// Factory
function getAssignmentStrategy(): AssignmentStrategy {
  return config.businessMode === 'vertical_operator'
    ? new VerticalOperatorAssignment()
    : new MarketplaceAssignment();
}
```

**Applied to:**
- `AssignmentStrategy` (vendor/operator assignment)
- `PayoutStrategy` (contractual batch vs auto-split)
- `CommissionStrategy` (vertical margin vs platform fee)
- `CapacityStrategy` (master schedule vs operator calendar)
- `CommunicationStrategy` (BaliWild templates vs operator customize)

---

### 3. Feature Flag System

```typescript
// config/businessMode.ts
export const BUSINESS_MODE = (process.env.BUSINESS_MODE ?? 'vertical_operator') as BusinessMode;

export const FEATURES = {
  // Marketplace-only features
  vendorPortal: BUSINESS_MODE === 'marketplace_platform',
  autoSplitPayout: BUSINESS_MODE === 'marketplace_platform',
  operatorOnboarding: BUSINESS_MODE === 'marketplace_platform',
  platformFee: BUSINESS_MODE === 'marketplace_platform',
  publicApi: BUSINESS_MODE === 'marketplace_platform',
  
  // Always-on (vertical operator features)
  internalOpsDashboard: true,
  vendorAssignment: true,
  qualityAssurance: true,
  vendorPaymentContractual: true,
  dynamicPricing: true,
  digitalWaiver: true,
  verifiedId: true,
} as const;
```

**Usage:**
```tsx
// Component level
{FEATURES.vendorPortal && <OperatorPortalLink />}

// Service level
if (FEATURES.autoSplitPayout) {
  await autoSplitPayoutService.process(payment);
} else {
  await contractualPayoutService.schedule(payment);
}
```

---

### 4. Service Layer Abstraction

```
src/services/
├── booking/
│   ├── AssignmentStrategy.ts          # Interface
│   ├── VerticalOperatorAssignment.ts  # Current impl
│   ├── MarketplaceAssignment.ts       # Future impl
│   └── AssignmentFactory.ts           # getStrategy()
├── payout/
│   ├── PayoutStrategy.ts
│   ├── ContractualPayout.ts
│   ├── AutoSplitPayout.ts
│   └── PayoutFactory.ts
├── commission/
│   ├── CommissionStrategy.ts
│   ├── VerticalMargin.ts
│   ├── PlatformFeeEngine.ts
│   └── CommissionFactory.ts
└── capacity/
    ├── CapacityStrategy.ts
    ├── MasterSchedule.ts
    └── OperatorCalendar.ts
```

**Rule:** Semua service **harus** melalui factory. Tidak ada `if (mode)` di business logic.

---

### 5. API Layer: Progressive Exposure

| Phase | API Surface | Auth | Rate Limit |
|-------|-------------|------|------------|
| Current | Internal (Next.js Server Actions) | Session + Admin | N/A |
| Phase 2 | `/api/v1` (REST) | OAuth2 / API Key | 1000 req/min |
| Phase 3 | GraphQL + Webhooks | OAuth2 + JWT | Per-tier |

**Current:** Tidak ada public API. Semua via Server Actions.
**Migration:** Tambah `/api/v1` routes tanpa mengubah internal logic.

---

### 6. Database Migration Strategy

| Migration | Approach |
|-----------|----------|
| Add marketplace fields | `nullable`, default null, no data migration |
| Split `Vendor` → `Vendor` + `Operator` | New table, copy data, deprecate old |
| Add `OperatorAgreement` | New table, link to `Operator` |
| Add `PlatformFee` history | New table `PlatformFeeEvent` |

**Zero-downtime:** Semua additive. Tidak ada breaking change pada vertical operator.

---

## Consequences

### Positive
- ✅ **Zero technical debt** untuk vertical operator hari ini
- ✅ **Single codebase** — no fork, no duplication
- ✅ **Instant switch** via env var + feature flag (untuk testing/staging)
- ✅ **Type-safe** — TypeScript enforces strategy contracts
- ✅ **Testable** — mock strategy per mode

### Negative / Trade-offs
- ⚠️ **Slight complexity** di service layer (strategy pattern)
- ⚠️ **Nullable fields** di schema (marketplace fields)
- ⚠️ **Feature flag sprawl** jika tidak disiplin (mitigasi: central config)
- ⚠️ **Cognitive load** — dev harus paham dual-mode concept

### Mitigations
- **Documentation** di `docs/ARCHITECTURE_DUAL_MODE.md`
- **Code review checklist** — "Apakah logic ini mode-aware?"
- **Integration test** kedua mode di CI
- **Architecture review** tiap quarter

---

## Migration Checklist (Phase 1 → Phase 2)

| Item | Status | Owner |
|------|--------|-------|
| [ ] `BUSINESS_MODE=marketplace_platform` di staging | ⏳ | DevOps |
| [ ] Enable `FEATURES.vendorPortal` | ⏳ | Frontend |
| [ ] Deploy `MarketplaceAssignment` strategy | ⏳ | Backend |
| [ ] Enable `autoSplitPayout` + Stripe Connect | ⏳ | Backend + Finance |
| [ ] Build Operator Portal (MVP) | ⏳ | Fullstack |
| [ ] Public API v1 + OAuth2 | ⏳ | Backend |
| [ ] Webhook events: `booking.created`, `payment.paid` | ⏳ | Backend |
| [ ] Legal: Operator Agreement template | ⏳ | Legal |
| [ ] Finance: Platform fee model & tax | ⏳ | Finance |
| [ ] Load test dual-mode | ⏳ | QA |
| [ ] **Go/No-Go Decision** (6 triggers met) | ⏳ | Founder + CTO |

---

## References

- [BUSINESS_BLUEPRINT.md](./BUSINESS_BLUEPRINT.md) — Business direction & roadmap
- [docs/TECH_DECISION_LOG.md](../TECH_DECISION_LOG.md) — Technical decision log
- `src/services/*/Strategy.ts` — Implementation

---

**Approved By:** Founder, CTO  
**Date:** 2026-11-17  
**Next Review:** 2027-02-17 (or Phase 2 trigger)