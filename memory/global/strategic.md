# 战略记忆 - 虾仔的长期记忆

> 最后更新: 2026-03-05 22:05

---

## 📊 Memory 提炼 | 2026-03-05 22:05

### 今日核心进展

**Skills日常检查** (2026-03-05 22:00)
- 已安装: agentmail 1.1.1 (ClawHub最新3.665分), 21个自定义skills
- ClawHub热门: youtube-watcher(3.652), tiangong-notebooklm-cli(3.716), xiaohongshu-mcp(3.595)
- 结论: 日常运行稳定，无重大更新需求

### 历史核心进展

**邮件系统配置** (2026-03-05 19:50)
- 成功集成AgentMail服务
- 创建邮箱: jeffai@agentmail.to
- 实现功能：发送邮件、接收邮件(收件箱检查)
- 待处理：安全配置（webhook allowlist防prompt injection）

**Browser-Use配置** (2026-03-05 19:31)
- 用户提供API Key成功配置
- 测试通过：打开example.com截图正常
- Live URL: https://live.browser-use.com

---

### 历史核心进展

**OpenClaw安全新闻监控** (2026-03-05 16:05)
- 监控任务执行成功
- 发现重要安全新闻：
  1. **OpenClaw高危漏洞已修复** (v2026.2.25+)
  2. Microsoft发布安全运行指南
  3. 创始人Peter Steinberger加入OpenAI
  4. AWS官方支持在Lightsail运行
- 问题：通知Chief Agent失败（session send权限不足）
- 建议：手动通知或通过飞书消息

---

### 历史核心进展 (摘要)

**1. Agent架构 - 1+6架构完成**
- Chief + 6个SubAgents (content/growth/coding/product/finance/user)
- Memory分层设计：chief/projects/agent_cache
- 解决痛点：Memory混乱、Token浪费、上下文污染

**2. 小红书MCP配置** (2026-03-05)
- 安装 mcporter CLI + 3个小红书MCP包
- 用户扫码登录成功，Cookie保存至3个位置
- **问题**：所有MCP包都有技术问题无法完全运行
  - xiaohongshu-mcp-steve: API风控需要动态签名
  - xiaohongshu-mcp-server: Playwright页面初始化失败
  - xiaohongshu-mcp: Schema格式错误
- **结论**：改用原生Playwright脚本实现发布/点赞功能

**3. 搜索引擎配置**
- 创建智能搜索脚本 (Tavily优先 + Brave备用)
- 使用方式：`python3 /root/.openclaw/workspace/scripts/smart_search.py "查询内容"`

**4. 云端部署就绪**
- FastAPI服务搭建完成 (ai_company_server)
- 腾讯云8000端口开放
- 外网访问：http://43.156.101.197:8000

**5. 公众号发布**
- 标题：OpenClaw 打造一人公司，1+1个Agents终于协同工作了
- 反复修改5版后发布
- 经验：公众号文章要简洁，去掉所有Markdown符号

**6. EvoMap胶囊集成**
- 拉取96个优质胶囊（call_count≥5）
- 建立安全检查机制（认证凭据、代码执行、恶意文件、编码解码）
- Top胶囊：HTTP重试机制(8718次)、Feishu消息fallback(8711次)

---

## 📊 经验总结

1. **公众号文章**：要简洁，去掉所有Markdown符号
2. **API管理**：OpenClaw API可以统一管理多Provider
3. **Memory分层**：是解决Agent混乱的关键
4. **Cron任务delivery**：isolated session下最好让agent自己调用message工具
5. **Git操作**：永远不要对有内容的远程仓库force push
6. **MCP集成**：第三方MCP包常有兼容性问题，原生Playwright更可靠

---

## 📋 待处理问题

- 部分Cron任务仍有error（growth-seo-keywords, product-competitor-analysis）
- Chief日报发送失败问题
- session send权限限制问题
