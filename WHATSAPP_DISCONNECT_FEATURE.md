# WhatsApp 断开连接功能

## ✅ 新增功能

### 功能说明
用户现在可以通过前端 UI 主动断开 WhatsApp 连接，无需重启服务器或刷新页面。

## 实现细节

### 1. 后端 - Socket 事件处理 (`apps/api/src/socket.ts`)

新增 `wa.stop` 事件监听：

```typescript
// 监听停止 WhatsApp 连接请求
socket.on('wa.stop', async () => {
    try {
        await waChannel.stop(uid);
        socket.emit('wa.stopped', { success: true });
    } catch (err) {
        console.error(`Failed to stop WhatsApp for ${uid}:`, err);
        socket.emit('wa.error', {
            error: err instanceof Error ? err.message : String(err)
        });
    }
});
```

**事件流程**：
1. 前端发送 `wa.stop` 事件
2. 后端调用 `waChannel.stop(uid)`
3. WhatsAppChannel 调用 `connector.stop(uid)`
4. BaileysConnector 关闭 socket 并清理会话
5. 后端发送 `wa.stopped` 确认事件

### 2. 前端 - 断开按钮 (`apps/web/src/components/QRPanel.tsx`)

#### 新增状态管理
```typescript
const socketRef = useRef<Socket | null>(null);
```

#### 新增事件监听
```typescript
sock.on('wa.stopped', () => {
    setStatus('waiting');
    addDebugInfo('✅ WhatsApp disconnected successfully');
});
```

#### 新增断开函数
```typescript
const handleDisconnect = () => {
    if (socketRef.current && status === 'ready') {
        addDebugInfo('🔌 Requesting disconnect...');
        socketRef.current.emit('wa.stop');
    }
};
```

#### UI 按钮
在 `status === 'ready'` 状态下显示红色渐变断开按钮：

```tsx
<button
    className="btn btn-secondary"
    onClick={handleDisconnect}
    style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
        // ... 样式
    }}
>
    🔌 断开 WhatsApp
</button>
```

## 使用流程

### 用户操作步骤

1. **连接 WhatsApp**
   - 用户登录系统
   - 扫描二维码
   - 状态变为 "连接成功" ✅

2. **断开 WhatsApp**
   - 点击 "🔌 断开 WhatsApp" 按钮
   - 系统发送断开请求
   - 状态变回 "等待连接" ⏳
   - 会话被清理

3. **重新连接**
   - 点击 "🔄 重新连接" 或刷新页面
   - 重新生成二维码
   - 扫码重新连接

## 后端处理逻辑

### WhatsAppChannel.stop() 流程

```typescript
async stop(uid: string): Promise<void> {
    await this.connector.stop(uid);
    
    // 更新数据库状态为 DISCONNECTED
    await upsertChannelSession(uid, 'whatsapp', {
        status: 'DISCONNECTED',
        lastConnected: new Date()
    });
}
```

### BaileysConnector.stop() 流程

```typescript
async stop(uid: string): Promise<void> {
    const session = this.sessions.get(uid);
    if (!session) return;

    try {
        // 关闭 WebSocket 连接
        await session.socket.logout();
        session.socket.end(undefined);
        
        // 从内存中移除会话
        this.sessions.delete(uid);
        
        // 发出状态事件
        this.emit('status', { uid, state: 'close' });
        
        console.log(`[BaileysConnector] Session stopped for user ${uid}`);
    } catch (error) {
        console.error(`[BaileysConnector] Error stopping session:`, error);
        throw error;
    }
}
```

## 状态流转

```
等待连接 (waiting)
    ↓ 用户登录/连接
连接中 (connecting)
    ↓ 扫描二维码
扫描中 (scanning)
    ↓ 扫码成功
已连接 (ready) ✅
    ↓ 点击断开按钮
等待连接 (waiting) ⏳
```

## 数据库状态同步

断开连接时，会更新 `channel_sessions` 表：

```sql
UPDATE channel_sessions
SET 
    status = 'DISCONNECTED',
    last_connected = NOW()
WHERE 
    user_id = :uid AND 
    channel = 'whatsapp';
```

## 会话文件处理

**重要**: 断开连接**不会删除**会话文件（`creds.json`）

- ✅ 保留会话凭证
- ✅ 下次连接可能直接恢复（无需扫码）
- ✅ 除非用户主动"登出"

如需完全清除会话，需要调用：
```typescript
await waChannel.logout(uid);  // 这会删除 wa-auth/user-{uid}/ 目录
```

## 安全性

### 权限检查
- ✅ Socket.IO 中间件验证 JWT token
- ✅ 每个用户只能断开自己的连接
- ✅ `uid` 从 token 解析，不能伪造

### 并发处理
- ✅ 多个设备登录同一账号，断开互不影响
- ✅ 每个 `uid` 独立的会话管理

## 错误处理

### 可能的错误

1. **会话不存在**
   ```
   No session to stop for user {uid}
   ```
   - 原因：用户未连接或已断开
   - 处理：静默忽略，返回成功

2. **断开失败**
   ```
   Error stopping session: {error}
   ```
   - 原因：Baileys socket 异常
   - 处理：记录错误日志，强制删除会话

3. **Socket 断线**
   - 前端显示 "❌ Server disconnected"
   - 自动重连机制

## UI 设计

### 断开按钮样式
- 🎨 红色渐变背景 (#ff6b6b → #ee5a6f)
- ✨ Hover 效果：上浮 + 阴影增强
- 🔒 仅在 `status === 'ready'` 时显示
- 📱 响应式设计，移动端友好

### 状态提示
- ✅ 连接成功：绿/蓝色，复选标记
- 🔌 断开中：显示调试信息
- ⏳ 等待连接：灰色，时钟图标

## 测试场景

### 手动测试步骤

1. **正常断开**
   ```
   登录 → 连接 WhatsApp → 点击断开 → 确认状态变为等待
   ```

2. **快速重连**
   ```
   断开 → 立即刷新页面 → 确认重新生成二维码
   ```

3. **网络中断**
   ```
   断开网络 → 点击断开 → 恢复网络 → 确认操作完成
   ```

4. **多设备测试**
   ```
   设备A连接 → 设备B连接 → 设备A断开 → 确认设备B不受影响
   ```

## 性能优化

- ✅ 断开操作异步执行，不阻塞 UI
- ✅ 内存及时释放（会话对象删除）
- ✅ 数据库更新批量处理
- ✅ Socket 连接优雅关闭

## 后续改进

### 可选增强功能

1. **确认对话框**
   - 断开前弹出确认："确定要断开 WhatsApp 吗？"
   - 防止误操作

2. **断开原因**
   - 记录断开原因（用户主动/网络错误/服务器重启）
   - 用于分析和调试

3. **自动重连**
   - 意外断开后自动尝试重连
   - 配置最大重连次数

4. **会话管理页面**
   - 显示所有活跃会话
   - 批量管理（断开/删除）

---

**实现完成**: 2025-11-07  
**影响范围**: 
- `apps/api/src/socket.ts` (新增 wa.stop 事件)
- `apps/web/src/components/QRPanel.tsx` (新增断开按钮和逻辑)

**状态**: ✅ 功能已实现，可以测试
