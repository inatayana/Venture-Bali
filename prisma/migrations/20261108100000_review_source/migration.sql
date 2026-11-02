-- Review source: verified booking, founding guest, or imported real review.
CREATE TYPE "ReviewSource" AS ENUM ('VERIFIED_BOOKING', 'FOUNDING_GUEST', 'IMPORTED');

ALTER TABLE "Review"
  ADD COLUMN "source" "ReviewSource" NOT NULL DEFAULT 'VERIFIED_BOOKING';

CREATE INDEX "Review_source_idx" ON "Review"("source");
