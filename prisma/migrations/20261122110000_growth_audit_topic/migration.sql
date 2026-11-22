-- Growth audit trail: link every AuditEvent to the GrowthTopic that produced it,
-- and expose the content-hash lookup used by the producer.
--
-- Safety: the growth tables were empty when this migration was written
-- (verified 2026-11-22: AuditEvent = 0 rows), so the NOT NULL column can be
-- added without a backfill. If that ever changes, add the column as nullable,
-- backfill, then set NOT NULL.

ALTER TABLE "AuditEvent" ADD COLUMN "topicId" TEXT NOT NULL;

CREATE INDEX "ContentVersion_contentHash_idx" ON "ContentVersion"("contentHash");

ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "GrowthTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
