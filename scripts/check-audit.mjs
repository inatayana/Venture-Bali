#!/usr/bin/env node
/**
 * Dependency audit gate.
 *
 * `npm audit` reports every advisory, including ones that cannot be cleared on
 * the current major. Next 14.x is end-of-life, so its package-level advisory
 * only disappears with the Next 15/16 upgrade.
 *
 * The accepted residual is recorded advisory-by-advisory in
 * `scripts/audit-baseline.json`. This gate fails when:
 *   - a high/critical package is not in the baseline,
 *   - a package severity increases, or
 *   - a new high/critical advisory appears for a baseline package.
 *
 * When the Next upgrade lands, regenerate the baseline and prune it. Do not add
 * entries without a dated decision in docs/TECH_DECISION_LOG.md.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEVERITY_RANK = { low: 1, moderate: 2, high: 3, critical: 4 };
const BASELINE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  'audit-baseline.json',
);

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
    // npm audit exits non-zero when it finds vulnerabilities; JSON is on stdout.
    const stdout = error?.stdout?.toString?.() ?? '';
    if (stdout.trim()) return stdout;
    throw error;
  }
}

function notableAdvisories(info) {
  return (info.via ?? []).filter(
    (entry) =>
      typeof entry === 'object' &&
      entry?.url &&
      (entry.severity === 'high' || entry.severity === 'critical'),
  );
}

let report;
let baseline;
try {
  report = JSON.parse(readAudit());
  baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
} catch (error) {
  console.error(
    'Could not evaluate the dependency audit:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}

const blocking = [];
const allowed = [];

for (const [name, info] of Object.entries(report.vulnerabilities ?? {})) {
  const severity = info?.severity;
  if (severity !== 'critical' && severity !== 'high') continue;

  const expected = baseline.packages?.[name];
  const advisories = notableAdvisories(info);
  const urls = [...new Set(advisories.map((entry) => entry.url))];

  if (!expected) {
    blocking.push({
      name,
      severity,
      reason: 'package is not in the accepted baseline',
      urls,
    });
    continue;
  }

  const reasons = [];
  if (SEVERITY_RANK[severity] > SEVERITY_RANK[expected.severity]) {
    reasons.push(`severity increased from ${expected.severity}`);
  }

  const unknown = urls.filter((url) => !expected.advisories.includes(url));
  if (unknown.length > 0) {
    reasons.push(`new high/critical advisory: ${unknown.join(', ')}`);
  }

  if (reasons.length > 0) {
    blocking.push({
      name,
      severity,
      reason: reasons.join('; '),
      urls: unknown.length > 0 ? unknown : urls,
    });
  } else {
    allowed.push({ name, severity, count: urls.length });
  }
}

const prunable = Object.keys(baseline.packages ?? {}).filter(
  (name) => !report.vulnerabilities?.[name],
);
if (prunable.length > 0) {
  console.log(`Baseline entries no longer reported (prune them): ${prunable.join(', ')}`);
}

if (blocking.length > 0) {
  console.error('New or worsened high/critical advisories require action:');
  for (const row of blocking) {
    console.error(`  - ${row.name} (${row.severity}): ${row.reason}`);
    for (const url of row.urls) console.error(`      ${url}`);
  }
  process.exit(1);
}

console.log('Accepted residual advisories:');
for (const row of allowed) {
  console.log(`  - ${row.name} (${row.severity}, ${row.count} advisory entries)`);
}

const counts = report.metadata?.vulnerabilities ?? {};
console.log(
  `Audit gate passed. Total: ${counts.total ?? 0} ` +
    `(critical ${counts.critical ?? 0}, high ${counts.high ?? 0}, ` +
    `moderate ${counts.moderate ?? 0}, low ${counts.low ?? 0}).`,
);
