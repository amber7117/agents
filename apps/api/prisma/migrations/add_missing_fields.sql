-- 确保UserAgentBinding表有所有必要字段
ALTER TABLE "UserAgentBinding" 
ADD COLUMN IF NOT EXISTS "triggerKeywords" TEXT[],
ADD COLUMN IF NOT EXISTS "contextTags" TEXT[],
ADD COLUMN IF NOT EXISTS "modelOverride" TEXT;

-- 确保ModuleSettings表存在
CREATE TABLE IF NOT EXISTS "ModuleSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ModuleSettings_pkey" PRIMARY KEY ("id")
);

-- 确保UserModule表存在
CREATE TABLE IF NOT EXISTS "UserModule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserModule_pkey" PRIMARY KEY ("id")
);

-- 添加索引
CREATE INDEX IF NOT EXISTS "ModuleSettings_userId_idx" ON "ModuleSettings"("userId");
CREATE INDEX IF NOT EXISTS "UserModule_userId_module_idx" ON "UserModule"("userId", "module");
