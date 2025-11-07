# 迁移指南：从旧架构到新模块化架构

## 🎯 变更概述

本次重构将 WhatsApp 功能从 `WARegistry` 迁移到模块化的 Connector 架构，为后续添加 Telegram、AI、Flow 等功能做准备。

## 📋 迁移步骤

### 1. 安装依赖

```bash
# 安装所有依赖（包括新的 connector 包）
bun install

# 或使用 pnpm
pnpm install
```

### 2. 构建 Connector 包

```bash
# 构建 connectors-core
cd packages/connectors/core
bun run build

# 构建 connectors-whatsapp
cd ../whatsapp
bun run build
```

### 3. 数据库迁移

```bash
cd packages/db

# 生成 Prisma 客户端
bunx prisma generate

# 创建迁移
bunx prisma migrate dev --name add_module_and_channel_session

# 或者直接推送到数据库（开发环境）
bunx prisma db push
```

### 4. 环境变量检查

确保 `.env` 文件包含以下变量：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/wa_db"
JWT_SECRET="your-jwt-secret"
CORS_ORIGIN="http://localhost:5173"
PORT=3000
```

### 5. 启动开发服务器

```bash
# 在项目根目录
pnpm dev

# 或分别启动
pnpm dev:connectors  # 启动 connectors 监听模式
pnpm dev:api         # 启动 API 服务器
pnpm dev:web         # 启动前端开发服务器
```

## 🔄 代码变更对比

### 旧架构 (apps/api/src/socket.ts)

```typescript
// ❌ 旧代码
import { WARegistry } from './wa/manager';

const registry = new WARegistry(io);
await registry.startForUser(uid);
await registry.send(uid, payload.to, payload.text);
```

### 新架构 (apps/api/src/socket.ts)

```typescript
// ✅ 新代码
import { WhatsAppChannel } from './channels/whatsapp';

const waChannel = new WhatsAppChannel(io);
await waChannel.init();
await waChannel.ensure(uid);
await waChannel.send(uid, payload.to, payload.text);
```

## 📁 文件变更

### 新增文件

```
packages/connectors/core/
  ├── src/connector.ts          # ChatConnector 接口
  ├── src/index.ts
  ├── package.json
  ├── tsconfig.json
  └── tsup.config.ts

packages/connectors/whatsapp/
  ├── src/baileys-connector.ts  # Baileys 实现
  ├── src/storage.ts            # 存储管理
  ├── src/index.ts
  ├── package.json
  ├── tsconfig.json
  └── tsup.config.ts

apps/api/src/channels/
  └── whatsapp.ts               # 胶水层
```

### 修改文件

```
✏️ packages/db/prisma/schema.prisma   # 新增 UserModule, ChannelSession
✏️ apps/api/src/socket.ts             # 使用新的 WhatsAppChannel
✏️ apps/api/package.json              # 添加 connector 依赖
✏️ package.json                        # 更新 dev 脚本
```

### 保留但不再使用的文件

```
⚠️ apps/api/src/wa/manager.ts         # 旧的 WARegistry (可以删除或保留作为参考)
⚠️ apps/api/src/wa/types.ts           # 旧的类型定义 (可以删除)
```

## 🔧 数据库变更

### 新增表

#### `user_modules`
存储用户的模块配置：
```sql
CREATE TABLE "user_modules" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL,
  "waEnabled" BOOLEAN DEFAULT true,
  "tgEnabled" BOOLEAN DEFAULT false,
  "aiEnabled" BOOLEAN DEFAULT false,
  "flowEnabled" BOOLEAN DEFAULT false,
  "updatedAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

#### `channel_sessions`
存储频道会话状态：
```sql
CREATE TABLE "channel_sessions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "channel" TEXT NOT NULL, -- 'WA' | 'TG'
  "state" TEXT NOT NULL,
  "deviceLabel" TEXT,
  "lastQRAt" TIMESTAMP,
  "lastConnected" TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  UNIQUE("userId", "channel"),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

### 修改表

`User` 表新增关联：
```prisma
model User {
  // ... 现有字段
  modules         UserModule?
  channelSessions ChannelSession[]
}
```

## ✅ 验证迁移

### 1. 检查包构建

```bash
# 检查 connectors-core
ls -la packages/connectors/core/dist/
# 应该看到: index.js, index.d.ts, connector.d.ts

# 检查 connectors-whatsapp
ls -la packages/connectors/whatsapp/dist/
# 应该看到: index.js, index.d.ts, baileys-connector.d.ts, storage.d.ts
```

### 2. 检查数据库

```bash
cd packages/db
bunx prisma studio
# 打开浏览器查看新增的表
```

### 3. 测试 API

```bash
# 启动 API
cd apps/api
bun run dev

# 在另一个终端测试
curl http://localhost:3000/health
```

### 4. 测试前端连接

```bash
# 启动前端
cd apps/web
bun run dev

# 打开浏览器访问 http://localhost:5173
# 尝试登录并连接 WhatsApp
```

## 🐛 常见问题

### Q1: `Cannot find module '@pkg/connectors-core'`

**解决方案：**
```bash
# 重新安装依赖
rm -rf node_modules
bun install

# 构建 connector 包
cd packages/connectors/core && bun run build
cd ../whatsapp && bun run build
```

### Q2: Prisma Client 错误

**解决方案：**
```bash
cd packages/db
bunx prisma generate
bunx prisma migrate dev
```

### Q3: TypeScript 类型错误

**解决方案：**
```bash
# 清理并重新构建
cd packages/connectors/core
rm -rf dist
bun run build

cd ../whatsapp
rm -rf dist
bun run build

# 重启 TypeScript server (在 VSCode 中)
# Command + Shift + P → "TypeScript: Restart TS Server"
```

### Q4: Socket.IO 连接失败

**解决方案：**
1. 检查 JWT_SECRET 是否配置
2. 检查 CORS_ORIGIN 是否正确
3. 查看浏览器控制台错误
4. 查看服务器日志

### Q5: WhatsApp QR 码不显示

**解决方案：**
1. 检查 `wa-auth/user-<uid>` 目录权限
2. 删除旧的会话文件重试：`rm -rf apps/api/wa-auth/user-<uid>`
3. 查看服务器日志中的 Baileys 错误

## 🚀 性能优化建议

### 开发环境

1. **使用 watch 模式**
   ```bash
   # 并行运行所有 watch 模式
   pnpm dev
   ```

2. **启用 Bun 的热重载**
   ```bash
   # 在 apps/api/package.json
   "dev": "bun --watch --hot src/index.ts"
   ```

### 生产环境

1. **构建优化**
   ```bash
   # 构建所有包
   pnpm build
   
   # 启动生产服务器
   NODE_ENV=production bun apps/api/dist/index.js
   ```

2. **数据库连接池**
   ```typescript
   // 在 packages/db/src/index.ts
   export const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
     log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
   });
   ```

## 📚 后续步骤

1. **测试现有功能**
   - [ ] 用户注册/登录
   - [ ] WhatsApp QR 扫码
   - [ ] 发送/接收消息
   - [ ] 联系人同步
   - [ ] 聊天列表

2. **清理旧代码**
   ```bash
   # 确认新架构工作正常后，删除旧文件
   rm -rf apps/api/src/wa/manager.ts
   rm -rf apps/api/src/wa/types.ts
   ```

3. **添加新功能**
   - 参考 `ARCHITECTURE.md` 中的扩展性设计
   - 添加 Telegram Connector
   - 添加 AI 模块
   - 添加 Flow 模块

## 🎓 学习资源

- [Baileys 文档](https://github.com/WhiskeySockets/Baileys)
- [Prisma 文档](https://www.prisma.io/docs)
- [Socket.IO 文档](https://socket.io/docs/v4/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bun 文档](https://bun.sh/docs)

## 💡 提示

- 保持 connectors 层独立（不依赖 Prisma）
- 胶水层负责数据库操作
- 使用 TypeScript 严格模式
- 编写单元测试
- 记录 API 变更

---

**需要帮助？** 查看 `ARCHITECTURE.md` 或提交 Issue。
