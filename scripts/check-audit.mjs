#!/usr/bin/env node
/**
 * Dependency audit gate.
 *
 * `npm audit` reports every advisory, including ones that cannot be cleared on
 * the current major. Next 14.x is end-of-life, so its package-level advisory
 * only disappears with the Next 15/16 upgrade. This gate stays useful: it
 * fails on any NEW high/critical advisory while the known residuals below are
 * explicitly allowlisted and documented.
 *
 * Keep this list narrow. Every entry is reviewed when the Next upgrade lands.
 */
import { execSync } from 'node:child_process';

const ALLOWED = new Map([
  ['next', 'Next 14.x is EOL; fixed in 15.5.28/16.4.1. Scheduled before VPS migration.'],
  ['zod', 'No non-breaking 3.x fix; public arrays are bounded in the API schemas.'],
  ['postcss', 'Bundled inside Next 14; fixed by the Next major upgrade.'],
]);

function readAudit() {
  // `npm run` leaks lifecycle config into child npm processes. Strip the two
  // settings that either disable the audit or make nested npm refuse to run.
  const env = { ...process.env, npm_config_audit: 'true' };
  delete env.npm_config_allow_scripts;
  delete env.NPM_CONFIG_ALLOW_SCRIPTS;

  try {
    return execSync('npm audit --omit=dev --json', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 32 * 1024 * 1024,
      env,
    });
  } catch (error) {
    // npm audit exits non-zero when it finds vulnerabilities; the JSON is on stdout.
    const stdout = error?.stdout?.toString?.() ?? '';
    if (stdout.trim()) return stdout;
    throw error;
  }
}

let report;
try {
  report = JSON.parse(readAudit());
} catch (error) {
  console.error(
    'Could not read npm audit output:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}

const vulnerabilities = Object.entries(report.vulnerabilities ?? {});
const blocking = [];
const allowed = [];

for (const [name, info] of vulnerabilities) {
  const severity = info?.severity;
  if (severity !== 'critical' && severity !== 'high') continue;

  const titles = (info.via ?? [])
    .map((entry) => (typeof entry === 'string' ? entry : entry?.title))
    .filter(Boolean);

  if (ALLOWED.has(name)) {
    allowed.push({ name, severity, reason: ALLOWED.get(name) });
  } else {
    blocking.push({ name, severity, titles });
  }
}

if (allowed.length > 0) {
  console.log('Allowlisted residual advisories:');
  for (const row of allowed) {
    console.log(`  - ${row.name} (${row.severity}): ${row.reason}`);
  }
}

if (blocking.length > 0) {
  console.error('New high/critical advisories require action:');
  for (const row of blocking) {
    console.error(`  - ${row.name} (${row.severity})`);
    for (const title of row.titles) console.error(`      ${title}`);
  }
  process.exit(1);
}

const counts = report.metadata?.vulnerabilities ?? {};
console.log(
  `Audit gate passed. Total: ${counts.total ?? 0} ` +
    `(critical ${counts.critical ?? 0}, high ${counts.high ?? 0}, ` +
    `moderate ${counts.moderate ?? 0}, low ${counts.low ?? 0}).`,
);
