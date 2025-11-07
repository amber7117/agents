# 多渠道 WhatsApp 支持实现总结

## ✅ 已完成的工作

### 1. 数据库层 (Database Layer)
- ✅ 更新 `schema.prisma` 添加多渠道支持
  - 添加 `channelId` 字段（频道实例 ID）
  - 添加 `name` 字段（频道名称）
  - 添加 `phoneNumber` 字段（电话号码）
  - 添加 `createdAt` 字段（创建时间）
  - 更新唯一约束：从 `[userId, channel]` 改为 `[userId, channelId]`
  - 约束名称：`userId_channelId`

- ✅ 执行数据库迁移
  - 使用 `npx prisma generate` 生成新的 Prisma Client
  - 使用 `npx prisma db push` 同步数据库结构

### 2. Connector 核心层 (Core Connector)
- ✅ 更新 `packages/connectors/core/src/connector.ts`
  - 所有事件类型添加 `channelId` 字段
  - `ChatConnector` 接口所有方法添加 `channelId` 参数
  - 方法签名：
    - `start(uid, channelId?)`
    - `stop(uid, channelId?)`
    - `send(uid, channelId, to, text)`
    - `isReady(uid, channelId?)`

### 3. WhatsApp Connector 实现层
- ✅ 更新 `packages/connectors/whatsapp/src/baileys-connector.ts`
  - 添加 `getSessionKey(uid, channelId)` 方法：生成复合键 `${uid}:${channelId}`
  - 添加 `getUserChannelDir(uid, channelId)` 方法：目录格式 `user-${uid}-${channelId}`
  - 更新 `start()` 方法：支持 channelId 参数
  - 更新 `stop()` 方法：支持 channelId 参数
  - 更新 `send()` 方法：支持 channelId 参数
  - 更新 `isReady()` 方法：支持 channelId 参数
  - 更新 `getSocket()` 方法：支持 channelId 参数
  - 更新 `handleConnectionUpdate()` 方法：在所有事件中包含 channelId
  - 更新 `handleMessagesUpsert()` 方法：在消息事件中包含 channelId
  - Session 存储：从 `Map<uid>` 改为 `Map<uid:channelId>`

### 4. WhatsApp 胶水层 (Glue Layer)
- ✅ 更新 `apps/api/src/channels/whatsapp.ts`
  - 更新 `setupEventListeners()` 方法：所有事件监听器处理 channelId
  - 更新 `ensure(uid, channelId, name?)` 方法
  - 更新 `send(uid, channelId, to, text)` 方法
  - 更新 `stop(uid, channelId)` 方法
  - 更新 `isReady(uid, channelId)` 方法
  - 更新 `upsertChannelSession()` 方法：使用 `userId_channelId` 唯一约束
  - 更新 `saveMessage()` 方法：支持 channelId 参数

### 5. Socket.IO 事件协议
- ✅ 更新 `apps/api/src/socket.ts`
  - 客户端→服务器事件：
    - `wa.start({ channelId, name? })`
    - `wa.send({ channelId, to, text })`
    - `wa.stop({ channelId })`
  - 服务器→客户端事件：
    - `wa.qr({ channelId, qr })`
    - `wa.ready({ channelId })`
    - `wa.status({ channelId, state })`
    - `wa.message({ channelId, from, text, ts })`
    - `wa.error({ channelId, error })`
    - `wa.stopped({ channelId, success })`

### 6. HTTP REST API 路由
- ✅ 更新 `apps/api/src/channels/wa.routes.ts`
  - `GET /channels/wa/list` - 列出所有频道
  - `GET /channels/wa/status?channelId=xxx` - 获取特定频道状态
  - `POST /channels/wa/start` - 启动频道（Body: { channelId?, name? }）
  - `POST /channels/wa/stop` - 停止频道（Body: { channelId? }）
  - `POST /channels/wa/send` - 发送消息（Body: { channelId?, to, text }）

### 7. 包构建
- ✅ `packages/connectors/core` 包已构建
- ✅ `packages/connectors/whatsapp` 包已构建
- ✅ `packages/db` 包已构建
- ✅ `apps/api` 包已构建

## 🔄 待完成的工作

### 1. 前端更新 (Frontend)
- ⏳ 更新 `apps/web/src/pages/Channels.tsx`
  - 更新 `handleConnect()` 函数：`socket.emit('wa.start', { channelId, name })`
  - 更新 `handleDisconnect()` 函数：`socket.emit('wa.stop', { channelId })`
  - 更新 Socket.IO 事件监听器以匹配 channelId

### 2. 测试场景
- ⏳ 测试添加多个频道
- ⏳ 测试同时连接多个频道
- ⏳ 测试断开特定频道
- ⏳ 测试重连特定频道
- ⏳ 测试从特定频道发送/接收消息

## 📊 技术架构

### Session 管理
```
旧架构：Map<uid, Session>
新架构：Map<"uid:channelId", Session>

示例：
- user-123:default
- user-123:whatsapp-1699876543210
- user-123:business-account
```

### 文件系统结构
```
旧结构：apps/api/wa-auth/user-{uid}/
新结构：apps/api/wa-auth/user-{uid}-{channelId}/

示例：
- user-cmhns7h67000013axizbnzzwl-default/
- user-cmhns7h67000013axizbnzzwl-whatsapp-1699876543210/
```

### 数据库约束
```sql
-- 旧约束
UNIQUE (userId, channel)  -- 只能有 1 个 WA 账号

-- 新约束
UNIQUE (userId, channelId)  -- 可以有无限个 WA 账号
```

## 🚀 下一步操作

1. **重启 VS Code TypeScript 服务**
   - 按 `Cmd+Shift+P`
   - 选择 "TypeScript: Restart TS Server"
   - 这将刷新类型缓存

2. **更新前端 Channels.tsx**
   ```typescript
   const handleConnect = (channelId: string, name?: string) => {
     socket.emit('wa.start', { channelId, name });
   };
   
   const handleDisconnect = (channelId: string) => {
     socket.emit('wa.stop', { channelId });
   };
   ```

3. **测试流程**
   - 启动后端：`bun run dev`
   - 启动前端：`cd apps/web && bun run dev`
   - 在 Channels 页面添加新频道
   - 扫描二维码连接
   - 测试发送消息

## 📝 API 使用示例

### Socket.IO 事件
```typescript
// 启动频道
socket.emit('wa.start', { 
  channelId: 'business-account',
  name: 'Business WhatsApp' 
});

// 监听二维码
socket.on('wa.qr', ({ channelId, qr }) => {
  console.log(`QR for ${channelId}:`, qr);
});

// 监听就绪
socket.on('wa.ready', ({ channelId }) => {
  console.log(`${channelId} is ready`);
});

// 发送消息
socket.emit('wa.send', {
  channelId: 'business-account',
  to: '1234567890@s.whatsapp.net',
  text: 'Hello from business account'
});

// 停止频道
socket.emit('wa.stop', { channelId: 'business-account' });
```

### HTTP REST API
```bash
# 列出所有频道
GET /channels/wa/list

# 获取特定频道状态
GET /channels/wa/status?channelId=business-account

# 启动频道
POST /channels/wa/start
Body: { "channelId": "business-account", "name": "Business WhatsApp" }

# 发送消息
POST /channels/wa/send
Body: { 
  "channelId": "business-account",
  "to": "1234567890@s.whatsapp.net",
  "text": "Hello"
}

# 停止频道
POST /channels/wa/stop
Body: { "channelId": "business-account" }
```

## ⚠️ 注意事项

1. **向后兼容性**：所有方法的 channelId 参数都有默认值 `'default'`，确保旧代码仍能正常工作

2. **Session 隔离**：每个 `uid:channelId` 组合都有独立的：
   - WebSocket 连接
   - 认证文件目录
   - 数据库会话记录

3. **并发连接**：理论上一个用户可以同时连接无限个 WhatsApp 账号

4. **资源管理**：每个活跃连接都会占用内存和 WebSocket 资源，需要考虑服务器容量

## 🎉 完成状态

后端多渠道架构已完全实现！✅
- ✅ 数据库层
- ✅ Connector 层
- ✅ 胶水层
- ✅ API 层
- ⏳ 前端层（UI 已完成，事件需更新）
