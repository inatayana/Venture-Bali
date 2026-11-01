# BaliWild — Brand Guidelines

> **Version:** 1.0.0
> **Status:** MUST FOLLOW for every customer-facing surface.
> **Domain:** `https://baliwild.com`

## 1. Name

| Use | Correct |
|---|---|
| Brand name | **BaliWild** (one word, capital B and W) |
| Never | Bali Wild, Baliwild, BaliGo, Venture Bali |
| Tagline | **Own the wild.** |
| Product/category | Adventure name only — never prefix with the brand |

Official social handles:

| Platform | Handle |
|---|---|
| Instagram | `@baliwildadventures` |
| TikTok | `@baliwildadventures` |
| YouTube | `@BaliWildAdventures` |
| Facebook | **BaliWild Adventures** |

Product titles, meta titles and slugs must never contain “BaliWild” (enforced by
`src/lib/titleValidator.ts`). The brand lives on the site, not in the product.

## 2. Wordmark

`BALI` + `WILD` in a solid accent block. The block is the signature element and
must stay black-on-yellow or yellow-on-black; do not outline it, gradient it or
put it on a photo without the scrim.

Theme rule (v3.6.4):
- **Light theme:** `BALI` black, `WILD` white on the yellow block.
- **Dark theme:** `BALI` white, `WILD` black on the yellow block.

- Component: `src/components/layout/BrandWordmark.tsx`
- Minimum size: 18px. Keep clear space equal to the height of “W” around it.
- Use on: header, footer, admin/login, offline page, PWA icons.
- Do not use the wordmark as a repeating pattern or rotate it.

## 3. Colour

| Token | Value | Use |
|---|---|---|
| `brand-ink` | `#000000` | Primary text, buttons, dark surfaces |
| `brand` | `#FFEE00` | Stars, active states, CTA fills, the “WILD” block |
| White | `#FFFFFF` | Text on ink |
| Neutral greys | Tailwind `neutral-*` | Borders, secondary text, backgrounds |

Accent rules:

- Yellow is a **signal**, not a background for long text. Yellow surfaces always
  carry black text.
- Never hardcode `#FFEE00` in a component — use `bg-brand`, `text-brand`,
  `fill-brand`, or the CSS variables in `src/styles/globals.css`.
- The accepted brand is black + yellow; blue/navy is not part of the palette.

Theme surfaces (v3.6.5):

| Theme | Page | Header | Cards | Text |
|---|---|---|---|---|
| Light | `#FAFAFA` | `#FFFFFF` | `#FFFFFF` | black |
| Dark | `#212121` | `#191919` | `#191919` | white |

Brand surfaces (hero, footer, yellow CTA) keep their own contrast and are not
flattened by the theme toggle.

## 4. Typography

- Headings: **Barlow Condensed**, uppercase, tight tracking.
- Body/UI: **Plus Jakarta Sans**.
- Headline pattern: short imperative + one accent word. Example:
  `BOOK THE [ADVENTURE]` / `OWN THE WILD!`
- Do not use emoji in product titles or metadata.

## 5. Voice

**Bold, direct, local expert.** Short sentences. Concrete detail over hype.

Say:
- “Instant confirmation.”
- “Licensed local operators.”
- “80% refund when you cancel at least 24 hours before.”
- “Own the wild.”

Avoid:
- “Best”, “Cheapest”, “Free” (product claims).
- Invented reviews, ratings, reviewer names, locations or urgency.
- Vendor/partner names.
- Generic OTA filler (“book your dream adventure today!”).

## 6. Email addresses

| Address | Purpose | Public? |
|---|---|---|
| `hello@baliwild.com` | General enquiries, header/footer, social bio, Google Maps | Yes |
| `booking@baliwild.com` | Transactional sender: confirmations, e-vouchers, invoices, payment receipts | No — system only |
| `support@baliwild.com` | Complaints, reschedule, refund, on-trip emergency; `Reply-To` on transactional mail | Yes, for existing guests |
| `partners@baliwild.com` | Tour agents, drivers, activity suppliers, OTA partnerships | Yes, in the partner link |
| `b2b@baliwild.com` | Alias for the same partnership inbox | Optional |

Rules:
- `EMAIL_FROM` must use `booking@baliwild.com`; replies go to `support@`.
- Never put `booking@` on a public page — it is a send-only mailbox.
- Never use a personal Gmail address on the site or in email templates.

## 7. Imagery

- Real Bali landscapes, rivers, jungle, guides and guests in action.
- Cinematic crops, dark enough on the copy side for white text.
- Hero uses `/images/hero-bali.jpg` with a left-to-right scrim; the search card
  is intentionally translucent glass so the image remains the hero.
- Never put text directly on a busy photo without the scrim.

## 8. Where the brand must appear

| Surface | File(s) |
|---|---|
| Metadata, PWA, OG | `src/app/layout.tsx`, `src/app/manifest.ts` |
| Header / footer | `src/app/page.tsx`, `src/components/layout/SiteFooter.tsx` |
| Wordmark | `src/components/layout/BrandWordmark.tsx` |
| Hero | `src/components/features/HomeHero.tsx`, `src/components/search/HeroSearch.tsx` |
| Blog | `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx` |
| Admin | `src/components/admin/AdminSidebar.tsx`, login pages |
| Email / chat | `src/lib/notifications.ts`, `src/components/chat/ChatWidget.tsx` |
| SEO / schema | `src/lib/seo.ts`, `src/lib/brand.ts` |
| Icons | `public/icons/*` |

## 9. Domain migration checklist

- [ ] `NEXT_PUBLIC_APP_URL=https://baliwild.com` in production; rebuild.
- [ ] No legacy domain owned — **no 301 needed**. If an old host is acquired
      later, add a 301 to the matching `baliwild.com` path.
- [ ] Re-submit `/sitemap.xml`; check canonical tags on home, PDP and blog.
- [ ] Update `EMAIL_FROM`, WhatsApp templates, Google Business Profile and
      external booking links.
- [ ] Update the `Tenant` row (migration `20261106130000_rebrand_baliwild`).
