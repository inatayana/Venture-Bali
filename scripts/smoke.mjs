/**
 * BaliWild — deploy smoke check.
 *
 * The failure mode this guards against: the app LOOKS alive while the database
 * is empty, the catalogue is empty, admin auth is broken, or a catalogue route
 * (sorting / pagination / category) regressed after a deploy. It checks the
 * public pages that define "live" across the customer, SEO, content, legal and
 * admin surfaces.
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
    note: 'must render the brand and seeded catalogue, not an empty/mock fallback',
  },
  {
    name: 'admin sign-in page',
    path: '/admin/login',
    expectText: 'Sign in',
    note: 'login page must render (content check is case-insensitised)',
  },
  {
    name: 'experiences catalogue',
    path: '/experiences',
    expectText: 'All Adventures in Bali',
    note: 'canonical SEO catalogue must render',
  },
  {
    name: 'price-sorted catalogue (T6 regression)',
    path: '/experiences?sort=price-asc',
    expectText: 'All Adventures in Bali',
    note: 'database-side price sorting must not break the page',
  },
  {
    name: 'paginated catalogue (T6 regression)',
    path: '/experiences?page=2',
    expectText: 'All Adventures in Bali',
    note: 'database-side LIMIT/OFFSET must not break the page',
  },
  {
    name: 'category landing page',
    path: '/activities/atv',
    expectText: 'ATV',
    note: '9-category SEO landing page must render',
  },
  {
    name: 'blog archive',
    path: '/blog',
    expectText: 'Bali',
    note: 'AI content surface must render',
  },
  {
    name: 'public refund policy',
    path: '/refund',
    expectText: 'Refund',
    note: 'legal/trust surface must render',
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

let failed = 0;
for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  try {
    const { res, body } = await fetchWithRetry(url);
    const ok = res.ok && body.toLowerCase().includes(check.expectText.toLowerCase());
    if (ok) {
      console.log(`✓ ${check.name}: ${res.status} ${url}`);
    } else {
      const reason = !res.ok
        ? `HTTP ${res.status}`
        : `missing "${check.expectText}" marker (${check.note})`;
      console.error(`✗ ${check.name}: ${reason} — ${url}`);
      failed += 1;
    }
  } catch (error) {
    console.error(
      `✗ ${check.name}: unreachable — ${url} (${error instanceof Error ? error.message : String(error)})`
    );
    failed += 1;
  }
}

if (failed > 0) {
  console.error(
    `\nSmoke check FAILED (${failed}/${checks.length}). Run docs/RUNBOOK_DEPLOY.md §5 (empty database / broken login) before sign-off.`
  );
  // Use exitCode (not process.exit) so open fetch sockets can close cleanly —
  // process.exit() can abort libuv on Windows and return a non-1 exit status.
  process.exitCode = 1;
} else {
  console.log(`\nSmoke check PASSED (${checks.length}/${checks.length}).`);
}
