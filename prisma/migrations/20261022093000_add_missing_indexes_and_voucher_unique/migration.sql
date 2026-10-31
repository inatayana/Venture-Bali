-- Reconcile the database with the current Prisma schema.
--
-- The `Venture` model in prisma/schema.prisma was missing `createdAt` and
-- `updatedAt` while the table, the TypeScript types (src/types/venture.ts) and
-- the seed script all expected them. The schema has been corrected, so the
-- columns already exist and only the indexes below are still outstanding.
--
-- `Voucher.bookingId` was migrated as a plain index; the schema declares it as
-- `@unique` because a booking can only ever have one voucher.

-- CreateIndex
CREATE INDEX "Article_slug_idx" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Booking_bookingCode_idx" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Venture_slug_idx" ON "Venture"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_bookingId_key" ON "Voucher"("bookingId");
