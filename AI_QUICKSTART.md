# 🚀 AI 自动回复功能 - 快速启动指南

## ✅ 完成情况

### 后端（100%）
- ✅ Prisma Schema 更新（AiProvider、ApiCredential、AgentTemplate、UserAgentBinding、MessageLog）
- ✅ 加密工具（AES-256-GCM）
- ✅ 5 个 AI Provider 实现（OpenAI、DeepSeek、Anthropic、Grok、Gemini）
- ✅ 6 个预定义模板
- ✅ AI Orchestrator（限流、防回环、消息处理）
- ✅ REST API 路由（/ai/*, /modules）
- ✅ WhatsApp 集成（自动回复）
- ✅ 环境变量配置

### 前端（100%）
- ✅ AI Settings 页面
- ✅ 路由配置
- ✅ 侧边栏导航
- ✅ API Key 管理
- ✅ 模板绑定
- ✅ 模块开关

## 🎯 立即开始

### 第 1 步：数据库迁移

```bash
cd /Users/herbertlim/Downloads/wa

# 生成 Prisma Client
pnpm prisma:generate

# 运行迁移
cd packages/db
bunx prisma migrate dev --name add_ai_features
```

### 第 2 步：配置环境变量

编辑 `apps/api/.env`：

```bash
# 复制示例配置
cp apps/api/.env.example apps/api/.env

# 编辑 .env 添加以下内容：
SECRET_ENC_KEY=my_super_secret_32_byte_encryption_key_for_ai
XAI_BASE_URL=https://api.x.ai/v1
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
```

### 第 3 步：启动服务

```bash
# 根目录启动所有服务
pnpm dev

# 或分别启动
pnpm dev:api    # 后端: http://localhost:4000
pnpm dev:web    # 前端: http://localhost:5173
```

**检查后端日志，应该看到：**
```
[AI Templates] Starting to seed templates...
[AI Templates] ✓ Upserted: 售前顾问（中英双语）
[AI Templates] ✓ Upserted: 售后工单客服
[AI Templates] ✓ Upserted: 非工作时段自动回复
[AI Templates] ✓ Upserted: 社媒风格简答（Grok）
[AI Templates] ✓ Upserted: FAQ 型答案（Gemini）
[AI Templates] ✓ Upserted: 多语言通用助手
[AI Templates] Successfully seeded 6 templates
```

### 第 4 步：配置 AI

1. **登录系统**
   ```
   http://localhost:5173/login
   ```

2. **进入 AI Settings**
   - 点击侧边栏 🤖 **AI Settings**
   - 或访问：`http://localhost:5173/ai`

3. **保存 API Key**
   - 选择 Provider（例如：OpenAI）
   - 输入你的 API Key（例如：`sk-proj-...`）
   - 点击"Save API Key"

4. **绑定模板**
   - 浏览 6 个预定义模板
   - 选择合适的模板（推荐：**售前顾问（中英双语）**）
   - 点击"Bind to WhatsApp"

5. **启用 AI 模块**
   - 切换"AI Auto-Reply"开关到 **ON**

### 第 5 步：测试 WhatsApp

1. **进入 Dashboard**
   ```
   http://localhost:5173/dashboard
   ```

2. **连接 WhatsApp**
   - 点击"Start WhatsApp"
   - 扫描 QR 码

3. **发送测试消息**
   - 用另一个手机给你的 WhatsApp 发送消息
   - AI 应该会自动回复

## 🧪 API 测试

使用提供的测试脚本：

```bash
# 1. 先登录获取 JWT Token
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' | jq -r '.token'

# 2. 使用 token 运行测试脚本
./test-ai-api.sh "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

或手动测试：

```bash
TOKEN="your_jwt_token"

# 测试 1: 保存 API Key
curl -X POST http://localhost:4000/ai/key \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"OPENAI","apiKey":"sk-test-123"}' | jq '.'

# 测试 2: 获取模板
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/ai/templates | jq '.templates[].name'

# 测试 3: 启用 AI
curl -X POST http://localhost:4000/modules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"aiEnabled":true}' | jq '.'
```

## 📊 验证功能

### 1. 检查数据库

```bash
cd packages/db
bunx prisma studio
# 访问 http://localhost:5555
```

查看表：
- `agent_templates` - 应该有 6 条记录
- `api_credentials` - 保存的 API Key（加密）
- `user_agent_bindings` - 用户的渠道绑定
- `message_logs` - AI 交互日志

### 2. 检查日志

**后端日志应该显示：**
```
[AI Orchestrator] Calling OPENAI (gpt-4o-mini) for user xxx
[AI Orchestrator] Generated reply for user xxx: ...
[WhatsAppChannel] AI reply sent to 6012xxx@s.whatsapp.net
```

**如果 AI 不回复，检查：**
```
[AI Orchestrator] Rate limit: user xxx triggered too soon
[AI Orchestrator] AI disabled for user xxx
[AI Orchestrator] No active binding for user xxx on channel WA
[AI Orchestrator] No API credential for user xxx with provider OPENAI
```

## 🔧 故障排查

### 问题 1：Prisma 错误 "Property 'agentTemplate' does not exist"

**原因：** Prisma Client 未生成

**解决：**
```bash
cd packages/db
bunx prisma generate
```

### 问题 2：AI 不回复

**检查清单：**
1. ✅ `UserModule.aiEnabled = true`（在 AI Settings 页面启用）
2. ✅ 已绑定模板（`GET /ai/bind/WA` 返回数据）
3. ✅ 已保存 API Key（`api_credentials` 表有记录）
4. ✅ API Key 有效（去 Provider 控制台检查）
5. ✅ 后端日志没有错误

**调试命令：**
```bash
# 检查绑定
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/ai/bind/WA

# 检查模块
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/modules
```

### 问题 3：数据库迁移失败

**解决：**
```bash
# 查看迁移状态
cd packages/db
bunx prisma migrate status

# 重置数据库（开发环境）
bunx prisma migrate reset

# 重新迁移
bunx prisma migrate dev --name add_ai_features
```

### 问题 4：前端无法访问 AI Settings

**检查：**
1. 路由是否正确添加到 `main.tsx`
2. Sidebar 是否包含 AI Settings 链接
3. 浏览器控制台是否有错误

## 📝 下一步

### 功能扩展
- [ ] 添加 Telegram 支持
- [ ] 实现上下文记忆（多轮对话）
- [ ] 自定义模板功能
- [ ] 使用统计和成本分析
- [ ] A/B 测试不同模板

### 优化建议
- [ ] 添加 AI 回复预览
- [ ] 支持模板参数化
- [ ] 实现智能路由（根据消息类型选择模板）
- [ ] 添加黑名单/白名单
- [ ] 支持定时任务（非工作时间自动切换模板）

## 📚 相关文档

- **完整文档：** `AI_AUTO_REPLY_DOCUMENTATION.md`
- **测试脚本：** `test-ai-api.sh`
- **API 测试：** `WA_API_TESTING.md`
- **架构文档：** `ARCHITECTURE.md`

## 🎉 完成！

AI 自动回复功能已完整实现，现在可以：
1. ✅ 支持 5 家主流 AI Provider
2. ✅ 6 个预定义模板开箱即用
3. ✅ 完整的前后端集成
4. ✅ 安全的 API Key 加密存储
5. ✅ 智能限流和防回环
6. ✅ WhatsApp 自动回复

享受 AI 驱动的自动化客服体验！🚀

---
**快速启动指南版本：** 1.0.0  
**最后更新：** 2025-11-07
