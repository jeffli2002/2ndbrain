# MEMORY.md - Abi Memory Architecture

## 目录结构

```text
memory/
├── global/
│   ├── strategic.md
│   ├── rules.md
│   └── vision.md
├── daily/
│   └── YYYY-MM-DD.md
├── agents/
│   └── abi/
│       └── memory.md
├── projects/
├── reports/
└── shared/
    ├── inbound/
    └── outbound/
```

## 访问规则

| 角色 | 读 | 写 |
|------|----|----|
| Abi 主控 | global + daily + agents/abi + projects + shared | daily + agents/abi + global + shared |
| 未来子代理 | own namespace + 必要 shared | own namespace |

## 写入原则

### 1. 写 `daily/`
写：
- 今天做了什么
- 出了什么问题
- 修了什么
- 待确认事项

### 2. 写 `agents/abi/memory.md`
写：
- 阿比专属长期经验
- 反复使用的工作流
- 稳定有效的模板
- 常见坑位

### 3. 写 `global/strategic.md`
只写：
- 长期有效的规则
- 组织级机制
- 重要决策
- 已验证最佳实践

### 4. 写 `shared/outbound/`
只写：
- 跨系统 handoff 摘要
- 需要同步的长期结论
- 项目状态快照

## 不该进入长期记忆的内容

- 单次调试日志
- 临时错误输出
- 一次性待办
- 某天某个内容是否已发这种短期状态

## 每日提炼标准

只有当内容满足至少两项时，才考虑进入 `global/strategic.md`：
- 跨天仍有效
- 可复用
- 能降低错误率
- 能提升稳定性
- 属于机制/规则，而不是单次记录
