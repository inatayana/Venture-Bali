# BaliWild Platform Constitution

> **Version:** 1.0.0  
> **Status:** Ratified  
> **Last Updated:** 2026-11-05  
> **Owner:** Platform Engineering Team

---

## 🎯 Purpose

This document establishes the **immutable principles** that govern the BaliWild Platform. Every architectural decision, code change, and product feature must align with these principles. This is the "constitution" — changes require RFC process and team consensus.

---

## 🏛️ Core Principles

### 1. Multi-Tenancy First
> **The platform is multi-tenant by default, not as an afterthought.**

- Every model has `tenantId` with FK to `Tenant`
- Tenant isolation at database level (RLS-ready)
- Brand configuration via `Tenant.config` (JSON, Zod-validated)
- No hardcoded `tenant-001` in business logic

### 2. API Versioning is Mandatory
> **Breaking changes require new version, not patches.**

- All public APIs under `/api/v1/*`
- OpenAPI 3.1 spec as source of truth
- Deprecation policy: 6 months notice, parallel run
- Contract testing via `pact` for consumer-driven contracts

### 3. Type Safety is Non-Negotiable
> **`any` is banned. Strict TypeScript everywhere.**

- `tsc --noEmit` must pass
- Zod schemas for all external boundaries (API, webhooks, config)
- Prisma types as single source of truth
- Generated clients from OpenAPI spec

### 4. Testing is Documentation
> **Tests are the only reliable documentation.**

- 676+ tests passing (unit + integration)
- Test fixtures mirror production data shapes
- Contract tests for API compatibility
- E2E tests for critical user journeys

### 5. Observability by Default
> **You cannot operate what you cannot see.**

- Structured logging (Pino) with correlation IDs
- OpenTelemetry traces for all API routes
- SLO dashboards: latency p95 < 500ms, error rate < 0.1%
- Alert rules for critical paths (booking, payment, webhook)

### 6. Security by Design
> **Security is not a feature; it's the foundation.**

- Row-level security (RLS) via `tenantId`
- JWT auth with short expiry + refresh rotation
- Webhook signature verification (HMAC)
- Input validation via Zod at every boundary
- Rate limiting per tenant + IP

### 7. Multi-Brand Ready
> **New brands spin up in days, not months.**

- Brand config via `Tenant.config` (YAML/JSON)
- Category taxonomy per tenant
- Theme tokens (colors, fonts, radius) per tenant
- Feature flags per tenant
- White-label admin panel

---

## ⚖️ Governance

### RFC Process
1. **Propose**: Create RFC in `docs/rfc/` with problem, solution, alternatives
2. **Discuss**: 5 business days for team feedback
3. **Decide**: Tech lead + product owner approve
4. **Implement**: Feature branch, tests, docs updated
5. **Review**: PR with tests passing, docs updated

### Breaking Change Policy
| Change Type | Notice Period | Migration Support |
|-------------|---------------|-------------------|
| API field removal | 6 months | Parallel run, deprecated header |
| Enum value change | 3 months | Dual-write, adapter layer |
| Config schema change | 3 months | Migration script, default fallback |
| Database column removal | 6 months | Soft delete, backfill script |

### Code Quality Gates (Automated)
```bash
# Must pass before merge
npm run lint       # ESLint zero warnings
npm run typecheck  # tsc --noEmit zero errors
npm test           # 76 suites, 676+ tests passing
npm run build      # Next.js production build success
```

---

## 📦 Extension Points (Stable Contracts)

| Extension Point | Contract | Stability |
|-----------------|----------|-----------|
| `hooks.booking:beforeCreate` | `BookingContext → BookingModifications` | Stable v1 |
| `hooks.booking:afterConfirm` | `Booking → void` | Stable v1 |
| `hooks.price:calculate` | `PriceContext → PriceBreakdown` | Stable v1 |
| `hooks.availability:check` | `Variant, Date, Pax → Slot[]` | Stable v1 |
| `hooks.notification:send` | `NotificationEvent → DeliveryResult` | Stable v1 |
| `brand:themeTokens` | `Tenant → ThemeTokens` | Stable v1 |
| `brand:categoryMap` | `Tenant → CategoryConfig[]` | Stable v1 |

> **Rule**: Extension contracts are versioned. Breaking changes = new contract name.

---

## 🚫 Forbidden Patterns

| Pattern | Why | Alternative |
|---------|-----|-------------|
| `prisma.$queryRaw` in business logic | Bypasses RLS, untestable | Repository pattern + Prisma client |
| `any` type | Defeats type safety | Generics, `unknown`, Zod inference |
| Direct `headers()` in lib code | Couples to Next.js, untestable | Pass context explicitly |
| Hardcoded `tenant-001` | Breaks multi-tenancy | `getTenantContext()` |
| `console.log` in production | PII leakage, noise | Structured logger (Pino) |
| Sync webhooks | Blocks event loop | Fire-and-forget + dead letter queue |

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| `MULTI_TENANCY_GUIDE.md` | Tenant isolation, theming, config patterns |
| `BRAND_ADAPTATION_GUIDE.md` | Spin new brand in 1 day |
| `EXTENSION_POINTS.md` | Plugin/hook system spec |
| `TECH_DECISION_LOG.md` | ADR history, rationale |
| `API_CONTRACTS.md` | OpenAPI spec per version |

---

## ✍️ Amendment History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-11-05 | Platform Team | Initial ratification |

---

> **This constitution is the highest authority.** When in doubt, choose the option that best serves multi-tenancy, type safety, and long-term platform health.