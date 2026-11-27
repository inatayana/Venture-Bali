# ADR-010: Internationalization (i18n) Platform

**Date:** 2026-11-27
**Status:** APPROVED
**Deciders:** Senior Product & Database Architect, CTO, Founder
**Technical Story:** STRATEGY_20YEAR_ROADMAP.md §8 ADR-010

## Context

BaliWild needs an i18n platform for:
- **Current**: EN/ID (hardcoded in `src/lib/i18n-unified.ts`, `src/lib/brand.ts`)
- **Target markets**: International tourists (EN primary), Domestic (ID), East Asia (JA, ZH, KO)
- **Content types**: UI strings, product data, SEO metadata, AI-generated articles, legal docs, emails, push notifications
- **Scale**: 500+ articles, 50+ products, 20+ email templates, AI agent responses
- **Workflow**: Content team (non-technical), AI content wizard, developer handoff
- **SEO**: hreflang, localized URLs, localized sitemaps

## Decision

**Phase 1 (Now): Enhanced in-house i18n (current `i18n-unified.ts`) + Crowdin for content translation**
**Phase 2 (Year 2): Full Crowdin integration with CI/CD, automated PR creation**

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Crowdin** | CI/CD integration, context-aware translation, TM + MT, screenshots for context, CLI, GitHub sync, affordable at scale | Cost at scale (~$50-200/mo), learning curve, another vendor | ✅ **SELECTED** |
| **Locize** | Built for i18next, real-time editing, versioning, CDN delivery | More expensive, less CLI flexibility, smaller community | ⚠️ Runner-up |
| **In-house (current + custom admin)** | Zero cost, full control, integrated with AI wizard | No TM/MT, no context screenshots, manual CSV/JSON workflow, doesn't scale | ✅ **Phase 1** |
| **FormatJS / next-intl** | React/Next.js native, type-safe, ICU message format | Still needs translation management platform | ❌ Rejected (not a TMS) |
| **LinguiJS** | Compile-time optimization, ICU, CLI extract | Same as above | ❌ Rejected (not a TMS) |

## Consequences

### Positive
- **Phase 1**: Zero cost, leverages existing `i18n-unified.ts`, AI wizard generates EN/ID directly
- **Phase 2**: Professional translation workflow, translation memory reduces costs 30-50%, machine translation for first pass, context via screenshots, automated GitHub PRs
- **SEO ready**: Crowdin supports hreflang, localized sitemaps, URL slug translation

### Negative
- **Cost**: ~$100-300/mo at scale (500k+ words, 5 languages)
- **Complexity**: CI/CD pipeline, branch management, review workflow
- **AI content integration**: Need to sync AI-generated EN articles → Crowdin → localized → publish

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Translation quality (AI + MT) | Human review for all customer-facing content; AI only for first draft |
| Sync latency (Crowdin → repo) | Webhook → auto-PR → auto-merge on green CI; target <1hr |
| SEO hreflang errors | Automated validation in CI (`hreflang-checker`) |
| Content drift (EN updated, translations stale) | Crowdin "source string changed" flag → auto-assign to translators |

## Implementation Plan

### Phase 1: Enhanced In-House (Now - Month 6)
```typescript
// src/lib/i18n-unified.ts — Current (enhanced)
export const locales = ['en', 'id'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Namespace-based translation files (JSON)
/*
public/locales/
├── en/
│   ├── common.json
│   ├── booking.json
│   ├── product.json
│   ├── seo.json
│   ├── legal.json
│   ├── email.json
│   └── agent.json
└── id/
    ├── common.json
    ├── booking.json
    ...
*/

// Usage (Server Components)
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('booking');

// Usage (Client Components)
'use client';
import { useTranslations } from 'next-intl';
const t = useTranslations('booking');

// SEO Metadata (generateMetadata)
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const t = await getTranslations('seo');
  const product = await getProduct(params.slug);
  return {
    title: t('product.title', { name: product.title }),
    description: t('product.description', { name: product.title }),
    alternates: {
      languages: {
        en: `/en/product/${product.slug}`,
        id: `/id/product/${product.slug}`,
      },
    },
  };
}
```

```typescript
// src/lib/i18n/routing.ts — Locale routing
export const localePrefix = 'always'; // /en/, /id/
export const pathnames = {
  '/': '/',
  '/explore': '/explore',
  '/product/[slug]': '/product/[slug]',
  '/blog': '/blog',
  '/blog/[slug]': '/blog/[slug]',
  '/checkout/[sessionId]': '/checkout/[sessionId]',
  '/voucher/[bookingId]': '/voucher/[bookingId]',
  '/trips': '/trips',
};
```

```typescript
// 1. AI Content Wizard Integration (src/lib/aiContent.ts)
// Generate EN → Auto-translate to ID via Gemini → Human review → Save both
async function generateAndTranslateArticle(input: ArticleInput) {
  const enArticle = await geminiGenerateArticle({ ...input, language: 'en' });
  const idArticle = await geminiTranslateArticle(enArticle, 'id');
  
  // Save both to DB with same ventureId, different locale
  await prisma.article.createMany({
    data: [
      { ...enArticle, locale: 'en', slug: `${enArticle.slug}-en` },
      { ...idArticle, locale: 'id', slug: `${idArticle.slug}-id` },
    ],
  });
  
  // Return for human review in admin
  return { en: enArticle, id: idArticle };
}
```

### Phase 2: Crowdin Integration (Year 2)
```yaml
# .github/workflows/crowdin-sync.yml
name: Crowdin Sync
on:
  schedule:
    - cron: '0 2 * * *' # Daily 02:00 UTC
  workflow_dispatch:

jobs:
  crowdin-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Crowdin Sync
        uses: crowdin/github-action@v1
        with:
          args: upload sources --auto-update -b main
        env:
          CROWDIN_PROJECT_ID: ${{ secrets.CROWDIN_PROJECT_ID }}
          CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_TOKEN }}

  crowdin-download:
    needs: crowdin-sync
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - name: Download Translations
        uses: crowdin/github-action@v1
        with:
          args: download -b main --language id,ja,zh,ko
        env:
          CROWDIN_PROJECT_ID: ${{ secrets.CROWDIN_PROJECT_ID }}
          CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_TOKEN }}
      
      - name: Create PR
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          branch: crowdin-translations
          title: 'chore(i18n): sync translations from Crowdin'
          body: 'Automated translation sync from Crowdin'
          labels: 'i18n, automated'
```

```typescript
// crowdin.yml (project config)
project_id: "123456"
api_token_env: CROWDIN_TOKEN
base_path: "public/locales"
base_url: "https://api.crowdin.com"
preserve_hierarchy: true

files:
  - source: "/en/*.json"
    translation: "/%locale%/*.json"
    languages:
      - id
      - ja
      - zh
      - ko
    update_option: "update_as_unapproved"
    export_patterns:
      - "public/locales/%locale%/%file_name%"
```

```typescript
// src/lib/i18n/crowdin-webhook.ts — Webhook handler for instant sync
// POST /api/webhooks/crowdin
export async function POST(req: Request) {
  const payload = await req.json();
  
  // Verify signature
  const signature = req.headers.get('X-Crowdin-Signature');
  if (!verifyCrowdinSignature(payload, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Event: translation completed, proofread, approved
  if (payload.event === 'translation_approved' || payload.event === 'proofread_approved') {
    // Trigger download for specific language/file
    await triggerCrowdinDownload(payload.data.language, payload.data.file);
  }
  
  return Response.json({ ok: true });
}
```

### Article Model Enhancement (Prisma)
```prisma
// prisma/schema.prisma — Add locale support
model Article {
  id          String    @id @default(cuid())
  slug        String    @unique
  locale      String    @default("en") // NEW
  title       Json      // { en: "...", id: "..." } or localized per row
  content     String
  metaDesc    Json
  keywords    Json
  tags        Json
  publishedAt DateTime?
  aiGenerated Boolean   @default(false)
  ventureId   String?
  venture     Venture?  @relation("VentureToArticle", fields: [ventureId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([slug])
  @@index([ventureId])
  @@index([publishedAt])
  @@index([aiGenerated])
  @@index([locale]) // NEW
}
```

## Monitoring & Success Metrics

| Metric | Target |
|--------|--------|
| Translation coverage (UI) | 100% for EN/ID; >80% for JA/ZH/KO |
| Translation coverage (Articles) | 100% EN/ID; 50% JA/ZH/KO (Year 2) |
| Sync latency (Crowdin → prod) | <1 hour |
| hreflang validation | 0 errors in Search Console |
| Localized organic traffic | >30% of total (Year 2) |
| Translation cost per word | <$0.08 (blended MT + human) |

## Rollback Plan

If Crowdin fails:
1. Revert to in-house JSON + manual translation workflow
2. Use Google Translate API for first draft (budget controlled)
3. Document lessons learned in ADR-010-amendment

## References

- [Crowdin Documentation](https://support.crowdin.com/)
- [Crowdin GitHub Action](https://github.com/crowdin/github-action)
- [next-intl](https://next-intl-docs.vercel.app/)
- [hreflang Best Practices](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- `STRATEGY_20YEAR_ROADMAP.md` §8 ADR-010
- `src/lib/i18n-unified.ts` (current implementation)
- `SEO_STRATEGY.md` (current SEO implementation)