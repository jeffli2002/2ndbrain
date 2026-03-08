#!/bin/bash
# EvoMap 胶囊自动拉取脚本 (已修复 v3)
# 条件: confidence >= 0.9 AND success_streak >= 5

LOG_FILE="/root/.openclaw/workspace/logs/evomap_pull_$(date +%Y%m%d).log"
CAPSULES_DIR="/root/.openclaw/workspace/capsules/pending"
CREDENTIALS_FILE="/root/.openclaw/credentials/evomap.json"
RESPONSE_FILE="/tmp/evomap_response_$$.json"

# 确保目录存在
mkdir -p "$(dirname "$LOG_FILE")" "$CAPSULES_DIR"

echo "=== $(date) 胶囊拉取开始 ===" >> "$LOG_FILE"

# 读取或生成 node_id 和 node_secret
if [ -f "$CREDENTIALS_FILE" ]; then
    NODE_ID=$(cat "$CREDENTIALS_FILE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('node_id',''))" 2>/dev/null)
    NODE_SECRET=$(cat "$CREDENTIALS_FILE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('node_secret',''))" 2>/dev/null)
fi

# 如果没有凭证，先注册节点
if [ -z "$NODE_ID" ] || [ -z "$NODE_SECRET" ]; then
    echo "首次运行，注册 EvoMap 节点..." >> "$LOG_FILE"
    
    timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    message_id="msg_$(date +%s)_$RANDOM"
    new_node_id="node_$(openssl rand -hex 8)"
    
    hello_response=$(curl -s -X POST "https://evomap.ai/a2a/hello" \
      -H "Content-Type: application/json" \
      -d "{
        \"protocol\": \"gep-a2a\",
        \"protocol_version\": \"1.0.0\",
        \"message_type\": \"hello\",
        \"message_id\": \"$message_id\",
        \"sender_id\": \"$new_node_id\",
        \"timestamp\": \"$timestamp\",
        \"payload\": {
          \"capabilities\": {},
          \"gene_count\": 0,
          \"capsule_count\": 0,
          \"env_fingerprint\": {
            \"platform\": \"linux\",
            \"arch\": \"x64\"
          }
        }
      }")
    
    # 提取 node_id 和 node_secret
    NODE_ID=$(echo "$hello_response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('payload',{}).get('your_node_id',''))")
    NODE_SECRET=$(echo "$hello_response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('payload',{}).get('node_secret',''))")
    
    if [ -n "$NODE_ID" ] && [ -n "$NODE_SECRET" ]; then
        echo "{\"node_id\": \"$NODE_ID\", \"node_secret\": \"$NODE_SECRET\"}" > "$CREDENTIALS_FILE"
        chmod 600 "$CREDENTIALS_FILE"
        echo "节点注册成功: $NODE_ID" >> "$LOG_FILE"
    else
        echo "节点注册失败!" >> "$LOG_FILE"
        exit 1
    fi
fi

echo "使用节点: $NODE_ID" >> "$LOG_FILE"

# 1. 从EvoMap获取胶囊 (带认证)
timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
message_id="msg_$(date +%s)_$RANDOM"

curl -s -X POST "https://evomap.ai/a2a/fetch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NODE_SECRET" \
  -d "{
    \"protocol\": \"gep-a2a\",
    \"protocol_version\": \"1.0.0\",
    \"message_type\": \"fetch\",
    \"message_id\": \"$message_id\",
    \"sender_id\": \"$NODE_ID\",
    \"timestamp\": \"$timestamp\",
    \"payload\": {
      \"asset_type\": \"Capsule\",
      \"include_tasks\": true,
      \"limit\": 50
    }
  }" > "$RESPONSE_FILE"

# 检查响应是否有效
if ! python3 -c "import json; json.load(open('$RESPONSE_FILE'))" 2>/dev/null; then
    echo "API 响应无效" >> "$LOG_FILE"
    cat "$RESPONSE_FILE" >> "$LOG_FILE"
    rm -f "$RESPONSE_FILE"
    exit 1
fi

# 检查是否有错误
error_msg=$(python3 -c "import json; d=json.load(open('$RESPONSE_FILE')); print(d.get('error',''))")
if [ -n "$error_msg" ]; then
    echo "API 错误: $error_msg" >> "$LOG_FILE"
    if [[ "$error_msg" == *"secret"* ]] || [[ "$error_msg" == *"auth"* ]]; then
        rm -f "$CREDENTIALS_FILE"
        echo "凭证已删除，下次运行将重新注册" >> "$LOG_FILE"
    fi
    rm -f "$RESPONSE_FILE"
    exit 1
fi

echo "API 响应正常，开始处理..." >> "$LOG_FILE"

# 2. Python处理: 筛选 + 安全检查
python3 /dev/stdin "$RESPONSE_FILE" "$LOG_FILE" "$CAPSULES_DIR" << 'PYEOF'
import json, re, os, sys
from datetime import datetime

RESPONSE_FILE = sys.argv[1]
LOG_FILE = sys.argv[2]
CAPSULES_DIR = sys.argv[3]
PROCESSED_FILE = os.path.join(os.path.dirname(CAPSULES_DIR), "processed.json")

os.makedirs(CAPSULES_DIR, exist_ok=True)

# 读取已处理的capsules
processed_ids = set()
if os.path.exists(PROCESSED_FILE):
    try:
        with open(PROCESSED_FILE) as f:
            processed_ids = set(json.load(f))
    except:
        pass

# 读取API响应
try:
    with open(RESPONSE_FILE) as f:
        data = json.load(f)
except json.JSONDecodeError as e:
    with open(LOG_FILE, 'a') as log:
        print(f"解析响应失败: {e}", file=log)
    sys.exit(1)

# 从 payload.results 读取
results = data.get('payload', {}).get('results', [])

# 安全检查模式
dangerous_patterns = [
    (r'password\s*[=:]\s*["\'].+["\']', '硬编码密码'),
    (r'secret\s*[=:]\s*["\'].+["\']', '密钥泄露'),
    (r'api[_-]?key\s*[=:]\s*["\'].{20,}["\']', 'API Key'),
    (r'eval\s*\(', 'eval执行'),
    (r'exec\s*\(', 'exec执行'),
    (r'os\s*\.\s*system', 'os.system'),
]

qualified = []
unsafe = []
already_processed = []
new_processed = []

for a in results:
    payload = a.get('payload', {})
    conf = payload.get('confidence', 0)
    streak = payload.get('success_streak', 0)
    asset_id = a.get('asset_id', '')
    aid = asset_id.split(':')[-1][:16] if ':' in asset_id else asset_id[:16]
    
    # 去重检查
    if asset_id in processed_ids:
        already_processed.append(aid)
        continue
    
    # 条件筛选 (confidence >= 0.9 AND success_streak >= 5)
    if conf < 0.9 or streak < 5:
        continue
    
    # 安全检查
    payload_str = json.dumps(payload)
    is_dangerous = False
    found_risks = []
    for pattern, desc in dangerous_patterns:
        if re.search(pattern, payload_str, re.IGNORECASE):
            is_dangerous = True
            found_risks.append(desc)
    
    if is_dangerous:
        unsafe.append((aid, found_risks))
    else:
        # 保存胶囊
        filename = f'{CAPSULES_DIR}/{aid}.json'
        with open(filename, 'w') as f:
            json.dump(a, f, indent=2)
        qualified.append((aid, conf, streak))
        new_processed.append(asset_id)

# 保存已处理的capsules
if new_processed:
    processed_ids.update(new_processed)
    with open(PROCESSED_FILE, 'w') as f:
        json.dump(list(processed_ids), f)

# 输出日志
now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
with open(LOG_FILE, 'a') as log:
    print(f"=== {now} ===", file=log)
    print(f"获取: {len(results)} 个胶囊", file=log)
    print(f"已处理过: {len(already_processed)} 个", file=log)
    print(f"符合条件+安全: {len(qualified)} 个", file=log)
    print(f"可疑(已排除): {len(unsafe)} 个", file=log)
    for aid, conf, streak in qualified:
        print(f"  + {aid}: conf={conf}, streak={streak}", file=log)
    for aid, risks in unsafe:
        print(f"  - {aid}: {risks}", file=log)
    print("", file=log)

print(f"成功保存 {len(qualified)} 个新胶囊")
PYEOF

# 清理临时文件
rm -f "$RESPONSE_FILE"

echo "=== 胶囊拉取完成 ===" >> "$LOG_FILE"
