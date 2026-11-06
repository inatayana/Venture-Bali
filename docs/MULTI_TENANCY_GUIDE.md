# Multi-Tenancy Implementation Guide

> **Version:** 1.0.0  
> **Status:** Active  
> **Last Updated:** 2026-11-05  
> **Owner:** Platform Engineering Team

---

## 🎯 Overview

This guide documents the multi-tenancy architecture implemented in the BaliWild Platform. It covers tenant isolation, brand configuration, tenant resolution, and operational patterns.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                              │
├─────────────────────────────────────────────────────────────┤
│  Request → Middleware → getTenantContext() → Tenant Context  │
│         (subdomain, header, session, fallback)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TENANT ISOLATION                          │
├─────────────────────────────────────────────────────────────┤
│  Every query automatically scoped to tenantId via:          │
│  • Prisma middleware (tenantScoping)                        │
│  • Database FK constraints (tenantId → Tenant.id)           │
│  • Row-level security (RLS) - production ready              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Tenant Resolution Strategy

Priority order (highest first):

| Priority | Source | Example | Use Case |
|----------|--------|---------|----------|
| 1 | `X-Tenant-ID` header | `baliwild` | API clients, mobile apps |
| 2 | Subdomain | `baliwild.baliwild.com` | Multi-brand web |
| 3 | Custom domain | `baliwildadventures.com` | White-label |
| 4 | Admin session | `req.session.tenantId` | Admin panel |
| 5 | Default fallback | `tenant-001` | Development, legacy |

**Implementation:** `src/lib/tenant/context.ts::getTenantContext()`

```typescript
// Usage in API routes
const tenant = await getTenantContext();
// tenant.id, tenant.name, tenant.themeColor, tenant.config
```

---

## 📋 Database Schema

### Core Pattern
Every model has:
```prisma
model Example {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
}
```

### Tenant Model
```prisma
model Tenant {
  id         String   @id @default(cuid())
  domain     String   @unique          // subdomain or custom domain
  name       String                     // display name
  themeColor String   @default("#000000")
  logoUrl    String?
  isActive   Boolean  @default(true)
  config     Json?                      // BrandConfigSchema (validated)
  
  // Relations
  ventures   Venture[]
  bookings   Booking[]
  payments   Payment[]
  reviews    Review[]
}
```

---

## 🎨 Brand Configuration

### Schema (Zod-validated)
```typescript
// src/lib/tenant/config.ts
const BrandConfigSchema = z.object({
  brand: { name, shortName, tagline, logoUrl, faviconUrl },
  theme: { primaryColor, secondaryColor, fontHeading, fontBody, borderRadius },
  categories: CategoryConfig[],           // which adventure categories
  pricing: { currency, rounding, minPrice, maxDiscount, promoStacking },
  booking: { minAdvanceHours, maxAdvanceDays, cancellationPolicy },
  payment: { midtrans: { clientKey, serverKey, enabledMethods } },
  communication: { email, whatsapp, notifications },
  seo: { defaultTitle, defaultDescription, ogImageUrl },
  features: { aiContent, reviewInvites, coupons, groupBooking },
  localization: { defaultLocale, supportedLocales, dateFormat },
  operations: { timezone, businessHours }
})
```

### Loading with Caching
```typescript
const config = await getBrandConfig(tenantId);
// 5-minute in-memory cache, falls back to DEFAULT_BRAND_CONFIG
```

### Override Priority
1. `Tenant.config` (database JSON)
2. `DEFAULT_BRAND_CONFIG` (code defaults)
3. Environment variables (for secrets like Midtrans keys)

---

## 🔒 Tenant Isolation Patterns

### 1. Query Scoping (Automatic via Prisma)
```typescript
// All queries automatically include tenantId
const ventures = await prisma.venture.findMany({
  where: { tenantId: tenant.id }, // automatically added
  include: { variants: true }
});
```

### 2. Manual Scoping (when needed)
```typescript
const tenantPrisma = getTenantPrisma(tenant.id);
// All queries on tenantPrisma auto-scope to tenantId
```

### 3. Cross-Tenant Queries (Admin Only)
```typescript
// SUPER_ADMIN only - bypass tenant scoping
const allVentures = await prisma.venture.findMany(); // no tenant filter
```

---

## 🎨 Theming System

### CSS Variables (Injected at Runtime)
```css
:root {
  --brand-primary: #FFEE00;      /* from tenant.themeColor */
  --brand-secondary: #1E3A2B;    /* from tenant.config.theme.secondaryColor */
  --font-heading: 'Barlow Condensed';  /* from tenant.config.theme.fontHeading */
  --font-body: 'Plus Jakarta Sans';    /* from tenant.config.theme.fontBody */
  --border-radius: 8px;          /* from tenant.config.theme.borderRadius */
}
```

### Tailwind Integration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand-primary)',
        'brand-secondary': 'var(--brand-secondary)',
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
      borderRadius: {
        DEFAULT: 'var(--border-radius)',
      },
    },
  },
};
```

---

## 📦 Category Taxonomy per Tenant

### Configuration
```yaml
# tenant.config.categories
- slug: atv
  name: "ATV & Off-Road"
  short: "ATV"
  emoji: "🏁"
  isActive: true
  sortOrder: 1

- slug: rafting
  name: "White Water Rafting"
  short: "Rafting"
  emoji: "🚣"
  isActive: true
  sortOrder: 2
```

### Runtime Resolution
```typescript
const categories = await getCategoriesForTenant(tenantId);
// Returns only active categories for this tenant, sorted by sortOrder
```

---

## 🔧 Operational Patterns

### Creating a New Tenant
```sql
-- 1. Insert tenant
INSERT INTO "Tenant" (id, domain, name, themeColor, isActive)
VALUES ('tenant-baliexp', 'baliexperience', 'BaliExperience', '#2E7D32', true);

-- 2. Run migrations (tenantId columns already exist)
-- No schema changes needed!

-- 3. Configure brand via admin panel or direct JSON
UPDATE "Tenant" 
SET config = '{"brand":{"name":"BaliExperience"},"theme":{"primaryColor":"#2E7D32"},"categories":[...]}'
WHERE id = 'tenant-baliexp';
```

### Tenant-Specific Seeding
```bash
# Seed data for specific tenant
TENANT_ID=tenant-baliexp npm run db:seed
```

### Feature Flags per Tenant
```typescript
const config = await getBrandConfig(tenantId);
if (config.features.groupBooking) {
  // Show group booking UI
}
```

---

## 🚀 Deployment Considerations

### Database
- Single PostgreSQL database, shared schema
- RLS policies for additional security (optional)
- Connection pooling via Prisma Accelerate / PgBouncer

### CDN/Caching
- Tenant-specific cache keys: `tenant:{tenantId}:ventures`
- Cache invalidation on tenant config update
- Separate cache namespaces per tenant

### Monitoring
- Per-tenant metrics: `tenant:{tenantId}:requests_total`
- Per-tenant error rates
- Per-tenant latency percentiles

---

## 🧪 Testing Patterns

### Tenant Fixtures
```typescript
// test/fixtures/tenants.ts
export const testTenant = {
  id: 'tenant-test',
  domain: 'test',
  name: 'Test Brand',
  themeColor: '#FF0000',
  isActive: true,
  config: DEFAULT_BRAND_CONFIG,
};
```

### Multi-Tenant Test Helper
```typescript
async function withTenant<T>(tenantId: string, fn: (tenant: TenantContext) => Promise<T>) {
  const tenant = await getTenantContext(); // mocked in tests
  return fn(tenant);
}
```

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| `PLATFORM_CONSTITUTION.md` | Core principles, governance |
| `BRAND_ADAPTATION_GUIDE.md` | Spin new brand in 1 day |
| `EXTENSION_POINTS.md` | Plugin/hook system spec |
| `API_CONTRACTS.md` | OpenAPI spec per version |

---

## 📝 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-11-05 | Platform Team | Initial version |

---

> **Key Principle**: Multi-tenancy is not a feature flag — it's the foundation. Every query, every cache key, every metric must be tenant-aware.