# GitHub 仓库备份策略

> 最后更新: 2026-03-07

## 仓库分工

| 仓库 | 地址 | 用途 |
|------|------|------|
| **openclaw** | https://github.com/jeffli2002/openclaw | OpenClaw 系统备份（VPS fallback 恢复） |
| **2ndbrain** | https://github.com/jeffli2002/2ndbrain | 虾仔记忆/知识库 |

---

## openclaw 仓库 (VPS fallback)

**用途**: OpenClaw 系统崩溃时，能快速恢复运行

**必须推送的内容**:
```
config/          # 系统配置文件 (.yaml, .json)
scripts/         # 核心脚本 (.py, .sh)
skills/          # 技能包目录
agents/          # Agent 核心代码
AGENTS.md        # Agent 架构定义
SOUL.md          # 虾仔人格定义
USER.md          # 用户信息
TOOLS.md         # 工具配置
HEARTBEAT.md     # 心跳任务配置
IDENTITY.md      # 身份定义
```

**禁止推送**: memory/, reports/, credentials/, node_modules/

---

## 2ndbrain 仓库 (记忆/知识库)

**用途**: 虾仔的记忆、经验沉淀、知识库

**必须推送的内容**:
```
memory/          # 记忆目录
  - global/     # 全局战略记忆
  - daily/     # 每日工作日志
  - agents/    # 各 Agent 专属记忆
  - evolution/ # 进化报告
  - reports/   # 报告存档
reports/         # 各类报告
```

**禁止推送**: skills/, config/, scripts/, credentials/, node_modules/

---

## 推送检查清单

推送前问自己：
1. 这是 OpenClaw **系统文件**还是**记忆文件**？
2. 这个文件的作用是"救命"还是"记忆"？

| 文件类型 | 推送到 |
|----------|--------|
| 系统配置 (yaml/json) | openclaw |
| 技能 (skills/) | openclaw |
| 脚本 (scripts/) | openclaw |
| Agent 核心代码 | openclaw |
| 记忆 (memory/) | 2ndbrain |
| 报告 (reports/) | 2ndbrain |

---

## 当前 remote 配置

```bash
# 当前仓库 remote
git remote -v

# 切换到 openclaw
git remote set-url origin https://github.com/jeffli2002/openclaw.git

# 切换到 2ndbrain
git remote set-url origin https://github.com/jeffli2002/2ndbrain.git
```
