# 🚀 WA Business Desk

> **专业的 WhatsApp 业务管理平台** - 功能强大、界面精美的企业级 WhatsApp Web 客户端

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

## ✨ 主要特性

### 🎨 **现代化 UI 设计**
- 深色主题界面，符合现代审美
- 游戏化视觉元素和渐变色彩
- 响应式设计，完美适配各种设备
- 流畅的动画效果和交互体验

### 🔐 **完整的用户系统**
- 安全的用户注册和登录
- JWT 令牌认证
- 密码强度检测
- 表单验证和错误处理

### 💬 **实时消息功能**
- 基于 Socket.IO 的实时通信
- 支持接收和发送 WhatsApp 消息
- 多联系人聊天管理
- 消息历史记录

### 📱 **WhatsApp 集成**
- 基于 Baileys 库的 WhatsApp Web 协议
- QR 码扫描连接
- 多设备会话管理
- 自动重连机制

## 🛠️ 技术栈

### 前端 (apps/web)
- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **React Router** - 路由管理
- **Socket.IO Client** - 实时通信
- **Axios** - HTTP 客户端

### 后端 (apps/api)
- **Node.js** - 运行时环境
- **Express.js** - Web 框架
- **Socket.IO** - 实时通信服务器
- **Baileys** - WhatsApp Web API
- **JWT** - 身份验证
- **Prisma** - 数据库 ORM

### 数据库 (packages/db)
- **SQLite** - 默认数据库（可切换到 PostgreSQL）
- **Prisma** - 数据库管理和迁移

## 🚀 快速开始

### 1. 环境要求
- **Node.js** 18+ 
- **pnpm** 9+
- **现代浏览器** (Chrome, Firefox, Safari, Edge)

### 2. 一键启动
```bash
# 克隆项目并进入目录
cd /Users/herbertlim/Downloads/wa

# 运行启动脚本（自动安装依赖、配置环境、启动服务）
./start.sh
```

### 3. 手动安装（可选）
```bash
# 安装依赖
pnpm install

# 复制环境配置文件
cp apps/api/.env.example apps/api/.env

# 生成数据库客户端
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# 启动开发服务器
pnpm dev
```

## 🌐 访问地址

- **前端界面**: http://localhost:5173
- **后端API**: http://localhost:4000

## 📖 使用指南

### 1. **用户注册**
- 访问前端地址
- 点击"立即注册"
- 填写完整信息（邮箱、密码、姓名等）
- 系统会自动验证密码强度和邮箱格式

### 2. **登录系统**
- 使用注册的邮箱和密码登录
- 系统会自动保存登录状态

### 3. **连接 WhatsApp**
- 登录后进入 Dashboard
- 使用手机 WhatsApp 扫描二维码
- 等待连接成功提示

### 4. **开始聊天**
- 进入聊天界面
- 从联系人列表选择或添加新联系人
- 开始发送和接收消息

## 📁 项目结构

```
wa-business-desk/
├── 📁 packages/
│   └── 📁 db/                    # 数据库包
│       ├── prisma/schema.prisma  # 数据库模式
│       └── src/index.ts         # 数据库客户端
├── 📁 apps/
│   ├── 📁 api/                  # 后端应用
│   │   ├── src/
│   │   │   ├── index.ts         # 服务器入口
│   │   │   ├── auth.ts          # 身份验证
│   │   │   ├── socket.ts        # Socket.IO 配置
│   │   │   └── wa/manager.ts    # WhatsApp 管理器
│   │   └── .env.example         # 环境配置模板
│   └── 📁 web/                  # 前端应用
│       ├── src/
│       │   ├── App.tsx          # 主应用组件
│       │   ├── pages/           # 页面组件
│       │   └── components/      # 可复用组件
│       └── index.html           # HTML 模板
├── package.json                 # 根配置文件
├── pnpm-workspace.yaml         # 工作空间配置
└── start.sh                    # 启动脚本
```

## ⚙️ 配置说明

### 环境变量配置 (`apps/api/.env`)

```env
# 服务器端口
PORT=4000

# JWT 密钥（生产环境请更改）
JWT_SECRET=your_super_secret_key_here

# 数据库连接（相对于 packages/db 目录）
DATABASE_URL="file:../data.sqlite"

# CORS 源（前端地址）
CORS_ORIGIN=http://localhost:5173
```

### 数据库配置

默认使用 SQLite，如需切换到 PostgreSQL：

1. 修改 `packages/db/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // 改为 postgresql
  url      = env("DATABASE_URL")
}
```

2. 更新 `DATABASE_URL`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/wa_business_desk"
```

## 🎨 界面预览

### 🔐 登录页面
- 现代化登录界面，支持密码显示/隐藏
- 实时表单验证和错误提示
- 渐变色彩和动画效果

### 📝 注册页面
- 完整的用户注册流程
- 密码强度实时检测
- 邮箱格式验证
- 服务条款提示

### 🏠 Dashboard
- 美观的卡片式布局
- WhatsApp 连接状态显示
- QR 码扫描指导
- 快速操作按钮

### 💬 聊天界面
- 现代化聊天 UI
- 联系人列表管理
- 实时消息收发
- 连接状态监控

## ⚠️ 重要提醒

> **免责声明**: 本项目使用非官方的 Baileys 库连接 WhatsApp。使用此类工具可能违反 WhatsApp 的服务条款，并可能导致账户暂时或永久封禁。请仅在您拥有并有权自动化的账户上使用，风险自负。

### 安全建议
- 仅在测试账户上使用
- 定期备份聊天数据
- 不要用于垃圾信息发送
- 遵守当地法律法规

## 🔧 故障排除

### 常见问题

**1. pnpm 命令未找到**
```bash
npm install -g pnpm
```

**2. 端口占用**
```bash
# 检查端口占用
lsof -i :4000
lsof -i :5173

# 终止占用进程
kill -9 <PID>
```

**3. 数据库连接失败**
- 检查 `.env` 文件配置
- 确保数据库文件权限正确
- 重新运行数据库迁移

**4. WhatsApp 连接失败**
- 确保手机和电脑在同一网络
- 清除浏览器缓存
- 重新扫描 QR 码

## 🚧 开发计划

### 即将推出的功能
- [ ] 群组消息支持
- [ ] 文件发送功能
- [ ] 消息搜索和过滤
- [ ] 聊天记录导出
- [ ] 多语言支持
- [ ] 主题自定义
- [ ] 消息模板
- [ ] 自动回复功能

### 技术改进
- [ ] 性能优化
- [ ] 错误监控
- [ ] 单元测试
- [ ] Docker 部署
- [ ] CI/CD 流水线

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发环境设置
1. Fork 本仓库
2. 创建特性分支
3. 提交更改
4. 创建 Pull Request

### 代码规范
- 使用 TypeScript 进行开发
- 遵循 ESLint 配置
- 编写清晰的提交信息
- 添加必要的注释

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [React](https://reactjs.org/) - 前端框架
- [Node.js](https://nodejs.org/) - 后端运行时
- [Prisma](https://www.prisma.io/) - 数据库工具
- [Socket.IO](https://socket.io/) - 实时通信

---

<div align="center">

**🌟 如果这个项目对您有帮助，请考虑给它一个 Star！**

</div>