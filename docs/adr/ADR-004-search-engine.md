# ADR-004: Search/Discovery Engine Selection

**Date:** 2026-11-27
**Status:** APPROVED
**Deciders:** Senior Product & Database Architect, CTO, Founder
**Technical Story:** STRATEGY_20YEAR_ROADMAP.md §8 ADR-004

## Context

BaliWild needs a search and discovery engine for:
- Product catalog search (activities, locations, categories)
- Filter facets (price range, duration, difficulty, transfer mode, ratings)
- Typo-tolerant queries (international tourists, mobile users)
- Real-time availability integration
- Multi-language support (EN/ID/JA/ZH/KO)
- Scalability to 10k+ products, 100k+ searches/day

Current state: Client-side filtering only (`src/lib/filterCatalogue.ts`), no full-text search.

## Decision

**Adopt Typesense (self-hosted on Hostinger VPS Phase 2)**

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Typesense** (self-hosted) | Typo-tolerance, facet filtering, affordable ($0 on VPS), real-time indexing, multi-language, open source | Operational burden (self-hosted), smaller community than Algolia | ✅ **SELECTED** |
| **Algolia** | Managed, best-in-class relevance, excellent dashboard, analytics | Cost scales steeply ($1.50/1k searches), vendor lock-in, data leaves infrastructure | ❌ Rejected (cost) |
| **Meilisearch** | Open source, good typo-tolerance, easy setup | Less mature facet filtering, slower writes at scale, fewer language analyzers | ⚠️ Runner-up |
| **PostgreSQL `pg_trgm` + GIN** | Zero infra, ACID, already in stack | Poor typo-tolerance, no native faceting, slower at scale, no synonym support | ❌ Rejected (features) |
| **Elasticsearch/OpenSearch** | Full-featured, mature | Heavy resource usage, complex operations, overkill for current scale | ❌ Rejected (complexity) |

## Consequences

### Positive
- Zero marginal cost at scale (runs on existing VPS)
- Full control over data, indexing, ranking
- Native facet filtering matches booking architecture (zone, mode, price tier)
- Real-time sync via Prisma middleware or CDC
- Multi-language analyzers support EN/ID/JA/ZH/KO

### Negative
- Operational responsibility (backups, monitoring, upgrades)
- Requires VPS (Phase 2) — interim: client-side filtering + pg_trgm
- Smaller ecosystem than Algolia

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| VPS not ready in time | Interim: Enhance `filterCatalogue.ts` + add `pg_trgm` indexes |
| Typesense scaling issues | Benchmark at 10k docs; plan read replicas |
| Sync latency | Target <1s via Prisma `$extends` middleware on write |

## Implementation Plan

### Phase 1 (Now - Pre-VPS)
```typescript
// 1. Add pg_trgm indexes for interim search
// migration: 20261127_add_pg_trgm_indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_venture_title_trgm ON "Venture" USING GIN ("title" gin_trgm_ops);
CREATE INDEX idx_venture_short_desc_trgm ON "Venture" USING GIN ("shortDescription" gin_trgm_ops);
CREATE INDEX idx_article_content_trgm ON "Article" USING GIN ("content" gin_trgm_ops);
```

### Phase 2 (VPS Migration)
```yaml
# docker-compose.typesense.yml
services:
  typesense:
    image: typesense/typesense:27.0
    ports:
      - "8108:8108"
    volumes:
      - typesense-data:/data
    environment:
      - TYPESENSE_API_KEY=${TYPESENSE_API_KEY}
      - TYPESENSE_DATA_DIR=/data
    command: --enable-cors
```

```typescript
// 2. Typesense schema (src/lib/typesense/schema.ts)
const ventureSchema = {
  name: 'ventures',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string', facet: false },
    { name: 'slug', type: 'string', index: false },
    { name: 'category', type: 'string', facet: true },
    { name: 'subcategory', type: 'string', facet: true, optional: true },
    { name: 'location', type: 'string', facet: true },
    { name: 'minPrice', type: 'int32', facet: true },
    { name: 'maxPrice', type: 'int32', facet: true },
    { name: 'duration', type: 'string', facet: true },
    { name: 'difficulty', type: 'string', facet: true },
    { name: 'fulfillmentModes', type: 'string[]', facet: true },
    { name: 'rating', type: 'float', facet: false },
    { name: 'reviewCount', type: 'int32', facet: false },
    { name: 'tags', type: 'string[]', facet: true },
    { name: 'languages', type: 'string[]', facet: true },
    { name: 'createdAt', type: 'int64', facet: false },
  ],
  default_sorting_field: 'rating',
  symbols_to_index: ['-', '_', '+', '#'],
  token_separators: [' ', '-', '_'],
};
```

```typescript
// 3. Sync pipeline (src/lib/typesense/sync.ts)
export async function syncVentureToTypesense(venture: VentureWithRelations) {
  const minPrice = Math.min(...venture.variants.flatMap(v => v.priceTiers.map(t => t.pricePerPax)));
  const maxPrice = Math.max(...venture.variants.flatMap(v => v.priceTiers.map(t => t.pricePerPax)));
  const modes = [...new Set(venture.variants.map(v => v.fulfillmentMode))];
  
  await typesenseClient.collections('ventures').documents().upsert({
    id: venture.id,
    title: venture.title,
    slug: venture.slug,
    category: venture.category,
    subcategory: venture.subcategory,
    location: venture.location?.name,
    minPrice,
    maxPrice,
    duration: venture.duration,
    difficulty: venture.difficulty,
    fulfillmentModes: modes,
    rating: venture.rating,
    reviewCount: venture.reviews.length,
    tags: venture.searchTags,
    languages: venture.languages,
    createdAt: venture.createdAt.getTime(),
  });
}
```

## Monitoring & Success Metrics

| Metric | Target |
|--------|--------|
| Search latency (p95) | <100ms |
| Index freshness (write → searchable) | <1s |
| Zero-downtime deployments | 100% |
| Search conversion rate | >15% (search → booking start) |

## Rollback Plan

If Typesense fails:
1. Revert to enhanced `filterCatalogue.ts` + `pg_trgm` indexes
2. Feature flag: `NEXT_PUBLIC_SEARCH_ENGINE=postgres`
3. Document lessons learned in ADR-004-amendment

## References

- [Typesense Documentation](https://typesense.org/docs/)
- [Typesense Self-Hosting Guide](https://typesense.org/docs/guide/install-typesense.html)
- `STRATEGY_20YEAR_ROADMAP.md` §8 ADR-004
- `TECH_DECISION_LOG.md` (future reference)