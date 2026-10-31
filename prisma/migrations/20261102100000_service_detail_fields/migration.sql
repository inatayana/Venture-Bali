-- Service-detail layout data.
--
-- Ventures gain structured safety requirements (min age / max weight / briefing)
-- and variants gain their own inclusions, exclusions and an enforceable minimum
-- spend, so the package matrix can render the Airbnb-style detail cards without
-- inventing copy in the UI.

-- AlterTable
ALTER TABLE "Venture"
    ADD COLUMN "minAge" INTEGER,
    ADD COLUMN "maxWeightKg" INTEGER,
    ADD COLUMN "safetyBriefing" TEXT;

-- AlterTable
ALTER TABLE "Variant"
    ADD COLUMN "inclusions" JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN "exclusions" JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN "minimumSpendIdr" INTEGER;
