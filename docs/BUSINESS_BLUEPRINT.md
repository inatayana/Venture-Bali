# BaliWild Business Blueprint
**Version:** 1.0.0  
**Status:** APPROVED — Single Source of Truth  
**Last Updated:** 2026-11-17  
**Audience:** All team members (Engineering, Product, Operations, Marketing, Finance)  
**Classification:** INTERNAL — Strategic Direction

---

## 1. Executive Summary

### 1.1 Core Identity
> **BaliWild adalah Vertically Integrated Adventure Operator** yang menjual, mengoperasikan, dan bertanggung jawab penuh atas setiap pengalaman petualangan di Bali.

**Bukan** marketplace. **Bukan** platform B2B. **Bukan** OTA fee-based model.

### 1.2 Vision Statement
> **"Own the Wild"** — Memberikan pengalaman petualangan Bali yang aman, autentik, dan *hassle-free* di mana BaliWild menjamin kualitas dari *booking* hingga *completion*.

### 1.3 Mission
Membangun ekosistem petualangan Bali yang **terpercaya**, **terstandarisasi**, dan **berskala** — di mana BaliWild mengontrol kualitas end-to-end, namun arsitektur sistem siap berkembang menjadi **Marketplace/Platform** saat waktu yang tepat.

---

## 2. Business Model Definition

### 2.1 Current: Vertical Operator (Phase 1-Now)

```
┌─────────────────────────────────────────────────────────────────┐
│                    BALIWILD VERTICAL OPERATOR                   │
├─────────────────────────────────────────────────────────────────┤
│  GUEST                                                          │
│    │                                                            │
│    ▼                                                            │
│  BALIWILD (Single Point of Contact)                            │
│  ├── Sales & Marketing                                         │
│  ├── Booking & Payment (Midtrans)                              │
│  ├── Customer Service (WA/Email/Chat)                          │
│  ├── Operations Control (Scheduling, Vendor Assignment)        │
│  ├── Quality Assurance (SOP, Mystery Guest, Incident Mgmt)     │
│  ├── Vendor Management (Contracts, SLA, Payment, Performance)  │
│  └── Liability & Safety (Waiver, Insurance, Emergency)         │
│    │                                                            │
│    ▼                                                            │
│  VENDOR PARTNERS (Contractor Ops)                              │
│  ├── Local Operators (ATV, Rafting, Trekking, dll)             │
│  ├── Assigned by BaliWild (Zone, Capacity, Skill)              │
│  ├── Execute per BaliWild SOP                                  │
│  ├── Paid per Contract (Fixed/Rev-Share)                       │
│  └── Indemnify BaliWild                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
| Aspect | Implementation |
|--------|----------------|
| **Revenue** | 100% margin (Guest → BaliWild → Vendor) |
| **Customer Relationship** | BaliWild ↔ Guest (direct) |
| **Operations Control** | BaliWild master schedule → assign vendor |
| **Quality** | BaliWild SOP, mystery guest, pre/post checklist |
| **Liability** | BaliWild liable to guest → vendor indemnifies BaliWild |
| **Vendor Payment** | Contractual (weekly/monthly), not auto-split |
| **Brand Promise** | "BaliWild Guarantee" — kualitas & safety dijamin |

---

### 2.2 Future: Marketplace/Platform (Phase 2 — When Ready)

```
┌─────────────────────────────────────────────────────────────────┐
│                    BALIWILD MARKETPLACE PLATFORM                │
├─────────────────────────────────────────────────────────────────┤
│  GUEST                                                          │
│    │                                                            │
│    ▼                                                            │
│  BALIWILD PLATFORM                                             │
│  ├── Core: Search, Booking, Payment, Reviews                   │
│  ├── Trust & Safety: Verified ID, Insurance, SOS               │
│  ├── Operator Tools: Calendar, Payouts, Analytics, Content     │
│  ├── Guest Tools: Trips, Wishlists, Messages, Loyalty          │
│  └── Marketplace Governance: Standards, Dispute Resolution     │
│    │                                                            │
│    ▼                                                            │
│  VERIFIED OPERATORS (Third-party, Independent)                 │
│  ├── Meet BaliWild Standards (License, Insurance, Safety)      │
│  ├── Manage Own Inventory & Pricing                            │
│  ├── Receive Payouts (Auto-split, Net of Platform Fee)         │
│  ├── Build Reputation (Reviews, Response Rate, Completion)     │
│  └── Access BaliWild Demand Channel                            │
└─────────────────────────────────────────────────────────────────┘
```

**Transition Triggers (All Must Be Met):**
1. **Scale**: >500 bookings/bulan, >20 verified operators
2. **Operational Maturity**: SOP documented, QA automated, incident rate <1%
3. **Tech Readiness**: Public API, webhooks, operator portal, payout engine
4. **Brand Authority**: #1 Bali adventure brand, SEO dominance, review volume
5. **Financial**: Positive unit economics, platform fee model validated
6. **Legal/Compliance**: Framework for third-party liability, insurance partnerships

---

## 3. Architecture Blueprint: Dual-Mode Ready

### 3.1 Core Principle: **Single Codebase, Configurable Business Logic**

```typescript
// Konsep: Business Logic Layer yang bisa switch mode
enum BusinessMode {
  VERTICAL_OPERATOR = 'vertical_operator',  // Current
  MARKETPLACE_PLATFORM = 'marketplace_platform'  // Future
}

// Feature flags driven by mode
const FEATURES = {
  vendorPortal: mode === BusinessMode.MARKETPLACE_PLATFORM,
  autoSplitPayout: mode === BusinessMode.MARKETPLACE_PLATFORM,
  operatorOnboarding: mode === BusinessMode.MARKETPLACE_PLATFORM,
  platformFee: mode === BusinessMode.MARKETPLACE_PLATFORM,
  // Vertical operator features always on
  internalOpsDashboard: true,
  vendorAssignment: true,
  qualityAssurance: true,
  vendorPaymentContractual: true,
};
```

### 3.2 Data Model: Unified with Mode-Aware Fields

```prisma
// Unified schema — mode-aware via nullable fields
model Venture {
  id              String   @id @default(cuid())
  title           String
  // ... core fields
  
  // Vertical Operator fields (always present)
  vendorId        String?          // Internal contractor
  vendorContract  VendorContract?  // SLA, pricing, terms
  sopVersion      String?          // BaliWild SOP version
  qaScore         Float?           // Internal QA score
  
  // Marketplace fields (nullable until enabled)
  operatorId      String?          // Third-party operator
  operatorStatus  OperatorStatus?  // PENDING/VERIFIED/SUSPENDED
  platformFeePct  Float?           // e.g., 15%
  autoPayout      Boolean?         // true for marketplace
  commissionType  CommissionType?  // PERCENTAGE/FIXED
  
  // Unified operational fields
  capacity        CapacityConfig   // Real-time capacity
  sopChecklist    Json?            // Pre/post tour checklist
  incidentLog     Incident[]
}

model VendorContract {
  id              String   @id @default(cuid())
  vendorId        String
  ventureId       String
  type            ContractType     // FIXED_FEE / REVENUE_SHARE / HYBRID
  fixedFee        Int?             // IDR per pax / per trip
  revenueSharePct Float?           // e.g., 0.30 = 30%
  paymentTerms    PaymentTerms     // WEEKLY / BIWEEKLY / MONTHLY
  sla             SlaConfig        // Response time, cancellation policy
  insurance       InsuranceProof   // BPJS, liability insurance
  status          ContractStatus   // ACTIVE / EXPIRED / TERMINATED
  // Marketplace: nullable, replaced by OperatorAgreement
}
```

### 3.3 Service Layer: Strategy Pattern

```typescript
// services/booking/AssignmentStrategy.ts
interface AssignmentStrategy {
  assign(booking: Booking): Promise<VendorAssignment>;
}

class VerticalOperatorAssignment implements AssignmentStrategy {
  // BaliWild decides: zone, capacity, skill, vendor availability
  async assign(booking: Booking) { /* BaliWild logic */ }
}

class MarketplaceAssignment implements AssignmentStrategy {
  // Operator manages own calendar; platform matches availability
  async assign(booking: Booking) { /* Marketplace logic */ }
}

// Factory
function getAssignmentStrategy(mode: BusinessMode): AssignmentStrategy {
  return mode === BusinessMode.VERTICAL_OPERATOR
    ? new VerticalOperatorAssignment()
    : new MarketplaceAssignment();
}
```

---

## 4. Product Roadmap: Phased Evolution

### Phase 1: Vertical Operator Foundation (Current — Months 1-6)
**Goal:** Operational excellence, guest trust, vendor discipline

| Sprint | Deliverable | Success Metric |
|--------|-------------|----------------|
| 1 | Trip Hub (`/trips`) — real bookings, QR, status | 90% guest self-serve |
| 2 | Digital Waiver — e-sign, PDF, vendor copy | 100% waiver completion |
| 3 | Booking Modification — reschedule/cancel self-serve | <5% CS tickets for changes |
| 4 | Help Center + In-app Chat | <2hr first response |
| 5 | Verified ID (e-KTP/Passport) | 100% verified guests |
| 6 | **Internal Ops Dashboard** — real-time bookings, vendor status, incidents | 100% ops visibility |
| 7 | **Vendor Management System** — contracts, SLA, payment, performance | 100% vendor SLA tracked |
| 8 | **Real-time Capacity & Scheduling** — BaliWild master schedule | 0 overbooking |
| 9 | **Quality Assurance** — pre/post checklist, mystery guest, incident mgmt | <1% incident rate |
| 10 | **Vendor Payment & Reconciliation** — contractual, tax compliant | 100% on-time vendor pay |
| 11 | **SOP Digital & Vendor App** — mobile briefing, checklist, emergency | 100% vendor compliance |
| 12 | **Dynamic Pricing Engine** — BaliWild controls yield | +15% revenue/booking |

---

### Phase 2: Marketplace Readiness (Months 7-18)
**Goal:** Platform infrastructure, operator portal, payout engine

| Sprint | Deliverable | Dependency |
|--------|-------------|------------|
| 13 | **Public API v1** — bookings, availability, webhooks | Phase 1 stable |
| 14 | **Operator Portal (MVP)** — calendar, bookings, payouts | Phase 1 ops mature |
| 15 | **Auto-Split Payout Engine** — Stripe Connect / Midtrans split | Legal/Finance ready |
| 16 | **Operator Onboarding Flow** — KYC, contract, insurance verification | Compliance ready |
| 17 | **Platform Fee & Commission Engine** | Finance model validated |
| 18 | **Dispute Resolution Center** | Trust & Safety ready |
| 19 | **Public API v2** — reviews, content, webhooks | Partner demand |
| 20 | **Marketplace Launch** — 5-10 pilot operators | All triggers met |

---

### Phase 3: Marketplace Scale (Months 19+)
**Goal:** Network effects, liquidity, platform dominance

| Initiative | Target |
|-------------|--------|
| 50+ Verified Operators | Year 2 |
| 2000+ Bookings/Month | Year 2 |
| Platform Fee Revenue > Vertical Margin | Year 3 |
| International Expansion (Lombok, Labuan Bajo) | Year 3 |
| Mobile App (Guest + Operator) | Year 2 |

---

## 5. Technical Decisions: Future-Proofing

| Decision | Current Implementation | Future Migration Path |
|----------|------------------------|----------------------|
| **Vendor vs Operator** | Single `Vendor` model with `contract` | Split to `Vendor` (internal) + `Operator` (marketplace) |
| **Assignment Logic** | `VerticalOperatorAssignment` strategy | Swap to `MarketplaceAssignment` via feature flag |
| **Payout** | Contractual batch (weekly/monthly) | Add `AutoSplitPayout` service for marketplace |
| **Commission** | N/A (vertical margin) | Add `PlatformFeeEngine` with configurable % |
| **Operator Portal** | Internal ops dashboard | Extend with operator-facing views |
| **API** | Internal (Next.js server actions) | Expose via `/api/v1` with auth, rate limits |
| **Webhooks** | Midtrans only | Add `booking.created`, `payment.paid`, `review.published` |
| **Analytics** | Console.log + GA4 | Event-driven (Kafka/Redis Streams) → Data Lake |
| **Auth** | NextAuth (guest) + Admin session | Add OAuth2/OIDC for operator API access |

---

## 6. Operational Governance

### 6.1 Current: BaliWild Controls All
| Domain | Authority | Tool |
|--------|-----------|------|
| Pricing | BaliWild | Dynamic Pricing Engine |
| Capacity | BaliWild | Master Schedule |
| Vendor Assignment | BaliWild | Assignment Algorithm |
| Quality Standards | BaliWild | SOP, Checklist, Mystery Guest |
| Guest Communication | BaliWild | WA/Email/SMS templates |
| Issue Resolution | BaliWild | CS Team + Ops |
| Vendor Payment | BaliWild | Contractual Batch |

### 6.2 Future: Shared Governance
| Domain | Platform | Operator |
|--------|----------|----------|
| Base Standards | ✅ (Safety, Insurance, License) | — |
| Pricing | Min/Max bounds | ✅ Dynamic within bounds |
| Capacity | Platform sync | ✅ Manage own calendar |
| Quality | Audit, Mystery Guest | ✅ Self-manage + platform audit |
| Guest Comm | Core templates | ✅ Customize within brand |
| Disputes | Mediate, Decide | Respond, Evidence |
| Payout | Auto-split, fee deduct | Receive net |

---

## 7. Risk Mitigation

| Risk | Current Mitigation | Future Mitigation |
|------|-------------------|-------------------|
| Vendor dependency | Multiple vendors per zone, SLA penalties | Operator diversification, platform standards |
| Quality inconsistency | Mystery guest, pre/post checklist, SOP | Platform QA + operator self-regulation |
| Liability exposure | Waiver, insurance, vendor indemnity | Platform insurance pool, verified ID |
| Tech debt from dual-mode | Strategy pattern, feature flags, unified schema | Regular refactoring sprints, architecture reviews |
| Premature marketplace | Strict transition triggers (6 criteria) | Board approval required for Phase 2 |

---

## 8. Decision Log (Appendix)

| Date | Decision | Rationale | Author |
|------|----------|-----------|--------|
| 2026-11-17 | **Vertical Operator as Phase 1** | Full margin, quality control, brand ownership | Founder |
| 2026-11-17 | **Marketplace as Phase 2 (conditional)** | Scale requires network effects; not now | Founder |
| 2026-11-17 | **Unified Schema + Strategy Pattern** | Single codebase, zero-duplication migration | Tech Lead |
| 2026-11-17 | **Vendor = Internal Contractor** | Legal clarity, liability chain | Legal |
| 2026-11-17 | **No Auto-Split Until Phase 2** | Contractual control, tax simplicity | Finance |

---

## 8. Glossary

| Term | Definition |
|------|------------|
| **Vertical Operator** | Perusahaan yang menjual, mengoperasikan, dan bertanggung jawab penuh atas produknya |
| **Marketplace Platform** | Platform yang menghubungkan supplier (operator) dengan demand (guest), mengambil fee |
| **Vendor (Current)** | Kontraktor lokal yang mengeksekusi tour per kontrak & SOP BaliWild |
| **Operator (Future)** | Pihak ketiga independen yang mengelola inventory & pricing sendiri di platform |
| **SOP** | Standard Operating Procedure — standar kualitas & safety BaliWild |
| **Assignment** | Proses BaliWild menugaskan vendor ke booking berdasarkan zona/kapasitas/skill |
| **Master Schedule** | Jadwal pusat yang dikelola BaliWild, vendor menerima assign |
| **Platform Fee** | Persentase yang dipotong platform dari transaksi operator (future) |
| **Auto-Split Payout** | Pembayaran otomatis ke operator net of platform fee (future) |

---

## 9. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Founder / CEO | | | 2026-11-17 |
| CTO / Tech Lead | | | 2026-11-17 |
| Head of Operations | | | 2026-11-17 |
| Head of Finance | | | 2026-11-17 |
| Legal Counsel | | | 2026-11-17 |

---

> **Document Control:**  
> - This document is the **single source of truth** for BaliWild business direction.  
> - All technical decisions **must reference** this blueprint.  
> - Changes require **Founder + CTO approval** and version bump.  
> - Review quarterly; update on phase transitions.