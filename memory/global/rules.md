# 公司规则

> 最后更新: 2026-02-28

---

## 核心原则

### 1. Agent组织架构
- **Chief Agent**: 决策中枢，负责任务调度
- **Sub-Agent**: Coding、Content、Growth、Product、Finance
- 支持多Agent并行执行（根据任务复杂度决定）
- 任务完成后统一整合输出

### 2. Memory管理规则
- **分层存储**:
  - `memory/global/` - 全局战略决策（Chief写入）
  - `memory/agents/{agent}/memory.md` - 各Agent专属记忆
  - `memory/daily/YYYY-MM-DD.md` - 每日工作日志
  - `memory/projects/` - 项目状态

- **写入权限**:
  - Chief Agent → 写入 global + projects + daily
  - Sub-Agent → 写入自己的 memory/agents/{agent}/memory.md

- **报告规范**: 所有报告append-only，禁止rewrite

### 3. 任务执行规则
- 可并行执行多Agent
- 任务粒度控制，避免过度拆解
- 执行前传递必要上下文
- 完成后记录状态到对应Memory
- **Chief 私聊硬规则（2026-03-10）**：非前台任务必须先过 dispatch planner；若目标不是 Chief，则优先真实委派，不能由 Chief 直接越过分发链路硬做
- **禁止伪委派**：未实际发生 `sessions_spawn` / `sessions_send` 时，不得对外表述为“已经切给对应 Agent”
- **降级透明**：若因运行时限制或失败而由 Chief 兜底执行，必须向用户明确说明降级，并把原因写入 daily log

### 4. 沟通规则
- 大方向确认：涉及重大策略/方向不确定时，主动寻求确认
- 小事自己扛：执行层面的问题自己搞定

### 5. 定时任务交付规则（2026-03-10 新增）
- **系统维护类任务**（如 GitHub/Supabase 同步、cron 健康检查、delivery guard、memory extractor 等）：默认不要发送常规成功消息；仅在警告、失败、需要人工介入时直发老板。
- **非系统维护类定时任务**：每次正常运行后都必须通过飞书直达老板，不能只汇总到 Chief 每日汇报。
- **报告产出类定时任务**（如日报、竞品分析、TrustMRR、KOL 通讯、Chief 日报等）：必须同时完成三份交付：
  1. 本地 Markdown 归档
  2. 飞书云文档归档
  3. 飞书核心总结直发老板
- **AI 日报特例（2026-03-11 老板明确要求）**：每天 07:30 发给老板的 AI 日报必须发送**完整版正文**，包含当天全部入选新闻；允许顶部有 1-2 句导语，但**禁止只发 3 条重磅/核心摘要替代全文**。
- AI 日报的本地 Markdown、飞书云文档、飞书最终消息必须保持同一批入选新闻，禁止“归档完整版、飞书发缩水版”。
- 禁止出现“只写 MD 不发飞书”或“只发飞书不归档”的半交付状态。

---

## 质量标准

### 输出规范
- 数据优先：能用数字表达的就不用文字
- 描述性语言：避免简单罗列，要叙述性的描述
- 项目视角：站在整体项目角度

### 禁止事项
- 禁止使用"一些"、"若干"、"部分"等模糊词
- 禁止简单罗列任务清单
- 禁止缺少数据的概括性描述

---

## 工具使用规范

### 搜索引擎使用流程（2026-03-05 更新）

**搜索优先级**：
1. **智能搜索脚本** - `smart_search.py` (Tavily 优先，Brave 备用)
2. **Tavily 直接搜索** - `tavily_search.py` (仅 Tavily)
3. **OpenClaw 内置** - `web_search` 工具 (Brave API，备用)

**使用方式**：
```bash
# 智能搜索（推荐）
python3 /root/.openclaw/workspace/scripts/smart_search.py "查询内容"

# Tavily直接搜索
python3 /root/.openclaw/workspace/scripts/tavily_search.py "查询内容"
```

**流程**：
1. 任何需要 web 搜索的任务 → 使用 `smart_search.py`
2. 如果脚本不可用 → 回退到 `web_search` 工具
3. 禁止直接调用 Brave API（除非前两者都失败）

---

## 决策记录

### 2026-02-28: Memory架构升级
从"集中式记忆"改为"分层分布式记忆"

**原因**：
- 各Agent需要跨会话记忆能力
- 避免记忆碎片化到根目录
- 职责清晰：Chief管战略，Agent管专业

**新架构**：
- Chief: global + projects + daily
- Sub-Agent: 专属 memory/agents/{agent}/memory.md
- 每日日志统一存 daily/
