#!/usr/bin/env node
/**
 * Local money-path E2E runner.
 *
 * Creates an isolated database inside the shared `baligo-pg-ci` Postgres
 * container, applies migrations, seeds, builds, runs Playwright, then drops the
 * database. It never touches the team's `baligo_test` database.
 *
 * Usage:
 *   npm run test:e2e
 *   E2E_SKIP_BUILD=1 npm run test:e2e   # reuse the existing .next build
 */
import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const npx = isWindows ? 'npx.cmd' : 'npx';
const container = process.env.E2E_PG_CONTAINER ?? 'baligo-pg-ci';
const dbName = `baliwild_e2e_${Date.now()}`;
const dbUrl = `postgresql://postgres:postgres@127.0.0.1:55432/${dbName}?schema=public`;

const env = {
  ...process.env,
  DATABASE_URL: dbUrl,
  DIRECT_URL: dbUrl,
  MIDTRANS_SERVER_KEY: 'test-server-key',
  MIDTRANS_CLIENT_KEY: 'test-client-key',
  MIDTRANS_IS_PRODUCTION: 'false',
  NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3300',
  ADMIN_SESSION_SECRET: 'e2e-admin-session-secret-32-chars',
  CUSTOMER_LINK_SECRET: 'e2e-customer-link-secret-32-chars',
  CRON_SECRET: 'e2e-cron-secret-32-chars',
  BOOKING_HOLD_MINUTES: '10',
  E2E_PORT: process.env.E2E_PORT ?? '3300',
  PLAYWRIGHT_CHANNEL: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
    ...options,
  });

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
  }
  return result.status;
}

function runNpm(command, args, options = {}) {
  return run(command, args, { shell: true, ...options });
}

let created = false;

try {
  console.log(`[e2e] creating isolated database ${dbName}`);
  run('docker', [
    'exec',
    container,
    'psql',
    '-U',
    'postgres',
    '-c',
    `CREATE DATABASE "${dbName}"`,
  ]);
  created = true;

  runNpm(npx, ['prisma', 'migrate', 'deploy']);
  runNpm(npm, ['run', 'db:seed']);

  if (process.env.E2E_SKIP_BUILD !== '1') {
    runNpm(npm, ['run', 'build']);
  }

  runNpm(npx, ['playwright', 'test']);
} finally {
  if (created) {
    console.log(`[e2e] dropping ${dbName}`);
    run(
      'docker',
      [
        'exec',
        container,
        'psql',
        '-U',
        'postgres',
        '-c',
        `DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`,
      ],
      { allowFailure: true },
    );
  }
}
