# 战略记忆 - 虾仔的长期记忆

> 最后更新: 2026-03-06 12:00

---

## 📊 Memory 提炼 | 2026-03-06 12:00

### 今日核心进展

**微信公众号API发布经验** (2026-03-06)
- 凭据配置：写入 `skills/content-factory/.env`，不要在命令行临时设置
- 发布命令：`python3 -X utf8 scripts/wechat_publish.py --html "path/to/article.html"`
- ⚠️ 必须加 `-X utf8` 参数，否则中文变编码
- API限制：提交预览需更高权限，草稿创建后需手动在后台发布

**重大教训：禁止编造数据** (2026-03-06)
- 错误：撰写GPT-5.4文章时编造API价格 $30/M（实际$2.5/M）
- 正确流程：先查证官方数据 → 再写作 → 完成后再次核实
- 规则：价格/参数/排名等信息必须来自官方或权威来源，不确定时标注"待核实"

### 昨日核心进展 (2026-03-05)

**Sub Agent身份配置修复**
- 问题：Agent在群聊中喊用户"黎镭"而非"老板"
- 修复：更新6个Agent的system prompt + sub_agents.yaml
- 要求：永远称呼用户为"老板"或"Jeff"

**Cron任务调度集成**
- 创建 config/cron-agent-dispatch.yaml：10个任务→Agent映射
- 创建 scripts/cron_dispatcher.py 调度器
- 完成8个主要Cron任务迁移

**Agent模型配置**
- Chief/Content/Coding: MiniMax M2.5
- Growth/Product/Finance: Kimi K2.5

---

> 最后更新: 2026-03-06 10:00

---

## 📊 Memory 提炼 | 2026-03-06 02:00

### 今日核心进展

**Sub Agent 身份配置修复** (2026-03-05)
- 问题：各Sub Agent在群聊中不知道用户身份，直接喊"黎镭"
- 修复：更新6个Agent的system prompt，明确要求称呼用户为"老板"或"Jeff"
- 修改文件：chief_system.md, content_system.md, growth_system.md, coding_system.md, product_system.md, finance_system.md
- 更新config/sub_agents.yaml：所有Agent的greeting改为"老板好！"

**Cron任务调度集成** (2026-03-05)
- 创建config/cron-agent-dispatch.yaml：定义10个主要任务到Agent的映射
- 创建scripts/cron_dispatcher.py调度器脚本
- 任务映射：daily-content-publish→Content, ai-daily-newsletter→Content, openclaw-news-monitor→Growth等
- 完成8个主要Cron任务迁移到新调度机制

**Agent模型配置** (2026-03-05)
- Chief/Content/Coding: MiniMax M2.5 (主力) / Kimi K2.5 (Fallback)
- Growth/Product/Finance: Kimi K2.5 (主力) / MiniMax M2.5 (Fallback)

**邮件系统配置** (2026-03-05 19:50)
- 成功集成AgentMail服务
- 邮箱: jeffai@agentmail.to
- 实现发送/接收邮件功能

**Browser-Use配置** (2026-03-05 19:31)
- 配置完成，测试通过
- Live URL: https://live.browser-use.com

---

### 历史核心进展

**OpenClaw安全新闻监控** (2026-03-05 16:05)
- 监控任务执行成功
- 发现重要安全新闻：
  1. **OpenClaw高危漏洞已修复** (v2026.2.25+)
  2. Microsoft发布安全运行指南
  3. 创始人Peter Steinberger加入OpenAI
  4. AWS官方支持在Lightsail运行
- 问题：通知Chief Agent失败（session send权限不足）

---

### 历史核心进展 (摘要)

**1. Agent架构 - 1+6架构完成**
- Chief + 6个SubAgents (content/growth/coding/product/finance/user)
- Memory分层设计：chief/projects/agent_cache
- 解决痛点：Memory混乱、Token浪费、上下文污染

**2. 小红书MCP配置** (2026-03-05)
- 安装 mcporter CLI + 3个小红书MCP包
- 用户扫码登录成功，Cookie保存至3个位置
- **问题**：所有MCP包都有技术问题无法完全运行
  - xiaohongshu-mcp-steve: API风控需要动态签名
  - xiaohongshu-mcp-server: Playwright页面初始化失败
  - xiaohongshu-mcp: Schema格式错误
- **结论**：改用原生Playwright脚本实现发布/点赞功能

**3. 搜索引擎配置**
- 创建智能搜索脚本 (Tavily优先 + Brave备用)
- 使用方式：`python3 /root/.openclaw/workspace/scripts/smart_search.py "查询内容"`

**4. 云端部署就绪**
- FastAPI服务搭建完成 (ai_company_server)
- 腾讯云8000端口开放
- 外网访问：http://43.156.101.197:8000

**5. 公众号发布**
- 标题：OpenClaw 打造一人公司，1+1个Agents终于协同工作了
- 反复修改5版后发布
- 经验：公众号文章要简洁，去掉所有Markdown符号

**6. EvoMap胶囊集成**
- 拉取96个优质胶囊（call_count≥5）
- 建立安全检查机制（认证凭据、代码执行、恶意文件、编码解码）
- Top胶囊：HTTP重试机制(8718次)、Feishu消息fallback(8711次)

---

## 📊 经验总结

1. **公众号文章**：要简洁，去掉所有Markdown符号
2. **API管理**：OpenClaw API可以统一管理多Provider
3. **Memory分层**：是解决Agent混乱的关键
4. **Cron任务delivery**：isolated session下最好让agent自己调用message工具
5. **Git操作**：永远不要对有内容的远程仓库force push
6. **MCP集成**：第三方MCP包常有兼容性问题，原生Playwright更可靠

---

## 📊 Memory 提炼 | 2026-03-06 06:00

### 今日核心进展

**每日记忆提炼流程确认** (2026-03-06)
- 定时任务(cron: daily-memory-extractor)正常运行
- 确认2026-03-05核心信息已在strategic.md中
- 验证Sub Agent身份配置、Cron调度集成、Agent模型配置等关键修复已生效

### 今日待处理问题
- 部分Cron任务仍有error（growth-seo-keywords, product-competitor-analysis）
- Chief日报发送失败问题
- session send权限限制问题

---

## 📊 Memory 提炼 | 2026-03-06 08:00

### 今日核心进展

**每日记忆提炼流程正常运行** (2026-03-06)
- 定时任务(daily-memory-extractor)每日自动执行
- 确认昨日核心信息已在strategic.md中

**Sub Agent Workspace修复** (2026-03-06 07:10)
- 为所有Sub Agent workspace添加AGENTS.md/SOUL.md/MEMORY.md
- 修复群聊中称呼用户为"黎镭"而非"老板"的问题
- 验证Sub Agent身份配置已生效

**AI日报任务执行成功** (2026-03-06 07:15)
- 定时触发ai-daily-newsletter任务
- 成功获取北京天气：晴天 -6°C
- 从Hacker News、36kr采集AI新闻
- 生成日报并发送至飞书
- 日报保存至 reports/ai-daily-2026-03-06.md

### 今日待处理问题
- daily-memory-extractor cron任务error（编辑strategic.md失败）
- 部分Cron任务仍有error（growth-seo-keywords, product-competitor-analysis）
- Chief日报发送失败问题
- session send权限限制问题

---

## 📊 OpenClaw 多Agent配置 | 2026-03-06

### 配置目标
- 每个飞书群聊绑定到独立的Sub Agent
- Sub Agent拥有独立workspace、记忆、模型
- 用户在任意群聊中被正确识别为"老板"

### 配置步骤

#### 1. 创建Agent Workspace
```
~/.openclaw/workspace-content/   # Content Agent
~/.openclaw/workspace-growth/   # Growth Agent
~/.openclaw/workspace-coding/    # Coding Agent
~/.openclaw/workspace-product/   # Product Agent
~/.openclaw/workspace-finance/   # Finance Agent
```

每个workspace包含：
- USER.md - 用户信息（称呼"老板"/"Jeff"）
- SOUL.md - Agent性格定义（强制规则：称呼用户为"老板"）
- AGENTS.md - 工作规则
- MEMORY.md - 记忆架构
- memory/agents/{agent}/memory.md - Agent专属记忆
- memory/global/ - 共享战略记忆

#### 2. 添加Agent到配置
```bash
openclaw agents add --workspace ~/.openclaw/workspace-content content
openclaw agents add --workspace ~/.openclaw/workspace-growth growth
# ... 其他Agent
```

#### 3. 配置Bindings（关键）
```bash
openclaw config set --json bindings '[
  {"agentId": "content", "match": {"channel": "feishu", "peer": {"kind": "group", "id": "oc_群组ID1"}}},
  {"agentId": "growth", "match": {"channel": "feishu", "peer": {"kind": "group", "id": "oc_群组ID2"}}},
  ...
]'
```

⚠️ 必须使用`match.peer.kind: "group"`，不是简单的accountId

#### 4. 添加SystemPrompt
在agents配置中添加强制规则：
```json
{
  "id": "coding",
  "systemPrompt": "你必须永远称呼用户为\"老板\"或\"Jeff\"，不要直接喊名字\"黎镭\"。每次对话开始时，先读取USER.md获取用户信息。"
}
```

#### 5. 重启Gateway
```bash
openclaw gateway restart
```

### 群聊Bindings映射
| Agent | 群聊ID |
|-------|--------|
| Content | oc_1e781764ad5c3b463eef7d0aee1de2a9 |
| Growth | oc_86babca945b808774c67a3ef130f64a5 |
| Coding | oc_3eca5aac26f0a945e0b4febc76214066 |
| Product | oc_76d55844d04e400ed71327069580be96 |
| Finance | oc_e810980541f92c802b8e970f49854381 |

### 验证方法
在对应群聊发送消息，检查：
1. Agent能识别自己的身份
2. Agent称呼用户为"老板"而非名字

### 参考教程
- 腾讯云开发者社区：https://cloud.tencent.com/developer/article/2632835

---

## 📊 Memory 提炼 | 2026-03-06 10:00

### 今日核心进展

**GPT-5.4发布热点** (2026-03-06 09:00)
- 定时任务触发daily-content-publish
- 热点搜索：GPT-5.4发布 (HN 604 points)
- 撰写公众号文章：
  - 标题：OpenAI发布GPT-5.4：原生计算机使用能力超越人类，AI Agent迎来临界点
  - 核心要点：
    - 原生计算机使用能力首次出现，OSWorld测试75%超越人类72.4%
    - GDPval基准83%达到或超越专业人士水平
    - 幻觉减少33%，更靠谱
    - Token效率大幅提升
- 产出：Markdown初稿已完成，待生成HTML/小红书/Twitter版本

**每日记忆提炼流程正常运行** (2026-03-06)
- 定时任务(daily-memory-extractor)每日自动执行
- 确认2026-03-05核心信息已在strategic.md中

### 今日待处理问题
- daily-memory-extractor cron任务error（编辑strategic.md失败 - 权限或格式问题）
- 部分Cron任务仍有error（growth-seo-keywords, product-competitor-analysis）
- Chief日报发送失败问题
- session send权限限制问题

---

## 📊 Memory 提炼 | 2026-03-06 14:10

### 近2日战略级结论（2026-03-05 ~ 2026-03-06）

**1. 内容生产进入“半自动发布”阶段**
- 微信公众号链路已跑通到“创建草稿”这一步，凭据应写入 `skills/content-factory/.env`，发布命令固定为：`python3 -X utf8 scripts/wechat_publish.py --html "path/to/article.html"`
- 当前API权限不足以完成preview/最终发布，因此现实可用流程是：**AI生成内容 → 脚本创建草稿 → 人工后台确认发布**
- 这意味着内容自动化已经能显著提效，但最后一步仍需人工把关，适合作为当前稳定工作流

**2. 建立“先核实、后写作”的硬规则**
- 已出现一次严重质量事故：GPT-5.4文章中错误编造API价格
- 战略上必须把“数据核实”前置到写作前，尤其是**价格、参数、榜单、基准测试、订阅方案**这类高风险信息
- 后续所有对外内容默认执行：**官网/权威来源核实 → 写作 → 发布前复核**；若无法确认，则明确标注“待核实”

**3. 多Agent基础设施已形成可复用框架**
- Sub Agent身份问题已修复：所有Agent必须称呼用户为“老板”或“Jeff”，不能直呼姓名
- 已形成可复制的多Agent配置模板：**独立workspace + 独立记忆 + 群聊bindings + 明确system prompt约束**
- 对Jeff的长期价值是：后续新增Agent或新群聊时，可以按同一模板快速扩展，而不是每次从零调试身份与上下文

**4. Cron → Agent调度体系已经成型，但稳定性仍需补强**
- 已完成 `config/cron-agent-dispatch.yaml` + `scripts/cron_dispatcher.py` 的调度骨架，并迁移8个主要Cron任务
- 这标志着日常运营任务开始从“单点脚本执行”升级为“按职能分发给对应Agent执行”
- 当前主要瓶颈集中在：`strategic.md`编辑失败、部分Cron报错、Chief日报发送失败、session send权限限制
- 下一阶段重点不是继续扩任务数量，而是**先补稳定性和可观测性**，把已有自动化跑稳

**5. Agent模型分工已更新，已正式引入 GPT-5.4**
- Main / Coding：GPT-5.4 主力，Minimax M2.5 第一Fallback，Kimi 2.5 第二Fallback
- 其他 Sub Agent（Content / Growth / Product / Finance）：Minimax M2.5 主力，Kimi 2.5 Fallback
- 这代表系统已从“MiniMax/Kimi 二选一”升级为“主Agent高能力模型 + 其他Agent性价比模型”的分层策略
- 后续优化原则：主Agent与Coding优先保证推理/编码质量，其余Sub Agent优先平衡速度、成本与稳定性

**6. 飞书语音播放链路已沉淀为可复用 Skill**
- 已验证可行链路：**Edge TTS → ffmpeg 转 Ogg/Opus → 飞书语音消息播放条**
- 结论：飞书里若想展示可播放/暂停的原生播放条，不能停留在 raw mp3 文件，必须走 Opus/Ogg 方向
- 已封装为可分享技能：`skills/feishu-voice-reply/`
- 已打包产物：`dist/skills/feishu-voice-reply.skill`
- 默认能力形态：用户说“语音播放一下……”，系统同时返回**文字回复 + 飞书语音播放条**

### 当前应持续坚持的方向
- **对外内容**：先保证真实性，再追求爆款效率
- **系统建设**：先保证现有Cron/Agent链路稳定，再扩更多自动化场景
- **组织方式**：继续强化Chief统筹 + 专业Sub Agent执行的分工模式
- **人工介入点**：保留在“最终发布、重大策略、敏感外发”这些高风险环节

## 📊 Memory 提炼 | 2026-03-06 14:30

### 今日新增固化能力

**飞书语音播放 Skill 已完成封装** (2026-03-06)
- 新建 Skill：`skills/feishu-voice-reply/`
- 统一安装路径：`/root/.openclaw/workspace/skills/feishu-voice-reply`
- 已打包产物：`/root/.openclaw/workspace/dist/skills/feishu-voice-reply.skill`
- 能力链路：Edge TTS → ffmpeg 转 Ogg/Opus → Feishu 语音消息（可播放/暂停）
- 使用约定：用户说“语音播放一下……”时，默认同时返回文字 + 飞书语音播放条
- 安全结论：Skill 内未写入私人凭据、Token、Secret，可对外分享

**模型分工记忆已修正** (2026-03-06)
- Main / Coding：GPT-5.4 → Minimax M2.5 → Kimi 2.5
- 其他 Sub Agent 默认：Minimax M2.5 → Kimi 2.5
- 旧记忆中关于 Chief/Content/Coding 与 Growth/Product/Finance 的模型分工已过期，后续以本条为准
