# Memory架构文档

> 最后更新: 2026-02-28

## 目录结构

```
/root/.openclaw/workspace/memory/
│
├── global/                    # 全局Memory（Chief可读写）
│   ├── strategic.md          # 战略决策
│   ├── rules.md              # 公司规则
│   └── vision.md             # 长期愿景
│
├── agents/                    # Sub-Agent专属Memory
│   ├── coding/memory.md    # Coding Agent
│   ├── content/memory.md   # Content Agent
│   ├── growth/memory.md    # Growth Agent
│   ├── growth/seo-report.md # Growth SEO报告
│   ├── product/memory.md   # Product Agent
│   └── finance/memory.md   # Finance Agent
│
├── daily/                     # 每日工作日志
│   └── YYYY-MM-DD.md       # 按日期命名
│
├── evolution/                 # Evolver自我进化报告
│   └── evolution_YYYY-MM-DD.md
│
├── projects/                  # 项目状态
│   └── default_project.md
│
└── reports/                  # 报告存档（历史）
    └── *.md
```

## 访问规则

| 角色 | 读 | 写 |
|------|-----|-----|
| Chief Agent | global + agents/* + daily + evolution + projects | global/* |
| Sub-Agent | own namespace only | own namespace only |

## 备份

- 备份位置: `memory_backup_YYYYMMDD_HHMMSS/`
- 自动备份: 每次重大操作前自动备份

## 快速访问

```bash
# 读取Agent Memory
cat /root/.openclaw/workspace/memory/agents/growth/memory.md

# 读取每日日志
cat /root/.openclaw/workspace/memory/daily/2026-02-26.md

# 读取进化报告
cat /root/.openclaw/workspace/memory/evolution/evolution_2026-02-26.md
```

## 相关系统

### Evolver 自我进化系统

| 任务ID | 名称 | 调度 | 状态 |
|--------|------|------|------|
| 7cdeec37... | daily-skill-evolution | 每天 22:00 | 待执行 |
| 01fa3453... | evolver-auto-restart | 每小时 | OK |

- **报告位置**: `/memory/evolution/`
- **Evolver 进程**: 运行中，连接 EvoMap 市场
- **最新胶囊**: HTTP Retry Mechanism (评分 0.96)
