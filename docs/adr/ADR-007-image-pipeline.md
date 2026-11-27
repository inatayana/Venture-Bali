# ADR-007: Image Pipeline Strategy

**Date:** 2026-11-27
**Status:** APPROVED (Reaffirming TECH_DECISION_LOG.md §9, §15)
**Deciders:** Senior Product & Database Architect, CTO, Founder
**Technical Story:** STRATEGY_20YEAR_ROADMAP.md §8 ADR-007

## Context

BaliWild needs an image pipeline for:
- Product photos (hero + gallery, up to 8 per venture)
- Content/article images
- Review photos (guest uploads, max 3, 4:3)
- Voucher QR codes
- Admin uploads (vendor contracts, certifications)
- Optimization for Core Web Vitals (LCP, CLS)
- Cost control (free tier friendly)

Current state: Single WebP master stored in Supabase Storage (`venture-assets` bucket), variants generated on-demand by Vercel Image Optimizer (`next/image`).

## Decision

**Stay with current architecture: Single WebP master + Vercel Image Optimizer + Sharp for server-side normalization**

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Current: Single WebP master + Vercel Optimizer + Sharp** | Zero marginal cost, leverages Vercel edge CDN, Sharp ensures valid WebP masters, no duplicate storage, LCP priority works | Vercel Hobby quota (~1000 unique images/month), VPS needs Sharp installed | ✅ **SELECTED** (reaffirmed) |
| **Multi-variant storage (Supabase)** | No optimizer dependency, full control | 3-4x storage cost, manual srcset management, complex upload pipeline | ❌ Rejected (cost/complexity) |
| **Supabase Image Transform** | Integrated, on-demand | **Paid plan required**, limited transforms, vendor lock-in | ❌ Rejected (cost) |
| **Cloudinary / Imgix** | Best-in-class optimization, responsive images, auto-format | **Cost scales with bandwidth**, vendor lock-in, data leaves infra | ❌ Rejected (cost) |
| **Thumbor (self-hosted)** | Full control, open source | Operational burden, need CDN in front, VPS resources | ❌ Rejected (ops) |

## Consequences

### Positive
- **Zero cost** on Vercel Free Tier (within quota)
- **Single source of truth**: One WebP master per image
- **Content hashing** (SHA-256) prevents duplicate uploads
- **EXIF stripping + orientation correction** via Sharp (security + correctness)
- **Size budget enforced**: ≤300KB, ≤1600px longest edge
- **VPS migration ready**: Sharp works on Linux VPS for `next start` optimizer

### Negative
- **Vercel Hobby quota limit**: ~1000 unique source images/month
- **No AVIF** (blocked by GHSA-2xp9-vwfh-vxw4 in Next 14.2.35)
- **VPS Phase 2 requires Sharp** system dependency (`libvips`)

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Quota exceeded | Monitor via Vercel Analytics; upgrade to Pro ($20/mo) or migrate to VPS |
| Sharp vulnerability (GHSA-2xp9-vwfh-vxw4) | AVIF disabled; only WebP output; upgrade to Next 15+ when stable |
| Upload bypass (spoofed Content-Type) | Sharp server-side normalization (already implemented in `imageNormalize.ts`) |
| Large original uploads | Client-side compression first (canvas/WebP) + server validation |

## Implementation Details (Already In Place)

### Client-Side Compression (`src/lib/compressImage.ts`)
```typescript
// Browser compresses to WebP ≤300KB, ≤1600px before upload
// Validates: file type, dimensions, size
// Returns: { blob, hash, width, height, size }
```

### Server-Side Normalization (`src/lib/imageNormalize.ts`)
```typescript
// Sharp pipeline:
// 1. Decode (validates actual format, rejects spoofed)
// 2. EXIF orientation + strip all metadata (GPS, device info)
// 3. Resize to 1600px longest edge (lanczos3)
// 4. Encode WebP (quality 80, effort 6)
// 5. Verify ≤300KB, re-encode at lower quality if needed
// 6. SHA-256 hash for deduplication
// 7. Upload to Supabase Storage: `products/${hash}.webp`
```

### Vercel Image Optimizer (`next.config.js`)
```javascript
images: {
  formats: ['image/webp'], // AVIF disabled (security advisory)
  remotePatterns: [], // No external images - all local
  dangerouslyAllowSVG: false, // Only local placeholder SVGs
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
}
```

### Display (`next/image` + `sizes`)
```tsx
// Automatic srcset generation via `sizes` prop
<Image
  src={product.imageUrl}
  alt={product.title}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
  priority={isHero}
  className="object-cover"
/>
```

## Monitoring & Success Metrics

| Met | Target |
|-----|--------|
| Image optimization quota usage | <80% of monthly limit |
| LCP (product pages) | <2.5s |
| CLS (image-related) | <0.1 |
| Upload rejection rate | <5% (client-side catches most) |
| Duplicate upload rate | <1% (content hashing) |

## Rollback Plan

If Vercel Optimizer fails:
1. `next.config.js`: Add `loader: 'custom'`, implement Sharp-based loader for VPS
2. Pre-generate variants at upload (Sharp) — increases storage 3-4x
3. Document lessons learned in ADR-007-amendment

## References

- `TECH_DECISION_LOG.md` §9 (Media Delivery), §15 (Sharp)
- `MEMO_MEDIA_ARCHITECTURE.md`
- `STRATEGY_20YEAR_ROADMAP.md` §8 ADR-007
- [Vercel Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)