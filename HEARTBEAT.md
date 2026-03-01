# HEARTBEAT.md

# 核心原则：任何失败任务必须修复后立即测试，不能等到第二天

# 早上7:35检查
## 1. 检查AI日报是否发送成功
- 检查cron任务 "ai-daily-newsletter" 状态
- 如果lastStatus不是ok，立即手动发送

## 2. 检查所有Cron任务状态
- 使用 cron list 查看所有任务
- 如果任何任务lastStatus是error，记录并尝试修复
- 如果delivery失败，立即手动发送内容

## 3. 检查Cron任务时间异常（防止调度跳過）
- 检查每个cron任务的 nextRunAtMs 是否在合理范围内
- 对于每日9点任务，如果nextRunAtMs不是今天9点左右，告警并手动修复
- 计算预期时间：当前日期 + 任务时间，检查偏差是否>1小时

# 每天9:00内容发布 (daily-content-publish)
## 必须调用Content Factory Skill
按照以下流程：
1. 调用content-factory skill
2. 研究素材（YouTube、行业报告）
3. 生成3-5个候选主题
4. 等用户确认主题
5. 写文章（自评≥85分）
6. 生成4种格式
7. 自动发布到公众号

# 晚上写日报前
- 读取 MEMORY.md 的格式要求（四大板块）
- 确认内容准确后再发布
