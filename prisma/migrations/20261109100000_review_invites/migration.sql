-- Founding-guest review invites.
CREATE TYPE "ReviewInviteStatus" AS ENUM ('UNUSED', 'SUBMITTED', 'EXPIRED');

CREATE TABLE "ReviewInvite" (
  "id" TEXT NOT NULL,
  "ventureId" TEXT NOT NULL,
  "guestName" TEXT,
  "guestCountryCode" TEXT,
  "status" "ReviewInviteStatus" NOT NULL DEFAULT 'UNUSED',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewInvite_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Review" ADD COLUMN "inviteId" TEXT;
ALTER TABLE "Review" ALTER COLUMN "customerId" DROP NOT NULL;

CREATE UNIQUE INDEX "Review_inviteId_key" ON "Review"("inviteId");
CREATE INDEX "ReviewInvite_ventureId_status_idx" ON "ReviewInvite"("ventureId", "status");
CREATE INDEX "ReviewInvite_expiresAt_idx" ON "ReviewInvite"("expiresAt");

ALTER TABLE "ReviewInvite"
  ADD CONSTRAINT "ReviewInvite_ventureId_fkey"
  FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_inviteId_fkey"
  FOREIGN KEY ("inviteId") REFERENCES "ReviewInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
