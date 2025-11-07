# 模块化架构 - 下一步规划

## 🎯 已完成：WhatsApp 封装

✅ 创建通用 Connector 接口  
✅ 实现 WhatsApp Connector (Baileys)  
✅ 创建 API 胶水层  
✅ 更新数据库 Schema  
✅ 保持前端完全兼容  

## 📋 下一步任务清单

### 阶段 1: Telegram 集成

#### 1.1 Telegram Bot Connector
```bash
# 创建包结构
packages/connectors/telegram-bot/
  ├── src/
  │   ├── bot-connector.ts      # 实现 ChatConnector
  │   ├── storage.ts
  │   └── index.ts
  ├── package.json               # 依赖 node-telegram-bot-api
  └── tsconfig.json
```

**功能需求：**
- [ ] 实现 ChatConnector 接口
- [ ] Bot Token 配置
- [ ] 接收/发送消息
- [ ] 支持群组/频道
- [ ] 命令处理 (/start, /help)
- [ ] Webhook 支持

**数据库变更：**
```prisma
model TelegramBotConfig {
  id          String  @id @default(cuid())
  userId      String  @unique
  botToken    String  @db.Text
  botUsername String
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
}
```

#### 1.2 Telegram User Connector
```bash
packages/connectors/telegram-user/
  ├── src/
  │   ├── user-connector.ts     # MTProto 实现
  │   ├── auth.ts               # 电话号码认证
  │   └── index.ts
  └── package.json               # 依赖 telegram
```

**功能需求：**
- [ ] 实现 ChatConnector 接口
- [ ] 电话号码登录
- [ ] 验证码输入
- [ ] 2FA 支持
- [ ] 读取/发送私聊消息
- [ ] 群组消息

**API 胶水层：**
```typescript
// apps/api/src/channels/telegram.ts
export class TelegramChannel {
  private botConnector: TelegramBotConnector;
  private userConnector: TelegramUserConnector;
  
  async ensureBot(uid: string): Promise<void>
  async ensureUser(uid: string): Promise<void>
}
```

### 阶段 2: AI 模块

```bash
packages/modules/ai/
  ├── src/
  │   ├── ai-manager.ts         # AI 管理器
  │   ├── context-store.ts      # 上下文存储
  │   ├── providers/
  │   │   ├── openai.ts         # OpenAI 提供商
  │   │   ├── anthropic.ts      # Anthropic 提供商
  │   │   └── local.ts          # 本地模型
  │   └── index.ts
  └── package.json
```

**功能需求：**
- [ ] 多 AI 提供商支持
- [ ] 用户自定义 API Key
- [ ] Prompt 模板系统
- [ ] 上下文管理（每用户独立）
- [ ] 对话历史记录
- [ ] Token 使用统计

**数据库设计：**
```prisma
model AIConfig {
  id          String  @id @default(cuid())
  userId      String  @unique
  provider    String  // 'openai' | 'anthropic' | 'local'
  apiKey      String  @db.Text
  model       String  // 'gpt-4', 'claude-3', etc.
  temperature Float   @default(0.7)
  maxTokens   Int     @default(2000)
}

model AIContext {
  id          String   @id @default(cuid())
  userId      String
  contactId   String   // WhatsApp/Telegram contact
  channel     Channel  // WA | TG
  messages    Json     // 聊天历史
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, contactId, channel])
}

model AIPromptTemplate {
  id          String  @id @default(cuid())
  userId      String
  name        String
  scenario    String  // 'customer_service', 'sales', 'support'
  prompt      String  @db.Text
  isActive    Boolean @default(true)
  
  @@unique([userId, name])
}
```

**使用示例：**
```typescript
// 在 channels/whatsapp.ts 中集成
import { AIManager } from '@pkg/modules-ai';

this.connector.on('message', async ({ uid, from, text }) => {
  // 检查用户是否启用 AI
  const userModule = await prisma.userModule.findUnique({
    where: { userId: uid }
  });
  
  if (userModule?.aiEnabled) {
    const aiManager = new AIManager(uid);
    const response = await aiManager.reply({
      channel: 'WA',
      contactId: from,
      message: text,
    });
    
    await this.connector.send(uid, from, response);
  }
});
```

### 阶段 3: Flow 模块

```bash
packages/modules/flow/
  ├── src/
  │   ├── flow-engine.ts        # 流程引擎
  │   ├── flow-builder.ts       # DSL 构建器
  │   ├── nodes/
  │   │   ├── trigger.ts        # 触发器节点
  │   │   ├── condition.ts      # 条件节点
  │   │   ├── action.ts         # 动作节点
  │   │   └── delay.ts          # 延迟节点
  │   └── index.ts
  └── package.json
```

**Flow DSL 设计：**
```typescript
interface Flow {
  id: string;
  name: string;
  userId: string;
  enabled: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface FlowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  data: any;
}

// 示例：WhatsApp 收到消息 → Telegram 咨询 → WhatsApp 回复
const exampleFlow: Flow = {
  id: 'flow-1',
  name: '客服咨询流程',
  userId: 'user-123',
  enabled: true,
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      data: {
        channel: 'WA',
        event: 'message',
        condition: { contains: ['价格', '报价'] }
      }
    },
    {
      id: 'action-1',
      type: 'action',
      data: {
        channel: 'TG',
        action: 'send',
        target: '@customer_service',
        message: '客户咨询：{{original_message}}'
      }
    },
    {
      id: 'trigger-2',
      type: 'trigger',
      data: {
        channel: 'TG',
        event: 'reply',
        timeout: 300000 // 5分钟
      }
    },
    {
      id: 'action-2',
      type: 'action',
      data: {
        channel: 'WA',
        action: 'send',
        target: '{{original_contact}}',
        message: '{{telegram_reply}}'
      }
    }
  ],
  edges: [
    { from: 'trigger-1', to: 'action-1' },
    { from: 'action-1', to: 'trigger-2' },
    { from: 'trigger-2', to: 'action-2' }
  ]
};
```

**数据库设计：**
```prisma
model Flow {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  enabled     Boolean  @default(true)
  definition  Json     // Flow DSL
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  executions  FlowExecution[]
}

model FlowExecution {
  id          String   @id @default(cuid())
  flowId      String
  flow        Flow     @relation(fields: [flowId], references: [id])
  status      String   // 'running' | 'completed' | 'failed' | 'timeout'
  context     Json     // 执行上下文
  startedAt   DateTime @default(now())
  completedAt DateTime?
  error       String?
}
```

### 阶段 4: 用户界面

#### 4.1 模块管理页面
```typescript
// apps/web/src/pages/Modules.tsx
export function ModulesPage() {
  return (
    <div>
      <h1>模块管理</h1>
      
      {/* WhatsApp 模块 */}
      <ModuleCard
        title="WhatsApp"
        description="WhatsApp 消息收发"
        enabled={userModules.waEnabled}
        onToggle={(enabled) => updateModule('waEnabled', enabled)}
      />
      
      {/* Telegram Bot 模块 */}
      <ModuleCard
        title="Telegram Bot"
        description="Telegram 机器人"
        enabled={userModules.tgBotEnabled}
        settings={<TelegramBotSettings />}
        onToggle={(enabled) => updateModule('tgBotEnabled', enabled)}
      />
      
      {/* AI 模块 */}
      <ModuleCard
        title="AI Assistant"
        description="智能客服助手"
        enabled={userModules.aiEnabled}
        settings={<AISettings />}
        onToggle={(enabled) => updateModule('aiEnabled', enabled)}
      />
      
      {/* Flow 模块 */}
      <ModuleCard
        title="Automation Flow"
        description="自动化工作流"
        enabled={userModules.flowEnabled}
        settings={<FlowBuilder />}
        onToggle={(enabled) => updateModule('flowEnabled', enabled)}
      />
    </div>
  );
}
```

#### 4.2 AI 配置页面
```typescript
// apps/web/src/pages/AISettings.tsx
export function AISettings() {
  return (
    <div>
      <h2>AI 配置</h2>
      
      {/* 提供商选择 */}
      <Select
        label="AI 提供商"
        options={['OpenAI', 'Anthropic', '本地模型']}
        value={aiConfig.provider}
        onChange={setProvider}
      />
      
      {/* API Key 输入 */}
      <Input
        type="password"
        label="API Key"
        value={aiConfig.apiKey}
        onChange={setApiKey}
      />
      
      {/* Prompt 模板选择 */}
      <PromptTemplateSelector
        templates={promptTemplates}
        selected={selectedTemplate}
        onChange={setTemplate}
      />
    </div>
  );
}
```

#### 4.3 Flow 编辑器
```typescript
// apps/web/src/pages/FlowBuilder.tsx
import ReactFlow from 'reactflow';

export function FlowBuilder() {
  return (
    <div className="h-screen">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={customNodeTypes}
      />
      
      {/* 节点面板 */}
      <NodePalette
        nodes={[
          { type: 'trigger', label: '触发器' },
          { type: 'condition', label: '条件' },
          { type: 'action', label: '动作' },
          { type: 'delay', label: '延迟' },
        ]}
      />
    </div>
  );
}
```

## 🚀 实施计划

### Sprint 1 (Week 1-2): Telegram Bot
- [ ] 创建 telegram-bot connector 包
- [ ] 实现基本消息收发
- [ ] 创建 TelegramChannel 胶水层
- [ ] 数据库迁移
- [ ] 测试集成

### Sprint 2 (Week 3-4): Telegram User
- [ ] 创建 telegram-user connector 包
- [ ] 实现电话号码认证
- [ ] 集成到 TelegramChannel
- [ ] 前端认证流程
- [ ] 测试

### Sprint 3 (Week 5-6): AI 模块
- [ ] 创建 ai 模块包
- [ ] 实现 OpenAI 提供商
- [ ] 上下文管理系统
- [ ] Prompt 模板系统
- [ ] 集成到 channels
- [ ] 前端配置页面

### Sprint 4 (Week 7-8): Flow 模块
- [ ] 创建 flow 模块包
- [ ] 实现 Flow Engine
- [ ] 基础节点类型
- [ ] 数据库设计
- [ ] 前端 Flow Builder
- [ ] 测试复杂场景

### Sprint 5 (Week 9): 完善与优化
- [ ] 性能优化
- [ ] 错误处理
- [ ] 日志系统
- [ ] 文档完善
- [ ] 单元测试
- [ ] E2E 测试

## 📐 架构原则

1. **模块独立性**
   - 每个模块可以独立开发、测试、部署
   - 通过明确的接口通信
   - 最小化模块间依赖

2. **可配置性**
   - 用户可以自由启用/禁用模块
   - 每个模块有独立的配置
   - 支持多租户

3. **可扩展性**
   - 易于添加新的 Connector
   - 易于添加新的 AI 提供商
   - 易于添加新的 Flow 节点类型

4. **数据隔离**
   - 每个用户的数据完全隔离
   - AI 上下文独立存储
   - Flow 执行互不影响

## 🎓 技术栈

### Connectors
- **WhatsApp**: @whiskeysockets/baileys
- **Telegram Bot**: node-telegram-bot-api
- **Telegram User**: telegram (MTProto)

### AI
- **OpenAI**: openai
- **Anthropic**: @anthropic-ai/sdk
- **本地**: ollama

### Flow
- **引擎**: 自研状态机
- **编辑器**: reactflow

### 数据库
- **ORM**: Prisma
- **数据库**: PostgreSQL

## 📚 参考资料

- [Baileys](https://github.com/WhiskeySockets/Baileys)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [MTProto](https://core.telegram.org/mtproto)
- [OpenAI API](https://platform.openai.com/docs)
- [React Flow](https://reactflow.dev/)

---

**让我们一起构建强大的模块化通讯平台！** 🚀
