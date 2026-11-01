# BaliWild — Fonts

The font files in this folder are **committed to the repository** and served
from our own origin.

## Why self-host?

`next/font/google` downloads font files **during `next build`**. When that
request fails — an offline build machine, a flaky network, a blocked
request — the entire production build fails. Self-hosting:

- removes the external build-time dependency,
- avoids a request to Google from every visitor's browser (privacy),
- makes builds reproducible and faster,
- keeps the exact same rendering, because these are the same files Google
  serves.

## Files

| File | Family | Weights | Type | Source |
|------|--------|---------|------|--------|
| `barlow-condensed-latin-600.woff2` | Barlow Condensed | 600 | static | Google Fonts |
| `barlow-condensed-latin-700.woff2` | Barlow Condensed | 700 | static | Google Fonts |
| `plus-jakarta-sans-latin-variable.woff2` | Plus Jakarta Sans | 200–800 | variable | Google Fonts |

`manifest.json` is generated and records the weight range of each file.

Barlow Condensed is served as static instances because Google does not
expose a variable file for the 600/700 pair the design system uses.
Plus Jakarta Sans is a variable font, so one file covers every weight.

## Licence

Both families are licensed under the **SIL Open Font License 1.1**:

- Barlow Condensed — © 2017 The Barlow Project
- Plus Jakarta Sans — © 2020 The Plus Jakarta Sans Project

The OFL permits bundling and self-hosting. If a family is ever replaced,
keep the licence and attribution with the files.

## How to update

The fonts are wired up in `src/styles/fonts.ts` with `next/font/local`.
To change a family, drop the new file in this folder, register it in
`src/styles/fonts.ts`, and update the table above.
