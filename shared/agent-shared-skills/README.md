# agent-shared-skills

Chief 与阿比之间的精选共享技能仓库。

## 设计目标
- 不直接共享任一方的全部私有 skills 仓库
- 只共享双方都能复用、且已脱敏、文档完整的技能
- 让阿比可通过 `git clone` / `git pull` 周期性同步
- 让 Chief 与阿比都有清晰的技能归属、发布流程与版本边界

## 仓库结构

```text
agent-shared-skills/
  README.md
  index.md
  manifest.json
  chief/
    <skill-name>/
      SKILL.md
      scripts/
      assets/
      examples/
  abi/
    <skill-name>/
      SKILL.md
      scripts/
      assets/
      examples/
  shared/
    <skill-name>/
      SKILL.md
      scripts/
      assets/
      examples/
  templates/
    skill-card-template.md
    handoff-template.md
  publish-workflow.md
```

## 三层归属
- `chief/`：Chief 创建并首先维护；阿比可读但未必默认长期使用
- `abi/`：阿比创建并首先维护；Chief 可读但未必默认长期使用
- `shared/`：双方共同认可、可长期复用的稳定能力

## 同步原则
- 私有 skills 在各自私有仓库开发
- 可共享 skill 通过“发布”进入本仓库
- 阿比侧只拉取本仓库，不直接全量 clone Chief 私有仓库

## 阿比侧同步建议
首次获取：

```bash
git clone <repo-url> ~/agent-shared-skills
```

日常更新：

```bash
cd ~/agent-shared-skills
git pull --ff-only
```

推荐频率：每天 1 次；若更新频繁，可改为每 6 小时 1 次。

## 加载原则
- 不默认全量读取整个仓库
- 启动时优先读取 `index.md` 与 `manifest.json`
- 按任务触发读取具体 skill 的 `SKILL.md`

## 安全原则
- 不提交私有凭据
- 不提交 token
- 不提交未脱敏账号信息
- 不提交只适用于单机环境的敏感路径或私有 prompt

## 当前建议架构
- Chief 私有仓库：完整 skills 源码与实验能力
- 阿比私有仓库：生活助理专属技能
- 本仓库：精选共享层 / 分发层
