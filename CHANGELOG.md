# 更新日志

本文档记录所有重要的项目变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2025-11-07

### ✨ 新增

#### 模块化架构
- 创建 `@pkg/connectors-core` 包，定义通用 `ChatConnector` 接口
- 创建 `@pkg/connectors-whatsapp` 包，封装 Baileys WhatsApp 实现
- 实现 `BaileysConnector` 类，支持：
  - 自动重连（最多 5 次）
  - 会话持久化
  - QR 码登录
  - 消息收发
  - 状态管理

#### API 胶水层
- 创建 `apps/api/src/channels/whatsapp.ts`
- 实现 `WhatsAppChannel` 类，负责：
  - Connector 和 Socket.IO 事件映射
  - 数据库同步（Contact, Chat, Message, ChannelSession）
  - 错误处理

#### 数据库增强
- 新增 `Channel` 枚举：`WA` (WhatsApp), `TG` (Telegram)
- 新增 `UserModule` 模型：
  - `waEnabled` - WhatsApp 模块开关
  - `tgEnabled` - Telegram 模块开关
  - `aiEnabled` - AI 模块开关
  - `flowEnabled` - Flow 模块开关
- 新增 `ChannelSession` 模型：
  - 追踪频道连接状态
  - 记录 QR 码生成时间
  - 记录最后连接时间

#### 文档
- ✅ **ARCHITECTURE.md** - 详细的架构设计文档
- ✅ **MIGRATION_GUIDE.md** - 迁移指南
- ✅ **ROADMAP.md** - 功能路线图
- ✅ **QUICK_START.md** - 快速入门指南
- ✅ **WHATSAPP_REFACTOR_SUMMARY.md** - 重构总结
- ✅ **README_NEW.md** - 更新的 README
- ✅ **.env.example** - 环境变量示例

### 🔄 变更

#### Socket.IO 集成
- 重构 `apps/api/src/socket.ts`
- 移除旧的 `WARegistry` 依赖
- 使用新的 `WhatsAppChannel` 类
- 保持前端事件完全兼容

#### 包依赖
- 更新 `apps/api/package.json`：
  - 添加 `@pkg/connectors-core` workspace 依赖
  - 添加 `@pkg/connectors-whatsapp` workspace 依赖
- 更新根 `package.json`：
  - 更新 workspace 配置支持 `packages/*/*`
  - 添加并行开发脚本

### 🗑️ 废弃

- ⚠️ `apps/api/src/wa/manager.ts` - 替换为新的 Connector 架构
- ⚠️ `apps/api/src/wa/types.ts` - 类型定义移至 Connector 包

### 🐛 修复

- 修复 TypeScript 类型错误
- 修复 Workspace 依赖解析问题
- 优化 Baileys 重连逻辑

### 🔒 安全

- JWT 验证保持不变
- 用户会话隔离
- 凭证文件权限控制

---

## [0.9.0] - 2025-11-06

### ✨ 新增

#### 数据库同步优化
- 优化消息同步逻辑
- 添加批量操作支持
- 改进联系人同步

#### 前端界面
- 修复消息显示问题
- 优化聊天列表性能
- 改进搜索功能

### 🐛 修复

- 修复消息重复显示问题
- 修复联系人同步延迟
- 修复 QR 码不刷新问题

---

## [0.8.0] - 2025-11-05

### ✨ 新增

#### 基础功能
- WhatsApp 连接和认证
- 消息收发
- 联系人管理
- 聊天列表
- 用户注册/登录

#### 技术栈
- Express + Socket.IO 后端
- Vite + React 前端
- Prisma + PostgreSQL 数据库
- Baileys WhatsApp 库

---

## 版本计划

### [1.1.0] - 预计 2025-11

#### 计划新增
- Telegram Bot Connector
- Telegram User Connector
- 频道切换界面
- 模块管理页面

### [1.2.0] - 预计 2025-12

#### 计划新增
- AI 模块（OpenAI 集成）
- Prompt 模板系统
- 上下文管理
- AI 配置界面

### [1.3.0] - 预计 2026-01

#### 计划新增
- Flow 引擎
- Flow Builder UI
- 跨平台自动化
- 条件路由

### [2.0.0] - 预计 2026-Q1

#### 主要变更
- 微服务架构
- gRPC 内部通讯
- 消息队列（RabbitMQ）
- 集群部署支持

---

## 贡献指南

如果您想为这个项目做出贡献，请：

1. Fork 仓库
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

### 提交消息格式

```
<类型>(<范围>): <简短描述>

<详细描述>

<关联 Issue>
```

**类型：**
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具链

**示例：**
```
feat(connector): 添加 Telegram Bot Connector

- 实现 ChatConnector 接口
- 添加 Bot Token 配置
- 支持消息收发和命令处理

Closes #123
```

---

## 联系方式

- 问题反馈: [GitHub Issues](https://github.com/your-repo/issues)
- 邮件: herbert@example.com
- 文档: [项目文档](./README.md)

---

**最后更新:** 2025-11-07  
**维护者:** Herbert Lim
