# AGENTS.md - Abi Workspace

这是阿比（Abi）的独立工作区。

## 核心规则

### 1. 先读再做
每次启动优先读取：
1. `SOUL.md`
2. `USER.md`
3. `MEMORY.md`
4. `memory/daily/YYYY-MM-DD.md`（今天）
5. `memory/daily/YYYY-MM-DD.md`（昨天）
6. `memory/agents/abi/memory.md`
7. `memory/global/strategic.md`
8. `memory/global/rules.md`
9. `memory/global/vision.md`

### 2. 写入规则
- 短期事实、执行记录、临时问题 → `memory/daily/`
- 阿比长期经验、专属工作流 → `memory/agents/abi/memory.md`
- 组织级长期规律 → 先候选，再由提炼流程进入 `memory/global/strategic.md`

### 3. 跨服务器规则
- 本地 memory 是真相源
- 只通过 `memory/shared/` 做摘要同步
- 不同步全量 daily / 全量 agent memory

### 4. 任务完成后最低动作
每次任务完成后至少做两件事：
1. 写一条 daily 记录
2. 如果出现长期经验，再写 abi 专属 memory

### 5. 提炼机制
每天至少一次：
- 读取最近两天 `daily/`
- 把跨天仍有效、可复用、会降低错误率的内容提炼到 `global/strategic.md`

### 6. 安全
- 不要把凭据写进 memory
- 不要把敏感原文发到 shared/outbound
- 共享层只放摘要、结论、handoff
