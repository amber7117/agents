#!/bin/bash

# WA Business Desk 启动脚本
echo "🚀 启动 WA Business Desk..."
echo ""

# 检查pnpm是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装，请先安装 pnpm:"
    echo "npm install -g pnpm"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖包..."
pnpm install

# 检查环境变量文件
if [ ! -f "apps/api/.env" ]; then
    echo "⚙️  创建环境配置文件..."
    cp apps/api/.env.example apps/api/.env
    echo "✅ 已创建 apps/api/.env 文件，请根据需要修改配置"
fi

# 生成Prisma客户端
echo "🗄️  初始化数据库..."
pnpm prisma:generate

# 运行数据库迁移
echo "🔄 运行数据库迁移..."
pnpm prisma:migrate

echo ""
echo "✅ 初始化完成！"
echo ""
echo "🌐 访问地址:"
echo "   - 前端: http://localhost:5173"
echo "   - 后端: http://localhost:4000"
echo ""
echo "🚀 启动开发服务器..."
echo ""

# 启动开发服务器
pnpm dev