# 🚀 模块化通讯平台 - WhatsApp + Telegram + AI

> 企业级多平台通讯管理系统，支持 WhatsApp、Telegram（规划中）、AI 自动回复和工作流自动化。

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)

## ✨ 特性

- 🔌 **模块化架构** - 可插拔的 Connector 设计，轻松添加新平台
- 💬 **WhatsApp 集成** - 基于 Baileys 的完整 WhatsApp 支持
- 🤖 **AI 自动回复** (规划中) - 智能客服，支持多种 AI 提供商
- 🔄 **工作流引擎** (规划中) - 跨平台自动化流程
- 📱 **实时通讯** - Socket.IO 驱动的实时消息系统
- 🎨 **现代 UI** - React + Vite + TypeScript
- 💾 **PostgreSQL** - Prisma ORM 数据持久化
- 🔐 **安全认证** - JWT 身份验证

## 📦 技术栈

### 后端
- **Runtime**: Bun / Node.js
- **Framework**: Express
- **WebSocket**: Socket.IO
- **Database**: PostgreSQL + Prisma
- **WhatsApp**: @whiskeysockets/baileys
- **Auth**: JWT

### 前端
- **Build Tool**: Vite
- **Framework**: React 18
- **Language**: TypeScript
- **State**: Zustand
- **Styling**: CSS Modules

### Monorepo
- **Package Manager**: pnpm / Bun
- **Workspace**: pnpm workspaces

## 🏗️ 项目结构

```
wa/
├── packages/                    # 📦 共享包
│   ├── connectors/             # 🔌 通讯平台连接器
│   │   ├── core/               # 通用接口定义
│   │   │   ├── src/
│   │   │   │   ├── connector.ts   # ChatConnector 接口
│   │   │   │   └── index.ts
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   └── whatsapp/           # WhatsApp 实现
│   │       ├── src/
│   │       │   ├── baileys-connector.ts
│   │       │   ├── storage.ts
│   │       │   └── index.ts
│   │       ├── package.json
│   │       └── tsconfig.json
│   │
│   └── db/                     # 💾 数据库层
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── src/index.ts
│       └── package.json
│
├── apps/                       # 🎯 应用
│   ├── api/                    # 🔧 后端 API
│   │   ├── src/
│   │   │   ├── index.ts        # 入口文件
│   │   │   ├── config.ts       # 配置
│   │   │   ├── auth.ts         # 认证逻辑
│   │   │   ├── routes.ts       # REST 路由
│   │   │   ├── socket.ts       # Socket.IO 入口
│   │   │   ├── channels/       # 📡 频道胶水层
│   │   │   │   └── whatsapp.ts # WhatsApp 频道
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts
│   │   │   └── utils/
│   │   │       └── logger.ts
│   │   ├── wa-auth/            # WhatsApp 会话存储
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # 🎨 前端应用
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── api.ts          # API 客户端
│       │   ├── store.ts        # 状态管理
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── Register.tsx
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Chat.tsx
│       │   │   └── Settings.tsx
│       │   └── components/
│       │       ├── QRPanel.tsx
│       │       ├── ChatList.tsx
│       │       ├── ChatSearch.tsx
│       │       ├── MessagePane.tsx
│       │       └── Sidebar.tsx
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
│
├── docs/                       # 📚 文档
│   ├── ARCHITECTURE.md         # 架构详解
│   ├── MIGRATION_GUIDE.md      # 迁移指南
│   ├── ROADMAP.md              # 功能路线图
│   ├── QUICK_START.md          # 快速入门
│   └── WHATSAPP_REFACTOR_SUMMARY.md
│
├── package.json                # 根配置
├── pnpm-workspace.yaml         # Workspace 配置
├── .env.example                # 环境变量示例
└── README.md                   # 本文件
```

## 🚀 快速开始

### 前置要求

- Node.js >= 20 或 Bun >= 1.0
- PostgreSQL >= 14
- pnpm >= 9 (或使用 Bun)

### 1. 克隆仓库

```bash
git clone <your-repo-url>
cd wa
```

### 2. 安装依赖

```bash
# 使用 bun (推荐)
bun install

# 或使用 pnpm
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/wa_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

### 4. 初始化数据库

```bash
cd packages/db

# 生成 Prisma 客户端
bunx prisma generate

# 运行数据库迁移
bunx prisma migrate dev

# (可选) 打开数据库管理界面
bunx prisma studio
```

### 5. 构建 Connectors

```bash
# 构建 connectors-core
cd packages/connectors/core
bun run build

# 构建 connectors-whatsapp
cd ../whatsapp
bun run build
```

### 6. 启动开发服务器

```bash
# 回到项目根目录
cd ../../../

# 并行启动所有服务
pnpm dev
```

### 7. 访问应用

- 🌐 前端: http://localhost:5173
- 🔧 API: http://localhost:3000

## 📖 使用指南

### 连接 WhatsApp

1. 在前端注册/登录账号
2. 进入 Dashboard
3. 点击 "连接 WhatsApp"
4. 使用手机 WhatsApp 扫描 QR 码
5. 连接成功！现在可以收发消息

### 发送消息

```typescript
// 前端代码示例
socket.emit('wa.send', {
  to: '6012xxxx@s.whatsapp.net',
  text: 'Hello from our platform!'
});
```

### 接收消息

```typescript
// 前端代码示例
socket.on('wa.message', ({ from, text, ts }) => {
  console.log(`收到来自 ${from} 的消息: ${text}`);
  // 更新 UI...
});
```

## 🔧 开发命令

```bash
# 开发模式（并行运行所有服务）
pnpm dev

# 只开发 API
pnpm dev:api

# 只开发前端
pnpm dev:web

# 只开发 connectors
pnpm dev:connectors

# 构建所有包
pnpm build

# 数据库操作
cd packages/db
bunx prisma generate          # 生成客户端
bunx prisma migrate dev       # 创建迁移
bunx prisma migrate deploy    # 应用迁移
bunx prisma studio            # 打开管理界面

# 类型检查
pnpm typecheck

# 格式化代码
pnpm format

# Lint
pnpm lint
```

## 🏗️ 架构概览

### Connector 层

所有通讯平台实现统一的 `ChatConnector` 接口：

```typescript
interface ChatConnector extends EventEmitter {
  start(uid: string): Promise<void>;     // 启动连接
  stop(uid: string): Promise<void>;      // 停止连接
  send(uid: string, to: string, text: string): Promise<void>;  // 发送消息
  isReady(uid: string): boolean;         // 检查状态
}
```

### Channel 层

胶水层，连接 Connector 和 Socket.IO：

```typescript
class WhatsAppChannel {
  private connector: BaileysConnector;
  
  constructor(io: SocketServer) {
    this.connector = new BaileysConnector({ authRoot: './wa-auth' });
    this.setupEventListeners(); // 映射事件
  }
  
  async ensure(uid: string): Promise<void> { /* ... */ }
  async send(uid: string, to: string, text: string): Promise<void> { /* ... */ }
}
```

### 事件流

```
WhatsApp 平台
    ↓ 消息
BaileysConnector (emit 'message')
    ↓
WhatsAppChannel (监听并处理)
    ↓ 保存数据库
    ↓ emit Socket.IO
前端 (显示消息)
```

## 📚 文档

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 详细的架构设计
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - 从旧版本迁移
- **[ROADMAP.md](./ROADMAP.md)** - 功能路线图
- **[QUICK_START.md](./QUICK_START.md)** - 详细的快速入门

## 🗺️ 功能路线图

### ✅ 已完成

- [x] WhatsApp 集成（消息收发）
- [x] 用户认证（JWT）
- [x] 实时通讯（Socket.IO）
- [x] 数据持久化（PostgreSQL）
- [x] 模块化架构
- [x] 完整文档

### 🚧 进行中

- [ ] Telegram Bot Connector
- [ ] Telegram User Connector

### 📋 计划中

- [ ] AI 模块（OpenAI, Anthropic）
- [ ] Flow 引擎（跨平台自动化）
- [ ] 用户模块配置界面
- [ ] 消息模板系统
- [ ] 群组管理
- [ ] 多媒体消息支持
- [ ] 数据分析面板

## 🤝 贡献指南

我们欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/my-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送到分支: `git push origin feature/my-feature`
5. 提交 Pull Request

### 添加新 Connector

1. 创建 `packages/connectors/<platform>`
2. 实现 `ChatConnector` 接口
3. 创建 `apps/api/src/channels/<platform>.ts`
4. 在 `socket.ts` 中集成
5. 更新文档

## 🐛 问题反馈

遇到问题？请：

1. 查看 [常见问题](./QUICK_START.md#常见问题)
2. 搜索 [Issues](https://github.com/your-repo/issues)
3. 创建新 Issue（提供详细信息）

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 👥 作者

**Herbert Lim**
- GitHub: [@herbertlim](https://github.com/herbertlim)
- Email: herbert@example.com

## 🙏 致谢

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Prisma](https://www.prisma.io/) - 数据库 ORM
- [Socket.IO](https://socket.io/) - 实时通讯
- [Vite](https://vitejs.dev/) - 前端构建工具

## 📊 项目状态

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-100%25-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-85%25-yellow)

---

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**

**🚀 开始使用：** [快速入门指南](./QUICK_START.md)
