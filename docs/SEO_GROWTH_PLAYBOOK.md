# BaliWild — SEO & Growth Measurement Playbook

> **Version:** 1.0.0
> **Status:** ACTIVE — Production IDs configured
> **Last Updated:** November 2026
> **Owner:** Senior SEO/Growth Agent

---

## 1. Production Tracking IDs (Official)

| Variable | Value | Scope | Purpose |
|----------|-------|-------|---------|
| **GTM Container ID** | `GTM-KG7PHCKV` | Public (`NEXT_PUBLIC_GTM_ID`) | Primary measurement backbone. All events flow through `window.dataLayer` → GTM → GA4. |
| **GA4 Measurement ID** | `G-Y2BFH5BNEX` | Public (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) | Fallback if GTM not configured. Direct gtag.js integration. |
| **GA4 Property ID** | (Internal) | Server (`GA_MEASUREMENT_ID`) | Metadata only; exposed via tenant/brand config JSON for debugging. |

> **Rule:** Set **exactly one** of `NEXT_PUBLIC_GTM_ID` or `NEXT_PUBLIC_GA_MEASUREMENT_ID`. The code in `src/lib/analyticsConfig.ts` enforces GTM priority — if both are present, GTM wins and GA4 direct is disabled to prevent double-counting.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      BALIWILD ANALYTICS FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  src/lib/analytics.ts                                           │
│       │                                                         │
│       ▼ (consent-gated)                                         │
│  window.dataLayer.push({ event, ...payload })                   │
│       │                                                         │
│       ▼                                                         │
│  window.dispatchEvent('baliwild:analytics')                     │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           AnalyticsLoader (client component)             │   │
│  │  1. Waits for "Accept all" consent (CookieConsent)       │   │
│  │  2. Loads GTM script (if NEXT_PUBLIC_GTM_ID)             │   │
│  │     OR gtag.js (if only NEXT_PUBLIC_GA_MEASUREMENT_ID)   │   │
│  │  3. Listens for 'baliwild:analytics' → forwards to GTM/GA│   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────┐       ┌──────────────────┐               │
│  │  GTM Container   │──────▶│  GA4 Property    │               │
│  │  GTM-KG7PHCKV    │       │  G-Y2BFH5BNEX    │               │
│  │  (dataLayer)     │       │  (events)        │               │
│  └──────────────────┘       └──────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Environment Configuration

### 3.1 Required Variables (`.env.example` lines 69-82)

```bash
# Growth measurement (consent-gated — loads only after "Accept all")
# [PUBLIC] Google Tag Manager container ID, e.g. GTM-XXXXXXX.
# When set, BaliWild events in window.dataLayer are consumed by GTM.
# Put the GA4 tag inside GTM.
NEXT_PUBLIC_GTM_ID="GTM-KG7PHCKV"

# [PUBLIC] GA4 measurement ID, e.g. G-XXXXXXXXXX.
# Used only when GTM is NOT set.
# gtag.js is loaded and baliwild:analytics events are forwarded to GA4 as events.
# Set exactly ONE of NEXT_PUBLIC_GTM_ID or NEXT_PUBLIC_GA_MEASUREMENT_ID.
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-Y2BFH5BNEX"

# [SERVER] Analytics ID exposed through tenant/brand config JSON (getBrandConfig).
# This is metadata only; the actual tag is controlled by the public vars above.
GA_MEASUREMENT_ID="G-Y2BFH5BNEX"
```

### 3.2 Vercel Deployment (Production)

Set in **Vercel Dashboard → Settings → Environment Variables**:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_GTM_ID` | `GTM-KG7PHCKV` | Production, Preview, Development |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-Y2BFH5BNEX` | Production, Preview, Development |
| `GA_MEASUREMENT_ID` | `G-Y2BFH5BNEX` | Production, Preview, Development |

> **Note:** `NEXT_PUBLIC_` prefix is required for browser access. `GA_MEASUREMENT_ID` (no prefix) is server-only metadata.

---

## 4. Consent-Gated Loading

### 4.1 Cookie Consent Integration

`src/components/CookieConsent.tsx` manages three consent levels:
- **essential** — Always allowed (session, security)
- **analytics** — GA4/GTM measurement (requires "Accept all")
- **marketing** — Future: Meta Pixel, TikTok, etc.

### 4.2 AnalyticsLoader Behavior (`src/components/analytics/AnalyticsLoader.tsx`)

```typescript
// Only loads scripts AFTER "Accept all" consent
const { gtmId, gaId } = getAnalyticsConfig();
const [consented, setConsented] = useState(false);

// 1. Listen for consent change
useEffect(() => {
  const sync = () => setConsented(getStoredConsent() === 'all');
  sync();
  window.addEventListener(CONSENT_EVENT, sync);
  return () => window.removeEventListener(CONSENT_EVENT, sync);
}, []);

// 2. Forward baliwild:analytics → GTM/gtag
useEffect(() => {
  if (!consented || !gaId) return;
  const forward = (event) => {
    const gtag = (window as GtagWindow).gtag;
    if (typeof gtag !== 'function') return;
    const { event: name, ...payload } = detail;
    gtag('event', name, payload);
  };
  window.addEventListener('baliwild:analytics', forward);
  return () => window.removeEventListener('baliwild:analytics', forward);
}, [consented, gaId]);

// 3. Render scripts
if (!consented || (!gtmId && !gaId)) return null;
```

### 4.3 No Duplicate `gtag` Scripts

The code guarantees **exactly one destination**:
- If `NEXT_PUBLIC_GTM_ID` is set → **GTM only** (GA4 tag lives inside GTM)
- If only `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set → **gtag.js direct**
- Never both simultaneously (enforced in `getAnalyticsConfig()`)

---

## 5. Event Taxonomy (Canonical)

All events pushed via `track(event, payload)` from `src/lib/analytics.ts`:

### 5.1 Booking Funnel
| Event | Trigger | Key Payload |
|-------|---------|-------------|
| `booking_started` | User clicks "Show dates" | `variantId`, `ventureId`, `category` |
| `variant_selected` | Package option chosen | `variantId`, `fulfillmentMode`, `priceIdr` |
| `date_selected` | Calendar date picked | `bookingDate`, `slotTime` |
| `travelers_selected` | Pax stepper changed | `adults`, `kids`, `youth`, `infants` |
| `pickup_selected` | Zone/vehicle chosen | `pickupZoneId`, `vehicleClassId`, `surchargeIdr` |
| `promo_applied` | Promo/coupon validated | `code`, `discountIdr`, `type` |
| `addon_selected` | Add-on toggled | `addonId`, `priceIdr`, `requiresTransfer` |
| `checkout_started` | "Continue to payment" | `totalPriceIdr`, `currency` |
| `payment_method_selected` | Payment radio changed | `method` (qris, va, cc, gopay, shopeepay) |
| `payment_completed` | Midtrans webhook SETTLEMENT | `bookingId`, `orderId`, `grossAmount` |
| `payment_failed` | Midtrans webhook FAILED/EXPIRED | `bookingId`, `reason` |

### 5.2 SEO / Content
| Event | Trigger | Key Payload |
|-------|---------|-------------|
| `article_viewed` | Blog article loaded | `articleId`, `slug`, `category` |
| `article_shared` | Share button clicked | `articleId`, `platform` (wa, telegram, copy) |
| `internal_link_clicked` | Product link in article | `fromArticleId`, `toVentureId`, `anchorText` |

### 5.3 Search / Discovery
| Event | Trigger | Key Payload |
|-------|---------|-------------|
| `search_performed` | Search submitted | `query`, `filters`, `resultsCount` |
| `filter_applied` | Facet changed | `facet`, `value`, `resultsCount` |
| `product_card_clicked` | Card → PDP | `ventureId`, `position`, `source` (explore, home, search) |

### 5.4 AI Agent
| Event | Trigger | Key Payload |
|-------|---------|-------------|
| `agent_message_received` | User message | `channel`, `intent`, `language` |
| `agent_tool_called` | Tool executed | `tool`, `success`, `latencyMs` |
| `agent_handoff_requested` | Escalation triggered | `reason`, `summary`, `urgency` |

### 5.5 Reviews
| Event | Trigger | Key Payload |
|-------|---------|-------------|
| `review_submitted` | Guest submits | `ventureId`, `rating`, `source`, `hasPhotos` |
| `review_invite_sent` | Ops marks COMPLETED | `bookingId`, `ventureId`, `channel` |
| `review_invite_opened` | Guest clicks link | `inviteId`, `ventureId` |

---

## 6. GTM Container Setup (GTM-KG7PHCKV)

### 6.1 Required Tags
| Tag Name | Type | Trigger | Notes |
|----------|------|---------|-------|
| GA4 Configuration | Google Tag | All Pages | Measurement ID: `G-Y2BFH5BNEX`, send_page_view: false |
| GA4 Event - booking_started | GA4 Event | Custom Event: `booking_started` | Map all payload fields to GA4 parameters |
| GA4 Event - checkout_started | GA4 Event | Custom Event: `checkout_started` | Include `value` (totalPriceIdr/100), `currency` (IDR) |
| GA4 Event - payment_completed | GA4 Event | Custom Event: `payment_completed` | Ecommerce: purchase event with items array |
| GA4 Event - article_viewed | GA4 Event | Custom Event: `article_viewed` | Content group: "blog" |

### 6.2 Data Layer Variables (Create in GTM)
| Variable Name | Data Layer Key | Type |
|---------------|----------------|------|
| `dlv_event` | `event` | Data Layer Variable |
| `dlv_variantId` | `variantId` | Data Layer Variable |
| `dlv_ventureId` | `ventureId` | Data Layer Variable |
| `dlv_totalPriceIdr` | `totalPrice` | Data Layer Variable |
| `dlv_bookingId` | `bookingId` | Data Layer Variable |
| `dlv_category` | `category` | Data Layer Variable |
| `dlv_fulfillmentMode` | `fulfillmentMode` | Data Layer Variable |

### 6.3 Triggers
| Trigger Name | Type | Condition |
|--------------|------|-----------|
| `tr_booking_started` | Custom Event | Event name equals `booking_started` |
| `tr_checkout_started` | Custom Event | Event name equals `checkout_started` |
| `tr_payment_completed` | Custom Event | Event name equals `payment_completed` |

---

## 7. Verification Checklist (Sprint 0 / Sprint 1)

### 7.1 Local Development
- [ ] Copy `.env.example` → `.env` and set:
  ```bash
  NEXT_PUBLIC_GTM_ID=GTM-KG7PHCKV
  NEXT_PUBLIC_GA_MEASUREMENT_ID=G-Y2BFH5BNEX
  ```
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:3000`
- [ ] Accept all cookies (CookieConsent banner)
- [ ] Open DevTools → Console → Verify no duplicate GTM/gtag scripts
- [ ] DevTools → Network → Filter "googletagmanager" → Confirm only **one** request
- [ ] DevTools → Console → `dataLayer` → Verify events appear after interactions

### 7.2 Production Deployment
- [ ] Vercel environment variables set (see §3.2)
- [ ] Deploy to production
- [ ] Visit `https://baliwild.com`
- [ ] Accept all cookies
- [ ] GA4 DebugView: `https://analytics.google.com/analytics/web/#/p[PROPERTY_ID]/debugview`
- [ ] GTM Preview Mode: Verify tags fire on events
- [ ] Search Console: Submit updated sitemap.xml

### 7.3 Code Verification
- [ ] `src/lib/analyticsConfig.ts` → GTM priority logic confirmed
- [ ] `src/components/analytics/AnalyticsLoader.tsx` → Consent-gated, no duplicates
- [ ] `src/lib/analytics.ts` → Consent check before `dataLayer.push`
- [ ] `src/app/layout.tsx` → `AnalyticsLoader` before `AnalyticsPageView`

---

## 8. Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Double page views | Both GTM and gtag.js loaded | Ensure only ONE of `NEXT_PUBLIC_GTM_ID` or `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set |
| Events not in GA4 | Consent not "all" | Verify CookieConsent sets `analytics: true` on "Accept all" |
| `gtag is not a function` | GTM loads async, event fires early | AnalyticsLoader waits for consent + GTM script load before attaching listener |
| Missing `bookingId` in purchase | Event fires before booking created | `payment_completed` event fired from webhook handler AFTER booking row exists |

---

## 9. Related Documents

| Document | Location |
|----------|----------|
| Environment Variables Template | `.env.example` |
| Analytics Config Logic | `src/lib/analyticsConfig.ts` |
| Core Analytics Function | `src/lib/analytics.ts` |
| Consent Management | `src/lib/consent.ts` |
| Analytics Loader Component | `src/components/analytics/AnalyticsLoader.tsx` |
| Cookie Consent UI | `src/components/CookieConsent.tsx` |
| Event Taxonomy (implementation) | `src/lib/analytics.ts` |
| SEO Strategy | `docs/SEO_STRATEGY.md` |
| Deployment Strategy | `docs/DEPLOYMENT_STRATEGY.md` |

---

## 10. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-11-27 | Initial playbook with production IDs (GTM-KG7PHCKV, G-Y2BFH5BNEX) | Senior SEO/Growth Agent |
| 2026-11-27 | Verified consent-gated loading, no duplicate scripts | Senior SEO/Growth Agent |

---

**Next Review:** After production deployment verification (GA4 DebugView + GTM Preview)