# BaliWild — Semantic Design Tokens

> **Version:** 1.0.0
> **Last Updated:** November 2026
> **Status:** ACTIVE — PR1 foundation. Components migrate in PR2.
> **Source of truth:** `src/styles/globals.css` + `tailwind.config.js`

## 1. Principles

1. **Channel format, not hex.** Tokens are space-separated RGB channels
   (`250 250 250`) so Tailwind opacity utilities such as `bg-surface/80` keep
   working. `scripts/check-contrast.mjs` fails if a required token is missing or
   not in channel format.
2. **`--brand` is the single accent source.** Do not add `--accent-yellow` or a
   second yellow token. `--brand-ink` is the only ink paired with it.
3. **Dark palette is fixed by owner decision:** page `#212121`, surfaces/cards
   `#191919`, hover `#2A2A2A`. Do not change it without an ADR.
4. **Contrast is a gate, not a review opinion.** Text ≥ 4.5:1; control borders
   ≥ 3:1. The gate runs in CI.
5. **Yellow is never text on a light surface.** `#FFEE00` on `#FFFFFF` is
   1.20:1. Use `bg-brand text-brand-ink`, or `text-brand` only on the dark base.

## 2. Token table

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg-base` | `#FAFAFA` | `#212121` | Page background |
| `--bg-surface` | `#FFFFFF` | `#191919` | Header, sheets, sticky bars |
| `--bg-card` | `#FFFFFF` | `#191919` | Product/booking cards |
| `--bg-card-hover` | `#F8FAFC` | `#2A2A2A` | Card hover |
| `--bg-inset` | `#F1F5F9` | `#2A2A2A` | Inputs, wells, skeletons |
| `--overlay` | `#000000` | `#000000` | Scrims (`bg-overlay/50`) |
| `--text-primary` | `#0F172A` | `#F8F9FA` | Headings, prices |
| `--text-secondary` | `#334155` | `#D1D5DB` | Body copy |
| `--text-muted` | `#64748B` | `#9CA3AF` | Metadata, helper text |
| `--border-subtle` | `#E5E7EB` | `#3A3A3A` | Decorative dividers |
| `--border-strong` | `#CBD5E1` | `#444444` | Emphasised dividers |
| `--border-control` | `#64748B` | `#9CA3AF` | Inputs, buttons, focus targets |
| `--brand` | `#FFEE00` | `#FFEE00` | Accent surfaces |
| `--brand-ink` | `#000000` | `#000000` | Ink on the accent |
| `--button-secondary` | `#4B5563` | `#4B5563` | Secondary button base |
| `--button-secondary-hover` | `#374151` | `#374151` | Secondary hover |
| `--button-secondary-active` | `#1F2937` | `#1F2937` | Secondary active |
| `--button-secondary-foreground` | `#FFFFFF` | `#FFFFFF` | Secondary label |
| `--state-success` | `#15803D` | `#4ADE80` | Success text/icons |
| `--state-warning` | `#B45309` | `#FBBF24` | Warning text/icons |
| `--state-danger` | `#DC2626` | `#F87171` | Error/destructive |
| `--state-info` | `#2563EB` | `#60A5FA` | Informational |

## 3. Tailwind mapping

| Utility | Token |
|---|---|
| `bg-base` | `--bg-base` |
| `bg-surface` | `--bg-surface` |
| `bg-card` / `bg-card-hover` | `--bg-card` / `--bg-card-hover` |
| `bg-inset` | `--bg-inset` |
| `bg-overlay` | `--overlay` |
| `text-foreground` | `--text-primary` |
| `text-foreground-secondary` | `--text-secondary` |
| `text-foreground-muted` | `--text-muted` |
| `border-line` | `--border-subtle` |
| `border-line-strong` | `--border-strong` |
| `border-line-control` | `--border-control` |
| `text-success` / `text-warning` / `text-danger` / `text-info` | state tokens |
| `bg-brand` / `text-brand` / `text-brand-ink` | brand tokens |

All mappings use `rgb(var(--token) / <alpha-value>)`, so
`bg-surface/80`, `bg-overlay/50` and `border-line/60` work.

## 4. Contrast matrix

Measured from the actual CSS by `npm run check:contrast`:

| Pair | Light | Dark | Minimum |
|---|---|---|---|
| primary on base | 17.10:1 | 15.28:1 | 4.5 |
| primary on surface | 17.85:1 | 16.68:1 | 4.5 |
| secondary on base | 9.92:1 | 10.93:1 | 4.5 |
| secondary on surface | 10.35:1 | 11.93:1 | 4.5 |
| muted on base | 4.56:1 | 6.34:1 | 4.5 |
| muted on surface | 4.76:1 | 6.93:1 | 4.5 |
| control border on base | 4.56:1 | 6.34:1 | 3.0 |
| control border on surface | 4.76:1 | 6.93:1 | 3.0 |
| brand-ink on brand | 17.48:1 | 17.48:1 | 4.5 |

`--text-muted` in light mode is intentionally at the AA floor (4.56:1). The
future Outdoor/Sunlight mode will raise it to ≥ 7:1 and force opaque surfaces.

State colours (`success`, `warning`, `danger`, `info`) are also checked on both
base and surface in both themes. The dark `--bg-inset` has a separation floor
from `--bg-surface` (currently 1.22:1) so skeletons, chips and hover states
remain visible; that separation is enforced by the gate even though WCAG does
not model it.

## 5. Theme resolution

`src/lib/theme.ts` is the single resolver used by the pre-paint script and the
React provider:

```
localStorage('baliwild_theme') > prefers-color-scheme > light
```

- An explicit choice wins and is persisted.
- With no stored choice, the app follows the OS and keeps following it until the
  guest chooses.
- `.dark` on `<html>` remains the only theme switch. `color-scheme` is kept in
  sync so native controls match.

## 6. Migration plan

| Step | Scope | Visual change |
|---|---|---|
| **PR1** | Tokens, Tailwind mapping, resolver, contrast gate, docs | None; components keep their existing classes |
| **PR2** | Button, BottomSheet, cards, header, skeleton, calendar, time-slot, stepper, currency/language controls → semantic utilities | Done; verified by the design smoke test |
| **PR2b (this)** | Page-level raw utilities migrated; 24 global `!important` overrides removed; base canvas and native controls use tokens | Done; 0 `!important`, `check:theme` guard green |
| **PR3** | Home/PDP quick wins, mobile cards, cookie banner, PDP CTA | Intentional |
| **PR4** | Outdoor/Sunlight mode (AAA, opaque), admin token adoption, docs v4 | Intentional |

PR2b removed the 24 global `!important` overrides. The base canvas and native
controls now use tokens without important rules. `npm run check:theme` fails if
a legacy palette utility returns. Translucent white overlays
(`bg-white/5`–`bg-white/25`) are intentionally allowed because they sit on dark
or brand surfaces; they are not theme surfaces.

The migration touched **1,308 occurrences across 71 files**. Raw dark fills such
as `bg-neutral-900` and `text-white` remain where the design is explicitly
theme-independent (dark buttons, image overlays, footer).

## 7. Guardrails

- Never add `--accent-yellow`; use `--brand`.
- Never use `text-brand` on `bg-base` or `bg-surface` in light mode.
- Never put text at `opacity` below 100%; use `text-foreground-muted` instead.
- Control boundaries (inputs, buttons, focus rings) use `border-line-control`,
  not `border-line`.
- Every new token pair must be added to `scripts/check-contrast.mjs`.
- Do not reintroduce `bg-white`, `text-gray-*`, `border-neutral-*`, or the old
  green/red palettes. `npm run check:theme` fails the build if they return.

## 8. Verify

```bash
npm run check:contrast   # WCAG gate
npm run check:theme      # no legacy palette utilities
npm run lint
npm run typecheck
npm test
npm run build
```

Both guards also run in `.github/workflows/ci.yml`.
