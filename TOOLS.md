# TOOLS.md - Local Notes

---

## 📋 凭据管理规范 (2026-03-05 强制执行)

**核心原则**：所有敏感凭据必须存储在 `/root/.openclaw/credentials/` 目录下，SKILL.md 和代码只引用变量。

### 凭据文件位置

| 服务 | 配置文件 | 状态 |
|------|----------|------|
| AgentMail | `credentials/agentmail.json` | ✅ 已配置 |
| Browser-Use | `credentials/browser-use.json` | ✅ 已配置 |
| Twitter | `credentials/twitter.json` | ✅ 已配置 |
| GitHub | `credentials/github.json` | ✅ 已配置 |
| 微信公众号 | `credentials/wechat.json` | ✅ 已配置 |
| YouTube | `credentials/youtube.json` | ⚠️ 需填入API Key |
| Supabase | `credentials/supabase.json` | ✅ 已配置 |

### 读取凭据

```bash
# 方式1: 从文件读取
cat /root/.openclaw/credentials/agentmail.json | jq -r '.api_key'

# 方式2: 设置环境变量
export $(cat /root/.openclaw/credentials/agentmail.json | jq -r 'to_entries | map("\(.key)=\(.value)") | join(" ")')
```

### 检查凭据
```bash
bash /root/.openclaw/workspace/scripts/check-credentials.sh
```

---

## 🔧 Skill 凭据规范

### 已更新的 Skills

| Skill | 凭据位置 | 引用方式 |
|-------|----------|----------|
| content-factory | credentials/wechat.json | 从文件读取 |
| agentmail | credentials/agentmail.json | $AGENTMAIL_API_KEY |
| youtube | credentials/youtube.json | 从文件读取 |
| xiaohongshu-skills | credentials/xiaohongshu.json | 从文件读取 cookies（登录态备份） |
| notebooklm-skill | skills 目录 | browser_state/ |

### 规范说明

所有 SKILL.md 中：
- ❌ 禁止直接写明文 API Key
- ✅ 必须引用 credentials/ 目录下的文件
- ✅ 使用环境变量或从文件读取

---

## 🔧 工具配置

### AgentMail (Email)
- **Email:** jeffai@agentmail.to
- **配置位置:** `credentials/agentmail.json`
- **变量:** `$AGENTMAIL_API_KEY`

### Browser-Use (Cloud Browser)
- **配置位置:** `credentials/browser-use.json`
- **变量:** `$BROWSER_USE_API_KEY`
- **Live View:** https://live.browser-use.com

### Twitter/X (via xreach)
- **配置位置:** `credentials/twitter.json`
- **变量:** `$XREACH_AUTH_TOKEN`, `$XREACH_CT0`

### GitHub
- **配置位置:** `credentials/github.json`
- **变量:** `$GITHUB_TOKEN`

### 微信公众号
- **AppID:** wxf9400829e3405317
- **配置位置:** `credentials/wechat.json`
- **变量:** `$WECHAT_APP_ID`, `$WECHAT_APP_SECRET`

### YouTube
- **配置位置:** `credentials/youtube.json`
- **变量:** `$YOUTUBE_API_KEY`
- **状态:** ⚠️ 需要填入 API Key

### Supabase
- **配置位置:** `credentials/supabase.json`
- **变量:** `$SUPABASE_URL`, `$SUPABASE_ANON_KEY`, `$SUPABASE_SERVICE_KEY`
- **用途:** Second Brain 项目数据与任务 token 使用量同步

### 小红书
- **配置位置:** `credentials/xiaohongshu.json`
- **用途:** 保存可复用的小红书 cookies / 登录态备份
- **说明:** 优先用于 creator 发布页登录恢复与发布测试

---

## 🧠 收到新凭据的处理流程

```
用户给凭据 → 立即执行:
  1. 写入 memory/daily/YYYY-MM-DD.md
  2. 创建/更新 credentials/xxx.json
  3. 更新 TOOLS.md (变量引用)
  4. 检查相关 SKILL.md 是否需要更新
```

---

## 📦 其他工具

### 搜索
- Tavily: `credentials/tavily.json` (如需要)
- Brave: `credentials/brave.json` (如需要)

### YouTube
- yt-dlp: 已安装

---

> ⚠️ 注意：此文件为脱敏版本，仅包含变量引用。完整凭据请查看 credentials/ 目录
