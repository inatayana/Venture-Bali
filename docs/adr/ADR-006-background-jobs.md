# ADR-006: Background Job Framework Selection

**Date:** 2026-11-27
**Status:** APPROVED
**Deciders:** Senior Product & Database Architect, CTO, Founder
**Technical Story:** STRATEGY_20YEAR_ROADMAP.md §8 ADR-006

## Context

BaliWild needs a reliable background job framework for:
- Booking hold expiration (every 10 minutes) — **critical for capacity**
- Payment reconciliation (every 15 minutes) — **financial integrity**
- Review reminders (daily) — **growth flywheel**
- AI content generation (scheduled, rate-limited) — **SEO engine**
- Notification delivery (WhatsApp, Email, Telegram) — **reliability**
- Vendor payout processing (weekly) — **operations**
- Dynamic pricing recalculation (hourly/daily) — **revenue optimization**
- Analytics event processing — **observability**

Current state: Vercel Cron (daily only on Hobby) + external cron-job.org for frequent jobs.

## Decision

**Adopt BullMQ on Redis (self-hosted on Hostinger VPS Phase 2)**

**Interim (Vercel Hobby):** Continue Vercel Cron (daily) + cron-job.org (1-min granularity) for critical jobs.

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **BullMQ + Redis** | Priority queues, delayed jobs, retries with backoff, rate limiting, job scheduling, metrics, UI dashboard, TypeScript native, scales horizontally | Requires Redis + VPS (Phase 2); operational overhead | ✅ **SELECTED** |
| **Vercel Cron** | Zero infra, integrated, free on Hobby | **Daily only on Hobby** (blocker for 10-min jobs), no priority, no retries, no visibility | ❌ Rejected (limit) |
| **Temporal** | Durable execution, workflows, sagas, visibility | Overkill for current needs, steep learning curve, heavier resources | ❌ Rejected (complexity) |
| **pg_cron** | Runs in PostgreSQL, no extra infra | Limited to SQL, no priority/retries, no dashboard, Supabase doesn't expose | ❌ Rejected (features) |
| **Node-cron / setTimeout** | Simple, no deps | No persistence, no retries, no scaling, crashes lose jobs | ❌ Rejected (reliability) |
| **Inngest / Trigger.dev** | Serverless, TypeScript, good DX | SaaS (cost at scale), vendor lock-in, less control | ❌ Rejected (cost/control) |

## Consequences

### Positive
- **Reliability**: Job persistence, automatic retries with exponential backoff, dead letter queues
- **Observability**: Bull Board UI for monitoring, metrics (completed, failed, delayed, waiting)
- **Priority queues**: Critical jobs (hold expiry, payment reconciliation) jump the queue
- **Rate limiting**: Respect API limits (Gemini 20/day, WhatsApp, Midtrans)
- **Scheduling**: Cron-like syntax + dynamic scheduling
- **Scalability**: Horizontal worker scaling on VPS
- **TypeScript native**: Full type safety for job data

### Negative
- Requires Redis + VPS (Phase 2) — not available on Vercel
- Operational responsibility (Redis persistence, memory, backups)
- Additional infrastructure cost (~$5-10/month for Redis on VPS)

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Redis memory pressure | Configure `maxmemory-policy allkeys-lru`; monitor; separate Redis for queues vs cache |
| Job duplication | Use idempotency keys in job data; `removeOnComplete` / `removeOnFail` |
| VPS not ready | Interim: cron-job.org + Vercel Cron (documented in DEPLOYMENT_STRATEGY.md) |
| Worker crashes | Graceful shutdown (SIGTERM); `worker.close()` drains current job |

## Implementation Plan

### Phase 1: Interim (Now - Pre-VPS)
```typescript
// Already documented in DEPLOYMENT_STRATEGY.md §2.5.1
// External cron-job.org calls:
// POST https://baliwild.com/api/cron/reap-holds (every 10 min)
// POST https://baliwild.com/api/cron/reconcile-payments (every 15 min)
// Authorization: Bearer ${CRON_SECRET}
```

### Phase 2: BullMQ Implementation (VPS Migration)

```yaml
# docker-compose.redis.yml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
```

```typescript
// src/lib/queue/redis.ts
import { createClient } from 'redis';

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

redis.on('error', (err) => console.error('Redis error:', err));
await redis.connect();
```

```typescript
// src/lib/queue/index.ts
import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis } from './redis';

// Queue definitions
export const queues = {
  bookingHolds: new Queue('booking-holds', { connection: redis }),
  paymentReconciliation: new Queue('payment-reconciliation', { connection: redis }),
  notifications: new Queue('notifications', { connection: redis }),
  aiContent: new Queue('ai-content', { connection: redis }),
  vendorPayouts: new Queue('vendor-payouts', { connection: redis }),
  dynamicPricing: new Queue('dynamic-pricing', { connection: redis }),
  analytics: new Queue('analytics', { connection: redis }),
};

// Job types
export interface BookingHoldJob {
  type: 'reap-expired-holds';
  idempotencyKey: string; // e.g., "reap-holds-2026-11-27T10:00"
}

export interface PaymentReconciliationJob {
  type: 'reconcile-payments';
  idempotencyKey: string;
  since?: Date; // ISO string
}

export interface NotificationJob {
  type: 'whatsapp' | 'email' | 'telegram';
  bookingId: string;
  template: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
}

export interface AIContentJob {
  type: 'generate-article';
  ventureId: string;
  keywords: string[];
  targetSlug: string;
  idempotencyKey: string;
}
```

```typescript
// src/lib/queue/workers/bookingHolds.ts
import { Worker } from 'bullmq';
import { queues, BookingHoldJob } from '../index';
import { reapExpiredHolds } from '@/lib/bookingService';

export const bookingHoldsWorker = new Worker<BookingHoldJob>(
  'booking-holds',
  async (job) => {
    const { idempotencyKey } = job.data;
    
    // Idempotency check
    const existing = await redis.get(`idempotent:${idempotencyKey}`);
    if (existing) {
      console.log(`[booking-holds] Skipping duplicate: ${idempotencyKey}`);
      return { skipped: true };
    }
    
    const result = await reapExpiredHolds();
    
    // Mark idempotency key (24hr TTL)
    await redis.setEx(`idempotent:${idempotencyKey}`, 86400, 'done');
    
    return result;
  },
  {
    connection: redis,
    concurrency: 1, // Serial execution for consistency
    maxStalledCount: 2,
    stalledInterval: 30000,
  }
);

bookingHoldsWorker.on('completed', (job) => {
  console.log(`[booking-holds] Completed: ${job.id}`, job.returnvalue);
});

bookingHoldsWorker.on('failed', (job, err) => {
  console.error(`[booking-holds] Failed: ${job?.id}`, err);
});
```

```typescript
// src/lib/queue/scheduler.ts — Cron-like scheduling
import { queues } from './index';
import { addMinutes, startOfMinute } from 'date-fns';

export async function scheduleRecurringJobs() {
  // Booking holds: every 10 minutes
  await queues.bookingHolds.add(
    'reap-expired-holds',
    { idempotencyKey: `reap-holds-${new Date().toISOString()}` },
    { repeat: { pattern: '*/10 * * * *' }, removeOnComplete: 100, removeOnFail: 50 }
  );

  // Payment reconciliation: every 15 minutes
  await queues.paymentReconciliation.add(
    'reconcile-payments',
    { idempotencyKey: `reconcile-${new Date().toISOString()}` },
    { repeat: { pattern: '*/15 * * * *' }, removeOnComplete: 100, removeOnFail: 50 }
  );

  // Review reminders: daily at 09:00 WITA
  await queues.notifications.add(
    'review-reminders',
    { idempotencyKey: `review-reminders-${new Date().toISOString()}` },
    { repeat: { pattern: '0 1 * * *' }, removeOnComplete: 30, removeOnFail: 10 } // UTC = 09:00 WITA
  );

  // AI Content: daily at 02:00 WITA (rate limited)
  await queues.aiContent.add(
    'generate-daily-articles',
    { idempotencyKey: `ai-content-${new Date().toISOString()}` },
    { repeat: { pattern: '0 18 * * *' }, removeOnComplete: 30, removeOnFail: 10 } // UTC = 02:00 WITA
  );

  // Vendor payouts: weekly Monday 10:00 WITA
  await queues.vendorPayouts.add(
    'process-weekly-payouts',
    { idempotencyKey: `payouts-${new Date().toISOString()}` },
    { repeat: { pattern: '0 3 * * 1' }, removeOnComplete: 10, removeOnFail: 5 } // UTC = 10:00 WITA Mon
  );

  // Dynamic pricing: hourly
  await queues.dynamicPricing.add(
    'recalculate-prices',
    { idempotencyKey: `pricing-${new Date().toISOString()}` },
    { repeat: { pattern: '0 * * * *' }, removeOnComplete: 100, removeOnFail: 20 }
  );
}
```

```typescript
// src/app/api/admin/queue/stats/route.ts — Monitoring endpoint
import { queues } from '@/lib/queue';

export async function GET() {
  const stats = await Promise.all(
    Object.entries(queues).map(async ([name, queue]) => {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);
      return { name, waiting, active, completed, failed, delayed };
    })
  );
  return Response.json({ queues: stats });
}
```

## Monitoring & Success Metrics

| Metric | Target |
|--------|--------|
| Job success rate | >99.5% |
| Critical job latency (p95) | <30s (hold expiry), <60s (payment reconciliation) |
| Queue depth (waiting) | <100 under normal load |
| Duplicate job rate | 0% (idempotency keys) |
| Worker uptime | 99.9% |

## Rollback Plan

If BullMQ fails:
1. Revert to cron-job.org + Vercel Cron (documented interim)
2. Redis: can run on same VPS as app (no separate infra)
3. Document lessons learned in ADR-006-amendment

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Bull Board Monitoring UI](https://github.com/felixmosh/bull-board)
- `STRATEGY_20YEAR_ROADMAP.md` §8 ADR-006
- `DEPLOYMENT_STRATEGY.md` §2.5.1 (current interim)
- `TECH_DECISION_LOG.md` (future reference)