# BaliWild — 20-Year Strategic Roadmap & Architecture Decisions

> **Version:** 1.0.0
> **Status:** APPROVED — Single Source of Truth for Long-Term Direction
> **Last Updated:** November 2026
> **Classification:** INTERNAL — Strategic Direction
> **Author:** Senior Product & Database Architect
> **Review Cadence:** Quarterly (architect) / Annually (board)

---

## 1. Executive Summary

**BaliWild adalah Vertically Integrated Adventure Operator** yang menjual, mengoperasikan, dan bertanggung jawab penuh atas setiap pengalaman petualangan di Bali.

**Bukan** marketplace. **Bukan** platform B2B. **Bukan** OTA fee-based model.

**Visi:** "Own the Wild" — Memberikan pengalaman petualangan Bali yang aman, autentik, dan *hassle-free* di mana BaliWild menjamin kualitas dari *booking* hingga *completion*.

**Misi:** Membangun ekosistem petualangan Bali yang **terpercaya**, **terstandarisasi**, dan **berskala** — di mana BaliWild mengontrol kualitas end-to-end, namun arsitektur sistem siap berkembang menjadi **Marketplace/Platform** saat waktu yang tepat.

---

## 2. Current State Assessment (November 2026)

### 2.1 Technical Architecture Scorecard

| Dimension | Score | Status |
|-----------|-------|--------|
| Technical Architecture | 8.5/10 | Production-ready, well-documented |
| Database Design | 9/10 | Sophisticated, scalable, dual-mode ready |
| Product Differentiation | 8/10 | Strong vertical operator moat |
| SEO/Content Strategy | 7.5/10 | Strong foundation, needs scale |
| AI/Automation | 8/10 | Innovative agent + content wizard |
| Scalability Readiness | 7/10 | Good foundation, needs infra investment |
| Competitive Moat vs OTAs | 6.5/10 | Vertical control strong; brand/SEO needs scale |

### 2.2 Core Product (Vertical Operator Model) — COMPLETE

- ✅ Booking Engine: 3 fulfillment modes (Self-Drive, Shared, Private Transfer) with zone-based pricing
- ✅ Tiered Pricing: Pax-based + age-tiered + promo + coupon
- ✅ Payment: Midtrans Snap (VA, QRIS, CC, e-Wallet)
- ✅ Voucher: QR-coded, verifiable at check-in
- ✅ Vendor Management: Contracts, SLA, performance tracking
- ✅ AI Agent: WhatsApp/Telegram/Web with function calling
- ✅ Content Engine: AI-generated SEO articles with validation
- ✅ Review System: Verified booking + founding guest + moderation
- ✅ Multi-currency (9), Multi-language (EN/ID), Dark/Light
- ✅ Admin: Product Manager, Vendor Portal (internal), Ops Dash

### 2.3 Technical Stack (Locked)

| Layer | Technology | Decision |
|-------|------------|----------|
| Frontend/SSR | Next.js 14.2.35 (App Router) | ✅ Security patch locked |
| Database | Supabase PostgreSQL + Prisma ORM | ✅ Locked |
| Auth | Supabase Auth | 🔄 Planned |
| Storage | Supabase Storage | ✅ Active |
| Payments | Midtrans Snap + Webhooks | ✅ Active |
| AI | Gemini 2.5 Flash (free tier) | ✅ Active |
| Messaging | WhatsApp Cloud API, Telegram Bot API | 🔄 In Progress |
| Deployment | Vercel Free Tier → Hostinger VPS (Phase 2) | ✅ Documented |
| Observability | Sentry (planned), Vercel Analytics | 🔄 Future |

---

## 3. Competitive Positioning vs Global OTAs

### 3.1 Structural Advantages (The "Unfair" Moat)

| Moat | Description | Defensibility |
|------|-------------|---------------|
| **Zero OTA Commission** | 20-30% price advantage vs GYG/Klook/Viator | **High** — structural |
| **Field Operations Control** | Direct vendor assignment, SOP enforcement, mystery guests | **High** — requires local presence |
| **Liability Chain** | BaliWild liable to guest → vendor indemnifies BaliWild | **High** — legal structure |
| **Real-time Capacity** | Master schedule prevents overbooking | **Medium-High** |
| **AI Content Engine** | Programmatic SEO at near-zero marginal cost | **Medium** |
| **Multi-channel AI Agent** | WhatsApp/Telegram/Web unified | **Medium** |
| **Indonesian Payment Native** | QRIS, VA, GoPay, ShopeePay — zero friction domestic | **High** |

### 3.2 Critical Gaps vs OTAs (Must Close)

| Gap | Priority | Timeline |
|-----|----------|----------|
| Brand Awareness | 🔴 Critical | 12-18 months |
| Inventory Breadth (50+ vs 1000+) | 🟡 High | 18 months |
| International Trust Signals | 🟡 High | 12 months |
| Mobile App | 🟢 Medium | Year 2 |
| Loyalty/Retention | 🟢 Medium | Year 2 |

---

## 4. 20-Year Phased Roadmap

### Phase 1: Vertical Operator Dominance (Months 1-18) — **CURRENT**

**North Star:** Profitable Bookings/Month > 500

| Sprint | Deliverable | KPI |
|--------|-------------|-----|
| 1-3 | Trip Hub (`/trips`), Digital Waiver, Self-serve Modify | 90% self-serve |
| 4-6 | Help Center, In-app Chat, Verified ID | <2hr CS response |
| 7-9 | **Internal Ops Dashboard** (real-time), Vendor Mgmt System | 100% ops visibility |
| 10-12 | Real-time Capacity, QA Automation, Vendor Payment Reconciliation | 0 overbooking, <1% incident |
| 13-15 | SOP Digital + Vendor App, Dynamic Pricing Engine | +15% revenue/booking |
| 16-18 | **SEO Dominance**: 500+ articles, #1 for "Bali [activity]" | 100k organic/mo |

**Transition Triggers (ALL must be met):**
1. >500 bookings/month
2. >20 verified vendors
3. SOP documented, QA automated, incident rate <1%
4. Public API, webhooks, operator portal, payout engine ready
5. #1 Bali adventure brand, SEO dominance, review volume
6. Positive unit economics, platform fee model validated
7. Legal framework for third-party liability

### Phase 2: Marketplace Platform (Months 19-36)

**North Star:** Platform Take Rate × GMV

| Quarter | Initiative | Technical Prerequisite |
|---------|------------|------------------------|
| Q1 | Public API v1 (REST + Webhooks) | AuthZ, rate limits, idempotency keys |
| Q2 | Operator Portal MVP (calendar, payouts) | Auto-split engine, Stripe Connect/Midtrans Split |
| Q3 | Operator Onboarding (KYC, insurance, license) | Compliance workflow, document verification |
| Q4 | Platform Fee Engine (configurable %) | Finance model, tax compliance |
| Y2 Q1 | Dispute Resolution Center | Mediation workflow, evidence collection |
| Y2 Q2 | **Marketplace Launch** (5-10 pilot operators) | All triggers met |
| Y2 Q3 | Public API v2 (reviews, content) | Partner demand |
| Y2 Q4 | Mobile Apps (Guest + Operator) | React Native / Expo |

### Phase 3: Platform Scale & Expansion (Years 3-5)

| Target | Timeline |
|--------|----------|
| 50+ Verified Operators | Year 2 |
| 2,000+ Bookings/Month | Year 2 |
| Platform Fee Revenue > Vertical Margin | Year 3 |
| International Expansion (Lombok, Labuan Bajo, Raja Ampat) | Year 3 |
| Mobile Apps Live | Year 2 |

### Phase 4: Ecosystem & Moat Deepening (Years 5-10)

- **BaliWild OS**: White-label SaaS for other destinations
- **Fintech Layer**: Embedded insurance, BNPL for travel, vendor working capital
- **Data Network**: Anonymized demand forecasting sold to tourism boards
- **Super-app**: Transport, dining, accommodation bundling

### Phase 5: Category Leadership (Years 10-20)

- **Southeast Asia Adventure Platform**: Thailand, Vietnam, Philippines, Malaysia
- **B2B2C**: Powering hotel concierge, airline ancillary, credit card travel portals
- **Infrastructure Play**: Booking engine as a service (like Stripe for activities)

---

## 5. Database Architecture — 20-Year Evolution

### 5.1 Current Schema Strengths

- ✅ Normalization: Proper 3NF with strategic denormalization (JSON for flexible arrays)
- ✅ Indexing Strategy: Composite indexes on query patterns
- ✅ Enum Discipline: 18 enums prevent string chaos
- ✅ Audit Fields: `createdAt`/`updatedAt` on all models
- ✅ Soft Relations: Nullable FKs for future marketplace split
- ✅ Capacity Logic: `SlotTime.currentBookings` + `maxCapacity` + transactional holds

### 5.2 Scaling Architecture

```
CURRENT (0-10k bookings/mo)          FUTURE (100k+ bookings/mo)
┌─────────────────────────────┐      ┌─────────────────────────────┐
│  Supabase Shared Cluster    │      │  Supabase Dedicated/Pro     │
│  - Transaction Pooler       │      │  - Read Replicas (3+)       │
│  - 100 connections          │      │  - PgBouncer (session mode) │
│  - Point-in-time recovery   │      │  - Partitioned tables       │
└─────────────────────────────┘      │  - pgvector for AI search   │
                                     │  - TimescaleDB for analytics│
                                     └─────────────────────────────┘
```

### 5.3 Table Evolution Plan

| Table | Current | 20-Year Target | Migration Path |
|-------|---------|----------------|----------------|
| `Booking` | Single tenant | Partition by `tenantId` + `bookingDate` (monthly) | Native PG partitioning |
| `SlotTime` | Per-variant | Global capacity pool per location/activity | Materialized view + trigger |
| `Vendor` | Internal contractors | Split: `Vendor` (internal) + `Operator` (marketplace) | New table, migrate via view |
| `Article` | Single table | Shard by `publishedAt` (quarterly) + full-text search | PG `pg_trgm` + partitioning |
| `AgentSession` | Single table | TTL auto-purge (30 days) + Redis cache layer | `pg_cron` + Redis |
| `Review` | Approved/unapproved | Vector embeddings for semantic search | `pgvector` extension |

---

## 6. Immediate Action Plan — Quick Wins (0-30 Days)

| # | Action | Impact | Effort | Owner | Status |
|---|--------|--------|--------|-------|--------|
| 1 | Enable Supabase RLS + Tenant Policies | Multi-tenancy security, zero-cost | 2 days | Backend | 🔄 Planned |
| 2 | Add `pgvector` + Article Embeddings | Semantic search for AI agent + SEO | 3 days | Backend | 🔄 Planned |
| 3 | Implement Booking Partitioning (monthly by `bookingDate`) | Query perf at scale | 1 day (DDL) | Backend | 🔄 Planned |
| 4 | Launch "Why Book Direct" Landing Page | Conversion + SEO for brand terms | 1 week | Product + FE | 🔄 Planned |
| 5 | WhatsApp Business API Verification | Primary CS channel for ID market | 2 weeks | Backend | 🔄 Planned |
| 6 | Structured Data Audit (Rich Results Test all page types) | SEO CTR boost | 2 days | SEO | 🔄 Planned |
| 7 | Core Web Vitals Monitoring (Vercel Analytics + custom RUM) | Lighthouse >90 maintenance | 1 day | FE | 🔄 Planned |

---

## 7. Strategic Investments (30-90 Days)

| # | Initiative | Rationale | Investment | Owner | Status |
|---|------------|-----------|------------|-------|--------|
| 1 | Content Velocity: 50 articles/month via AI Wizard | Topical authority → organic dominance | 1 content ops + AI costs | Content | 🔄 Planned |
| 2 | Review Flywheel: Automate founding guest + post-trip invites | Social proof → conversion + SEO | Engineering 1 week | Backend | 🔄 Planned |
| 3 | Dynamic Pricing Engine v1: Demand-based tier adjustment | +15% revenue/booking (per blueprint) | 2-3 sprints | Backend | 🔄 Planned |
| 4 | Vendor Mobile App (PWA): Checklist, briefing, emergency | Operational excellence → quality moat | 3-4 sprints | Full-stack | 🔄 Planned |
| 5 | International SEO: EN/ID content parity + hreflang | Capture foreign tourist intent | Ongoing | SEO | 🔄 Planned |

---

## 8. Architecture Decisions — ADR Registry

### ADR-001: Search/Discovery Engine
**Decision:** Typesense (self-hosted on VPS)
**Alternatives:** Algolia ($$), Meilisearch, PG `pg_trgm`
**Rationale:** Typo-tolerance, facet filtering, affordable, self-hosted control
**Status:** APPROVED
**Implementation:** Phase 2 (VPS migration)

### ADR-002: Analytics/BI Platform
**Decision:** PostHog (self-hosted)
**Alternatives:** GA4 + BigQuery, Mixpanel, Amplitude, Supabase Realtime + Metabase
**Rationale:** Product analytics + feature flags + session replay in one; self-hosted on VPS
**Status:** APPROVED
**Implementation:** Phase 1 (can run on Vercel via Docker)

### ADR-003: Background Job Framework
**Decision:** BullMQ on Redis (VPS Phase 2)
**Alternatives:** Vercel Cron, Temporal, pg_cron
**Rationale:** Reliable, observable, scalable, priority queues, delayed jobs, retries
**Status:** APPROVED
**Implementation:** Phase 2 (VPS migration); interim: Vercel Cron + external cron-job.org

### ADR-004: Image Pipeline
**Decision:** Stay with Vercel Optimizer + Sharp (already approved)
**Alternatives:** Cloudinary, Imgix, Thumbor
**Rationale:** Zero cost, already implemented, WebP master + edge variants
**Status:** APPROVED (ref: TECH_DECISION_LOG.md §9, §15)

### ADR-005: Multi-region Database
**Decision:** Supabase Dedicated + Read Replicas
**Alternatives:** Neon, PlanetScale, Self-hosted PG
**Rationale:** Simplest migration path, same provider, managed replicas
**Status:** APPROVED
**Implementation:** When Vercel limits exceeded

### ADR-006: Mobile Strategy
**Decision:** PWA → Expo (Year 2)
**Alternatives:** PWA only, React Native, Flutter
**Rationale:** PWA covers 80% use cases; Expo for native features (push, offline, app store)
**Status:** APPROVED
**Implementation:** Year 2

### ADR-007: Internationalization Platform
**Decision:** Crowdin (Year 2)
**Alternatives:** Locize, in-house, Crowdin
**Rationale:** CI/CD integration, context-aware translation, cost-effective at scale
**Status:** APPROVED
**Implementation:** Year 2

---

## 9. Risk Mitigation — 20-Year Perspective

| Risk Category | Probability | Impact | Mitigation |
|---------------|-------------|--------|------------|
| Platform Dependency (Vercel/Supabase) | Medium | High | Documented VPS migration path; own domain; portable stack |
| AI Model Changes (Gemini deprecation) | High | Medium | Multi-provider abstraction (`src/lib/gemini.ts`); budget for paid tier |
| OTA Retaliation (price matching, exclusivity) | Medium | High | Structural price advantage (no 30% fee); direct vendor relationships |
| Regulatory (Indonesian tourism licensing, data sovereignty) | Medium | High | Legal counsel retainer; data residency via Supabase SG/ID region |
| Key Person Dependency (Founder/Tech Lead) | High | Critical | Documentation culture (✅ strong); bus factor ≥2 per domain |
| Technical Debt Accumulation | High | Medium | Quarterly architecture review; dedicated refactor sprints (10% capacity) |
| Vendor Concentration | Medium | High | Multi-vendor per zone; SLA penalties; operator diversification (Phase 2) |
| Currency/Inflation (IDR volatility) | Medium | Low | IDR base pricing; USD display only; hedge via supplier contracts |

---

## 10. KPI Framework — Measuring 20-Year Success

### Phase 1 (Vertical Operator) — North Star: **Profitable Bookings/Month**

| Metric | Target (Month 18) | Measurement |
|--------|-------------------|-------------|
| Monthly Bookings | >500 | `Booking` count |
| Revenue/Booking | >IDR 300k | `Booking.totalPrice` avg |
| Organic Traffic | >100k/mo | GA4 / Search Console |
| Conversion Rate | >8% | Booking started → paid |
| Incident Rate | <1% | `VendorIncident` / Booking |
| Vendor On-time Pay | 100% | `VendorPayout.status = PAID` |
| Review Coverage | >10/product | `Review` count / `Venture` |

### Phase 2 (Marketplace) — North Star: **Platform Take Rate × GMV**

| Metric | Target (Year 2) | Measurement |
|--------|-----------------|-------------|
| Verified Operators | >20 | `Operator.status = VERIFIED` |
| Platform GMV | >IDR 2B/mo | Σ `Booking.totalPrice` (marketplace) |
| Take Rate | 15-20% | Platform fee / GMV |
| Operator Retention | >90% YoY | Active operators / Total |
| Guest NPS | >50 | Post-trip survey |

### Phase 3+ (Ecosystem) — North Star: **Revenue per Employee**

| Metric | Target (Year 5) |
|--------|-----------------|
| Revenue/Employee | >IDR 5B |
| International Markets | 3+ countries |
| B2B Partnerships | 10+ (hotels, airlines, cards) |
| SaaS ARR (White-label) | >IDR 10B |

---

## 11. Technical Debt & Refactor Priorities

### Immediate (This Sprint)

```typescript
// 1. Add missing indexes (run via migration)
// See Section 5.3 in original analysis

// 2. Fix N+1 in ventureMapper.ts (verify query plan)
const ventures = await prisma.venture.findMany({
  include: { variants: { include: { priceTiers: true, slotTimes: true } } }
})
// → Use DataLoader or batch loading

// 3. Add request validation middleware for all /api/admin/*
// 4. Implement idempotency keys for /api/booking and /api/payment
```

### Short-term (Next Quarter)

- Extract `computeQuote` to pure function (already done in `pricing.ts` ✅) — ensure 100% test coverage
- Migrate `Json` fields to proper relations where query patterns stabilize (e.g., `Venture.highlights` → `Highlight` table)
- Add OpenTelemetry tracing for distributed request tracking (Vercel → VPS)
- Implement feature flag system (PostHog or custom) for gradual marketplace rollout

### Medium-term (Year 1)

- **Event Sourcing for Booking Lifecycle**: `BookingChange` → full event store (audit, replay, analytics)
- **CQRS for Read Models**: Materialized views for dashboard queries (vendor performance, revenue, occupancy)
- **GraphQL Gateway**: Unify REST + AI Agent + future public API
- **Database Branching**: Supabase branching for preview deployments

---

## 12. Agent Skill Enhancement Plan

Based on this analysis, the AI Agent (`src/lib/agent-service.ts`) must be upgraded:

### 12.1 Knowledge Base Expansion

| Domain | Current | Target | Action |
|--------|---------|--------|--------|
| Product Catalog | 9 categories, basic info | Full variant + pricing + availability | Tool: `getProductCatalog` with filters |
| Pricing | Static tier lookup | Dynamic pricing awareness | Tool: `getDynamicPrice` with demand signals |
| Vendor/Ops | Not exposed | SLA, capacity, incident status | Tool: `getVendorStatus` (internal only) |
| Reviews | Not queryable | Semantic search + sentiment | Tool: `searchReviews` (pgvector) |
| Booking Management | Create only | Full lifecycle (modify, cancel, reschedule) | Tools: `modifyBooking`, `cancelBooking`, `rescheduleBooking` |
| Payments | Midtrans only | Multi-method, refund status | Tool: `getPaymentStatus` |
| Multi-language | EN/ID | EN/ID/JA/ZH/KO | i18n integration in agent prompts |

### 12.2 Agent Architecture Upgrades

```typescript
// Current: Single Gemini call with tools
// Target: Multi-step reasoning with memory

interface AgentUpgrade {
  // 1. Long-term memory per customer
  customerProfile: CustomerProfile; // preferences, history, LTV
  
  // 2. Multi-step planning
  plan: ExecutionPlan; // decompose complex requests
  
  // 3. Proactive capabilities
  proactiveTriggers: ProactiveTrigger[]; // price drop, availability, review request
  
  // 4. Handoff protocol
  humanHandoff: HandoffProtocol; // seamless escalation with context
  
  // 5. Analytics integration
  eventTracking: EventTracker; // track agent performance metrics
}
```

### 12.3 Implementation Priority

| Priority | Upgrade | Effort | Dependencies |
|----------|---------|--------|--------------|
| 1 | Add `searchReviews` tool (pgvector) | 1 week | ADR-001, pgvector |
| 2 | Add `getDynamicPrice` tool | 3 days | Dynamic Pricing Engine v1 |
| 3 | Implement customer profile memory | 1 week | PostHog/Analytics |
| 4 | Multi-language prompt templates | 3 days | Crowdin integration |
| 5 | Proactive notification triggers | 2 weeks | BullMQ + Review Flywheel |

---

## 13. Decision Log & Sign-Off

| Date | Decision | Rationale | Author |
|------|----------|-----------|--------|
| 2026-11-27 | 20-Year Roadmap Approved | Vertical first, marketplace conditional | Architect |
| 2026-11-27 | ADR-001 to ADR-007 Approved | Technology choices for scale | Architect |
| 2026-11-27 | Quick Wins Prioritized | 0-30 day impact | Architect |
| 2026-11-27 | Agent Upgrade Plan Approved | Competitive CS differentiation | Architect |

---

## 14. Document Control

- This document is the **single source of truth** for BaliWild long-term strategy
- All technical decisions **must reference** this roadmap
- Changes require **Founder + CTO + Architect approval** and version bump
- Review quarterly; update on phase transitions
- Linked documents: `BUSINESS_BLUEPRINT.md`, `TECH_DECISION_LOG.md`, `BOOKING_ARCHITECTURE.md`, `PRD_ANALYSIS.md`

---

## 15. Next Actions (This Week)

1. [ ] Create migration for Booking partitioning + indexes
2. [ ] Enable `pgvector` extension on Supabase
3. [ ] Draft "Why Book Direct" page spec
4. [ ] Initiate WhatsApp Business API verification
5. [ ] Set up Typesense trial on local/staging
6. [ ] Configure PostHog self-hosted on staging VPS
7. [ ] Begin Agent tool expansion: `searchReviews`, `getDynamicPrice`

---

**Approved by:** BaliWild Leadership Team
**Date:** November 2026
**Next Review:** February 2027 (Quarterly)