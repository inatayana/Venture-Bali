-- Persist the customer service agent conversations.
--
-- The agent previously kept its state in an in-memory Map, which is lost on
-- every serverless cold start and is not shared between instances. This
-- table stores the session so the agent keeps its context between turns.

-- CreateTable
CREATE TABLE "AgentSession" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'id',
    "userId" TEXT,
    "phone" TEXT,
    "productId" TEXT,
    "variantId" TEXT,
    "paxCount" INTEGER,
    "bookingDate" TEXT,
    "intent" TEXT,
    "history" JSONB NOT NULL DEFAULT '[]',
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentSession_sessionKey_key" ON "AgentSession"("sessionKey");

-- CreateIndex
CREATE INDEX "AgentSession_channel_idx" ON "AgentSession"("channel");

-- CreateIndex
CREATE INDEX "AgentSession_lastActiveAt_idx" ON "AgentSession"("lastActiveAt");
