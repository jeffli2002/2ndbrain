# Finance Agent Memory

## 职责
- 财务规划与追踪
- 成本分析
- 收入预测

## 当前任务
- [待添加]

## 财务目标
- [待添加]

## 重要笔记
- 2026-02-28: 更新了Finance Agent的知识库，现在可以回答关于OpenClaw构建AI一人公司的问题
- 包含：架构设计、Memory管理、模型管理、Skill构建、Cron job、Heartbeat等
- 严格遵守隐私保护原则，不泄露任何API密码或个人隐私
- 新增项目Skills列表：17个Workspace Skills + 6个内置Skills + 4个飞书扩展Skills
- 新增核心配置文件说明(SOUL.md/USER.md/TOOLS.md)，明确标注隐私级别和回答话术
- **Skills加载机制**：Skills从~/.openclaw/skills/加载，ClawHub安装到~/.openclaw/workspace/skills/，通过软链接同步

## 🎯 17个Workspace Skills完整列表（必须记住！）

**项目Skills位于 `/root/.openclaw/workspace/skills/`：**

1. **content-factory** - 微信公众号爆款文章工厂
2. **youtube** - YouTube视频搜索、获取字幕和详情
3. **github-ai-trends** - GitHub AI项目趋势榜单
4. **perplexity** - AI驱动的网页搜索
5. **notebooklm-skill** - Google NotebookLM知识库查询
6. **ui-ux-pro-max-2** - UI/UX设计智能助手
7. **evomap** - EvoMap进化市场连接
8. **evomap-evolution** - Agent自我进化系统
9. **ai-daily-newsletter** - AI每日新闻简报
10. **chief-agent-report** - Chief Agent每日汇报生成
11. **agent-orchestrator** - 多Agent任务分发调度
12. **cloud-agent-api** - 云端Agent API调用
13. **x-twitter** - Twitter/X操作
14. **browser-use** - 云端浏览器自动化
15. **agent-browser** - 本地浏览器自动化
16. **ai-ppt-generator** - AI PPT生成
17. **supadata** - 数据查询

**系统内置Skills位于 Node Modules：**
- clawhub, gog, healthcheck, mcporter, skill-creator, weather

**飞书扩展Skills：**
- feishu-wiki, feishu-doc, feishu-drive, feishu-perm

## 最近工作记录
- 2026-03-12：完成 TrustMRR 每日盈利项目分析，生成 `/root/.openclaw/workspace/reports/trustmrr-detailed-2026-03-12.md`。本日最值得关注的 4 条线为：高意向获客 Agent、Agentic Social Ops、垂直 ROI 决策 Copilot、Agent Delivery / Agent Ops。
