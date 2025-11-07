# AI 自动回复功能完整实现文档

## 📋 功能概述

本项目已完整实现 AI 自动回复功能，支持 5 家主流 AI Provider：
- **OpenAI** (GPT-4, GPT-3.5)
- **DeepSeek**
- **Anthropic** (Claude)
- **Grok** (xAI)
- **Google Gemini**

## 🏗️ 架构设计

### 数据库模型（Prisma Schema）

#### 1. AiProvider 枚举
```prisma
enum AiProvider {
  OPENAI
  DEEPSEEK
  ANTHROPIC
  GROK
  GEMINI
}
```

#### 2. ApiCredential（用户 API Key）
- 存储用户自带的 API Key
- 使用 AES-256-GCM 加密存储
- `@@unique([userId, provider])` 确保每个用户每个 Provider 只有一个凭证

#### 3. AgentTemplate（AI 模板）
- 预定义 6 个常用模板（售前、售后、非工作时段、社媒风格、FAQ、多语言）
- 包含 provider、model、temperature、systemPrompt
- `name` 字段 `@unique` 防止重复

#### 4. UserAgentBinding（用户渠道绑定）
- 将模板绑定到用户的特定渠道（WA/TG）
- 支持 `modelOverride` 覆盖模板默认模型
- `@@unique([userId, channel])` 确保每个渠道只能绑定一个模板

#### 5. MessageLog（消息日志）
- 记录所有 AI 交互（入站 + 出站）
- `aiUsed` 字段标记 AI 生成的消息

### 后端 API 层

#### apps/api/src/ai/

**1. types.ts**
- 定义 `ProviderName`、`ChannelName` 类型
- `AIClient` 接口规范（所有 Provider 必须实现）

**2. crypto.ts**
- AES-256-GCM 加密/解密
- 使用 `SECRET_ENC_KEY` 环境变量（自动填充到 32 字节）

**3. providers.ts**
- 实现 5 个 Provider 的 `AIClient`
- 全部使用 `fetch`，无第三方 SDK 依赖
- 统一错误处理和响应解析

**4. templates.ts**
- `seedTemplates()` 函数插入 6 个预定义模板
- 使用 `upsert` 防止重复

**5. orchestrator.ts**
- **核心编排逻辑**：`handleInbound()`
- 限流：同一用户 2 秒内只触发一次
- 防回环：记录最近发出的消息哈希（10 秒有效期）
- 检查 `UserModule.aiEnabled`（如果表存在）
- 查询绑定、凭证、调用 AI、写入日志

**6. routes.ts**
- `POST /ai/key` - 保存 API Key（加密）
- `GET /ai/templates` - 获取模板列表
- `POST /ai/bind` - 绑定模板到渠道
- `GET /ai/bind/:channel` - 查询当前绑定

#### apps/api/src/modules.routes.ts
- `GET /modules` - 获取模块开关（不存在则创建默认）
- `POST /modules` - 更新模块开关（只更新传入字段）

### WhatsApp 集成

**apps/api/src/channels/whatsapp.ts**

在 `message` 事件处理中：
1. 先向前端发送 `wa.message` 事件
2. 保存消息到数据库
3. 调用 `handleInbound()` 获取 AI 回复
4. 如果有回复，调用 `this.send()` 发送消息

```typescript
this.connector.on('message', async ({ uid, from, text, ts, messageId }) => {
  // 1. 发送给前端
  this.io.to(uid).emit('wa.message', { from, text, ts });
  
  // 2. 保存消息
  await this.saveMessage(/* ... */);
  
  // 3. AI 处理
  const reply = await handleInbound({ uid, channel: 'WA', from, text });
  
  // 4. 发送回复
  if (reply) await this.send(uid, from, reply);
});
```

### 前端页面

**apps/web/src/pages/AISettings.tsx**

功能模块：
1. **API Key 设置**
   - 选择 Provider
   - 输入 API Key
   - 加密保存到后端

2. **AI 模块开关**
   - 显示当前 `aiEnabled` 状态
   - 一键开启/关闭

3. **当前绑定信息**
   - 显示已绑定的模板
   - Provider、Model、状态

4. **模板列表**
   - 显示所有可用模板
   - 点击"Bind to WhatsApp"绑定
   - 当前激活模板显示"✓ Active"

## 🚀 部署步骤

### 1. 数据库迁移

```bash
cd packages/db
bunx prisma generate
bunx prisma migrate dev --name add_ai_features
```

### 2. 环境变量配置

在 `apps/api/.env` 添加：

```bash
# AI 加密密钥（至少 32 字节）
SECRET_ENC_KEY=your_32_byte_encryption_key_here

# AI Provider URLs（可选，使用默认值）
XAI_BASE_URL=https://api.x.ai/v1
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
```

### 3. 启动服务

```bash
# 根目录
pnpm dev

# 或分别启动
pnpm dev:api    # 后端
pnpm dev:web    # 前端
```

### 4. 首次启动

后端启动时会自动执行 `seedTemplates()`，创建 6 个预定义模板。

## 📝 使用流程

### 用户端操作

1. **登录系统**
   - 访问 `/login` 登录

2. **配置 API Key**
   - 导航到 **AI Settings**（侧边栏 🤖 图标）
   - 选择 Provider（例如：OpenAI）
   - 输入 API Key（例如：`sk-...`）
   - 点击"Save API Key"

3. **绑定 AI 模板**
   - 浏览可用模板列表
   - 选择合适的模板（例如："售前顾问（中英双语）"）
   - 点击"Bind to WhatsApp"

4. **启用 AI 模块**
   - 切换"AI Auto-Reply"开关到 ON

5. **测试 WhatsApp**
   - 进入 **Dashboard** 或 **Chat**
   - 扫描 QR 码连接 WhatsApp
   - 发送测试消息，AI 会自动回复

### 管理员/开发者操作

#### 添加新模板

编辑 `apps/api/src/ai/templates.ts`：

```typescript
const TEMPLATES = [
  // ... 现有模板
  {
    name: '你的新模板',
    provider: 'OPENAI',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    systemPrompt: '你的 system prompt...',
  },
];
```

重启服务后，新模板会自动插入数据库。

#### 添加新 Provider

1. 在 `apps/api/src/ai/providers.ts` 实现 `AIClient` 接口
2. 更新 `getClient()` 函数
3. 在 Prisma Schema 添加枚举值
4. 前端 `AISettings.tsx` 的 `PROVIDERS` 数组添加选项

## 🔒 安全特性

### 1. API Key 加密
- 使用 AES-256-GCM 加密算法
- 12 字节随机 IV
- 存储格式：`iv:authTag:ciphertext`（Base64）

### 2. 限流保护
- 同一用户 2 秒内只触发一次 AI 请求
- 防止滥用和重复触发

### 3. 防回环机制
- 记录最近发出的消息哈希
- 10 秒内收到相同文本不触发 AI
- 防止 AI 自我对话

### 4. 权限控制
- 所有 API 路由使用 `auth` 中间件
- 用户只能访问自己的数据

## 🐛 故障排查

### AI 不回复？

检查清单：
1. ✅ `UserModule.aiEnabled` 是否为 `true`
2. ✅ 是否绑定了模板（`GET /ai/bind/WA`）
3. ✅ 是否保存了对应 Provider 的 API Key
4. ✅ API Key 是否有效（检查 Provider 控制台）
5. ✅ 检查后端日志是否有错误

### 数据库错误？

```bash
# 重新生成 Prisma Client
cd packages/db
bunx prisma generate

# 查看迁移状态
bunx prisma migrate status

# 重置数据库（开发环境）
bunx prisma migrate reset
```

### 模板未显示？

检查后端启动日志：
```
[AI Templates] Starting to seed templates...
[AI Templates] ✓ Upserted: 售前顾问（中英双语）
[AI Templates] Successfully seeded 6 templates
```

如果没有，手动执行：
```bash
curl -X POST http://localhost:4000/ai/seed
```

## 📊 监控和日志

### 关键日志

**Orchestrator**
```
[AI Orchestrator] Rate limit: user xxx triggered too soon
[AI Orchestrator] Loop prevention: ignoring our recent message
[AI Orchestrator] AI disabled for user xxx
[AI Orchestrator] Calling OPENAI (gpt-4o-mini) for user xxx
[AI Orchestrator] Generated reply for user xxx: Hello...
```

**WhatsApp Channel**
```
[WhatsAppChannel] Message from 6012xxx@s.whatsapp.net to user xxx
[WhatsAppChannel] AI reply sent to 6012xxx@s.whatsapp.net
[AI][WA] Error processing message: ...
```

### 数据库查询

```sql
-- 查看用户的 AI 配置
SELECT * FROM user_modules WHERE "userId" = 'xxx';

-- 查看用户的 API 凭证（加密）
SELECT * FROM api_credentials WHERE "userId" = 'xxx';

-- 查看用户的渠道绑定
SELECT * FROM user_agent_bindings WHERE "userId" = 'xxx';

-- 查看 AI 消息日志
SELECT * FROM message_logs 
WHERE "userId" = 'xxx' AND "aiUsed" = true 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- 统计 AI 使用情况
SELECT 
  channel,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN "aiUsed" = true THEN 1 END) as ai_messages
FROM message_logs
WHERE "userId" = 'xxx'
GROUP BY channel;
```

## 🎯 扩展建议

### 1. 添加 Telegram 支持
- 创建 `TelegramConnector`
- 在 `handleInbound` 中支持 `channel: 'TG'`
- 前端添加 Telegram 绑定界面

### 2. 上下文记忆
- 在 `orchestrator` 中维护会话历史
- 传递最近 N 条消息给 AI
- 实现更智能的多轮对话

### 3. 自定义模板
- 允许用户创建自己的模板
- 提供模板市场
- 支持模板分享

### 4. 使用统计
- 记录 token 使用量
- 成本分析
- 响应时间监控

### 5. A/B 测试
- 同时绑定多个模板
- 随机选择或智能路由
- 比较效果

## 📚 API 文档

### POST /ai/key
保存用户的 API Key。

**Request:**
```json
{
  "provider": "OPENAI",
  "apiKey": "sk-..."
}
```

**Response:**
```json
{
  "ok": true,
  "message": "API key saved successfully",
  "id": "credential_id"
}
```

### GET /ai/templates
获取所有可用模板。

**Response:**
```json
{
  "templates": [
    {
      "id": "template_id",
      "name": "售前顾问（中英双语）",
      "provider": "DEEPSEEK",
      "model": "deepseek-chat",
      "temperature": 0.5,
      "systemPrompt": "..."
    }
  ]
}
```

### POST /ai/bind
绑定模板到渠道。

**Request:**
```json
{
  "channel": "WA",
  "templateId": "template_id",
  "enabled": true,
  "modelOverride": "gpt-4"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Binding saved successfully",
  "binding": {
    "id": "binding_id",
    "channel": "WA",
    "enabled": true,
    "template": { /* ... */ }
  }
}
```

### GET /ai/bind/:channel
查询渠道绑定。

**Response:**
```json
{
  "binding": {
    "id": "binding_id",
    "channel": "WA",
    "enabled": true,
    "modelOverride": null,
    "template": { /* ... */ }
  }
}
```

### GET /modules
获取模块开关。

**Response:**
```json
{
  "modules": {
    "waEnabled": true,
    "tgEnabled": false,
    "aiEnabled": true,
    "flowEnabled": false
  }
}
```

### POST /modules
更新模块开关。

**Request:**
```json
{
  "aiEnabled": true
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Modules updated successfully",
  "modules": { /* ... */ }
}
```

## 🎉 完成！

AI 自动回复功能现已完整实现并可投入使用。如有问题，请查看日志或联系开发团队。

---
**文档版本：** 1.0.0  
**最后更新：** 2025-11-07
