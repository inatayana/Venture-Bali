# Extension Points Specification

> **Version:** 1.0.0  
> **Status:** Stable v1  
> **Last Updated:** 2026-11-05  
> **Owner:** Platform Engineering Team

---

## 🎯 Purpose

This document defines the **stable extension contracts** that allow brands and partners to extend platform behavior without modifying core code. All extension points are versioned, typed, and governed by semantic versioning.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTENSION ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Core Platform          Extension Registry          Brand   │
│   ┌─────────────┐         ┌─────────────┐         ┌─────┐  │
│   │  Hook Point │────────▶│  Registry   │◀───────│Impl │  │
│   │  (emit)     │         │ (validate,  │         │     │  │
│   └─────────────┘         │  execute)   │         └─────┘  │
│                           └─────────────┘                    │
│                              │                               │
│                              ▼                               │
│                    ┌─────────────────────┐                  │
│                    │  Plugin Runtime     │                  │
│                    │  (sandboxed, typed) │                  │
│                    └─────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Extension Point Registry

| Hook Point | Version | Stability | Description |
|------------|---------|-----------|-------------|
| `booking:beforeCreate` | v1 | Stable | Modify booking data before persistence |
| `booking:afterConfirm` | v1 | Stable | Trigger side effects after payment confirmation |
| `booking:onCancel` | v1 | Stable | Handle refund logic, notifications on cancellation |
| `price:calculate` | v1 | Stable | Custom pricing logic (promos, dynamic pricing) |
| `availability:check` | v1 | Stable | Custom availability logic (capacity, restrictions) |
| `notification:send` | v1 | Stable | Multi-channel notification routing |
| `brand:themeTokens` | v1 | Stable | Override CSS variables per tenant |
| `brand:categoryMap` | v1 | Stable | Define which categories a tenant offers |
| `variant:beforeSave` | v1 | Beta | Validate/modify variant before save |
| `review:beforePublish` | v1 | Beta | Content moderation, auto-approve logic |

---

## 📝 Contract Specifications

### 1. `booking:beforeCreate`

**Purpose:** Modify booking data before it's persisted to database.

**Signature:**
```typescript
type BookingBeforeCreateHook = (
  context: BookingBeforeCreateContext
) => Promise<BookingModifications>;

interface BookingBeforeCreateContext {
  tenantId: string;
  variant: VariantWithRelations;
  input: BookingInput;           // Raw booking input
  breakdown: PriceBreakdown;     // Computed price breakdown
  customer: Customer;            // Upserted customer
  slot: SlotTime;                // Selected time slot
  zone?: PickupZone;             // Pickup zone (if transfer)
  vehicleClass?: VehicleClass;   // Vehicle class (if private transfer)
}

interface BookingModifications {
  // Optional modifications (all optional)
  paxCount?: number;
  adultsCount?: number;
  kidsCount?: number;
  youthCount?: number;
  infantCount?: number;
  hotelAddress?: string | null;
  isTba?: boolean;
  selectedAddons?: Array<{ id: string; name: string; price: number }>;
  totalPrice?: number;
  discountIdr?: number;
  appliedCouponCode?: string | null;
  zoneSurchargeIdr?: number;
  nightSurchargeIdr?: number;
  // Custom metadata (stored in booking.billingAddress)
  metadata?: Record<string, unknown>;
}
```

**Use Cases:**
- Dynamic group discounts based on pax count
- Partner-specific surcharges
- Custom addon bundling
- Corporate account billing codes

**Example Implementation:**
```typescript
// packages/extensions/corporate-discounts/src/hooks.ts
export const corporateDiscountHook: BookingBeforeCreateHook = async (ctx) => {
  const corporateAccount = await findCorporateAccount(ctx.customer.email);
  if (!corporateAccount) return {};

  const discount = corporateAccount.discountPercent;
  const discountAmount = Math.round(ctx.breakdown.totalPriceIdr * discount / 100);

  return {
    discountIdr: discountAmount,
    appliedCouponCode: `CORP-${corporateAccount.code}`,
    metadata: {
      corporateAccountId: corporateAccount.id,
      discountPercent: discount,
    },
  };
};
```

---

### 2. `booking:afterConfirm`

**Purpose:** Trigger side effects after payment is confirmed and booking moves to CONFIRMED.

**Signature:**
```typescript
type BookingAfterConfirmHook = (
  context: BookingAfterConfirmContext
) => Promise<void>;

interface BookingAfterConfirmContext {
  tenantId: string;
  booking: BookingWithRelations;  // Full booking with all relations
  payment: Payment;               // Confirmed payment
  customer: Customer;
  variant: VariantWithRelations;
}
```

**Use Cases:**
- Send confirmation email/SMS/WhatsApp
- Trigger inventory reservation in partner system
- Generate voucher QR codes
- Update partner inventory via API
- Trigger loyalty points accrual

**Example Implementation:**
```typescript
// packages/extensions/partner-sync/src/hooks.ts
export const partnerSyncHook: BookingAfterConfirmHook = async (ctx) => {
  const partner = await getPartnerForVariant(ctx.variant.id);
  if (!partner?.apiEndpoint) return;

  await partner.api.createReservation({
    bookingCode: ctx.booking.bookingCode,
    date: ctx.booking.bookingDate,
    time: ctx.booking.slotTime?.time,
    pax: ctx.booking.paxCount,
    guestName: ctx.customer.name,
    guestPhone: ctx.customer.whatsapp,
    specialRequests: ctx.booking.hotelAddress,
  });
};
```

---

### 3. `booking:onCancel`

**Purpose:** Handle refund calculation, partner notification, inventory release on cancellation.

**Signature:**
```typescript
type BookingOnCancelHook = (
  context: BookingCancelContext
) => Promise<RefundCalculation>;

interface BookingCancelContext {
  tenantId: string;
  booking: BookingWithRelations;
  reason: string;
  cancelledBy: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  refundPolicy: RefundPolicy;  // From tenant config
}

interface RefundCalculation {
  amountIdr: number;           // Refund amount (0 = no refund)
  feeIdr: number;              // Processing fee
  method: 'MIDTRANS' | 'MANUAL';
  notes?: string;              // Internal notes
}
```

**Use Cases:**
- Dynamic refund tiers based on cancellation window
- Partner-specific cancellation fees
- Custom refund logic for packages

---

### 4. `price:calculate`

**Purpose:** Override or extend the core pricing engine.

**Signature:**
```typescript
type PriceCalculateHook = (
  context: PriceCalculateContext
) => Promise<PriceBreakdown>;

interface PriceCalculateContext {
  tenantId: string;
  variant: VariantWithRelations;
  input: {
    paxCount: number;
    adultsCount: number;
    kidsCount: number;
    youthCount: number;
    infantCount: number;
    fulfillmentMode: FulfillmentMode;
    slotTimeLabel: string;
    pickupZone?: PickupZone;
    vehicleClass?: VehicleClass;
    selectedAddons: Addon[];
    coupon?: Coupon;
  };
  baseBreakdown: PriceBreakdown;  // Core engine result
}

interface PriceBreakdown {
  basePriceIdr: number;
  pricePerPax: number;
  totalPriceIdr: number;
  surcharges: Array<{ label: string; amountIdr: number }>;
  discounts: Array<{ label: string; amountIdr: number }>;
  promoPriceIdr?: number;
  promoLabel?: string;
  discountPercent?: number;
  // Per-pax breakdown for age-tiered pricing
  perPax?: Array<{
    type: 'ADULT' | 'KIDS' | 'YOUTH' | 'INFANT';
    count: number;
    pricePerPax: number;
  }>;
}
```

**Use Cases:**
- Dynamic pricing based on demand/time
- Corporate/group volume discounts
- Seasonal pricing adjustments
- Partner-specific pricing models

---

### 5. `availability:check`

**Purpose:** Custom availability logic beyond core slot capacity.

**Signature:**
```typescript
type AvailabilityCheckHook = (
  context: AvailabilityCheckContext
) => Promise<AvailabilityResult>;

interface AvailabilityCheckContext {
  tenantId: string;
  variant: VariantWithRelations;
  date: string;              // YYYY-MM-DD
  paxCount: number;
  fulfillmentMode: FulfillmentMode;
  slots: SlotTime[];         // Core engine available slots
}

interface AvailabilityResult {
  available: boolean;
  slots: SlotTime[];         // Filtered/modified slots
  message?: string;          // User-facing message if unavailable
}
```

**Use Cases:**
- Partner capacity limits
- Weather-based availability
- Minimum pax requirements per slot
- Custom blackout rules

---

### 6. `notification:send`

**Purpose:** Route notifications through custom channels.

**Signature:**
```typescript
type NotificationSendHook = (
  context: NotificationSendContext
) => Promise<DeliveryResult>;

interface NotificationSendContext {
  tenantId: string;
  event: NotificationEvent;
  recipient: {
    customerId?: string;
    email?: string;
    whatsapp?: string;
    phone?: string;
  };
  template: NotificationTemplate;
  data: Record<string, unknown>;
}

interface DeliveryResult {
  success: boolean;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PUSH' | 'CUSTOM';
  externalId?: string;       // Provider message ID
  error?: string;
}
```

**Use Cases:**
- Custom WhatsApp Business API integration
- SMS via local provider (e.g., Infobip, Twilio)
- Push notifications via Firebase/OneSignal
- In-app notification center

---

### 7. `brand:themeTokens`

**Purpose:** Override CSS custom properties per tenant.

**Signature:**
```typescript
type BrandThemeTokensHook = (
  tenantId: string
) => Promise<ThemeTokens>;

interface ThemeTokens {
  // Colors
  '--brand-primary': string;        // Required
  '--brand-secondary'?: string;
  '--brand-accent'?: string;
  '--brand-on-primary'?: string;    // Text on primary
  '--brand-on-secondary'?: string;

  // Typography
  '--font-heading'?: string;
  '--font-body'?: string;
  '--font-mono'?: string;

  // Spacing & Radius
  '--border-radius'?: string;
  '--spacing-unit'?: string;

  // Shadows
  '--shadow-sm'?: string;
  '--shadow-md'?: string;
  '--shadow-lg'?: string;

  // Custom properties (passed through)
  [key: `--${string}`]: string | undefined;
}
```

**Use Cases:**
- Per-brand color schemes
- Seasonal theme overrides
- Accessibility adjustments (high contrast mode)

---

### 8. `brand:categoryMap`

**Purpose:** Define which adventure categories a tenant offers.

**Signature:**
```typescript
type BrandCategoryMapHook = (
  tenantId: string
) => Promise<CategoryConfig[]>;

interface CategoryConfig {
  slug: string;              // Must match core category slug
  name: string;              // Display name
  short: string;             // Short name (nav)
  emoji?: string;            // Emoji for UI
  description?: string;      // Category description
  isActive: boolean;
  sortOrder: number;
  // Override core category config
  overrides?: {
    difficultyFilter?: Difficulty[];  // Only show these difficulties
    minPriceIdr?: number;
    maxPriceIdr?: number;
  };
}
```

**Use Cases:**
- Brand-specific category subsets
- Custom category ordering
- Category-specific pricing floors/ceilings

---

## 🔌 Registration & Discovery

### Extension Package Structure
```
my-extension/
├── package.json
├── src/
│   ├── hooks/
│   │   ├── booking-before-create.ts
│   │   ├── price-calculate.ts
│   │   └── index.ts
│   ├── config/
│   │   └── schema.ts          # Zod schema for extension config
│   └── index.ts               # Extension entry point
├── package.json
└── tsconfig.json
```

### Extension Entry Point
```typescript
// src/index.ts
import { registerExtension } from '@platform/extensions';

export default registerExtension({
  name: 'corporate-discounts',
  version: '1.0.0',
  description: 'Corporate account volume discounts',
  hooks: {
    'booking:beforeCreate': './hooks/booking-before-create',
    'price:calculate': './hooks/price-calculate',
  },
  configSchema: z.object({
    minPaxForDiscount: z.number().int().min(1).default(10),
    discountPercent: z.number().min(0).max(50).default(10),
  }),
});
```

### Registration
```typescript
// In platform bootstrap
import { extensionRegistry } from '@platform/extensions';
import corporateDiscounts from 'corporate-discounts-extension';

extensionRegistry.register(corporateDiscounts);
```

---

## ⚙️ Configuration Schema

Each extension declares its config schema via Zod:

```typescript
// src/config/schema.ts
import { z } from 'zod';

export const CorporateDiscountConfigSchema = z.object({
  minPaxForDiscount: z.number().int().min(1).default(10),
  discountPercent: z.number().min(0).max(50).default(10),
  maxDiscountIdr: z.number().int().positive().optional(),
  applicableCategories: z.array(z.string()).optional(),
  excludedVariants: z.array(z.string()).optional(),
});

export type CorporateDiscountConfig = z.infer<typeof CorporateDiscountConfigSchema>;
```

### Tenant Configuration
```yaml
# tenant.config.extensions.corporate-discounts
minPaxForDiscount: 8
discountPercent: 15
maxDiscountIdr: 500000
applicableCategories:
  - atv
  - rafting
```

---

## 🧪 Testing Extensions

### Unit Test Template
```typescript
// src/hooks/__tests__/booking-before-create.test.ts
import { corporateDiscountHook } from '../booking-before-create';

describe('corporateDiscountHook', () => {
  it('applies discount for corporate accounts', async () => {
    const ctx = createMockContext({
      customer: { email: 'john@corp.com' },
      breakdown: { totalPriceIdr: 1_000_000 },
    });

    const result = await corporateDiscountHook(ctx);

    expect(result.discountIdr).toBe(100_000); // 10%
    expect(result.appliedCouponCode).toBe('CORP-ACME');
  });

  it('does not apply for non-corporate emails', async () => {
    const ctx = createMockContext({
      customer: { email: 'john@gmail.com' },
    });

    const result = await corporateDiscountHook(ctx);
    expect(result).toEqual({});
  });
});
```

### Integration Test
```typescript
// src/__tests__/corporate-discount.integration.test.ts
it('applies corporate discount end-to-end', async () => {
  const tenant = await createTestTenant({ extensions: ['corporate-discounts'] });
  const corporateAccount = await createCorporateAccount({ tenantId: tenant.id });

  const booking = await createBooking({
    tenantId: tenant.id,
    customerEmail: corporateAccount.email,
    paxCount: 10,
  });

  expect(booking.discountIdr).toBeGreaterThan(0);
  expect(booking.appliedCouponCode).toMatch(/^CORP-/);
});
```

---

## 📦 Publishing & Versioning

### Semantic Versioning
| Version | When |
|---------|------|
| `MAJOR` | Breaking contract change (input/output types) |
| `MINOR` | New hook, new config option (backward compatible) |
| `PATCH` | Bug fix, internal refactor |

### Release Checklist
- [ ] All tests pass
- [ ] Contract types unchanged (or properly versioned)
- [ ] Config schema backward compatible
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Published to private npm registry

---

## 🔐 Security & Sandboxing

| Layer | Mechanism |
|-------|-----------|
| **Code Execution** | Extensions run in same process (trusted) — future: WASM sandbox |
| **Config Validation** | Zod schema at registration + runtime |
| **Tenant Isolation** | Hook context includes `tenantId`, cannot access other tenants |
| **Rate Limiting** | Per-extension, per-tenant rate limits |
| **Audit Logging** | All hook executions logged with correlation ID |
| **Timeouts** | 5s default, configurable per hook |

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| `PLATFORM_CONSTITUTION.md` | Core principles, governance |
| `MULTI_TENANCY_GUIDE.md` | Architecture & patterns |
| `BRAND_ADAPTATION_GUIDE.md` | Spin new brand in 1 day |
| `API_CONTRACTS.md` | OpenAPI spec per version |

---

## 📝 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-11-05 | Platform Team | Initial stable contracts |

---

> **Note**: This document contains no proprietary algorithms, internal infrastructure details, or sensitive business logic. All extension contracts are designed to be implementation-agnostic and safe for public documentation.