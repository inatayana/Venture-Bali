-- Guest review profile: let the reviewer choose the name and location shown
-- publicly, while the review stays tied to a verified booking. Nullable so
-- existing reviews keep using the booking customer's name/country.

ALTER TABLE "Review" ADD COLUMN "guestName" TEXT;
ALTER TABLE "Review" ADD COLUMN "guestLocation" TEXT;
