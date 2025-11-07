# WhatsApp API 测试命令

## 前置准备

1. 启动 API 服务器：
```bash
cd /Users/herbertlim/Downloads/wa
pnpm dev:api
```

2. 获取 JWT Token（登录或注册后）

## API 端点测试

### 1. 获取 WhatsApp 状态

```bash
# 替换 <YOUR_TOKEN> 为您的 JWT Token
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  http://localhost:3000/channels/wa/status | jq '.'
```

**响应示例：**
```json
{
  "state": "waiting_qr",
  "isReady": false
}
```

或

```json
{
  "state": "open",
  "deviceLabel": null,
  "lastQRAt": "2025-11-07T10:30:00.000Z",
  "lastConnected": "2025-11-07T10:31:00.000Z",
  "isReady": true,
  "updatedAt": "2025-11-07T10:31:00.000Z"
}
```

### 2. 启动 WhatsApp 连接

```bash
curl -X POST \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  http://localhost:3000/channels/wa/start | jq '.'
```

**响应示例：**
```json
{
  "ok": true
}
```

**注意：** 启动后，前端会收到 Socket.IO 事件 `wa.qr`，需要扫描 QR 码。

### 3. 发送消息

```bash
# 替换 <TO_JID> 为接收者的 WhatsApp JID
# 格式: 6012xxxxxxxx@s.whatsapp.net
curl -X POST \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"to":"<TO_JID>","text":"Hello from API!"}' \
  http://localhost:3000/channels/wa/send | jq '.'
```

**响应示例（成功）：**
```json
{
  "ok": true,
  "message": "Message sent successfully"
}
```

**响应示例（未连接）：**
```json
{
  "error": "Not connected",
  "message": "WhatsApp is not connected. Please connect first."
}
```

### 4. 停止 WhatsApp 连接

```bash
curl -X POST \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  http://localhost:3000/channels/wa/stop | jq '.'
```

**响应示例：**
```json
{
  "ok": true
}
```

## 完整测试流程

### 步骤 1: 注册用户

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  http://localhost:3000/auth/register | jq '.'
```

### 步骤 2: 登录获取 Token

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  http://localhost:3000/auth/login | jq '.'
```

**保存响应中的 token：**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cm3h...",
    "email": "test@example.com"
  }
}
```

### 步骤 3: 设置环境变量

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 步骤 4: 测试 API

```bash
# 获取状态
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/channels/wa/status | jq '.'

# 启动连接
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/channels/wa/start | jq '.'

# 等待扫描 QR 码...
# 前端会显示 QR 码，用手机 WhatsApp 扫描

# 发送消息（扫码成功后）
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"6012xxxxxxxx@s.whatsapp.net","text":"Test message"}' \
  http://localhost:3000/channels/wa/send | jq '.'
```

## 错误处理

### 401 Unauthorized

```json
{
  "error": "缺少授权头"
}
```

**解决方案：** 检查 `Authorization` 头是否正确。

### 400 Bad Request

```json
{
  "error": "Missing required fields",
  "message": "Both \"to\" and \"text\" are required"
}
```

**解决方案：** 确保请求体包含 `to` 和 `text` 字段。

### 500 Internal Server Error

```json
{
  "error": "Failed to send message",
  "message": "Socket not found for user xxx"
}
```

**解决方案：** 
1. 确保 WhatsApp 已连接
2. 检查服务器日志
3. 重新启动连接

## 使用脚本测试

```bash
# 给脚本添加执行权限
chmod +x test-wa-api.sh

# 运行测试（需要先获取 token）
./test-wa-api.sh "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 数据库验证

### 检查 ChannelSession 表

```sql
-- 在 Prisma Studio 或 PostgreSQL 中执行
SELECT * FROM "channel_sessions" WHERE "userId" = '<your-user-id>';
```

**预期结果：**
- `state`: 'waiting_qr' / 'open' / 'closed' / 'reconnecting'
- `channel`: 'WA'
- `lastQRAt`: QR 码生成时间
- `lastConnected`: 最后连接时间

### 检查 UserModule 表

```sql
SELECT * FROM "user_modules" WHERE "userId" = '<your-user-id>';
```

**预期结果：**
- `waEnabled`: true (默认)
- `tgEnabled`: false (默认)
- `aiEnabled`: false (默认)
- `flowEnabled`: false (默认)

## 监控日志

### 查看 API 日志

```bash
# 在运行 pnpm dev:api 的终端中查看
```

**正常日志示例：**
```
[WhatsAppChannel] QR generated for user cm3h...
[WhatsAppChannel] Ready for user cm3h...
[WhatsAppChannel] Message from 6012xxx@s.whatsapp.net to user cm3h...
```

### 查看数据库变化

```bash
cd packages/db
bunx prisma studio
# 打开浏览器访问 http://localhost:5555
```

## 故障排查

### 问题 1: "WhatsApp channel not initialized"

**原因：** Socket.IO 未正确初始化

**解决方案：**
1. 确保 `mountWARoutes` 在 `initIO` 之后调用
2. 重启 API 服务器

### 问题 2: QR 码不刷新

**解决方案：**
1. 停止连接：`POST /channels/wa/stop`
2. 删除会话目录：`rm -rf apps/api/wa-auth/user-<uid>`
3. 重新启动：`POST /channels/wa/start`

### 问题 3: 消息发送失败

**检查清单：**
1. ✅ WhatsApp 是否已连接（`isReady: true`）
2. ✅ JID 格式是否正确（`6012xxx@s.whatsapp.net`）
3. ✅ Token 是否有效
4. ✅ 服务器是否有错误日志

---

**文档版本：** 1.0.0  
**最后更新：** 2025-11-07
