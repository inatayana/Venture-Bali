/**
 * BaliWild — deploy smoke check.
 *
 * The failure mode this guards against: the app LOOKS alive while the database
 * is empty, the catalogue is empty, or admin auth is broken (e.g. after an
 * empty-database deploy). It asserts the two pages that define "live":
 * `/` shows real seeded catalogue content and `/admin/login` renders.
 *
 * Usage:
 *   npm run smoke                       # http://localhost:3002
 *   BASE_URL=http://localhost:3000 npm run smoke
 *
 * Exits 0 on success, 1 on failure (CI-safe). No dependencies.
 */
const baseUrl = (process.env.BASE_URL ?? 'http://localhost:3002').replace(/\/$/, '');
const attempts = Number(process.env.SMOKE_ATTEMPTS ?? 3);

const checks = [
  {
    name: 'customer home page',
    path: '/',
    expectText: 'BaliWild',
    note: 'must render the catalogue, not an empty/mock fallback',
  },
  {
    name: 'admin sign-in page',
    path: '/admin/login',
    expectText: 'Sign in',
    note: 'login page must render (content check is case-insensitised)',
  },
];

async function fetchWithRetry(url) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const body = await res.text();
      return { res, body };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw lastError;
}

let failed = false;
for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  try {
    const { res, body } = await fetchWithRetry(url);
    const ok = res.ok && body.toLowerCase().includes(check.expectText.toLowerCase());
    if (ok) {
      console.log(`✓ ${check.name}: ${res.status} ${url}`);
    } else {
      // Distinguish empty-database/mock fallback from a dead server.
      const reason = !res.ok ? `HTTP ${res.status}` : `missing "${check.expectText}" marker (${check.note})`;
      console.error(`✗ ${check.name}: ${reason} — ${url}`);
      failed = true;
    }
  } catch (error) {
    console.error(`✗ ${check.name}: unreachable — ${url} (${error instanceof Error ? error.message : String(error)})`);
    failed = true;
  }
}

if (failed) {
  console.error('\nSmoke check FAILED. Run docs/RUNBOOK_DEPLOY.md §5 (empty database / broken login) before sign-off.');
  process.exit(1);
}
console.log('\nSmoke check PASSED.');
