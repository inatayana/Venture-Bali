-- Product detail gallery & meeting point.
--
-- Ventures now expose the exact base-camp / meeting point (name + coordinates)
-- for self-drive guests, and variants can own a gallery image so selecting a
-- package synchronises the hero image on the left-column gallery.

-- AlterTable
ALTER TABLE "Venture"
    ADD COLUMN "meetingPoint" TEXT,
    ADD COLUMN "meetingPointLat" DOUBLE PRECISION,
    ADD COLUMN "meetingPointLng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN "imageUrl" TEXT;
