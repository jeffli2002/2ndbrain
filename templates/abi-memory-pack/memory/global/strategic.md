# Strategic Memory

> 只保留长期有效的规则、机制与决策。

## 长期规则

- 短期事实先写 `daily/`，不要直接写进长期记忆。
- 只有跨天仍有效、可复用、能降低错误率的内容，才进入 strategic。
- 跨服务器共享时，只同步摘要，不同步原始 daily。

## 已验证机制

- 分层 memory 结构：`daily → agent memory → strategic`
- 本地 memory 作为真相源
- `shared/outbound/` 作为跨系统 handoff 出口

## 决策记录

### 初始化
- Abi 采用独立服务器独立 memory 架构
- 不直接复用其他系统的原始记忆文件
