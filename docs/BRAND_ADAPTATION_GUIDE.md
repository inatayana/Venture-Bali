# Brand Adaptation Guide

> **Version:** 1.0.0  
> **Status:** Active  
> **Last Updated:** 2026-11-05  
> **Owner:** Platform Engineering Team

---

## 🎯 Purpose

This guide provides a step-by-step process for spinning up a new brand on the platform. The goal: **from zero to live in under 1 day** with full brand customization, tenant isolation, and zero code changes.

---

## 🎯 Target Audience

- Platform engineers onboarding new brands
- Product managers defining brand scope
- DevOps engineers provisioning infrastructure

---

## ⏱️ Timeline: Zero to Live

| Phase | Duration | Owner |
|-------|----------|-------|
| **1. Provision Tenant** | 15 min | DevOps |
| **2. Configure Brand** | 30 min | Product + Design |
| **3. Seed Data** | 15 min | Platform Engineer |
| **4. DNS & SSL** | 30 min | DevOps |
| **5. Smoke Test** | 15 min | QA + Product |
| **Total** | **~1.5 hours** | |

---

## 🚀 Step-by-Step Process

### Phase 1: Provision Tenant (15 min)

#### 1.1 Create Tenant Record
```sql
-- Run against production database
INSERT INTO "Tenant" (
  id, 
  domain, 
  name, 
  themeColor, 
  logoUrl, 
  isActive
) VALUES (
  'tenant-<brand-slug>',    -- e.g., 'tenant-baliexp'
  '<brand-slug>',           -- e.g., 'baliexperience' (subdomain)
  '<Brand Display Name>',   -- e.g., 'BaliExperience'
  '#<HEX_COLOR>',           -- e.g., '#2E7D32'
  'https://cdn.example.com/logos/<brand-slug>.svg',  -- optional
  true
) ON CONFLICT (id) DO NOTHING;
```

**Validation Checklist:**
- [ ] `domain` is unique, lowercase, alphanumeric + hyphens only
- [ ] `themeColor` is valid 6-digit hex
- [ ] `logoUrl` is HTTPS, accessible, SVG preferred

#### 1.2 Verify Tenant Creation
```bash
# Verify tenant exists and is active
curl -H "X-Tenant-ID: tenant-<brand-slug>" \
  https://api.example.com/api/v1/health
# Should return 200 with tenant context
```

---

### Phase 2: Configure Brand (30 min)

#### 2.1 Prepare Brand Config YAML
Create `brand-config-<brand-slug>.yaml`:

```yaml
brand:
  name: "BaliExperience"
  shortName: "BaliExp"
  tagline: "Discover Authentic Bali"
  description: "Curated local experiences by verified hosts"
  logoUrl: "https://cdn.example.com/logos/baliexperience.svg"
  faviconUrl: "https://cdn.example.com/favicons/baliexperience.ico"

theme:
  primaryColor: "#2E7D32"
  secondaryColor: "#1B5E20"
  accentColor: "#81C784"
  fontHeading: "Montserrat"
  fontBody: "Inter"
  borderRadius: "md"

categories:
  - slug: "culture"
    name: "Culture & Heritage"
    short: "Culture"
    emoji: "🏛️"
    description: "Temples, ceremonies, traditional arts"
    isActive: true
    sortOrder: 1
  - slug: "nature"
    name: "Nature & Adventure"
    short: "Nature"
    emoji: "🌿"
    description: "Waterfalls, rice terraces, volcanoes"
    isActive: true
    sortOrder: 2
  - slug: "wellness"
    name: "Wellness & Healing"
    short: "Wellness"
    emoji: "🧘"
    description: "Yoga, meditation, spa, sound healing"
    isActive: true
    sortOrder: 3
  - slug: "culinary"
    name: "Culinary Experiences"
    short: "Food"
    emoji: "🍲"
    description: "Cooking classes, food tours, farm visits"
    isActive: true
    sortOrder: 4

pricing:
  currency:
    base: "IDR"
    display: ["IDR", "USD", "AUD"]
    exchangeRate:
      USD: 15500
      AUD: 10200
  rounding: "1000"
  minPriceIdr: 50000
  maxDiscountPercent: 40
  promoStacking: false
  couponStacking: false

booking:
  minAdvanceHours: 2
  maxAdvanceDays: 365
  cancellationPolicy:
    freeCancellationHours: 24
    refundPercentTiers:
      - hoursBefore: 24
        refundPercent: 80
      - hoursBefore: 12
        refundPercent: 50
      - hoursBefore: 0
        refundPercent: 0
  holdDurationMinutes: 15
  maxPaxPerBooking: 15
  requireWaiver: true
  waiverVersion: "1.0"

payment:
  midtrans:
    clientKey: "<FROM_ENV>"      # Set via env var
    serverKey: "<FROM_ENV>"      # Set via env var
    isProduction: false
    enabledMethods:
      - "credit_card"
      - "gopay"
      - "shopeepay"
      - "bank_transfer"
      - "qrris"
  manualTransfer:
    enabled: true
    bankAccounts:
      - bank: "BCA"
        accountNumber: "1234567890"
        accountName: "PT BaliExperience"

communication:
  email:
    fromName: "BaliExperience"
    fromEmail: "hello@baliexperience.com"
    supportEmail: "support@baliexperience.com"
    helloEmail: "hello@baliexperience.com"
    partnersEmail: "partners@baliexperience.com"
  whatsapp:
    businessNumber: "+6281234567890"
  notifications:
    bookingConfirmation: true
    paymentReminder: true
    pickupReminder: true
    reviewRequest: true
    reviewRequestDelayHours: 24

seo:
  defaultTitle: "BaliExperience - Authentic Local Experiences"
  defaultDescription: "Discover authentic Bali through curated local experiences. Verified hosts, instant booking, free cancellation."
  ogImageUrl: "https://cdn.example.com/og/baliexperience.jpg"
  twitterHandle: "@baliexperience"
  googleAnalyticsId: "G-XXXXXXXXXX"

features:
  aiContentGeneration: true
  reviewInvites: true
  couponCodes: true
  groupBooking: false
  giftCards: false
  loyaltyProgram: false
  multiLanguage: true
  pwa: true

localization:
  defaultLocale: "en"
  supportedLocales: ["en", "id"]
  dateFormat: "DD MMM YYYY"
  timeFormat: "HH:mm"
  numberFormat: "id-ID"

operations:
  timezone: "Asia/Makassar"
  businessHours:
    start: "08:00"
    end: "22:00"
    days: [0, 1, 2, 3, 4, 5, 6]
```

#### 2.2 Validate Config
```bash
# Validate against Zod schema
npm run brand:validate -- --config brand-config-<brand-slug>.yaml
# Should output: ✅ Valid brand configuration
```

#### 2.3 Apply Config to Database
```sql
UPDATE "Tenant" 
SET config = '<JSON_STRING_FROM_YAML>'
WHERE id = 'tenant-<brand-slug>';
```

**Validation:**
```bash
curl -H "X-Tenant-ID: tenant-<brand-slug>" \
  https://api.example.com/api/v1/ventures
# Should return ventures filtered by tenant's categories
```

---

### Phase 3: Seed Data (15 min)

#### 3.1 Run Tenant-Specific Seeding
```bash
# Seed ventures, variants, pickup zones for this tenant
TENANT_ID=tenant-<brand-slug> npm run db:seed
```

**Expected Output:**
```
✅ Created 5 ventures
✅ Created 12 variants
✅ Created 3 pickup zones
✅ Created 2 vehicle classes
✅ Created 3 vendors
✅ Seeding completed in 8.2s
```

#### 3.2 Verify Seeded Data
```bash
# Check ventures
curl -H "X-Tenant-ID: tenant-<brand-slug>" \
  https://api.example.com/api/v1/ventures

# Check pickup zones
curl -H "X-Tenant-ID: tenant-<brand-slug>" \
  https://api.example.com/api/v1/pickup-zones
```

---

### Phase 4: DNS & SSL (30 min)

#### 4.1 Subdomain Setup (Automatic)
```bash
# Platform automatically provisions:
# - <brand-slug>.platform.example.com → API
# - <brand-slug>.app.example.com → Frontend
# - <brand-slug>.cdn.example.com → Static assets
```

#### 4.2 Custom Domain (Optional)
```bash
# For custom domain: brandexperience.com
# 1. Add CNAME record:
#    www.brandexperience.com → cname.platform.example.com
#    brandexperience.com → A record to platform ALB IP

# 2. Update tenant record:
UPDATE "Tenant" SET domain = 'brandexperience.com' WHERE id = 'tenant-<brand-slug>';

# 3. Provision SSL (Let's Encrypt auto-provisioned)
# Platform handles ACME challenge via DNS-01
```

#### 4.3 SSL Verification
```bash
# Verify SSL
curl -I https://brandexperience.com/api/v1/health
# Should return 200 with valid SSL certificate
```

---

### Phase 5: Smoke Test (15 min)

#### 5.1 Critical Path Tests
```bash
# 1. Health check
curl https://brandexperience.com/api/v1/health

# 2. List ventures (tenant-scoped)
curl -H "X-Tenant-ID: tenant-<brand-slug>" \
  https://api.example.com/api/v1/ventures

# 3. Get single venture
curl https://brandexperience.com/api/v1/ventures/<venture-id>

# 4. Create booking (test flow)
curl -X POST https://brandexperience.com/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-<brand-slug>" \
  -d '{
    "variantId": "<variant-id>",
    "bookingDate": "2026-12-25",
    "slotTimeId": "<slot-id>",
    "fulfillmentMode": "SELF_DRIVE",
    "paxCount": 2,
    "customer": {
      "email": "test@example.com",
      "name": "Test User",
      "countryCode": "ID",
      "whatsapp": "+6281234567890"
    }
  }'

# 5. Payment initiation
curl -X POST https://brandexperience.com/api/v1/payment/midtrans \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "<booking-id>"}'

# 6. Frontend load
curl -I https://brandexperience.com/
# Should return 200 with correct theme colors
```

#### 5.2 Verification Checklist
| Test | Expected | Pass/Fail |
|------|----------|-----------|
| API health | 200 OK | ☐ |
| Ventures list | Tenant-filtered results | ☐ |
| Brand colors | Primary color in CSS vars | ☐ |
| Categories | Only tenant's active categories | ☐ |
| Booking flow | Creates booking + payment | ☐ |
| Payment redirect | Midtrans snap URL | ☐ |
| Frontend loads | 200, correct theme | ☐ |
| SSL certificate | Valid, no warnings | ☐ |

---

## ✅ Go-Live Checklist

| Item | Owner | Done |
|------|-------|------|
| Tenant provisioned in DB | DevOps | ☐ |
| Brand config applied & validated | Product | ☐ |
| Seed data completed | Platform Eng | ☐ |
| DNS records configured | DevOps | ☐ |
| SSL certificate provisioned | DevOps | ☐ |
| Smoke tests passed | QA | ☐ |
| Analytics events firing | Analytics | ☐ |
| Error tracking configured | DevOps | ☐ |
| Documentation updated | Product | ☐ |
| Stakeholder sign-off | PM | ☐ |

---

## 🔧 Troubleshooting

| Issue | Diagnosis | Resolution |
|-------|-----------|------------|
| API returns 404 for ventures | Tenant not linked to categories | Check `tenant.config.categories` has active slugs matching venture categories |
| Wrong theme colors | CSS vars not injected | Check `tenant.themeColor` and `tenant.config.theme` |
| Booking fails with tenant error | Missing `tenantId` in create | Ensure API routes pass `tenant.id` |
| SSL certificate not provisioned | DNS not propagated | Wait for DNS propagation, check ACME logs |
| Wrong language shown | Locale not detected | Check `Accept-Language` header handling |

---

## 📋 Brand Config Template (Minimal)

For rapid prototyping, use this minimal config:

```yaml
brand:
  name: "<Brand Name>"
  shortName: "<Short>"
  tagline: "<Tagline>"
theme:
  primaryColor: "#<HEX>"
categories:
  - slug: "<slug>"
    name: "<Name>"
    short: "<Short>"
    emoji: "🏷️"
    isActive: true
    sortOrder: 1
```

---

## 🔐 Security Reminders

- **Never commit** actual API keys, secrets, or real customer data to config files
- Use environment variables for: `midtrans.clientKey`, `midtrans.serverKey`, `googleAnalyticsId`
- Rotate keys after brand launch
- Enable `isActive: false` for staging tenants

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| `MULTI_TENANCY_GUIDE.md` | Architecture & patterns |
| `PLATFORM_CONSTITUTION.md` | Core principles |
| `EXTENSION_POINTS.md` | Plugin/hook system |

---

## 📝 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-11-05 | Platform Team | Initial version |

---

> **Note**: This guide contains no proprietary secrets, customer data, or internal infrastructure details. All configuration examples use placeholder values. Adapt paths, domains, and credentials to your environment.