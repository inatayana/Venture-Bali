#!/usr/bin/env node
/**
 * Theme utility guard.
 *
 * The theme migration replaced raw palette utilities that depended on the old
 * global !important overrides. This guard prevents them from creeping back in.
 *
 * Translucent white overlays (bg-white/5, /10, /15, /20, /25) are allowed:
 * they sit on dark or brand surfaces by design.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

const BANNED = [
  /\bbg-white(?!\/)/,
  /\bbg-white\/9[05]\b/,
  /\bbg-(?:gray|neutral)-(?:50|100|200)\b/,
  /\btext-(?:gray|neutral)-(?:300|400|500|600|700|800|900)\b/,
  /\btext-black\b/,
  /\bborder-(?:gray|neutral)-(?:50|100|200|300|400|900)\b/,
  /\bbg-green-50\b/,
  /\btext-green-(?:700|800)\b/,
  /\bbg-red-50\b/,
  /\btext-red-(?:600|700)\b/,
];

const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
}
walk(src);

const violations = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const pattern of BANNED) {
      if (pattern.test(line)) {
        violations.push(
          `${relative(root, file)}:${index + 1}: ${line.trim().slice(0, 160)}`,
        );
        break;
      }
    }
  });
}

if (violations.length > 0) {
  console.error('Legacy theme utilities found. Use semantic tokens instead:');
  for (const violation of violations) console.error(`  ${violation}`);
  console.error(
    '\nAllowed: bg-surface, bg-base, bg-inset, bg-line, text-foreground, ' +
      'text-foreground-secondary, text-foreground-muted, border-line, ' +
      'border-line-strong, border-line-control.',
  );
  process.exit(1);
}

console.log(`Theme utility guard passed (${files.length} files).`);
