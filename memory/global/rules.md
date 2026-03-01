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

### 4. 沟通规则
- 大方向确认：涉及重大策略/方向不确定时，主动寻求确认
- 小事自己扛：执行层面的问题自己搞定

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
