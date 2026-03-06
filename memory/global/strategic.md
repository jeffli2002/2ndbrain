# 战略记忆 - 虾仔的长期记忆

> 最后更新: 2026-03-06 08:05

---

## 📊 Memory 提炼 | 2026-03-06 02:00

### 今日核心进展

**Sub Agent 身份配置修复** (2026-03-05)
- 问题：各Sub Agent在群聊中不知道用户身份，直接喊"黎镭"
- 修复：更新6个Agent的system prompt，明确要求称呼用户为"老板"或"Jeff"
- 修改文件：chief_system.md, content_system.md, growth_system.md, coding_system.md, product_system.md, finance_system.md
- 更新config/sub_agents.yaml：所有Agent的greeting改为"老板好！"

**Cron任务调度集成** (2026-03-05)
- 创建config/cron-agent-dispatch.yaml：定义10个主要任务到Agent的映射
- 创建scripts/cron_dispatcher.py调度器脚本
- 任务映射：daily-content-publish→Content, ai-daily-newsletter→Content, openclaw-news-monitor→Growth等
- 完成8个主要Cron任务迁移到新调度机制

**Agent模型配置** (2026-03-05)
- Chief/Content/Coding: MiniMax M2.5 (主力) / Kimi K2.5 (Fallback)
- Growth/Product/Finance: Kimi K2.5 (主力) / MiniMax M2.5 (Fallback)

**邮件系统配置** (2026-03-05 19:50)
- 成功集成AgentMail服务
- 邮箱: jeffai@agentmail.to
- 实现发送/接收邮件功能

**Browser-Use配置** (2026-03-05 19:31)
- 配置完成，测试通过
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

## 📊 Memory 提炼 | 2026-03-06 06:00

### 今日核心进展

**每日记忆提炼流程确认** (2026-03-06)
- 定时任务(cron: daily-memory-extractor)正常运行
- 确认2026-03-05核心信息已在strategic.md中
- 验证Sub Agent身份配置、Cron调度集成、Agent模型配置等关键修复已生效

### 今日待处理问题
- 部分Cron任务仍有error（growth-seo-keywords, product-competitor-analysis）
- Chief日报发送失败问题
- session send权限限制问题

---

## 📊 Memory 提炼 | 2026-03-06 08:00

### 今日核心进展

**每日记忆提炼流程正常运行** (2026-03-06)
- 定时任务(daily-memory-extractor)每日自动执行
- 确认昨日核心信息已在strategic.md中

**Sub Agent Workspace修复** (2026-03-06 07:10)
- 为所有Sub Agent workspace添加AGENTS.md/SOUL.md/MEMORY.md
- 修复群聊中称呼用户为"黎镭"而非"老板"的问题
- 验证Sub Agent身份配置已生效

**AI日报任务执行成功** (2026-03-06 07:15)
- 定时触发ai-daily-newsletter任务
- 成功获取北京天气：晴天 -6°C
- 从Hacker News、36kr采集AI新闻
- 生成日报并发送至飞书
- 日报保存至 reports/ai-daily-2026-03-06.md

### 今日待处理问题
- daily-memory-extractor cron任务error（编辑strategic.md失败）
- 部分Cron任务仍有error（growth-seo-keywords, product-competitor-analysis）
- Chief日报发送失败问题
- session send权限限制问题
