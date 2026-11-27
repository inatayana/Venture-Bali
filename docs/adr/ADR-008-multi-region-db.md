# ADR-008: Multi-Region Database Strategy

**Date:** 2026-11-27
**Status:** APPROVED
**Deciders:** Senior Product & Database Architect, CTO, Founder
**Technical Story:** STRATEGY_20YEAR_ROADMAP.md §8 ADR-008

## Context

BaliWild needs a database strategy for:
- **Phase 1 (Current):** Vercel + Supabase Shared Cluster (Singapore region)
- **Phase 2 (VPS):** Hostinger VPS (Singapore/Jakarta) + Supabase
- **Phase 3 (Scale):** Read replicas for analytics, geographic distribution
- **Regulatory:** Indonesian data sovereignty (PDP Law) — personal data must reside in Indonesia
- **Performance:** Low latency for Indonesian users (primary market) + international tourists
- **Cost:** Controlled scaling

Current state: Supabase Shared Cluster (Singapore), Transaction Pooler (port 6543), Direct connection (port 5432) for migrations.

## Decision

**Adopt Supabase Dedicated + Read Replicas (Singapore primary, Jakarta replica for data residency)**

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Supabase Dedicated + Read Replicas** | Managed, same provider, zero code changes, read replicas for analytics, Jakarta region for PDP compliance, point-in-time recovery | Cost jumps from $0 to ~$600+/mo (Dedicated), vendor lock-in | ✅ **SELECTED** |
| **Neon** | Serverless, branching, autoscaling, generous free tier, PostgreSQL compatible | No Jakarta region yet, younger platform, branching not needed for our workflow | ⚠️ Runner-up |
| **PlanetScale** | Vitess-backed, infinite scale, branching, MySQL compatible | **MySQL not PostgreSQL** (schema migration required), no Jakarta region | ❌ Rejected (MySQL) |
| **Self-Hosted PostgreSQL (VPS)** | Full control, zero marginal cost, any region | Operational burden (backups, HA, tuning, security, upgrades), team expertise | ❌ Rejected (ops) |
| **Supabase Shared + pg_dump to local** | Cheap, simple | No HA, no read replicas, manual failover, not production-grade at scale | ❌ Rejected (reliability) |

## Consequences

### Positive
- **Zero migration effort**: Same connection strings, same Prisma client
- **Data residency**: Jakarta replica satisfies Indonesian PDP Law
- **Read scaling**: Analytics/dashboard queries offloaded to replicas
- **HA**: Automatic failover (Supabase manages)
- **Point-in-time recovery**: 7-day PITR on Dedicated
- **Connection pooling**: Session mode pooler for VPS (long-lived connections)

### Negative
- **Cost**: ~$600-1000/mo for Dedicated + replicas (vs $0 Shared)
- **Vendor lock-in**: Supabase-specific features (RLS, Realtime, Storage)
- **Region latency**: Singapore → Jakarta replica ~30ms; acceptable for async reads

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Cost shock at migration | Budget $1000/mo; monitor usage; negotiate enterprise if >$2k |
| Supabase outage | Multi-region replica = read availability; write fails over automatically |
| Data residency audit | Jakarta replica + Supabase compliance docs; legal review annually |
| Connection pool exhaustion (VPS) | Use Session Pooler (port 5432) for VPS; Transaction Pooler for serverless |

## Implementation Plan

### Phase 1: Current (No Action)
- Continue on Supabase Shared Cluster
- Monitor: connections, query latency, storage growth
- Budget planning for Dedicated migration

### Phase 2: Migration Trigger (When Any Met)
- Vercel Free Tier limits exceeded (bandwidth, function hours, builds)
- Monthly active connections >80% of Shared limit (100)
- Need read replicas for analytics dashboard performance
- Regulatory requirement for Jakarta data residency
- Team decision to move to VPS

### Phase 3: Migration Steps
```bash
# 1. Provision Supabase Dedicated (Singapore primary)
# Dashboard → Create New Project → "Dedicated" → Region: Singapore

# 2. Enable Read Replica in Jakarta
# Dashboard → Database → Read Replicas → Add Replica → Region: Jakarta

# 3. Update connection strings
# Transaction Pooler (Vercel/serverless): singapore-pooler.supabase.com:6543
# Session Pooler (VPS/long-lived): singapore-pooler.supabase.com:5432
# Direct (migrations): db.<ref>.supabase.co:5432
# Analytics (read-only): jakarta-replica.supabase.com:5432

# 4. Migrate data (zero-downtime)
# Option A: Supabase "Import from another project" (recommended)
# Option B: pg_dump / pg_restore with logical replication

# 5. Update environment variables
DATABASE_URL="postgresql://postgres:xxx@singapore-pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:xxx@db.<new-ref>.supabase.co:5432/postgres"
ANALYTICS_DATABASE_URL="postgresql://postgres:xxx@jakarta-replica.supabase.com:5432/postgres?sslmode=require"

# 6. Deploy with new config
# Vercel: Update env vars → redeploy
# VPS: Update .env → pm2 reload

# 7. Verify
# - Write latency <50ms (Singapore)
# - Read replica lag <1s (Jakarta)
# - PITR working
# - RLS policies replicated
```

### Phase 4: Read Replica Usage
```typescript
// src/lib/prisma/analytics.ts — Separate client for read replicas
import { PrismaClient } from '@prisma/client';

export const analyticsPrisma = new PrismaClient({
  datasourceUrl: process.env.ANALYTICS_DATABASE_URL,
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
});

// Usage: Dashboard queries, reporting, exports
const revenue = await analyticsPrisma.booking.groupBy({
  by: ['bookingDate'],
  _sum: { totalPrice: true },
  where: { bookingDate: { gte: startOfMonth }, paymentStatus: 'PAID' },
});
```

## Monitoring & Success Metrics

| Metric | Target |
|--------|--------|
| Write latency (p95) | <50ms |
| Read replica lag | <1s |
| Connection pool utilization | <70% |
| PITR recovery test | Quarterly, <1hr RTO |
| Monthly cost | <$1000 (Dedicated + 1 replica) |

## Rollback Plan

If Supabase Dedicated fails:
1. Revert to Shared Cluster (data sync via pg_dump/restore)
2. Document lessons learned in ADR-008-amendment
3. Evaluate Neon as alternative

## References

- [Supabase Dedicated](https://supabase.com/docs/guides/platform/dedicated)
- [Supabase Read Replicas](https://supabase.com/docs/guides/database/read-replicas)
- [Indonesian PDP Law](https://www.kominfo.go.id/content/detail/44165/uu-pelindungan-data-pribadi/0/aturan_perundangan)
- `STRATEGY_20YEAR_ROADMAP.md` §8 ADR-008
- `DEPLOYMENT_STRATEGY.md` §3 (VPS migration)
- `TECH_DECISION_LOG.md` §2 (Database Provider)