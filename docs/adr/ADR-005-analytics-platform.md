# ADR-005: Analytics/BI Platform Selection

**Date:** 2026-11-27
**Status:** APPROVED
**Deciders:** Senior Product & Database Architect, CTO, Founder
**Technical Story:** STRATEGY_20YEAR_ROADMAP.md §8 ADR-005

## Context

BaliWild needs a unified analytics platform for:
- Product analytics (funnels, retention, feature adoption)
- Feature flags / A/B testing (marketplace rollout, pricing experiments)
- Session replay (debugging, UX optimization)
- Event tracking (booking flow, AI agent interactions, SEO content performance)
- Self-hosted for data sovereignty and cost control
- Integration with Next.js (client + server), AI Agent, future mobile apps

Current state: GA4 only (basic page views), no product analytics, no feature flags.

## Decision

**Adopt PostHog (self-hosted on Hostinger VPS)**

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **PostHog** (self-hosted) | All-in-one: analytics + feature flags + session replay + A/B testing; open source; self-hosted; ClickHouse backend scales; generous free tier; SQL access | Operational burden; ClickHouse resource usage; smaller integration ecosystem than GA4 | ✅ **SELECTED** |
| **GA4 + BigQuery** | Free, familiar, SQL access, scales infinitely | No feature flags, no session replay, no A/B testing, event model complex, sampling at scale | ❌ Rejected (features) |
| **Mixpanel** | Excellent product analytics, good free tier | SaaS only (data leaves infra), expensive at scale, no feature flags/session replay in free tier | ❌ Rejected (SaaS) |
| **Amplitude** | Best-in-class behavioral analytics | SaaS only, very expensive, no feature flags/session replay | ❌ Rejected (SaaS) |
| **Supabase Realtime + Metabase** | Already in stack, SQL-native | No auto-capture, no session replay, no feature flags, manual dashboard building | ❌ Rejected (features) |
| **Custom (ClickHouse + Grafana)** | Full control | High engineering investment, reinventing wheels | ❌ Rejected (effort) |

## Consequences

### Positive
- Single platform replaces 3-4 tools (analytics + flags + replay + A/B)
- Self-hosted = data sovereignty (Indonesian regulations), zero marginal cost
- Feature flags critical for marketplace gradual rollout (ADR-003, ADR-006)
- Session replay invaluable for booking flow optimization
- SQL access for custom cohort analysis
- ClickHouse handles 100M+ events/day on modest hardware

### Negative
- Operational responsibility (ClickHouse + PostHog services)
- Resource usage: ~4GB RAM minimum for ClickHouse
- Learning curve for team (new query language: HogQL)
- Smaller community than GA4/Mixpanel

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| ClickHouse OOM on VPS | Start with 8GB RAM VPS; monitor; upgrade to dedicated ClickHouse later |
| Team adoption | Internal training; designate analytics champion; start with 3 key dashboards |
| Migration from GA4 | Run both in parallel 30 days; compare metrics; sunset GA4 |

## Implementation Plan

### Phase 1: Self-Hosted Setup (Week 1-2)
```yaml
# docker-compose.posthog.yml (run on VPS)
services:
  posthog:
    image: posthog/posthog:latest
    ports:
      - "8000:8000"
    environment:
      - POSTHOG_SECRET=${POSTHOG_SECRET}
      - POSTHOG_DISABLE_SECURE_SSL_REDIRECT=1
      - CLICKHOUSE_HOST=clickhouse
      - CLICKHOUSE_PORT=9000
      - CLICKHOUSE_DATABASE=posthog
      - CLICKHOUSE_USER=posthog
      - CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD}
      - KAFKA_HOST=kafka
      - KAFKA_PORT=9092
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - clickhouse
      - kafka
      - redis
    volumes:
      - posthog-media:/app/media

  clickhouse:
    image: clickhouse/clickhouse-server:23.8
    environment:
      - CLICKHOUSE_DB=posthog
      - CLICKHOUSE_USER=posthog
      - CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD}
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
    volumes:
      - clickhouse-data:/var/lib/clickhouse

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      - KAFKA_BROKER_ID=1
      - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
      - KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      - ZOOKEEPER_CLIENT_PORT=2181

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
```

### Phase 2: Integration (Week 2-3)
```typescript
// src/lib/posthog/client.ts
import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window === 'undefined') return;
  
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage',
    loaded: (ph) => {
      // Identify user if logged in
      if (user) ph.identify(user.id, { email: user.email, role: user.role });
    },
  });
}

// Server-side (API routes, AI Agent)
import { PostHog } from 'posthog-node';

export const serverPostHog = new PostHog(process.env.POSTHOG_API_KEY!, {
  host: process.env.POSTHOG_HOST,
  flushAt: 20,
  flushInterval: 10000,
});
```

```typescript
// src/lib/posthog/events.ts — Canonical event taxonomy
export const Events = {
  // Booking funnel
  booking_started: 'booking_started',
  variant_selected: 'variant_selected',
  date_selected: 'date_selected',
  travelers_selected: 'travelers_selected',
  pickup_selected: 'pickup_selected',
  promo_applied: 'promo_applied',
  addon_selected: 'addon_selected',
  checkout_started: 'checkout_started',
  payment_method_selected: 'payment_method_selected',
  payment_completed: 'payment_completed',
  payment_failed: 'payment_failed',
  
  // AI Agent
  agent_message_received: 'agent_message_received',
  agent_tool_called: 'agent_tool_called',
  agent_handoff_requested: 'agent_handoff_requested',
  
  // SEO/Content
  article_viewed: 'article_viewed',
  article_shared: 'article_shared',
  internal_link_clicked: 'internal_link_clicked',
  
  // Search/Discovery
  search_performed: 'search_performed',
  filter_applied: 'filter_applied',
  product_card_clicked: 'product_card_clicked',
  
  // Reviews
  review_submitted: 'review_submitted',
  review_invite_sent: 'review_invite_sent',
  review_invite_opened: 'review_invite_opened',
  
  // Feature flags (experiments)
  experiment_viewed: 'experiment_viewed',
  experiment_converted: 'experiment_converted',
} as const;
```

### Phase 3: Feature Flags for Marketplace Rollout (Month 2)
```typescript
// Feature flags for gradual marketplace transition
export const Flags = {
  marketplace_enabled: 'marketplace-enabled',
  operator_portal_enabled: 'operator-portal-enabled',
  auto_split_payout: 'auto-split-payout',
  platform_fee_enabled: 'platform-fee-enabled',
  public_api_v1: 'public-api-v1',
  dynamic_pricing_v2: 'dynamic-pricing-v2',
  ai_agent_proactive: 'ai-agent-proactive',
  review_flywheel_v2: 'review-flywheel-v2',
} as const;

// Usage
const isMarketplaceEnabled = posthog.getFeatureFlag(Flags.marketplace_enabled);
if (isMarketplaceEnabled) {
  // Show operator portal link, enable auto-split, etc.
}
```

## Monitoring & Success Metrics

| Metric | Target |
|--------|--------|
| Event ingestion latency | <5s |
| Dashboard load time (p95) | <3s |
| Feature flag evaluation latency | <10ms |
| Session replay capture rate | >95% |
| Team adoption (weekly active users) | >80% of product/eng |

## Rollback Plan

If PostHog fails:
1. Revert to GA4 + custom event logging (`src/lib/analytics.ts`)
2. Feature flags: simple in-memory/config-based (`src/lib/featureFlags.ts`)
3. Session replay: disable (nice-to-have)
4. Document lessons learned in ADR-005-amendment

## References

- [PostHog Self-Hosting](https://posthog.com/docs/deploy/self-host)
- [PostHog Feature Flags](https://posthog.com/docs/product-analytics/feature-flags)
- [PostHog Session Replay](https://posthog.com/docs/session-replay)
- `STRATEGY_20YEAR_ROADMAP.md` §8 ADR-005
- `TECH_DECISION_LOG.md` (future reference)