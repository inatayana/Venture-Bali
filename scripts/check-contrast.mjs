#!/usr/bin/env node
/**
 * Design-token contrast gate.
 *
 * Reads the semantic tokens from src/styles/globals.css and checks the pairs
 * that matter for legibility. No dependency, no build step: the same file that
 * ships to the browser is the source of truth.
 *
 * Thresholds:
 * - body text: 4.5:1 (WCAG AA)
 * - control borders: 3:1 (WCAG 1.4.11)
 *
 * Brand yellow is intentionally never checked as text on a light surface: it is
 * only valid as a background with brand-ink, or as text on the dark base.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = join(root, 'src', 'styles', 'globals.css');
const css = readFileSync(cssPath, 'utf8');

const TEXT_MIN = 4.5;
const UI_MIN = 3;

function blockFor(selector) {
  const marker = `\n  ${selector} {`;
  let start = css.indexOf(marker);
  if (start === -1) start = css.indexOf(`${selector} {`);
  if (start === -1) {
    throw new Error(`Could not find the ${selector} block in globals.css`);
  }

  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  if (open === -1 || close === -1) {
    throw new Error(`Unclosed ${selector} block in globals.css`);
  }
  return css.slice(open + 1, close);
}

function readTokens(selector) {
  const tokens = {};
  const pattern = /--([a-z0-9-]+):\s*([0-9]+)\s+([0-9]+)\s+([0-9]+)\s*;/gi;

  for (const match of blockFor(selector).matchAll(pattern)) {
    tokens[match[1]] = [Number(match[2]), Number(match[3]), Number(match[4])];
  }
  return tokens;
}

function channelToLuminance([r, g, b]) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const first = channelToLuminance(a);
  const second = channelToLuminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const rootTokens = readTokens(':root');
const themes = {
  light: rootTokens,
  // Dark inherits the brand tokens from :root; merge so inherited values are
  // checked too.
  dark: { ...rootTokens, ...readTokens('.dark') },
};

const pairs = [
  ['light', 'text-primary on bg-base', 'text-primary', 'bg-base', TEXT_MIN],
  ['light', 'text-primary on bg-surface', 'text-primary', 'bg-surface', TEXT_MIN],
  ['light', 'text-secondary on bg-base', 'text-secondary', 'bg-base', TEXT_MIN],
  ['light', 'text-secondary on bg-surface', 'text-secondary', 'bg-surface', TEXT_MIN],
  ['light', 'text-muted on bg-base', 'text-muted', 'bg-base', TEXT_MIN],
  ['light', 'text-muted on bg-surface', 'text-muted', 'bg-surface', TEXT_MIN],
  ['light', 'border-control on bg-base', 'border-control', 'bg-base', UI_MIN],
  ['light', 'border-control on bg-surface', 'border-control', 'bg-surface', UI_MIN],
  ['light', 'brand-ink on brand', 'brand-ink', 'brand', TEXT_MIN],
  ['light', 'button-secondary fg on bg', 'button-secondary-foreground', 'button-secondary', TEXT_MIN],
  ['light', 'button-secondary fg on hover', 'button-secondary-foreground', 'button-secondary-hover', TEXT_MIN],
  ['light', 'button-secondary fg on active', 'button-secondary-foreground', 'button-secondary-active', TEXT_MIN],
  ['dark', 'text-primary on bg-base', 'text-primary', 'bg-base', TEXT_MIN],
  ['dark', 'text-primary on bg-surface', 'text-primary', 'bg-surface', TEXT_MIN],
  ['dark', 'text-secondary on bg-base', 'text-secondary', 'bg-base', TEXT_MIN],
  ['dark', 'text-secondary on bg-surface', 'text-secondary', 'bg-surface', TEXT_MIN],
  ['dark', 'text-muted on bg-base', 'text-muted', 'bg-base', TEXT_MIN],
  ['dark', 'text-muted on bg-surface', 'text-muted', 'bg-surface', TEXT_MIN],
  ['dark', 'border-control on bg-base', 'border-control', 'bg-base', UI_MIN],
  ['dark', 'border-control on bg-surface', 'border-control', 'bg-surface', UI_MIN],
  ['dark', 'brand-ink on brand', 'brand-ink', 'brand', TEXT_MIN],
  ['dark', 'button-secondary fg on bg', 'button-secondary-foreground', 'button-secondary', TEXT_MIN],
  ['dark', 'button-secondary fg on hover', 'button-secondary-foreground', 'button-secondary-hover', TEXT_MIN],
  ['dark', 'button-secondary fg on active', 'button-secondary-foreground', 'button-secondary-active', TEXT_MIN],
];

for (const theme of ['light', 'dark']) {
  for (const state of ['state-success', 'state-warning', 'state-danger', 'state-info']) {
    pairs.push([theme, `${state} on bg-base`, state, 'bg-base', TEXT_MIN]);
    pairs.push([theme, `${state} on bg-surface`, state, 'bg-surface', TEXT_MIN]);
  }
}

const invalid = new Set();
function validateChannels(selector) {
  const pattern = /--([a-z0-9-]+):\s*([^;]+);/gi;
  for (const match of blockFor(selector).matchAll(pattern)) {
    const value = match[2].trim();
    if (!/^\d+\s+\d+\s+\d+$/.test(value)) {
      invalid.add(`${selector} --${match[1]} = ${value}`);
    }
  }
}
validateChannels(':root');
validateChannels('.dark');

const missing = new Set();
const rows = [];

for (const [theme, label, foreground, background, minimum] of pairs) {
  const tokens = themes[theme];
  if (!tokens[foreground]) missing.add(`${theme}:--${foreground}`);
  if (!tokens[background]) missing.add(`${theme}:--${background}`);
  if (!tokens[foreground] || !tokens[background]) continue;

  const ratio = contrast(tokens[foreground], tokens[background]);
  rows.push({ theme, label, ratio, minimum, pass: ratio >= minimum });
}

// A surface that collapses into the surface behind it makes skeletons, chips
// and hover states disappear. WCAG does not model this, so give it a floor.
const separations = [
  ['dark', 'bg-inset vs bg-surface', 'bg-inset', 'bg-surface', 1.15],
  ['dark', 'bg-card-hover vs bg-card', 'bg-card-hover', 'bg-card', 1.15],
];

for (const [theme, label, foreground, background, minimum] of separations) {
  const tokens = themes[theme];
  if (!tokens[foreground]) missing.add(`${theme}:--${foreground}`);
  if (!tokens[background]) missing.add(`${theme}:--${background}`);
  if (!tokens[foreground] || !tokens[background]) continue;

  const ratio = contrast(tokens[foreground], tokens[background]);
  rows.push({ theme, label, ratio, minimum, pass: ratio >= minimum });
}

for (const row of rows) {
  console.log(
    `${row.theme.padEnd(5)} ${row.label.padEnd(34)} ` +
      `${row.ratio.toFixed(2).padStart(6)}:1  min ${row.minimum.toFixed(2)}  ` +
      `${row.pass ? 'PASS' : 'FAIL'}`,
  );
}

if (missing.size > 0) {
  console.error(`\nMissing tokens: ${[...missing].join(', ')}`);
}
if (invalid.size > 0) {
  console.error(`\nNon-channel tokens: ${[...invalid].join(', ')}`);
  console.error('Tokens must be space-separated RGB channels, never hex.');
}

const failures = rows.filter((row) => !row.pass);
if (failures.length > 0 || missing.size > 0 || invalid.size > 0) {
  console.error(
    `\nContrast gate failed (${failures.length + missing.size + invalid.size} issue(s)).`,
  );
  process.exit(1);
}

console.log('\nContrast gate passed.');
