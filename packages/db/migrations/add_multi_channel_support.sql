-- AlterTable: 添加多频道支持
ALTER TABLE "channel_sessions" ADD COLUMN "channelId" TEXT;
ALTER TABLE "channel_sessions" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "channel_sessions" ADD COLUMN "name" TEXT;
ALTER TABLE "channel_sessions" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 为现有数据生成 channelId (如果有的话)
UPDATE "channel_sessions" 
SET "channelId" = channel || '-' || EXTRACT(EPOCH FROM "updatedAt")::TEXT
WHERE "channelId" IS NULL;

-- 设置 channelId 为必填
ALTER TABLE "channel_sessions" ALTER COLUMN "channelId" SET NOT NULL;

-- 删除旧的唯一约束
ALTER TABLE "channel_sessions" DROP CONSTRAINT IF EXISTS "channel_sessions_userId_channel_key";

-- 添加新的唯一约束
ALTER TABLE "channel_sessions" ADD CONSTRAINT "channel_sessions_userId_channelId_key" UNIQUE ("userId", "channelId");

-- 添加索引
CREATE INDEX IF NOT EXISTS "channel_sessions_userId_channel_idx" ON "channel_sessions"("userId", "channel");
