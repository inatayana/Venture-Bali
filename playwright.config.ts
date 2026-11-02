import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 3300);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const externalServer = Boolean(process.env.E2E_BASE_URL);
const channel =
  process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : 'chrome');

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // The money-path test writes to the database, so keep the files serial.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(channel ? { channel } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: externalServer
    ? undefined
    : {
        command: `npm run start -- -p ${port}`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          DATABASE_URL: process.env.DATABASE_URL ?? '',
          DIRECT_URL: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
          MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY ?? '',
          MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY ?? '',
          MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION ?? 'false',
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? baseURL,
          ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET ?? '',
          CUSTOMER_LINK_SECRET: process.env.CUSTOMER_LINK_SECRET ?? '',
          CRON_SECRET: process.env.CRON_SECRET ?? '',
          BOOKING_HOLD_MINUTES: process.env.BOOKING_HOLD_MINUTES ?? '10',
        },
      },
});
