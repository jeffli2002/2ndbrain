# AI Daily Newsletter Skill

生成AI行业日报，精选24小时内重大新闻。

## 信息源

### 主要搜索源
- web_search + freshness=pd: "OpenAI Anthropic Google AI 2026"
- web_search + freshness=pd: "中国 AI DeepSeek 字节跳动 2026"
- web_search + freshness=pd: "AI funding startup 2026"

### 关键词（必搜）
- OpenClaw
- Anthropic
- Gemini
- DeepSeek
- Qwen
- Seedance
- Seedream
- MiniMax
- ChatGPT
- Claude
- 豆包
- 元宝

### RSS订阅源（推荐）
**第一层（必读 - 每天）**
- 量子位
- TechCrunch AI
- Anthropic Blog
- Simon Willison

**第二层（周读）**
- VentureBeat
- Lilian Weng
- Sebastian Raschka
- Ben's Bites

**第三层（按需）**
- Arxiv CS.AI
- 机器之心

### RSS工具推荐
- Feedly (feedly.com) - AI摘要过滤
- Follow (follow.is) - 自动发现RSS，支持AI摘要
- Inoreader - 关键词过滤规则

## 执行步骤

### 第一步：天气
使用 weather 工具获取北京今日天气。

### 第二步：搜索新闻
使用 web_search + freshness=pd 搜索：
- "OpenAI Anthropic Google AI 2026" + freshness=pd
- "DeepSeek Qwen MiniMax 字节跳动" + freshness=pd
- "AI funding startup 2026" + freshness=pd
- "OpenClaw Claude Gemini ChatGPT" + freshness=pd
- "豆包 元宝 Seedream Seedance" + freshness=pd

### 第三步：验证时效
- 检查每条新闻的发布时间
- 只选择过去24小时内的
- 超过时间的直接跳过

### 第四步：输出格式
```
🌤️ 北京今日天气：[天气]

📰 AI日报 | [月日]

🔥 全球AI
1. [公司] [标题] - [发布时间]
   [1-2句话提炼]
   [显示全文](URL)

🇨🇳 中国AI
1. [公司] [标题] - [发布时间]
   [1-2句话提炼]
   [显示全文](URL)

💰 融资/商业
1. [公司] [事件] - [发布时间]
   [1-2句话提炼]
   [显示全文](URL)

—
📝 虾仔观点
[用3-5句话总结今日新闻的核心洞察和趋势]

📮 虾仔为您精选
```

## 格式要求

1. **链接格式**：`[显示全文](URL)` - 节省空间，点击可跳转
2. **提炼要求**：每条新闻1-2句话总结
3. **时效要求**：严格24小时内，超过一律不报
4. **虾仔观点**：最后必须加3-5句话核心洞察
5. **不显示完整URL**：只用超链接格式
6. **飞书最终投递必须是完整版正文**：最终发给老板的飞书消息，必须包含当天所有入选新闻的完整正文分组，不得只发送“3条重磅/核心摘要”替代全文。
7. **摘要只能做导语，不能替代正文**：如需在开头加 1-2 句总览可以，但后面仍必须完整展开全部条目。
8. **归档与发送保持一致**：本地 Markdown、飞书云文档、飞书最终消息三者应保持同一批入选新闻，不能出现“归档完整版、飞书只发摘要”的缩水投递。

## 发送

使用 message 工具发送到飞书：
- channel: feishu
- target: ou_aeb3984fc66ae7c78e396255f7c7a11b

## 注意事项

- 不确定的信息标注「待确认」
- 绝对不编造新闻
- 优先选择有原文链接的新闻
