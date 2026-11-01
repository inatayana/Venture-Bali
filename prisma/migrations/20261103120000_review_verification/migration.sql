-- Verified reviews: link a review to the booking it came from, and reserve a
-- photos column for guest images (rendered once storage is configured).

ALTER TABLE "Review" ADD COLUMN "bookingId" TEXT;
ALTER TABLE "Review" ADD COLUMN "photos" JSONB NOT NULL DEFAULT '[]';

CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
