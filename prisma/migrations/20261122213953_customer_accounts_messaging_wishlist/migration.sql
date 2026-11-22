-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('CUSTOMER_ADMIN', 'CUSTOMER_VENDOR', 'CUSTOMER_CUSTOMER', 'BOOKING_THREAD');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('OWNER', 'MEMBER', 'OBSERVER');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('CUSTOMER', 'ADMIN', 'VENDOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'BOOKING_ACTION', 'SYSTEM_NOTE', 'REVIEW_REQUEST');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "AuthAttemptType" AS ENUM ('MAGIC_LINK_REQUEST', 'MAGIC_LINK_VERIFY', 'PASSWORD_LOGIN', 'PASSWORD_RESET', 'LOGOUT');

-- Rename old NotificationType (EMAIL, WHATSAPP, SMS) to NotificationChannel
-- Then create new NotificationType with new values
DO $$
BEGIN
    -- Rename old NotificationType to NotificationChannel if it exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
        ALTER TYPE "NotificationType" RENAME TO "NotificationChannel";
    END IF;
    
    -- Create NotificationChannel if it doesn't exist (after rename or fresh)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationChannel') THEN
        CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'PUSH', 'IN_APP');
    END IF;
    
    -- Create new NotificationType with new values
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
        CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMED', 'PAYMENT_RECEIVED', 'BOOKING_REMINDER_24H', 'BOOKING_REMINDER_2H', 'REVIEW_REQUEST', 'MESSAGE_RECEIVED', 'PROMO', 'SYSTEM', 'VOUCHER_READY', 'REFUND_PROCESSED', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED');
    END IF;
END $$;

-- AlterEnum
ALTER TYPE "NotificationStatus" ADD VALUE 'READ';

-- DropForeignKey
ALTER TABLE "ContentAsset" DROP CONSTRAINT "ContentAsset_currentVersionId_fkey";

-- DropIndex
DROP INDEX "NotificationLog_type_idx";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'IDR',
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lifetimeValue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'id',
ADD COLUMN     "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "phoneVerified" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Makassar';

-- AlterTable
ALTER TABLE "NotificationLog" DROP COLUMN "type",
ADD COLUMN     "channel" "NotificationChannel" NOT NULL;

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Adventures',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "variantId" TEXT,
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'CUSTOMER_ADMIN',
    "subject" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "customerId" TEXT,
    "adminUserId" TEXT,
    "vendorId" TEXT,
    "role" "ParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "lastReadAt" TIMESTAMP(3),
    "notificationPreferences" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" "MessageSender" NOT NULL DEFAULT 'CUSTOMER',
    "customerId" TEXT,
    "adminUserId" TEXT,
    "vendorId" TEXT,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channels" "NotificationChannel"[],
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "data" JSONB NOT NULL DEFAULT '{}',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAttempt" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "email" TEXT NOT NULL,
    "type" "AuthAttemptType" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_shareToken_key" ON "Wishlist"("shareToken");

-- CreateIndex
CREATE INDEX "Wishlist_customerId_idx" ON "Wishlist"("customerId");

-- CreateIndex
CREATE INDEX "Wishlist_tenantId_idx" ON "Wishlist"("tenantId");

-- CreateIndex
CREATE INDEX "Wishlist_shareToken_idx" ON "Wishlist"("shareToken");

-- CreateIndex
CREATE INDEX "WishlistItem_wishlistId_idx" ON "WishlistItem"("wishlistId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_wishlistId_ventureId_variantId_key" ON "WishlistItem"("wishlistId", "ventureId", "variantId");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_status_idx" ON "Conversation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_type_idx" ON "Conversation"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_conversationId_idx" ON "ConversationParticipant"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_customerId_idx" ON "ConversationParticipant"("customerId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_adminUserId_idx" ON "ConversationParticipant"("adminUserId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_vendorId_idx" ON "ConversationParticipant"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_customerId_key" ON "ConversationParticipant"("conversationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_adminUserId_key" ON "ConversationParticipant"("conversationId", "adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_vendorId_key" ON "ConversationParticipant"("conversationId", "vendorId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderType_customerId_idx" ON "Message"("senderType", "customerId");

-- CreateIndex
CREATE INDEX "Message_senderType_adminUserId_idx" ON "Message"("senderType", "adminUserId");

-- CreateIndex
CREATE INDEX "Message_senderType_vendorId_idx" ON "Message"("senderType", "vendorId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_customerId_status_createdAt_idx" ON "Notification"("tenantId", "customerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_tenantId_type_status_idx" ON "Notification"("tenantId", "type", "status");

-- CreateIndex
CREATE INDEX "AuthAttempt_customerId_idx" ON "AuthAttempt"("customerId");

-- CreateIndex
CREATE INDEX "AuthAttempt_email_idx" ON "AuthAttempt"("email");

-- CreateIndex
CREATE INDEX "AuthAttempt_createdAt_idx" ON "AuthAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "Customer_lastLoginAt_idx" ON "Customer"("lastLoginAt");

-- CreateIndex
CREATE INDEX "NotificationLog_channel_idx" ON "NotificationLog"("channel");

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthAttempt" ADD CONSTRAINT "AuthAttempt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;