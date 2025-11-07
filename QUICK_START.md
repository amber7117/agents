# 快速入门指南

## 🎉 欢迎！

恭喜您成功完成 WhatsApp 模块化封装！本指南将帮助您快速开始使用新架构。

## 📦 项目结构

```
wa/
├── packages/
│   ├── connectors/          # 📡 通讯平台连接器
│   │   ├── core/           # 通用接口定义
│   │   └── whatsapp/       # WhatsApp 实现
│   └── db/                 # 💾 数据库层
│
├── apps/
│   ├── api/                # 🔧 后端 API
│   │   └── src/
│   │       ├── channels/   # 胶水层
│   │       └── socket.ts   # Socket.IO 入口
│   └── web/                # 🎨 前端界面
│
└── 📄 文档
    ├── ARCHITECTURE.md     # 架构详解
    ├── MIGRATION_GUIDE.md  # 迁移指南
    ├── ROADMAP.md          # 路线图
    └── QUICK_START.md      # 本文件
```

## 🚀 快速启动（5 分钟）

### 步骤 1: 安装依赖

```bash
# 安装所有依赖
bun install
```

### 步骤 2: 配置环境变量

创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/wa_db"

# JWT 密钥
JWT_SECRET="your-super-secret-jwt-key-change-this"

# 服务器配置
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

### 步骤 3: 初始化数据库

```bash
cd packages/db

# 生成 Prisma 客户端
bunx prisma generate

# 运行数据库迁移
bunx prisma migrate dev

# (可选) 打开数据库管理界面
bunx prisma studio
```

### 步骤 4: 构建 Connectors

```bash
# 构建 connectors-core
cd packages/connectors/core
bun run build

# 构建 connectors-whatsapp
cd ../whatsapp
bun run build
```

### 步骤 5: 启动开发服务器

```bash
# 回到项目根目录
cd ../../../

# 并行启动所有服务
pnpm dev

# 或分别启动：
# Terminal 1: pnpm dev:api
# Terminal 2: pnpm dev:web
```

## ✅ 验证安装

### 1. 检查 API 服务器

打开浏览器访问：
- API Health: http://localhost:3000/health
- 应该返回：`{ "status": "ok" }`

### 2. 检查前端

打开浏览器访问：
- Web App: http://localhost:5173
- 应该看到登录页面

### 3. 测试 WhatsApp 连接

1. 在前端注册/登录账号
2. 进入 Dashboard
3. 点击 "连接 WhatsApp"
4. 扫描 QR 码
5. 连接成功后可以收发消息

## 🔧 常用命令

### 开发

```bash
# 并行开发模式（推荐）
pnpm dev

# 只开发 API
pnpm dev:api

# 只开发前端
pnpm dev:web

# 只开发 connectors
pnpm dev:connectors
```

### 构建

```bash
# 构建所有包
pnpm build

# 单独构建
cd packages/connectors/core && bun run build
cd packages/connectors/whatsapp && bun run build
cd apps/api && bun run build
cd apps/web && bun run build
```

### 数据库

```bash
cd packages/db

# 生成客户端
bunx prisma generate

# 创建迁移
bunx prisma migrate dev --name <migration_name>

# 应用迁移
bunx prisma migrate deploy

# 重置数据库
bunx prisma migrate reset

# 打开数据库管理界面
bunx prisma studio
```

### 测试

```bash
# 运行测试（待实现）
pnpm test

# 类型检查
pnpm typecheck

# 代码格式化
pnpm format

# Lint
pnpm lint
```

## 📚 核心概念

### 1. Connector（连接器）

连接器是与外部通讯平台交互的抽象层。

```typescript
// 所有连接器都实现这个接口
interface ChatConnector {
  start(uid: string): Promise<void>;
  stop(uid: string): Promise<void>;
  send(uid: string, to: string, text: string): Promise<void>;
  isReady(uid: string): boolean;
}
```

### 2. Channel（频道）

频道是连接器和 Socket.IO 之间的胶水层。

```typescript
// WhatsApp 频道示例
const waChannel = new WhatsAppChannel(io);
await waChannel.init();
await waChannel.ensure(uid);  // 确保连接
await waChannel.send(uid, to, text);  // 发送消息
```

### 3. 事件流

```
WhatsApp 平台
    ↓ 消息
BaileysConnector (emit 'message')
    ↓
WhatsAppChannel (监听 'message')
    ↓ 保存到数据库
    ↓ emit Socket.IO 'wa.message'
前端 (显示消息)
```

## 🎯 使用示例

### 示例 1: 接收 WhatsApp 消息

```typescript
// apps/api/src/channels/whatsapp.ts

this.connector.on('message', ({ uid, from, text, ts }) => {
  console.log(`收到来自 ${from} 的消息: ${text}`);
  
  // 转发到前端
  this.io.to(uid).emit('wa.message', { from, text, ts });
  
  // 保存到数据库
  this.saveMessage(uid, {
    contactWhatsappId: from,
    direction: 'INCOMING',
    content: text,
    sentAt: new Date(ts),
  });
});
```

### 示例 2: 发送 WhatsApp 消息

```typescript
// apps/api/src/socket.ts

socket.on('wa.send', async (payload: { to: string; text: string }) => {
  try {
    await waChannel.send(uid, payload.to, payload.text);
    console.log(`消息已发送到 ${payload.to}`);
  } catch (err) {
    console.error('发送失败:', err);
    socket.emit('wa.error', { error: err.message });
  }
});
```

### 示例 3: 检查连接状态

```typescript
// 在任何地方
if (waChannel.isReady(uid)) {
  console.log('WhatsApp 已连接');
} else {
  console.log('WhatsApp 未连接');
}
```

## 🐛 常见问题

### Q: TypeScript 报错找不到 @pkg/connectors-core

**A:** 构建 connector 包

```bash
cd packages/connectors/core && bun run build
cd ../whatsapp && bun run build
```

### Q: Prisma Client 报错

**A:** 重新生成客户端

```bash
cd packages/db
bunx prisma generate
```

### Q: Socket.IO 连接失败

**A:** 检查配置
1. `.env` 中的 `JWT_SECRET` 是否设置
2. `CORS_ORIGIN` 是否正确
3. API 服务器是否运行
4. 前端 `src/api.ts` 中的 URL 是否正确

### Q: WhatsApp QR 码不显示

**A:** 清理会话重试

```bash
# 删除旧会话
rm -rf apps/api/wa-auth/user-<your-uid>

# 重新连接
```

## 📖 进阶学习

### 阅读文档

1. **ARCHITECTURE.md** - 了解架构设计
2. **MIGRATION_GUIDE.md** - 详细的迁移步骤
3. **ROADMAP.md** - 未来功能规划

### 添加新功能

参考 `ROADMAP.md` 中的计划：
- 添加 Telegram Connector
- 集成 AI 模块
- 创建 Flow 引擎

### 贡献代码

1. Fork 仓库
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/my-feature`
5. 创建 Pull Request

## 🎓 学习资源

### 官方文档
- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp 库
- [Prisma](https://www.prisma.io/docs) - 数据库 ORM
- [Socket.IO](https://socket.io/docs/v4/) - 实时通讯
- [Bun](https://bun.sh/docs) - JavaScript 运行时

### 教程
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [React 文档](https://react.dev/)
- [Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)

## 💡 最佳实践

### 1. 代码组织

```typescript
// ✅ 好的做法
export class MyConnector extends EventEmitter implements ChatConnector {
  async start(uid: string): Promise<void> {
    // 清晰的职责
  }
}

// ❌ 避免
export class GodClass {
  // 做所有事情
}
```

### 2. 错误处理

```typescript
// ✅ 好的做法
try {
  await connector.send(uid, to, text);
} catch (err) {
  this.emit('error', { uid, error: err });
  throw err;
}

// ❌ 避免
await connector.send(uid, to, text); // 忽略错误
```

### 3. 类型安全

```typescript
// ✅ 好的做法
interface MessagePayload {
  to: string;
  text: string;
}

socket.on('wa.send', async (payload: MessagePayload) => {
  // TypeScript 会检查类型
});

// ❌ 避免
socket.on('wa.send', async (payload: any) => {
  // 失去类型安全
});
```

## 🎉 恭喜！

您已经完成了快速入门。现在可以：

1. ✅ 开发新功能
2. ✅ 添加新的 Connector
3. ✅ 集成 AI 和 Flow
4. ✅ 部署到生产环境

**祝您开发愉快！** 🚀

---

**需要帮助？**
- 查看文档：[ARCHITECTURE.md](./ARCHITECTURE.md)
- 报告问题：创建 GitHub Issue
- 联系维护者：herbert@example.com
