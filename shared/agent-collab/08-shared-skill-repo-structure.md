# 共享技能仓库建议结构

更新时间：2026-03-09
用途：为 Chief Agent 与阿比之间的技能共享提供跨机器、跨 Bot 的长期方案。

## 目标
- 让 Chief 与阿比共享可复用技能
- 避免技能只存在于单方私有环境
- 支持双方共同学习、复用、迭代

## 推荐仓库名
- `agent-shared-skills`
- 或 `jeff-ai-shared-skills`

## 推荐目录结构

```text
agent-shared-skills/
  README.md
  index.md
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
```

## 目录说明

### `chief/`
- 由 Chief Agent 创建、首先维护的技能
- 如果阿比也适合使用，可 later 提升到 `shared/`

### `abi/`
- 由阿比创建、首先维护的技能
- 如果 Chief 也适合使用，可 later 提升到 `shared/`

### `shared/`
- 双方共同认可、可长期复用的公共技能
- 优先放稳定、脱敏、文档完整的能力

## 每个技能最少应包含
- `SKILL.md`
- 使用场景
- 输入输出说明
- 脚本入口
- 注意事项
- 是否依赖特定平台（例如 Feishu、Calendar、OpenClaw）

## 安全要求
- 不提交私有凭据
- 不提交 token
- 不提交未脱敏账号信息
- 不把完整私有 prompt 直接塞进共享仓库

## 建议工作流
1. 某一方创建技能
2. 先写 `SKILL.md`
3. 补 usage / script / notes
4. 另一方验证是否可复用
5. 确认可共享后进入 shared repo

## 短期替代方案
在共享仓库正式建立前，可以先用：
- Feishu 文档做技能说明主库
- workspace 中 `shared/agent-skills/` 做本地镜像
- 通过手动同步方式共享给另一方
