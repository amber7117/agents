# WhatsApp 封装重构文档

## 📋 概述

本次重构将 WhatsApp 功能模块化，创建了可复用的 Connector 层架构，为后续添加 Telegram、AI、Flow 等模块打下基础。

## 🏗️ 新架构设计

```
packages/
├── connectors/
│   ├── core/                    # 通用连接器接口
│   │   ├── src/
│   │   │   ├── connector.ts     # ChatConnector 接口定义
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── whatsapp/                # WhatsApp 实现
│       ├── src/
│       │   ├── baileys-connector.ts  # Baileys 实现
│       │   ├── storage.ts            # 会话存储管理
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
└── db/
    └── prisma/
        └── schema.prisma        # 新增 UserModule, ChannelSession

apps/
└── api/
    └── src/
        ├── channels/
        │   └── whatsapp.ts      # WhatsApp 胶水层
        └── socket.ts            # 重构后的 Socket.IO 集成
```

## 🎯 核心组件说明

### 1. **ChatConnector 接口** (`packages/connectors/core`)

定义了所有聊天平台必须实现的通用接口：

```typescript
export interface ChatConnector extends EventEmitter {
  start(uid: string): Promise<void>;      // 启动连接
  stop(uid: string): Promise<void>;       // 停止连接
  send(uid: string, to: string, text: string): Promise<void>;  // 发送消息
  isReady(uid: string): boolean;          // 检查连接状态
}
```

**事件类型：**
- `qr` - QR 码生成
- `ready` - 连接就绪
- `status` - 状态变化 (connecting/open/closed/reconnecting)
- `message` - 收到消息
- `error` - 错误事件

### 2. **BaileysConnector** (`packages/connectors/whatsapp`)

实现 WhatsApp 功能的具体类：

**特性：**
- ✅ 自动重连机制（最多 5 次）
- ✅ 会话持久化存储
- ✅ QR 码扫描登录
- ✅ 消息收发
- ✅ 联系人/群组同步
- ✅ 消息状态追踪

**存储路径：**
```
apps/api/wa-auth/user-<uid>/
  ├── creds.json
  ├── app-state-sync-*.json
  └── pre-key-*.json
```

### 3. **WhatsAppChannel** (`apps/api/src/channels/whatsapp.ts`)

胶水层，负责：
1. 连接 BaileysConnector 和 Socket.IO
2. 映射事件（保持前端兼容）
3. 更新数据库（ChannelSession, Message, Contact, Chat）

**事件映射：**
```
Connector Event     →  Socket.IO Event
─────────────────────────────────────
'qr'               →  'wa.qr'
'ready'            →  'wa.ready'
'status'           →  'wa.status'
'message'          →  'wa.message'
'error'            →  'wa.error'
```

### 4. **数据库模型** (`packages/db/prisma/schema.prisma`)

#### UserModule（用户模块配置）
```prisma
model UserModule {
  id          String   @id @default(cuid())
  userId      String   @unique
  waEnabled   Boolean  @default(true)   // WhatsApp 启用
  tgEnabled   Boolean  @default(false)  // Telegram 启用
  aiEnabled   Boolean  @default(false)  // AI 启用
  flowEnabled Boolean  @default(false)  // Flow 启用
}
```

#### ChannelSession（频道会话状态）
```prisma
model ChannelSession {
  id            String    @id @default(cuid())
  userId        String
  channel       Channel   // WA | TG
  state         String    // 'waiting_qr' | 'open' | 'closed' | 'reconnecting'
  deviceLabel   String?
  lastQRAt      DateTime?
  lastConnected DateTime?
  
  @@unique([userId, channel])
}
```

## 🔄 工作流程

### 用户连接流程
```
1. 前端连接 Socket.IO (带 JWT token)
   ↓
2. socket.ts: 验证 token，提取 uid
   ↓
3. waChannel.ensure(uid)
   ↓
4. BaileysConnector.start(uid)
   ↓
5a. 无会话 → 生成 QR 码 → emit 'wa.qr'
5b. 有会话 → 自动登录 → emit 'wa.ready'
```

### 消息接收流程
```
1. WhatsApp 收到消息
   ↓
2. Baileys 触发 'messages.upsert'
   ↓
3. BaileysConnector emit 'message'
   ↓
4. WhatsAppChannel 监听到 'message'
   ↓
5a. 保存到数据库 (Contact, Chat, Message)
5b. emit Socket.IO 'wa.message' → 前端
```

### 消息发送流程
```
1. 前端 emit 'wa.send' { to, text }
   ↓
2. socket.ts 监听到事件
   ↓
3. waChannel.send(uid, to, text)
   ↓
4. BaileysConnector.send() → Baileys
   ↓
5. 保存到数据库 (OUTGOING)
```

## 📦 依赖关系

```
apps/api
  ├── @pkg/connectors-core (workspace)
  ├── @pkg/connectors-whatsapp (workspace)
  └── @pkg/db (workspace)

@pkg/connectors-whatsapp
  ├── @pkg/connectors-core (workspace)
  └── @whiskeysockets/baileys (^6.7.8)

@pkg/connectors-core
  └── (无外部依赖)
```

## 🚀 开发命令

```bash
# 并行开发模式（connectors + api + web）
pnpm dev

# 只开发 connectors
pnpm dev:connectors

# 只开发 API
pnpm dev:api

# 只开发 Web
pnpm dev:web

# 构建所有包
pnpm build

# 数据库迁移
cd packages/db
bunx prisma migrate dev --name <migration_name>
bunx prisma generate
```

## 🔌 扩展性设计

### 添加 Telegram Connector

1. 创建 `packages/connectors/telegram`
2. 实现 `ChatConnector` 接口
3. 创建 `apps/api/src/channels/telegram.ts` 胶水层
4. 在 `socket.ts` 中初始化 TelegramChannel
5. 前端 emit/listen `tg.*` 事件

### 添加 AI 模块

1. 创建 `packages/modules/ai`
2. 定义 AI 配置（API Key, 模型选择）
3. 实现上下文管理（每用户独立）
4. 在 Channel 层集成 AI 回复

### 添加 Flow 模块

1. 创建 `packages/modules/flow`
2. 定义 Flow DSL（JSON/YAML）
3. 实现 Flow Engine（状态机）
4. 连接多个 Channel（WA ↔ TG）

## ✅ 前端兼容性

**无需修改前端代码！** 所有 Socket.IO 事件名称保持不变：

- `wa.qr` - QR 码
- `wa.ready` - 连接就绪
- `wa.status` - 状态更新
- `wa.message` - 收到消息
- `wa.send` - 发送消息

## 🔧 配置文件

### tsconfig.json (connectors)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "declaration": true
  }
}
```

### tsup.config.ts (构建配置)
```typescript
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});
```

## 🐛 故障排查

### 问题：连接失败
1. 检查 `wa-auth/user-<uid>` 目录是否存在
2. 查看 `creds.json` 是否完整
3. 检查 Baileys 版本兼容性

### 问题：数据库错误
1. 运行 `bunx prisma generate`
2. 运行 `bunx prisma migrate dev`
3. 检查 DATABASE_URL 环境变量

### 问题：TypeScript 错误
1. `bun install` 重新安装依赖
2. 重启 TypeScript server
3. 检查 workspace 链接

## 📈 性能优化

- ✅ 事件驱动架构（非阻塞）
- ✅ 会话持久化（减少重连）
- ✅ 数据库批量操作
- ✅ Socket.IO room 隔离

## 🔒 安全考虑

- ✅ JWT 验证
- ✅ 用户会话隔离
- ✅ 凭证文件权限控制
- ✅ Socket.IO CORS 配置

## 📝 下一步计划

1. ✅ **完成 WhatsApp 封装**
2. ⏳ 添加 Telegram Bot Connector
3. ⏳ 添加 Telegram User Connector
4. ⏳ 实现 AI 模块（上下文管理）
5. ⏳ 实现 Flow 模块（跨平台工作流）
6. ⏳ 用户设置界面（模块开关）

## 🤝 贡献指南

添加新 Connector 的步骤：

1. 创建 `packages/connectors/<platform>`
2. 实现 `ChatConnector` 接口
3. 编写 `storage.ts`（如需要）
4. 创建 `apps/api/src/channels/<platform>.ts`
5. 在 `socket.ts` 中集成
6. 添加数据库模型（如需要）
7. 更新文档

---

**版本：** 1.0.0  
**最后更新：** 2025-11-07  
**维护者：** Herbert Lim
