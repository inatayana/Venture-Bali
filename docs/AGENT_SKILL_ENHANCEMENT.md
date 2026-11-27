# BaliWild AI Agent — Skill Enhancement Plan

> **Version:** 1.0.0
> **Status:** APPROVED FOR IMPLEMENTATION
> **Reference:** STRATEGY_20YEAR_ROADMAP.md §12, AI_AGENT.md
> **Priority:** Phase 1 (Months 1-3) → Phase 2 (Months 4-6)

---

## 1. Current Agent Capability Assessment

### 1.1 Strengths (What Works Today)
| Capability | Implementation | Quality |
|------------|----------------|---------|
| **Intent Classification** | Keyword + Gemini hybrid (`agent-intent.ts`) | ✅ Good |
| **Tool Execution** | 6 tools: `getProductInfo`, `calculatePrice`, `checkAvailability`, `getRefundPolicy`, `createBooking`, `sendBookingConfirmation` | ✅ Solid |
| **Session Management** | `AgentSession` table with 12-turn history | ✅ Good |
| **Multi-channel** | WhatsApp, Telegram, Web (`agent-service.ts`) | ✅ Working |
| **Fallback Logic** | Deterministic when Gemini fails | ✅ Robust |
| **Rate Limit Handling** | Exponential backoff, quota awareness | ✅ Good |
| **Validation Guardrails** | Price from DB, policy from `refundUtils.ts`, categories from taxonomy | ✅ Strong |

### 1.2 Critical Gaps (Blocking Competitive Parity)
| Gap | Impact | Effort |
|-----|--------|--------|
| **No Semantic Search** | Can't answer "best waterfall near Ubud" or "family-friendly rafting" | 🔴 High |
| **No Review Access** | Can't share real guest feedback, photos, ratings | 🔴 High |
| **Static Pricing Only** | No awareness of dynamic pricing, demand signals, promotions | 🟡 Medium |
| **No Booking Management** | Can't modify, cancel, reschedule — only create | 🔴 High |
| **No Customer Context** | No memory of preferences, history, LTV | 🟡 Medium |
| **No Proactive Capability** | Can't notify price drops, availability, review requests | 🟡 Medium |
| **Limited Languages** | EN/ID only (no JA/ZH/KO) | 🟢 Low |
| **No Handoff Protocol** | No seamless human escalation with context | 🟡 Medium |

---

## 2. Enhancement Roadmap

### Phase 1: Knowledge & Action Expansion (Months 1-3)

#### 2.1 New Tools (Priority Order)

| # | Tool | Description | Dependencies | Effort |
|---|------|-------------|--------------|--------|
| 1 | `searchReviews` | Semantic search over guest reviews (pgvector) | ADR-001, pgvector migration | 1 week |
| 2 | `getDynamicPrice` | Real-time pricing with demand signals | Dynamic Pricing Engine v1 | 3 days |
| 3 | `modifyBooking` | Change date, time, pax, pickup | BookingService + idempotency | 1 week |
| 4 | `cancelBooking` | Initiate cancellation with refund calc | `refundUtils.ts` + Refund model | 3 days |
| 5 | `rescheduleBooking` | Move to new date/slot | BookingService + capacity check | 3 days |
| 6 | `getBookingStatus` | Full booking details + timeline | Booking model relations | 2 days |
| 7 | `searchVentures` | Semantic product search (pgvector) | ADR-001, pgvector migration | 1 week |
| 8 | `getCustomerProfile` | Preferences, history, LTV, past issues | Customer model + analytics | 1 week |

#### 2.2 Tool Specifications

```typescript
// src/lib/tools.ts — New Tool Definitions

// 1. Semantic Review Search
interface SearchReviewsParams {
  query: string;           // "good for kids", "scary", "best guide"
  ventureId?: string;      // Optional: filter to specific activity
  minRating?: number;      // 1-5
  limit?: number;          // Default 5
  language?: 'en' | 'id';  // Match review language
}

interface SearchReviewsResult {
  reviews: Array<{
    rating: number;
    comment: string;
    guestName: string;
    guestLocation: string;
    createdAt: string;
    photos: string[];
    similarity: number;    // 0-1 cosine similarity
  }>;
  summary: string;         // AI-generated summary
}

// 2. Dynamic Pricing
interface GetDynamicPriceParams {
  variantId: string;
  bookingDate: string;     // YYYY-MM-DD
  paxCount: number;
  adultsCount?: number;
  kidsCount?: number;
  youthCount?: number;
  pickupZoneId?: string;
  vehicleClassId?: string;
  addonIds?: string[];
}

interface GetDynamicPriceResult {
  basePrice: number;
  demandMultiplier: number;    // 0.8-1.5 based on occupancy
  finalPrice: number;
  priceBreakdown: PriceBreakdown;
  urgencySignal?: string;      // "Only 3 spots left at this price"
  expiresAt: string;           // Quote validity
}

// 3. Booking Modification
interface ModifyBookingParams {
  bookingId: string;
  newDate?: string;
  newSlotTimeId?: string;
  newPaxCount?: number;
  newPickupZoneId?: string;
  newVehicleClassId?: string;
  addonIds?: string[];
  reason?: string;
}

interface ModifyBookingResult {
  success: boolean;
  bookingId: string;
  changes: BookingChange[];
  priceDifference: number;     // Positive = owes more, negative = refund
  newVoucherUrl?: string;
}

// 4. Cancellation
interface CancelBookingParams {
  bookingId: string;
  reason: string;
}

interface CancelBookingResult {
  success: boolean;
  refundAmount: number;
  refundStatus: 'PENDING' | 'PROCESSED' | 'NOT_ELIGIBLE';
  policyApplied: RefundPolicy;
  cancellationFee: number;
}

// 5. Customer Profile
interface GetCustomerProfileParams {
  customerId: string;        // From session or authenticated
}

interface GetCustomerProfileResult {
  customer: {
    id: string;
    name: string;
    email: string;
    totalBookings: number;
    totalSpent: number;
    favoriteCategories: string[];
    preferredLanguage: string;
    preferredCurrency: string;
    lastBookingDate: string | null;
    vipTier?: 'bronze' | 'silver' | 'gold';
  };
  recentBookings: BookingSummary[];
  preferences: {
    fulfillmentMode?: 'SELF_DRIVE' | 'SHARED_TRANSFER' | 'PRIVATE_TRANSFER';
    priceSensitivity: 'low' | 'medium' | 'high';
    activityLevel: 'easy' | 'moderate' | 'challenging';
  };
}
```

### Phase 2: Intelligence & Proactivity (Months 4-6)

#### 2.3 Agent Architecture Upgrades

```typescript
// src/lib/agent-service.ts — Enhanced Architecture

interface EnhancedAgentState {
  // Current
  session: AgentSession;
  intent: Intent;
  tools: ToolResult[];
  
  // New
  customerProfile: CustomerProfile | null;
  conversationMemory: ConversationMemory;
  proactiveTriggers: ProactiveTrigger[];
  escalationContext: EscalationContext | null;
}

interface ConversationMemory {
  // Long-term preferences (persisted)
  preferences: UserPreferences;
  
  // Short-term context (this session)
  mentionedProducts: string[];      // Venture IDs
  discussedTopics: string[];        // 'pricing', 'safety', 'pickup'
  objectionsRaised: string[];       // 'too expensive', 'need pickup'
  decisionsMade: Decision[];        // 'chose private transfer'
  
  // Cross-session (30 days)
  abandonedCarts: AbandonedCart[];
  viewedProducts: ViewedProduct[];
}

interface ProactiveTrigger {
  type: 'price_drop' | 'availability_alert' | 'review_request' | 'rebooking_suggestion';
  payload: any;
  priority: 'high' | 'medium' | 'low';
  expiresAt: Date;
}

interface EscalationContext {
  reason: 'complex_refund' | 'safety_incident' | 'vendor_issue' | 'payment_dispute' | 'customer_request';
  summary: string;                 // AI-generated for human agent
  urgency: 'immediate' | 'within_hour' | 'within_day';
  customerSentiment: 'angry' | 'frustrated' | 'neutral' | 'happy';
  suggestedActions: string[];
}
```

#### 2.4 Proactive Notification Engine

```typescript
// src/lib/agent/proactive.ts

class ProactiveNotificationEngine {
  // 1. Price Drop Alerts
  async checkPriceDrops(customerId: string): Promise<ProactiveTrigger[]> {
    const bookings = await getUpcomingBookings(customerId);
    const triggers = [];
    
    for (const booking of bookings) {
      const currentPrice = await getDynamicPrice(booking.variantId, booking.bookingDate);
      if (currentPrice.finalPrice < booking.totalPrice * 0.9) { // 10% drop
        triggers.push({
          type: 'price_drop',
          payload: { bookingId: booking.id, oldPrice: booking.totalPrice, newPrice: currentPrice.finalPrice },
          priority: 'high',
          expiresAt: addDays(new Date(), 7),
        });
      }
    }
    return triggers;
  }
  
  // 2. Availability Alerts (wishlist/abandoned cart)
  async checkAvailabilityAlerts(customerId: string): Promise<ProactiveTrigger[]> {
    const viewed = await getRecentlyViewedProducts(customerId, 7); // 7 days
    const triggers = [];
    
    for (const product of viewed) {
      const availability = await checkAvailabilityNext7Days(product.id);
      if (availability.lowStockSlots.length > 0) {
        triggers.push({
          type: 'availability_alert',
          payload: { productId: product.id, slots: availability.lowStockSlots },
          priority: 'medium',
          expiresAt: addDays(new Date(), 3),
        });
      }
    }
    return triggers;
  }
  
  // 3. Rebooking Suggestions (seasonal)
  async checkRebookingSuggestions(customerId: string): Promise<ProactiveTrigger[]> {
    const lastBooking = await getLastBooking(customerId);
    if (!lastBooking) return [];
    
    const daysSince = differenceInDays(new Date(), lastBooking.bookingDate);
    if (daysSince > 180 && daysSince < 200) { // ~6 months
      return [{
        type: 'rebooking_suggestion',
        payload: { 
          lastActivity: lastBooking.venture.title,
          suggestedActivities: await getSimilarActivities(lastBooking.ventureId, 3),
        },
        priority: 'low',
        expiresAt: addDays(new Date(), 30),
      }];
    }
    return [];
  }
}
```

---

## 3. Data Requirements (Database)

### 3.1 pgvector Embeddings (Migration Required)

```sql
-- Already in migration 20261127090000_performance_indexes_pgvector
-- Article.embedding vector(1536) + HNSW index
-- Review.embedding vector(1536) + HNSW index  
-- Venture.embedding vector(1536) + HNSW index
```

### 3.2 Embedding Generation Pipeline

```typescript
// src/lib/embeddings.ts

// Generate embeddings for semantic search
export async function generateEmbedding(text: string): Promise<number[]> {
  // Use Gemini embedding model (free tier: 100/day) or text-embedding-3-small
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/embedding-001',
      content: { parts: [{ text }] },
    }),
  });
  const data = await response.json();
  return data.embedding.values; // 768 dimensions
}

// Batch generate for existing data
export async function backfillEmbeddings() {
  // 1. Articles: content + title
  // 2. Reviews: comment + venture context
  // 3. Ventures: title + description + highlights + category
  // Run as background job (BullMQ)
}
```

### 3.3 Customer Analytics Views

```sql
-- Materialized view for customer profiles (refresh daily)
CREATE MATERIALIZED VIEW customer_profile_mv AS
SELECT 
  c.id,
  c.name,
  c.email,
  COUNT(b.id) as total_bookings,
  COALESCE(SUM(b.total_price), 0) as total_spent,
  MAX(b.booking_date) as last_booking_date,
  MODE() WITHIN GROUP (ORDER BY v.category) as favorite_category,
  -- Preferences inferred from behavior
  CASE 
    WHEN COUNT(CASE WHEN b.fulfillment_mode = 'PRIVATE_TRANSFER' THEN 1 END) > COUNT(*) * 0.5 
    THEN 'PRIVATE_TRANSFER'
    WHEN COUNT(CASE WHEN b.fulfillment_mode = 'SHARED_TRANSFER' THEN 1 END) > COUNT(*) * 0.3
    THEN 'SHARED_TRANSFER'
    ELSE 'SELF_DRIVE'
  END as preferred_fulfillment_mode
FROM "Customer" c
LEFT JOIN "Booking" b ON b.customer_id = c.id AND b.payment_status = 'PAID'
LEFT JOIN "Variant" va ON va.id = b.variant_id
LEFT JOIN "Venture" v ON v.id = va.venture_id
GROUP BY c.id;

CREATE UNIQUE INDEX ON customer_profile_mv (id);
```

---

## 4. Multi-Language Support (JA/ZH/KO)

### 4.1 Prompt Templates per Language

```typescript
// src/lib/agent/prompts.ts

const SYSTEM_PROMPTS = {
  en: `You are a senior customer relationship specialist for BaliWild...`,
  id: `Anda adalah spesialis hubungan pelanggan senior untuk BaliWild...`,
  ja: `あなたはバリワイルドのシニアカスタマーリレーションスペシャリストです...`,
  zh: `您是BaliWild的高级客户关系专家...`,
  ko: `당신은 BaliWild의 시니어 고객 관계 전문가입니다...`,
} as const;

// Language detection from session
function getSystemPrompt(session: AgentSession): string {
  return SYSTEM_PROMPTS[session.language as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.en;
}
```

### 4.2 Tool Response Localization

```typescript
// All tool results must include localized strings
interface LocalizedToolResult {
  data: any;
  localized: {
    en: string;
    id: string;
    ja?: string;
    zh?: string;
    ko?: string;
  };
}
```

---

## 5. Human Handoff Protocol

### 5.1 Escalation Triggers

```typescript
// src/lib/agent/escalation.ts

const ESCALATION_TRIGGERS = {
  // Explicit request
  human_request: /(talk to human|speak to agent|real person|operator)/i,
  
  // Complex issues
  refund_dispute: /refund.*(denied|unfair|wrong|dispute)/i,
  safety_incident: /(accident|injury|unsafe|dangerous|emergency)/i,
  vendor_complaint: /(guide|driver|vendor).*(rude|late|no show|bad)/i,
  payment_issue: /(charged|payment|money).*(twice|wrong|missing|refund)/i,
  
  // Sentiment
  high_frustration: /(unacceptable|ridiculous|worst|never again|lawsuit|lawyer)/i,
  
  // Technical limits
  too_many_turns: (turns: number) => turns > 15,
  repeated_failures: (failures: number) => failures > 3,
};

function shouldEscalate(state: AgentState): EscalationContext | null {
  // Check triggers
  // Return context for human agent
}
```

### 5.2 Handoff Payload

```typescript
interface HandoffPayload {
  sessionId: string;
  customerId: string | null;
  channel: 'whatsapp' | 'telegram' | 'web';
  language: string;
  summary: string;                    // AI-generated 3-sentence summary
  fullHistory: ConversationTurn[];    // Last 20 turns
  customerProfile: CustomerProfile | null;
  currentBooking: Booking | null;
  detectedIntent: string;
  escalationReason: string;
  urgency: 'immediate' | 'within_hour' | 'within_day';
  sentiment: 'angry' | 'frustrated' | 'neutral' | 'happy';
  suggestedActions: string[];
  tags: string[];                     // 'refund', 'safety', 'vip', etc.
}
```

---

## 6. Testing & Quality Assurance

### 6.1 Test Coverage Requirements

| Test Type | Coverage Target | Critical Paths |
|-----------|-----------------|----------------|
| Unit Tests | 90% | Tool implementations, pricing calculations, refund logic |
| Integration Tests | 80% | Agent → Tool → DB flow, session persistence |
| E2E Tests | 70% | Full conversation flows (booking, cancel, modify) |
| Adversarial Tests | 100% | Hallucination attempts, policy bypass, injection |

### 6.2 Golden Test Cases

```typescript
// src/lib/agent/__tests__/golden.test.ts

const GOLDEN_CASES = [
  // Booking flow
  {
    name: 'Complete booking via agent',
    messages: [
      'I want to book ATV Ubud for 2 adults tomorrow',
      'Yes, 10am slot with hotel pickup in Seminyak',
      'John Doe, john@email.com, US, +1234567890',
      'I accept terms and waiver',
    ],
    expectedTools: ['getProductInfo', 'checkAvailability', 'calculatePrice', 'createBooking'],
    expectedOutcome: 'booking_created',
  },
  
  // Price objection handling
  {
    name: 'Price objection with facts',
    messages: [
      'How much is ATV Ubud?',
      'That\'s expensive, Klook is cheaper',
    ],
    expectedTools: ['getProductInfo', 'calculatePrice', 'getRefundPolicy'],
    expectedResponse: 'includes_commission_comparison',
  },
  
  // Safety question
  {
    name: 'Safety concern addressed factually',
    messages: [
      'Is rafting safe for my 7-year-old?',
    ],
    expectedTools: ['getProductInfo'],
    expectedResponse: 'includes_min_age_and_safety_briefing',
  },
  
  // Modification
  {
    name: 'Reschedule booking',
    messages: [
      'I need to change my booking to next week',
      'Booking ID BW-123456',
      'Next Friday same time',
    ],
    expectedTools: ['getBookingStatus', 'checkAvailability', 'rescheduleBooking'],
    expectedOutcome: 'booking_rescheduled',
  },
  
  // Cancellation
  {
    name: 'Cancellation with refund calculation',
    messages: [
      'I want to cancel my booking',
      'Booking ID BW-123456',
      'Reason: flight cancelled',
    ],
    expectedTools: ['getBookingStatus', 'cancelBooking'],
    expectedOutcome: 'refund_calculated_correctly',
  },
];
```

### 6.3 Automated Evaluation Pipeline

```yaml
# .github/workflows/agent-eval.yml
name: Agent Evaluation
on: [push, pull_request]
jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Golden Tests
        run: npm test -- agent-golden
      - name: Run Adversarial Tests
        run: npm test -- agent-adversarial
      - name: Check Policy Compliance
        run: npm test -- agent-policy
      - name: Performance Benchmark
        run: npm run benchmark:agent
```

---

## 7. Monitoring & Observability

### 7.1 Key Metrics (PostHog - ADR-002)

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **Resolution Rate** | >85% | <75% |
| **Escalation Rate** | <15% | >25% |
| **Avg Response Time** | <3s | >10s |
| **Tool Success Rate** | >99% | <95% |
| **Gemini Fallback Rate** | <5% | >15% |
| **Customer Satisfaction** | >4.5/5 | <4.0/5 |
| **Booking Conversion** | >20% (agent-assisted) | <10% |

### 7.2 Dashboard Panels

```typescript
// PostHog Dashboard Configuration
const AGENT_DASHBOARD = {
  panels: [
    { name: 'Conversation Volume', query: 'count(agent_message_received) by channel' },
    { name: 'Intent Distribution', query: 'count(agent_tool_called) by tool' },
    { name: 'Resolution Funnel', query: 'funnel(agent_started, tool_called, response_sent, booking_created)' },
    { name: 'Escalation Rate', query: 'count(agent_handoff_requested) / count(agent_started)' },
    { name: 'Latency P50/P95/P99', query: 'percentile(agent_response_time, 50, 95, 99)' },
    { name: 'Gemini Health', query: 'count(gemini_fallback) / count(gemini_calls)' },
    { name: 'Top Unhandled Queries', query: 'top(agent_unhandled_intent, 20)' },
  ],
};
```

---

## 8. Implementation Priority & Timeline

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| **1-2** | **Foundation** | pgvector migration, `searchReviews`, `searchVentures`, `getDynamicPrice` |
| **3-4** | **Booking Management** | `modifyBooking`, `cancelBooking`, `rescheduleBooking`, `getBookingStatus` |
| **5-6** | **Intelligence** | Customer profile, conversation memory, proactive engine |
| **7-8** | **Multilingual** | JA/ZH/KO prompts, localized tool responses |
| **9-10** | **Handoff** | Escalation protocol, human agent dashboard integration |
| **11-12** | **Optimization** | A/B testing, adversarial hardening, performance tuning |

---

## 9. Success Criteria (6-Month Target)

| KPI | Current | Target |
|-----|---------|--------|
| **Automated Resolution Rate** | ~60% | >85% |
| **Avg Handle Time** | ~5 min | <3 min |
| **Booking Conversion (Agent)** | ~15% | >25% |
| **Escalation Rate** | ~30% | <15% |
| **CSAT** | N/A | >4.5/5 |
| **Language Coverage** | EN/ID | EN/ID/JA/ZH/KO |
| **Proactive Revenue** | $0 | >5% of bookings |

---

## 10. References

- `STRATEGY_20YEAR_ROADMAP.md` §12
- `AI_AGENT.md` (current implementation)
- `ADR-001` (Typesense + pgvector for semantic search)
- `ADR-002` (PostHog for analytics)
- `ADR-003` (BullMQ for proactive job scheduling)
- `src/lib/agent-service.ts`, `src/lib/tools.ts`, `src/lib/agent-intent.ts`
- `prisma/schema.prisma` (AgentSession, Review, Venture, Booking models)