#!/bin/bash

# AI 功能测试脚本
# 用法: ./test-ai-api.sh <JWT_TOKEN>

if [ -z "$1" ]; then
  echo "用法: $0 <JWT_TOKEN>"
  echo "示例: $0 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  exit 1
fi

TOKEN="$1"
BASE_URL="http://localhost:4000"

echo "========================================="
echo "AI 功能 API 测试"
echo "========================================="
echo ""

# 1. 保存 API Key
echo "1️⃣  测试：保存 OpenAI API Key"
curl -X POST "${BASE_URL}/ai/key" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "OPENAI",
    "apiKey": "sk-test-key-12345"
  }' | jq '.'
echo ""
echo ""

# 2. 获取模板列表
echo "2️⃣  测试：获取 AI 模板列表"
curl -X GET "${BASE_URL}/ai/templates" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo ""

# 3. 绑定模板到 WhatsApp（需要先获取模板 ID）
echo "3️⃣  测试：绑定模板到 WhatsApp"
echo "⚠️  请先从上面的模板列表中选择一个 templateId，然后手动执行："
echo ""
echo "TEMPLATE_ID='<从上面复制>' # 例如：cm3h..."
echo "curl -X POST '${BASE_URL}/ai/bind' \\"
echo "  -H 'Authorization: Bearer ${TOKEN}' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"channel\":\"WA\",\"templateId\":\"'\${TEMPLATE_ID}'\",\"enabled\":true}' | jq '.'"
echo ""
echo ""

# 4. 查询 WhatsApp 绑定
echo "4️⃣  测试：查询 WhatsApp 当前绑定"
curl -X GET "${BASE_URL}/ai/bind/WA" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo ""

# 5. 获取模块配置
echo "5️⃣  测试：获取模块配置"
curl -X GET "${BASE_URL}/modules" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo ""

# 6. 启用 AI 模块
echo "6️⃣  测试：启用 AI 模块"
curl -X POST "${BASE_URL}/modules" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "aiEnabled": true
  }' | jq '.'
echo ""
echo ""

# 7. 再次查询模块配置（验证更新）
echo "7️⃣  测试：验证模块配置已更新"
curl -X GET "${BASE_URL}/modules" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo ""

echo "========================================="
echo "测试完成！"
echo "========================================="
echo ""
echo "📝 后续步骤："
echo "1. 打开前端 http://localhost:5173/ai"
echo "2. 配置真实的 API Key"
echo "3. 选择并绑定模板"
echo "4. 启用 AI 模块"
echo "5. 在 WhatsApp 发送消息测试"
echo ""
