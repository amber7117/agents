# 多频道支持实现指南

## 📋 概述

当前系统**不支持**多频道管理。需要进行以下修改以支持用户添加多个 WhatsApp 账号。

## 🔴 当前限制

### 1. 数据库 Schema
```prisma
@@unique([userId, channel])  // ❌ 每个用户每个类型只能有一个
```
**问题**: 一个用户只能有 1 个 WhatsApp 连接

### 2. 后端 API
```typescript
async ensure(uid: string)  // ❌ 只用 uid，无法区分多个账号
```
**问题**: 没有 `channelId` 概念

### 3. Connector
```typescript
private sessions = new Map<string, UserSession>();  // ❌ key 是 uid
```
**问题**: 无法为同一用户创建多个会话

## ✅ 需要的修改

### 第 1 步: 更新数据库 Schema ✅

**文件**: `packages/db/prisma/schema.prisma`

```prisma
model ChannelSession {
  id            String    @id @default(cuid())
  userId        String
  channel       Channel
  channelId     String    // ✅ 新增: 频道实例 ID
  phoneNumber   String?   // ✅ 新增: 电话号码
  name          String?   // ✅ 新增: 频道名称
  state         String
  deviceLabel   String?
  lastQRAt      DateTime?
  lastConnected DateTime?
  createdAt     DateTime  @default(now())  // ✅ 新增
  updatedAt     DateTime  @updatedAt
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, channelId])  // ✅ 改为: userId + channelId
  @@index([userId, channel])
  @@map("channel_sessions")
}
```

**迁移 SQL**: `packages/db/migrations/add_multi_channel_support.sql` ✅

### 第 2 步: 更新 BaileysConnector

**文件**: `packages/connectors/whatsapp/src/baileys-connector.ts`

**当前**:
```typescript
private sessions = new Map<string, UserSession>();  // key: uid

async start(uid: string)
```

**需要改为**:
```typescript
// 使用 uid+channelId 作为 key
private sessions = new Map<string, UserSession>();  // key: `${uid}:${channelId}`

async start(uid: string, channelId: string)
async stop(uid: string, channelId: string)
async send(uid: string, channelId: string, to: string, text: string)
isReady(uid: string, channelId: string)
```

**会话目录结构**:
```
apps/api/wa-auth/
├── user-uid1-channelId1/  // 用户1的频道1
│   ├── creds.json
│   └── ...
├── user-uid1-channelId2/  // 用户1的频道2
│   ├── creds.json
│   └── ...
└── user-uid2-channelId1/  // 用户2的频道1
    ├── creds.json
    └── ...
```

### 第 3 步: 更新 WhatsAppChannel 胶水层

**文件**: `apps/api/src/channels/whatsapp.ts`

**需要修改的方法**:
```typescript
class WhatsAppChannel {
  // 事件监听器需要传递 channelId
  private setupEventListeners(): void {
    this.connector.on('qr', ({ uid, channelId, qr }) => {
      this.io.to(uid).emit('wa.qr', { channelId, qr });
    });
    
    this.connector.on('ready', ({ uid, channelId }) => {
      this.io.to(uid).emit('wa.ready', { channelId });
    });
    
    // ... 其他事件
  }

  // 所有方法都需要 channelId 参数
  async ensure(uid: string, channelId: string, name?: string)
  async send(uid: string, channelId: string, to: string, text: string)
  async stop(uid: string, channelId: string)
  isReady(uid: string, channelId: string)
  
  // upsertChannelSession 需要更新
  private async upsertChannelSession(
    uid: string,
    channelId: string,  // ✅ 新增
    state: string,
    extra?: { phoneNumber?: string; name?: string; ... }
  )
}
```

### 第 4 步: 更新 Socket.IO 事件 ✅

**文件**: `apps/api/src/socket.ts` ✅ 已完成

**新的事件协议**:

```typescript
// 前端发送
socket.emit('wa.start', { 
  channelId: 'whatsapp-1699876543210',
  name: 'WhatsApp 1'  // 可选
});

socket.emit('wa.send', { 
  channelId: 'whatsapp-1699876543210',
  to: '+1234567890',
  text: 'Hello'
});

socket.emit('wa.stop', { 
  channelId: 'whatsapp-1699876543210'
});

// 后端响应
socket.on('wa.qr', ({ channelId, qr }) => { ... });
socket.on('wa.ready', ({ channelId }) => { ... });
socket.on('wa.status', ({ channelId, state }) => { ... });
socket.on('wa.message', ({ channelId, from, text, ts }) => { ... });
socket.on('wa.stopped', ({ channelId }) => { ... });
socket.on('wa.error', ({ channelId, error }) => { ... });
```

### 第 5 步: 更新前端 Channels 页面

**文件**: `apps/web/src/pages/Channels.tsx`

**需要修改**:

```typescript
// Socket 事件监听需要匹配 channelId
sock.on('wa.qr', async (payload: { channelId: string; qr: string }) => {
  if (payload.channelId === currentChannelId) {
    // 显示 QR 码
  }
});

sock.on('wa.ready', (payload: { channelId: string }) => {
  updateChannelStatus(payload.channelId, 'connected');
});

// 连接时发送 channelId
const handleConnect = (channelId: string, name: string) => {
  socketRef.current?.emit('wa.start', { channelId, name });
};

// 断开时发送 channelId
const handleDisconnect = (channelId: string) => {
  socketRef.current?.emit('wa.stop', { channelId });
};
```

### 第 6 步: 添加后端 REST API（可选）

**文件**: `apps/api/src/channels/wa.routes.ts`

```typescript
// GET /api/channels - 获取用户所有频道
router.get('/channels', async (req, res) => {
  const uid = req.user.uid;
  const channels = await prisma.channelSession.findMany({
    where: { userId: uid, channel: 'WA' }
  });
  res.json(channels);
});

// POST /api/channels - 创建新频道
router.post('/channels', async (req, res) => {
  const uid = req.user.uid;
  const { channelId, name } = req.body;
  
  const channel = await prisma.channelSession.create({
    data: {
      userId: uid,
      channel: 'WA',
      channelId,
      name,
      state: 'disconnected'
    }
  });
  
  res.json(channel);
});

// DELETE /api/channels/:channelId - 删除频道
router.delete('/channels/:channelId', async (req, res) => {
  const uid = req.user.uid;
  const { channelId } = req.params;
  
  // 先断开连接
  await waChannel.stop(uid, channelId);
  
  // 删除数据库记录
  await prisma.channelSession.delete({
    where: { userId_channelId: { userId: uid, channelId } }
  });
  
  res.json({ success: true });
});
```

## 🎯 实现优先级

### 高优先级 (必须)
1. ✅ 数据库 Schema 更新
2. ✅ Socket.IO 事件协议更新
3. ⏳ BaileysConnector 支持 channelId
4. ⏳ WhatsAppChannel 支持 channelId
5. ⏳ 前端 Channels 页面事件对接

### 中优先级 (建议)
6. ⏳ REST API 端点
7. ⏳ 数据库迁移执行
8. ⏳ 错误处理和验证

### 低优先级 (可选)
9. ⏳ 批量操作
10. ⏳ 频道统计
11. ⏳ 自动重连优化

## 📝 详细实现步骤

### 步骤 1: 修改 BaileysConnector

```typescript
// packages/connectors/whatsapp/src/baileys-connector.ts

export class BaileysConnector extends EventEmitter implements ChatConnector {
    private sessions = new Map<string, UserSession>();
    
    // 生成会话 key
    private getSessionKey(uid: string, channelId: string): string {
        return `${uid}:${channelId}`;
    }
    
    // 生成会话目录
    private getUserChannelDir(uid: string, channelId: string): string {
        return path.join(this.storage.authRoot, `user-${uid}-${channelId}`);
    }
    
    async start(uid: string, channelId: string): Promise<void> {
        const sessionKey = this.getSessionKey(uid, channelId);
        
        if (this.sessions.has(sessionKey)) {
            console.log(`Session already exists: ${sessionKey}`);
            return;
        }
        
        const userDir = this.getUserChannelDir(uid, channelId);
        await fs.mkdir(userDir, { recursive: true });
        
        const { state, saveCreds } = await useMultiFileAuthState(userDir);
        // ... rest of implementation
        
        this.sessions.set(sessionKey, session);
        
        // 事件发送时带上 channelId
        socket.ev.on('connection.update', (update) => {
            if (update.qr) {
                this.emit('qr', { uid, channelId, qr: update.qr });
            }
            if (update.connection === 'open') {
                this.emit('ready', { uid, channelId });
            }
        });
    }
    
    async stop(uid: string, channelId: string): Promise<void> {
        const sessionKey = this.getSessionKey(uid, channelId);
        const session = this.sessions.get(sessionKey);
        if (!session) return;
        
        await session.socket.logout();
        session.socket.end(undefined);
        this.sessions.delete(sessionKey);
        
        this.emit('status', { uid, channelId, state: 'close' });
    }
    
    async send(uid: string, channelId: string, to: string, text: string): Promise<void> {
        const sessionKey = this.getSessionKey(uid, channelId);
        const session = this.sessions.get(sessionKey);
        
        if (!session) {
            throw new Error(`No session found: ${sessionKey}`);
        }
        
        await session.socket.sendMessage(to, { text });
    }
    
    isReady(uid: string, channelId: string): boolean {
        const sessionKey = this.getSessionKey(uid, channelId);
        return this.sessions.get(sessionKey)?.ready ?? false;
    }
}
```

### 步骤 2: 修改 WhatsAppChannel

```typescript
// apps/api/src/channels/whatsapp.ts

export class WhatsAppChannel {
    private setupEventListeners(): void {
        // QR 码事件
        this.connector.on('qr', ({ uid, channelId, qr }) => {
            this.io.to(uid).emit('wa.qr', { channelId, qr });
            
            this.upsertChannelSession(uid, channelId, 'waiting_qr', {
                lastQRAt: new Date()
            }).catch(console.error);
        });

        // 连接就绪事件
        this.connector.on('ready', ({ uid, channelId }) => {
            this.io.to(uid).emit('wa.ready', { channelId });
            
            this.upsertChannelSession(uid, channelId, 'open', {
                lastConnected: new Date()
            }).catch(console.error);
        });

        // 消息事件
        this.connector.on('message', async ({ uid, channelId, from, text, ts }) => {
            this.io.to(uid).emit('wa.message', { channelId, from, text, ts });
            
            await this.saveMessage(uid, channelId, {
                contactWhatsappId: from,
                direction: 'INCOMING',
                content: text,
                sentAt: new Date(ts),
            });
        });
    }

    async ensure(uid: string, channelId: string, name?: string): Promise<void> {
        await this.connector.start(uid, channelId);
        
        // 创建或更新数据库记录
        await this.upsertChannelSession(uid, channelId, 'connecting', {
            name,
        });
    }

    async send(uid: string, channelId: string, to: string, text: string): Promise<void> {
        await this.connector.send(uid, channelId, to, text);
        
        await this.saveMessage(uid, channelId, {
            contactWhatsappId: to,
            direction: 'OUTGOING',
            content: text,
            sentAt: new Date(),
        });
    }

    async stop(uid: string, channelId: string): Promise<void> {
        await this.connector.stop(uid, channelId);
        
        await this.upsertChannelSession(uid, channelId, 'disconnected', {
            lastConnected: new Date()
        });
    }

    private async upsertChannelSession(
        uid: string,
        channelId: string,
        state: string,
        extra?: {
            name?: string;
            phoneNumber?: string;
            lastQRAt?: Date;
            lastConnected?: Date;
        }
    ): Promise<void> {
        await prisma.channelSession.upsert({
            where: {
                userId_channelId: {
                    userId: uid,
                    channelId: channelId
                }
            },
            create: {
                userId: uid,
                channel: 'WA',
                channelId: channelId,
                state,
                name: extra?.name,
                phoneNumber: extra?.phoneNumber,
                lastQRAt: extra?.lastQRAt,
                lastConnected: extra?.lastConnected,
            },
            update: {
                state,
                ...(extra?.name && { name: extra.name }),
                ...(extra?.phoneNumber && { phoneNumber: extra.phoneNumber }),
                ...(extra?.lastQRAt && { lastQRAt: extra.lastQRAt }),
                ...(extra?.lastConnected && { lastConnected: extra.lastConnected }),
            }
        });
    }
}
```

### 步骤 3: 更新前端

```typescript
// apps/web/src/pages/Channels.tsx

useEffect(() => {
  const sock = io(API_URL, { auth: { token } });
  socketRef.current = sock;

  // QR 码事件 - 带 channelId
  sock.on('wa.qr', async (payload: { channelId: string; qr: string }) => {
    console.log('QR received for channel:', payload.channelId);
    
    // 只为当前正在连接的频道显示 QR 码
    if (payload.channelId === currentChannelId) {
      setQrData(payload.qr);
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, payload.qr, { width: 300 });
      }
    }
  });

  // 就绪事件 - 带 channelId
  sock.on('wa.ready', (payload: { channelId: string }) => {
    console.log('Channel ready:', payload.channelId);
    updateChannelStatus(payload.channelId, 'connected');
    
    // 如果是当前正在连接的频道，关闭弹窗
    if (payload.channelId === currentChannelId) {
      setShowQRModal(false);
      setCurrentChannelId(null);
    }
  });

  // 断开事件 - 带 channelId
  sock.on('wa.stopped', (payload: { channelId: string }) => {
    console.log('Channel stopped:', payload.channelId);
    updateChannelStatus(payload.channelId, 'disconnected');
  });

  // 错误事件 - 带 channelId
  sock.on('wa.error', (payload: { channelId: string; error: string }) => {
    console.error('Channel error:', payload);
    updateChannelStatus(payload.channelId, 'disconnected');
  });

  return () => sock.close();
}, []);

// 连接频道
const handleConnect = (channel: Channel) => {
  setCurrentChannelId(channel.id);
  updateChannelStatus(channel.id, 'connecting');
  setShowQRModal(true);
  
  // 发送 wa.start 事件，带 channelId
  socketRef.current?.emit('wa.start', {
    channelId: channel.id,
    name: channel.name
  });
};

// 断开频道
const handleDisconnect = (channel: Channel) => {
  // 发送 wa.stop 事件，带 channelId
  socketRef.current?.emit('wa.stop', {
    channelId: channel.id
  });
  updateChannelStatus(channel.id, 'disconnected');
};
```

## 🧪 测试计划

### 单元测试

1. **BaileysConnector 测试**
   - 测试 `start()` 为不同 channelId 创建独立会话
   - 测试 `stop()` 只断开指定 channelId
   - 测试会话目录隔离

2. **WhatsAppChannel 测试**
   - 测试数据库 upsert 正确使用 channelId
   - 测试事件发送包含 channelId

### 集成测试

1. **多频道连接**
   ```
   用户A添加 WhatsApp 1 → 扫码连接
   用户A添加 WhatsApp 2 → 扫码连接
   确认两个账号同时在线
   ```

2. **频道隔离**
   ```
   用户A的 WhatsApp 1 收到消息 → 不影响 WhatsApp 2
   用户A断开 WhatsApp 1 → WhatsApp 2 保持连接
   ```

3. **多用户**
   ```
   用户A添加 WhatsApp 1
   用户B添加 WhatsApp 1 (不同账号)
   确认互不干扰
   ```

## ⚠️ 注意事项

1. **向后兼容**: 现有单频道数据需要迁移
2. **会话目录**: 确保旧的 `user-{uid}` 目录迁移到新格式
3. **性能**: 多个会话可能占用更多内存
4. **错误处理**: channelId 不存在时的处理
5. **并发**: 同时连接多个频道的限制

## 📊 数据迁移

```sql
-- 为现有会话生成 channelId
UPDATE channel_sessions
SET channelId = channel || '-' || EXTRACT(EPOCH FROM updatedAt)::TEXT
WHERE channelId IS NULL;

-- 迁移会话目录
-- 需要手动操作或写脚本
-- 从: apps/api/wa-auth/user-{uid}/
-- 到: apps/api/wa-auth/user-{uid}-{channelId}/
```

## ✅ 完成检查清单

- [x] 数据库 Schema 更新
- [x] SQL 迁移文件创建
- [x] Socket.IO 事件协议更新
- [ ] BaileysConnector 支持 channelId
- [ ] WhatsAppChannel 支持 channelId
- [ ] 前端 Channels 页面更新
- [ ] REST API 端点添加
- [ ] 单元测试
- [ ] 集成测试
- [ ] 文档更新

---

**状态**: 🟡 部分完成 (30%)  
**阻塞**: 需要更新 BaileysConnector 和 WhatsAppChannel 核心逻辑  
**下一步**: 实现 BaileysConnector 的 channelId 支持
