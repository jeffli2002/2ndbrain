# Content Agent Memory

## 职责
- 公众号内容创作
- 视频脚本撰写
- 社交媒体运营

## 当前任务
- 固化小红书 Publish Skill 的发布规则与 fallback 封面机制

## 内容策略
- 小红书标题上限 20 字符
- 正文总长度不超过 1000，建议控制在 800~1000
- 正文第一句话不能重复标题
- 开头必须带 emoji
- 结尾必须有 #tag
- 若未提供封面图，默认尝试使用 skill 内置 fallback 封面

## Skill 工具路径（必须读取）
- **content-factory**: `/root/.openclaw/workspace/skills/content-factory/SKILL.md`
- **wechat-article**: `/root/.openclaw/workspace/skills/wechat-article/SKILL.md`
- **youtube**: `/root/.openclaw/workspace/skills/youtube/SKILL.md`
- **xhs-publish**: `/root/.openclaw/workspace/skills/xiaohongshu-skills/skills/xhs-publish/SKILL.md`

## 工具映射表 (Intent → Tool/Skill)

| 任务意图 | 工具/Skill | 说明 |
|---------|------------|------|
| 抓取微信公众号文章 | `skills/wechat-article` | 封装为 Skill，已安装到 dist/skills/ |
| 公众号写文章 | Content Factory Skill | 写→排版→发布全流程 |
| 小红书发布 | `skills/xiaohongshu-skills/skills/xhs-publish` | 图文/视频发布 |
| YouTube 视频研究 | `skills/youtube` | 搜索、获取字幕、分析 |
| 生成 AI 日报 | `skills/content-factory` | 研究→写→发布 |

## 重要笔记
- 2026-03-07：已将小红书发布规则写入 `skills/xiaohongshu-skills/skills/xhs-publish/SKILL.md`，并在 CLI / publish_pipeline 中增加发布前校验
- 2026-03-12：`ai-kol-daily-newsletter` 已升级为“严格按 X/Twitter watchlist 出日报”模式；主配置文件为 `config/ai-kol-watchlist.yaml`，默认追踪 15 个 AI KOL（Sam Altman、Elon Musk、Mark Zuckerberg、Dario Amodei、Daniela Amodei、Ilya Sutskever、Andrej Karpathy、Yann LeCun、Demis Hassabis、Jeff Dean、Andrew Ng、Fei-Fei Li、Thomas Wolf、Greg Brockman、Peter Steinberger）。
- 2026-03-12：KOL 日报硬规则：只写过去24小时内确有 X/Twitter 更新的账号；优先保留 KOL 原观点与一手表达；如果当天无人更新，要明确写“无人更新”，不要拿普通行业新闻硬凑。
