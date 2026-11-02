import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';

const prisma = new PrismaClient();
const serverKey = process.env.MIDTRANS_SERVER_KEY;

test.beforeAll(async () => {
  await prisma.$connect();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

function futureDate(days = 7): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

test('health endpoint reports the database as ready', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data.checks.database.status).toBe('ok');
});

test('home and product detail render', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const card = page.locator('[data-testid^="venture-card-"]').first();
  await expect(card).toBeVisible();

  // The production optimizer needs sharp; a missing binary renders broken
  // images even though the markup is present.
  const image = card.locator('img').first();
  await expect(image).toBeVisible();
  await expect
    .poll(async () => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0);

  await card.locator('a').first().click();

  await expect(page).toHaveURL(/\/experiences\/[^/]+\/[^/]+/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('booking -> signed Midtrans webhook -> paid voucher', async ({
  page,
  request,
}) => {
  expect(serverKey, 'MIDTRANS_SERVER_KEY must be set for the e2e run').toBeTruthy();

  const variant = await prisma.variant.findFirst({
    where: {
      fulfillmentMode: 'SELF_DRIVE',
      priceTiers: { some: {} },
      slotTimes: { some: { isAvailable: true, maxCapacity: { gt: 2 } } },
    },
    include: { slotTimes: true },
    orderBy: { createdAt: 'asc' },
  });

  expect(variant, 'seed data must contain a bookable SELF_DRIVE variant').not.toBeNull();
  const slot = variant!.slotTimes.find(
    (candidate) => candidate.isAvailable && candidate.maxCapacity > 2,
  );
  expect(slot).toBeDefined();

  const blackouts = Array.isArray(variant!.blackoutDates)
    ? (variant!.blackoutDates as string[])
    : [];
  const bookingDate = Array.from({ length: 60 }, (_, index) =>
    futureDate(index + 7),
  ).find((date) => !blackouts.includes(date));
  expect(bookingDate).toBeDefined();

  const bookingResponse = await request.post('/api/booking', {
    data: {
      ventureId: variant!.ventureId,
      variantId: variant!.id,
      bookingDate: bookingDate!,
      slotTimeId: slot!.id,
      fulfillmentMode: 'SELF_DRIVE',
      paxCount: 2,
      selectedAddons: [],
      customerName: 'E2E Guest',
      customerEmail: `e2e-${Date.now()}@example.com`,
      customerWhatsApp: '+628123456789',
      countryCode: 'ID',
      termsAccepted: true,
      waiverAccepted: true,
    },
  });

  expect(bookingResponse.status()).toBe(201);
  const bookingBody = await bookingResponse.json();
  const booking = bookingBody.data.booking as {
    id: string;
    bookingCode: string;
    totalPrice: number;
    paymentStatus: string;
  };

  expect(booking.paymentStatus).toBe('PENDING');
  expect(booking.totalPrice).toBeGreaterThan(0);

  // The Snap token endpoint needs live Midtrans credentials. The webhook path
  // is the part that moves money, so create the pending Payment row directly.
  const orderId = `E2E-${booking.id}`;
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      midtransOrderId: orderId,
      grossAmount: booking.totalPrice,
      status: 'PENDING',
    },
  });

  const statusCode = '200';
  const grossAmount = String(booking.totalPrice);
  const signatureKey = createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex');

  const webhookResponse = await request.post('/api/webhooks/midtrans', {
    data: {
      order_id: orderId,
      status_code: statusCode,
      status_message: 'midtrans payment notification',
      transaction_status: 'settlement',
      payment_type: 'qris',
      fraud_status: 'accept',
      gross_amount: grossAmount,
      transaction_time: new Date().toISOString(),
      transaction_id: `txn-${booking.id}`,
      merchant_id: 'e2e-merchant',
      signature_key: signatureKey,
    },
  });

  expect(webhookResponse.status()).toBe(200);
  const webhookBody = await webhookResponse.json();
  expect(webhookBody.data.paymentStatus).toBe('PAID');
  expect(webhookBody.data.voucherIssued).toBe(true);

  const detailResponse = await request.get(`/api/booking/${booking.id}`);
  const detailBody = await detailResponse.json();
  expect(detailBody.data.paymentStatus).toBe('PAID');
  expect(detailBody.data.voucher.status).toBe('ACTIVE');
  expect(detailBody.data.qrCodeDataUrl).toContain('data:image/svg+xml;base64,');

  await page.goto(`/voucher/${booking.id}`);
  await expect(page.getByText('Paid', { exact: false }).first()).toBeVisible();
  await expect(page.getByText(booking.bookingCode, { exact: false }).first()).toBeVisible();
});
