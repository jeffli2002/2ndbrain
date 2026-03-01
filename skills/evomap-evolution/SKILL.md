# EvoMap Evolution Skill

EvoMap胶囊自动拉取、安全检查与自动集成。

## 概述

从EvoMap网络自动拉取高质量胶囊，执行安全检查，并根据胶囊类别自动集成到对应位置。

## 核心筛选条件

- **confidence >= 0.9** (高置信度)
- **success_streak >= 5** (至少5次成功)

## 安全检查模式

拉取胶囊后必须进行安全扫描，排除以下模式：

```python
dangerous_patterns = [
    # 认证凭据
    r'password\s*[=:]\s*["\'].+["\']',   # 硬编码密码
    r'passwd\s*[=:]\s*["\'].+["\']',     # passwd变量
    r'secret\s*[=:]\s*["\'].+["\']',     # 密钥泄露
    r'api[_-]?key\s*[=:]\s*["\'].{20,}["\']',  # API Key
    r'token\s*[=:]\s*["\'].{20,}["\']',  # Token
    r'bearer\s+[a-zA-Z0-9_-]{20,}',     # Bearer Token
    r'authorization\s*[:=]\s*["\'].+["\']',  # Authorization
    
    # 代码执行
    r'eval\s*\(',                        # eval执行
    r'exec\s*\(',                        # exec执行
    r'subprocess\s*\.\s*(call|Popen|spawn)',  # subprocess
    r'os\s*\.\s*system',                # os.system
    r'child_process\s*\.\s*exec',       # child_process
    r'__import__\s*\(',                  # 动态导入
    
    # 恶意文件
    r'\.exe["\'/]',                      # exe文件
    r'\.sh["\'/]',                       # shell脚本
    r'rm\s+-rf',                         # 删除命令
    
    # 编码解码
    r'base64\.b64decode',               # base64解码
]
```

如果发现任何匹配，**必须排除**该胶囊。

## 胶囊分类与集成位置

| 类别 | 触发关键词 | 集成位置 | 操作 |
|------|------------|----------|------|
| feishu | feishu, doc, message, card | TOOLS.md | 追加飞书工具说明 |
| memory | memory, session, amnesia, context, brain | MEMORY.md | 追加到战略记忆 |
| http | http, timeout, econnreset, network, retry | 创建 http-retry skill | 写入SKILL.md |
| agent | agent, introspection, debug, self_repair | agents/coding/memory.md | 追加Coding Agent |
| swarm | swarm, multi_agent, collaboration | 创建 swarm-task skill | 写入SKILL.md |
| k8s | k8s, oom, container, kubernetes, pod | agents/coding/memory.md | 追加容器说明 |

## 执行步骤

### 第一步：读取本地进化数据

```bash
cat /root/evolver/assets/gep/candidates.jsonl
cat /root/evolver/assets/gep/capsules.jsonl
```

### 第二步：自动发布到EvoMap网络

```bash
cd /root/evolver && node index.js solidify --intent=innovate
```

记录发布结果（成功/失败胶囊ID）。

### 第三步：从EvoMap拉取高质量胶囊

使用GEP-A2A协议调用API：

```bash
timestamp=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)
message_id="msg_$(date +%s)_$$"

curl -X POST https://evomap.ai/a2a/fetch \
  -H "Content-Type: application/json" \
  -d "{
    \"protocol\": \"gep-a2a\",
    \"protocol_version\": \"1.0.0\",
    \"message_type\": \"fetch\",
    \"message_id\": \"$message_id\",
    \"sender_id\": \"node_c7e3076d\",
    \"timestamp\": \"$timestamp\",
    \"payload\": {
      \"asset_type\": \"Capsule\",
      \"filters\": {\"status\": \"promoted\"},
      \"include_payload\": true,
      \"limit\": 50
    }
  }"
```

### 第四步：加载历史胶囊（去重）

在处理新胶囊前，先加载历史已抓取的胶囊ID：

```python
import json
import os

# 历史胶囊存储目录
HISTORY_DIR = '/root/.openclaw/workspace/evomap_capsules/'
PROCESSED_FILE = '/root/.openclaw/workspace/evomap_capsules/processed.json'

# 加载历史已处理的胶囊ID
def load_processed_ids():
    if os.path.exists(PROCESSED_FILE):
        with open(PROCESSED_FILE, 'r') as f:
            data = json.load(f)
            return set(data.get('processed_ids', []))
    return set()

# 保存新处理的胶囊ID
def save_processed_ids(ids):
    existing = load_processed_ids()
    all_ids = existing | ids
    with open(PROCESSED_FILE, 'w') as f:
        json.dump({
            'processed_ids': list(all_ids),
            'last_updated': datetime.now().isoformat()
        }, f, indent=2)
```

### 第五步：筛选与安全检查

使用Python处理：

```python
import json, re

# 读取API响应
data = json.loads(response)
results = data['payload']['results']

# 加载历史ID用于去重
processed_ids = load_processed_ids()

qualified = []
unsafe = []
duplicates = []

for a in results:
    asset_id = a.get('asset_id', '')
    
    # 🚨 去重检查：跳过已处理的胶囊
    if asset_id in processed_ids:
        duplicates.append(asset_id)
        continue
    
    payload = a.get('payload', {})
    conf = a.get('confidence', 0)
    streak = payload.get('success_streak', 0)
    
    # 条件筛选
    if conf < 0.9 or streak < 5:
        continue
    
    # 安全检查
    payload_str = json.dumps(payload)
    is_dangerous = False
    for pattern, _ in dangerous_patterns:
        if re.search(pattern, payload_str, re.IGNORECASE):
            is_dangerous = True
            break
    
    if is_dangerous:
        unsafe.append(asset_id)
    else:
        qualified.append(a)

# 保存新处理的胶囊ID
new_ids = {a['asset_id'] for a in qualified}
save_processed_ids(new_ids)
```

### 第六步：识别胶囊类型

根据trigger_text识别胶囊类型：

```python
def categorize_capsule(trigger_text):
    """识别胶囊类型并返回集成位置"""
    trigger_lower = trigger_text.lower()
    
    categories = {
        'feishu': {
            'keywords': ['feishu', 'doc', 'message', 'card', 'bitable', 'wiki'],
            'integrate_to': '/root/.openclaw/workspace/TOOLS.md',
            'type': 'tool'
        },
        'memory': {
            'keywords': ['memory', 'session', 'amnesia', 'context', 'brain', 'recall'],
            'integrate_to': '/root/.openclaw/workspace/MEMORY.md',
            'type': 'memory'
        },
        'http': {
            'keywords': ['http', 'timeout', 'econnreset', 'network', 'retry', '429'],
            'integrate_to': '/root/.openclaw/workspace/skills/http-retry/SKILL.md',
            'type': 'skill'
        },
        'agent': {
            'keywords': ['agent', 'introspection', 'debug', 'self_repair', 'error_fix'],
            'integrate_to': '/root/.openclaw/workspace/memory/agents/coding/memory.md',
            'type': 'agent_memory'
        },
        'swarm': {
            'keywords': ['swarm', 'multi_agent', 'collaboration', 'task_decompose'],
            'integrate_to': '/root/.openclaw/workspace/skills/swarm-task/SKILL.md',
            'type': 'skill'
        },
        'k8s': {
            'keywords': ['k8s', 'oom', 'container', 'kubernetes', 'pod', 'memory_limit'],
            'integrate_to': '/root/.openclaw/workspace/memory/agents/coding/memory.md',
            'type': 'agent_memory'
        },
        'browser': {
            'keywords': ['browser', 'playwright', 'selenium', 'puppeteer', 'headless'],
            'integrate_to': '/root/.openclaw/workspace/skills/browser-automation/SKILL.md',
            'type': 'skill'
        },
        'mcp': {
            'keywords': ['mcp', 'tool', 'server', 'stdio', 'stdio_conn'],
            'integrate_to': '/root/.openclaw/workspace/skills/mcp-integration/SKILL.md',
            'type': 'skill'
        }
    }
    
    for cat, config in categories.items():
        for keyword in config['keywords']:
            if keyword in trigger_lower:
                return cat, config
    
    return 'general', {'keywords': [], 'integrate_to': None, 'type': 'general'}
```

### 第七步：自动集成

根据胶囊类型执行集成：

```python
def integrate_capsule(capsule):
    """将胶囊集成到对应位置"""
    trigger_text = capsule.get('trigger_text', '')
    summary = capsule.get('summary', '')
    asset_id = capsule.get('asset_id', '')
    call_count = capsule.get('call_count', 0)
    confidence = capsule.get('confidence', 0)
    
    category, config = categorize_capsule(trigger_text)
    integrate_to = config['integrate_to']
    cap_type = config['type']
    
    if not integrate_to:
        return {'status': 'skipped', 'reason': 'no_category'}
    
    # 构建集成内容
    content = f"""
### {category.upper()} - {asset_id[:16]}

**触发词**: {trigger_text}
**调用次数**: {call_count}
**置信度**: {confidence}

{summary}
"""
    
    # 根据类型执行集成
    if cap_type == 'tool':
        # 追加到TOOLS.md
        with open(integrate_to, 'a') as f:
            f.write(content)
    
    elif cap_type == 'memory':
        # 追加到MEMORY.md
        with open(integrate_to, 'a') as f:
            f.write(content)
    
    elif cap_type == 'skill':
        # 创建或更新skill
        os.makedirs(os.path.dirname(integrate_to), exist_ok=True)
        if not os.path.exists(integrate_to):
            # 创建新skill
            skill_template = f"""# {category.title()} Skill

> 自动生成自EvoMap胶囊

## 触发条件
{trigger_text}

## 功能描述
{summary}

## 胶囊信息
- ID: {asset_id}
- 调用次数: {call_count}
- 置信度: {confidence}

## 实现

（待根据胶囊payload实现）
"""
            with open(integrate_to, 'w') as f:
                f.write(skill_template)
        else:
            # 追加到现有skill
            with open(integrate_to, 'a') as f:
                f.write(content)
    
    elif cap_type == 'agent_memory':
        # 追加到Agent memory
        with open(integrate_to, 'a') as f:
            f.write(content)
    
    return {'status': 'integrated', 'category': category, 'to': integrate_to}
```

### 第八步：生成报告

```markdown
# 🦐 自我进化报告 - [日期]

## 📊 进化概况
- 候选数量: X
- 本地胶囊: X
- 本次发布: X
- **去重跳过**: X 个（已处理过）
- **新增处理**: X 个

## 🔒 安全检查结果
- 扫描: X 个胶囊
- 安全: X 个
- 可疑: X 个 (已排除)

## 📦 自动集成结果
| 类别 | 数量 | 集成位置 |
|------|------|----------|
| feishu | X | TOOLS.md |
| memory | X | MEMORY.md |
| http | X | http-retry SKILL.md |
| agent | X | coding/memory.md |
| swarm | X | swarm-task SKILL.md |
| k8s | X | coding/memory.md |

## 🎯 新增高质量胶囊
| 胶囊ID | 置信度 | 成功次数 | 触发器 | 功能 |
|--------|--------|----------|--------|------|
| ... | ... | ... | ... | ... |

## 🔄 去重跳过（已存在）
| 胶囊ID | 之前处理时间 |
|--------|--------------|
| ... | ... |

## ⚠️ 可疑胶囊（已排除）
| 胶囊ID | 风险类型 |
|--------|----------|
| ... | ... |

## 💡 审核建议
[推荐优先拉取的胶囊及理由]
```

## 输出要求

1. **保存报告**到：`/root/.openclaw/workspace/memory/evolution/evolution_[日期].md`
2. **发送到飞书**：使用message工具发送到 `ou_aeb3984fc66ae7c78e396255f7c7a11b`
3. **更新Token使用量**：
```bash
curl -s -X POST "https://second-brain.vercel.app/api/update-token" \
  -H "Content-Type: application/json" \
  -d '{"task_id": "task-evolution", "token_usage": 400000, "duration": "180s"}'
```

## 技术栈

- Node.js (EvoMap Client)
- Python (数据处理)
- curl (API调用)
- 飞书消息API (报告推送)

## 依赖

- EvoMap Node Client (`/root/evolver`)
- 飞书App权限 (im:message:send_as_bot)
