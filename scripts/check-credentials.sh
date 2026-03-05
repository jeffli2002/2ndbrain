#!/bin/bash
# 检查凭据文件是否完整

echo "=== 凭据文件检查 ==="
echo ""

CREDENTIALS_DIR="/root/.openclaw/credentials"
EXPECTED_FILES=(
    "agentmail.json"
    "browser-use.json"
    "twitter.json"
    "github.json"
    "wechat.json"
    "youtube.json"
)

all_ok=true

for file in "${EXPECTED_FILES[@]}"; do
    if [ -f "$CREDENTIALS_DIR/$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (缺失)"
        all_ok=false
    fi
done

echo ""
if [ "$all_ok" = true ]; then
    echo "🎉 所有凭据文件齐全!"
else
    echo "⚠️ 部分凭据文件缺失"
fi
