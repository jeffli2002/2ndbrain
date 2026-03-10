# Abi 落地文件包（独立服务器版）

这是一套给 **阿比（Abi）** 在独立云服务器上使用的 Memory 管理模板。

## 设计原则

- 阿比拥有 **独立 workspace** 与 **独立 memory**
- 复制的是 **架构与规则**，不是 Jeff 当前系统里的具体记忆内容
- 默认 **本地优先**，跨服务器只同步 **提炼后的摘要**
- 短期事实先进 `daily/`，长期规律再进 `global/`

## 推荐目录

将本目录整体放到阿比服务器，例如：

```bash
mkdir -p /root/.openclaw/workspace-abi
cp -r . /root/.openclaw/workspace-abi/
```

## 初始化顺序

1. 修改 `USER.md`
2. 修改 `SOUL.md`
3. 阅读 `MEMORY.md`
4. 初始化当天日志：
   ```bash
   python3 scripts/append_daily.py --title "系统初始化" --body "Abi memory system bootstrapped"
   ```
5. 每天定时执行：
   ```bash
   python3 scripts/extract_memory.py
   ```

## 目录说明

```text
templates/abi-memory-pack/
├── AGENTS.md
├── SOUL.md
├── USER.md
├── MEMORY.md
├── memory/
│   ├── global/
│   │   ├── strategic.md
│   │   ├── rules.md
│   │   └── vision.md
│   ├── daily/
│   ├── agents/
│   │   └── abi/
│   │       └── memory.md
│   ├── projects/
│   │   └── default_project.md
│   ├── reports/
│   └── shared/
│       ├── inbound/
│       └── outbound/
└── scripts/
    ├── append_daily.py
    ├── extract_memory.py
    ├── sync_pull_shared.sh
    └── sync_push_shared.sh
```

## 跨服务器同步建议

默认只同步：
- `memory/shared/outbound/*.md`
- `memory/shared/inbound/*.md`

不要同步：
- 全量 `memory/daily/`
- 全量 `memory/agents/`
- 敏感凭据
- 原始运行日志

## 最低可用工作流

- 执行任务后 → 写 `daily/YYYY-MM-DD.md`
- 出现长期经验 → 写 `memory/agents/abi/memory.md`
- 定时提炼 → 从最近两天 `daily/` 提炼到 `memory/global/strategic.md`
- 需要跨系统共享 → 手动或定时生成 `memory/shared/outbound/*.md`

## 注意

- 这是一套 **MVP 文件包**，不是最终产品
- 真正稳定运行时，建议把读写操作收口到统一脚本/服务，不要让业务逻辑到处直接改文件
