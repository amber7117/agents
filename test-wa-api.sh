#!/bin/bash

# WhatsApp API 测试脚本
# 使用方法: ./test-wa-api.sh <your-jwt-token>

set -e

# 配置
API_BASE="http://localhost:3000"
TOKEN="${1:-}"

if [ -z "$TOKEN" ]; then
  echo "错误: 请提供 JWT Token"
  echo "使用方法: $0 <jwt-token>"
  echo ""
  echo "示例:"
  echo "  $0 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  exit 1
fi

echo "======================================"
echo "WhatsApp API 测试"
echo "API: $API_BASE"
echo "======================================"
echo ""

# 测试 1: 获取 WhatsApp 状态
echo "📊 测试 1: GET /channels/wa/status"
echo "--------------------------------------"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/channels/wa/status" | jq '.'
echo ""
echo ""

# 测试 2: 启动 WhatsApp 连接
echo "🚀 测试 2: POST /channels/wa/start"
echo "--------------------------------------"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/channels/wa/start" | jq '.'
echo ""
echo ""

# 等待几秒让连接建立
echo "⏳ 等待 5 秒..."
sleep 5
echo ""

# 测试 3: 再次检查状态
echo "📊 测试 3: GET /channels/wa/status (连接后)"
echo "--------------------------------------"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/channels/wa/status" | jq '.'
echo ""
echo ""

# 测试 4: 发送消息 (需要替换真实的 JID)
# 取消注释下面的代码来测试发送消息
# TO_JID="6012xxxxxxxx@s.whatsapp.net"  # 替换为真实的 JID
# echo "📤 测试 4: POST /channels/wa/send"
# echo "--------------------------------------"
# curl -s -X POST \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   -d "{\"to\":\"$TO_JID\",\"text\":\"Hello from API test!\"}" \
#   "$API_BASE/channels/wa/send" | jq '.'
# echo ""
# echo ""

# 测试 5: 停止 WhatsApp 连接
echo "🛑 测试 5: POST /channels/wa/stop"
echo "--------------------------------------"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/channels/wa/stop" | jq '.'
echo ""
echo ""

# 测试 6: 检查停止后的状态
echo "📊 测试 6: GET /channels/wa/status (停止后)"
echo "--------------------------------------"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/channels/wa/status" | jq '.'
echo ""
echo ""

echo "======================================"
echo "✅ 测试完成！"
echo "======================================"
