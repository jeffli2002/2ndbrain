# 战略记忆 - 虾仔的长期记忆

---

---

## 📊 Memory 提炼 | 2026-03-14 12:03

### 飞书多维表格(Bitable)创建与维护经验

**问题1：空行问题**
- 现象：创建 Bitable 后自动生成 placeholder rows
- 解决：创建后立即用 `feishu_bitable_list_records` 检查，如有空记录立即删除
- 预防：创建时检查返回值是否有 `cleaned_placeholder_rows` 参数

**问题2：时间戳错误**
- 现象：日期显示为错误年份（如2025年）
- 原因：复用历史代码中的时间戳常量，未根据当前年份重新计算
- 解决：根据标题中的日期重新计算时间戳（2026年应为 177xxx 开始）
- 预防：重要数据写入后应抽样验证时间戳范围

**问题3：API权限问题**
- 现象：添加文档协作者失败，权限 API 报 validation 错误
- 原因：飞书权限 API 对应用类型支持特殊，需要正确的 member_type 和 type 组合
- 解决：使用 `type=docx` 作为 query param；复杂场景优先 UI 手动处理

**战略含义**：
- 批量数据写入后必须验证
- 时间戳等数值字段写入前校验合理范围
- 复杂飞书 API 优先在 UI 验证后再自动化

---

## 📊 Memory 提炼 | 2026-03-12 20:02

### 飞书云文档整理与知识库迁移的操作经验

**问题描述**：
- 尝试帮老板整理飞书云文档并迁移到知识库时，遇到两套不同的权限体系问题

**云空间操作限制**：
- 当前权限不足，无法执行：创建文件夹、移动文档、批量删除
- 可用权限：`drive:drive` (只读)、`drive:file` (部分读写)
- 缺失权限：`space:folder:create` (创建文件夹)

**知识库操作限制**：
- 机器人需要被**明确添加为知识库成员**
- 仅在云空间开放权限不够，必须到知识库 → 设置 → 成员管理 → 添加机器人
- 添加后可用 API：`wiki:node:create`、`wiki:node:update`、`wiki:member:create`

**可行的手动方案**：
1. 生成索引文档（告诉用户哪些要删、哪些要归类）
2. 引导用户在飞书 UI 手动操作
3. 或者先创建文件夹/移动文档，再让机器人接管后续迁移

**战略含义**：
- 飞书文档整理目前只能做"方案输出 + 手动执行"模式
- 知识库迁移需要预先配置成员权限，不能靠 API 临时申请
- 后续类似需求应先评估权限是否满足，再承诺自动化程度

### AI KOL 日报必须配置指定 watchlist，禁止泛写行业新闻

**新确认的长期配置规则**：AI KOL 日报（ai-kol-daily-newsletter）必须按老板指定的 15 个 KOL 账号监控 X/Twitter 动态，禁止泛写普通行业新闻。

**应长期保留的配置**：
- watchlist 配置文件位置：`/root/.openclaw/workspace/config/ai-kol-watchlist.yaml`
- 15 个指定 KOL：sama, elonmusk, zuck, DarioAmodei, danielaamodei, ilyasut, karpathy, ylecun, demishassabis, jeffdean, AndrewYNg, drfeifei, Thom_Wolf, gdb, steipete
- 信息源优先级：X/Twitter > web_search/web_fetch > YouTube（仅作补充背景）
- 每条内容必须包含：KOL、账号、更新摘要、核心观点/原话、信号判断、对 Jeff 的启发
- 只写过去 24 小时有更新的 KOL，无更新则明确写"无人更新"
- 禁止把普通行业新闻冒充 KOL 动态

**战略含义**：
- 这是老板明确的监控范围，后续 KOL 日报必须严格按此名单执行，不能随意扩大或缩小。

---

### 模型额度耗尽时的降级策略

**新确认的系统性问题**：GPT-5.4 和 MiniMax 额度均会耗尽导致任务失败，需要建立额度监控和降级机制。

**应长期保留的应对策略**：
- 监控信号：任务报错 "400 limit exceeded" 即额度用完
- 降级路径：GPT-5.4 → MiniMax-M2.5 → Kimi (kimi-coding/k2p5)
- cron job 配置：优先使用默认模型，不要在 job 中显式指定容易耗尽的模型
- 关键任务（如 ai-daily-newsletter、ai-kol-daily-newsletter）应配置为使用默认模型的 fallback 链路

**战略含义**：
- 额度管理是系统性风险，不能依赖单一模型，后续新任务创建时应优先使用默认模型的 fallback。

---

## 📊 Memory 提炼 | 2026-03-11 10:33

### 飞书 Calendar API 创建日程的稳定路径已验证：优先写主日历，权限不足时回退到共享日历

**新确认的长期可复用能力**：当前 OpenClaw 环境已经实测跑通“通过 Feishu Calendar API 创建日程并邀请老板”的完整链路，而且不仅有主路径，也有权限受限时的回退路径。

**这次保留的长期信息**：
- 已沉淀为可复用 skill：`skills/feishu-calendar-invite/`。
- 稳定执行策略应固定为两段式：
  1. 先检测目标用户主日历权限；
  2. 若 app 对主日历具备 `writer/owner`，直接写主日历；
  3. 若只有 `reader` 或无写权限，则自动创建/复用 app 持有的共享日历，授予目标用户 writer，再创建事件并添加参与人。
- 该链路已做过真实测试，并验证共享日历回退可用；测试事件也已删除，说明不是纸面方案，而是已被实际验证的工作流。

**战略含义**：
- 后续凡是“飞书日历提醒 / 会议邀请 / 行程代创建 / Calendar API 能力验证”类需求，都不需要从零摸索权限问题，应直接优先走这条已验证路径。
- 这属于跨任务可复用的能力资产，而不是某一次临时日程的短期噪音，因此值得进入 global memory。


## 📊 Memory 提炼 | 2026-03-11 00:02

### Root 环境下 Browser/Chrome 必须先显式关闭 sandbox，再谈后续稳定性排查

**新确认的长期运行规则**：在当前这台以 root 运行 OpenClaw 的 Linux 主机上，若要拉起 Chrome / browser tool，`browser.noSandbox: true` 不是可选优化，而是基础前置条件。

**这次保留的长期信息**：
- 2026-03-10 夜间已定位到一层明确根因：Chrome 在 root 环境下会因 sandbox 机制而无法正常启动。
- 已把 `browser.noSandbox: true` 写入 `openclaw.json` 并重启 gateway，说明这条配置应作为此环境的默认基线保留。
- 同时也确认：**配置生效 ≠ 浏览器链路已完全修复**；即便 noSandbox 已补上，browser tool 仍可能因更深层问题继续超时，因此后续排障必须分层进行：
  1. 先验证 sandbox 配置是否满足启动前提；
  2. 再检查浏览器进程、代理链路、tool 超时、host 环境等更深层问题；
  3. 不能把“已加 noSandbox”误判为“browser 已彻底恢复”。

**战略含义**：
- 这条经验属于可跨任务复用的环境级规则，后续凡是做浏览器自动化、Chrome 启动修复、browser tool 排障，都应先检查 noSandbox 基线，避免重复从表层报错重新摸索。
- 同时它也提醒后续排障要避免“一处修复即宣告全好”的假恢复判断。


## 📊 Memory 提炼 | 2026-03-10 22:05

### Cron 交付策略必须分层治理：维护类静默，业务/报告类直达并归档

**新确认的长期规则**：不要把所有 cron 都按同一种“执行后发消息”方式处理，必须按任务性质区分交付层级。

**应长期保留的分层原则**：
- **系统维护类任务**（如健康检查、memory extractor、delivery guard、GitHub / Supabase 同步等）默认静默执行，仅在告警、失败、或需要人工介入时才直发老板。
- **业务执行类任务** 正常完成后，应直接把结果送达老板，不能只留在内部 run history 或日报汇总里。
- **报告产出类任务**（如 AI 日报、竞品分析、TrustMRR、KOL 通讯、Chief 日报等）必须同时完成三份交付：本地 Markdown 归档、飞书云文档归档、飞书核心总结直发老板。

**战略含义**：
- 若维护类任务也频繁常规通知，会制造高噪音并稀释真正告警；
- 若业务/报告类任务只落盘不直达老板，又会形成“系统做了，但人没收到”的半交付；
- 因此，cron 体系必须同时追求 **低噪音** 与 **强交付**，这是一条跨任务复用的系统治理规则。


## 📊 Memory 提炼 | 2026-03-10 20:02

### Chief 私聊分发硬闸门（避免再次退化为"Chief 全包"）

**新确认的长期规则**：在 Chief 私聊窗口中，只要不是前台型小问题，且任务落入内容 / 增长 / 代码 / 产品 / 财务任一领域，**必须先经过 dispatch planner**（如 `chief_dispatch.py`）再决定执行路径；禁止 Chief 直接跳过分发链路开工。

**这次排查得到的关键结论**：
- 问题根因不在 `openclaw.json`、`agent_keyword_router.yaml` 或 worker 配置缺失；
- 真正失效点在 **Chief 执行纪律** —— 领域任务被 Chief 直接做了，导致真实委派链路被绕开；
- 因此，长期修复不能只靠“记得委派”，而要把它升格为硬规则：
  1. 先分类/规划；
  2. 命中领域 worker 时优先真实 `sessions_spawn` / `sessions_send`；
  3. 只有委派不可用或失败时，Chief 才能透明降级执行；
  4. 未真实发生委派时，禁止对外表述为“已切给某 Agent”。

**战略含义**：
- 这条规则直接决定多 Agent 体系是不是“真实协作”，还是表面分工、实际单线程；
- 只有守住这个硬闸门，Chief→Worker 的编排、观测、责任归属和后续扩展才不会重新退化；
- 这属于系统治理规则，不是一次性任务细节，因此值得写入长期记忆。

## 📊 Memory 提炼 | 2026-03-10 17:44

### Kie.ai 生图 API 回调模式（避免再次踩坑）

**问题描述**：
- Kie.ai API 是**异步任务 + 回调模式**，不是同步返回图片
- 创建任务成功返回 `taskId`，但状态查询端点 `/api/v1/jobs/{id}` 返回 404
- 直接轮询查询会失败

**解决方案**：
1. 启动本地回调服务器：`python3 scripts/kie_callback_server.py`（端口 8787）
2. 通过 Cloudflare Quick Tunnel 暴露到公网：`cloudflared tunnel --url http://localhost:8787`
3. 创建任务时带上 `callBackUrl` 参数
4. 回调收到后解析 `data.resultJson.resultUrls[]` 获取图片 URL
5. 用 `curl -L` 下载图片（不能用 urllib，会遇到 403）

**关键经验**：
- 每次使用前需要确保回调服务器和 Tunnel 正常运行
- 可以把 Tunnel PID 写入文件，方便后续检查和清理

---

## 📊 Memory 提炼 | 2026-03-10 08:12

### 近两日新增应固化的系统规则（2026-03-09 ~ 2026-03-10）

**1. 守护/维护类 `isolated + agentTurn` cron 必须显式设置 `delivery.mode=none`，不要吃默认 announce**
- 2026-03-10 08:03 二次巡检确认：4 条 Chief 守护任务在改成 `sessionTarget=isolated + payload.kind=agentTurn + agentId=main` 后，被默认带成了 `delivery.mode=announce`。
- 这类任务的职责是巡检、提炼、守卫，不应每次常规主动投递；否则会制造无谓打扰，也会让“任务执行”与“消息投递”耦合得过紧。
- 长期规则：凡是守护、巡检、记忆提炼、补发判定这类后台维护任务，若无明确对外通知需求，必须显式写 `delivery.mode=none`；只有真正需要提醒老板时，再单独配置通知路径。
- **战略含义**：把后台维护任务默认设为静默执行，能降低噪音、减少隐式投递副作用，也能让 cron 配置语义更清晰。

**2. 看 cron 健康度时，必须区分“主任务成功”与“消息投递失败”两层状态**
- 2026-03-09 当日汇总已出现典型案例：GitHub / Supabase / OpenClaw 监控若干 run 的 `error` 实际都是 `⚠️ ✉️ Message failed`，主任务本身并未中断。
- 长期规则：对 cron 做稳定性评估时，至少分成两层统计：
  - **执行层**：抓取 / 生成 / 同步 / 写入是否完成；
  - **投递层**：消息、announce、reply 是否成功送达。
- **战略含义**：只有把执行失败和投递失败拆开看，才能避免误判系统可靠性，也更容易把优化重点放到真正的薄弱环节。

## 📊 Memory 提炼 | 2026-03-10 06:05

### 近两日新增应固化的系统规则（2026-03-09 ~ 2026-03-10）

**1. Chief 守护类 cron 若需要可验证的执行摘要，应优先采用 `sessionTarget=isolated + payload.kind=agentTurn + agentId=main`，不要继续依赖 `main + systemEvent`**
- 已验证：仅靠强化 prompt 文案，仍不足以解决 run summary 只回显提醒文本的“假绿灯”问题。
- 2026-03-10 06:01 已完成结构性修复：将 `cron-health-check`、`daily-memory-extractor`、`ai-daily-delivery-guard`、`daily-content-publish-guard` 统一切到 isolated agentTurn，并显式指定 `agentId=main`。
- **战略含义**：Chief 守护任务的可观测性不能只靠提示词优化，必要时要直接调整执行形态，让 run history 更容易沉淀真实结果，而不是只留下提醒文本。

**2. 任何任务声称“已生成报告 / 已写入文件”时，必须把目标文件真实存在纳入成功判定**
- 近两日已出现两类证据：Product 任务 summary 声称产出 `memory/reports/competitor-analysis-2026-03-09.md`，但实际文件不存在；多项任务声称已写入 `memory/daily/2026-03-09.md`，但晚间核查时该日志仍缺失，最终需要 Chief 补建。
- 长期规则：对涉及落盘产物的任务，不能只看 `status` 或 summary 文案，还要抽样核对目标文件是否真实存在、路径是否正确、内容是否落盘。
- **战略含义**：这条规则能减少“看起来完成、实际上没落盘”的隐性失败，避免后续记忆提炼、报告归档和复盘建立在不存在的产物上。

## 📊 Memory 提炼 | 2026-03-10 04:08

### 近两日新增应固化的系统规则（2026-03-09 ~ 2026-03-10）

**1. Chief 的 system-event cron 不能只看 `status=ok`，必须防“假绿灯”**
- 已确认 `cron-health-check`、`daily-memory-extractor`、`ai-daily-delivery-guard`、`daily-content-publish-guard` 曾出现 run history 显示 `ok`，但 summary 只是回显提醒词的情况。
- 长期修复原则：Chief 守护类 cron prompt 必须强制写明 **执行路径 + 实际检查/补发/写入动作 + 结构化结果**，并明确禁止只复述任务说明。
- **战略含义**：后续评估 cron 质量时，不能只看表面状态，还要看 summary 是否证明“真的做了事”。

**2. `sessionTarget=isolated` + `payload.kind=agentTurn` 的 cron 必须显式设置 `agentId`**
- 新发现：`trustmrr-daily-analysis` 在待首跑前缺少 `agentId`，容易让任务在默认路由下产生执行歧义。
- 长期规则：凡是 isolated agentTurn 任务，都要把 `agentId` 当成必填项检查，不要依赖默认 agent 或隐式推断。
- **战略含义**：这能降低首跑异常、错路由和“配置看起来完整、实际有歧义”的隐性风险。

**3. 判断 cron 时间异常时，必须把 `staggerMs` 计入容差**
- 04:00 档任务出现 `nextRunAtMs` 略早于当前时间的现象，经核对属于 `staggerMs=300000` 的 5 分钟错峰窗口，不是真异常。
- 长期规则：Cron 健康检查不能只拿裸 `nextRunAtMs` 与当前时间硬比较，而要按 `nextRunAtMs + staggerMs` 判断是否真的漏调度。
- **战略含义**：这能减少误报，让巡检结果更接近真实运行状态。

---

## 📊 Memory 提炼 | 2026-03-09 10:05

### 今日新增（2026-03-09 上午）

**1. TrustMRR双人对谈播客技术方案**
- 角色定义：小李(男声-Yunxi) vs 老王(女声-Xiaoxiao)
- Edge TTS分角色生成独立ogg片段
- ffmpeg合并关键：必须用 `-c:a libopus` 编码（vorbis飞书不兼容）
- 飞书发送：asVoice=true + mimeType=audio/ogg
- Skill位置：/workspace/skills/trustmrr-podcast/SKILL.md

**2. OpenClaw v2026.3.7 动态**
- ContextEngine 插件接口
- 生命周期钩子支持 (bootstrap, ingest, assemble, compact等)
- scoped subagent runtime
- sessions.get 网关方法
- 为 lossless-claw 等插件提供支持

---

## 📊 Memory 提炼 | 2026-03-15 04:10

### Cron 任务超时问题的持续优化（第三轮）

**问题描述**：
- 2026-03-15 凌晨检查发现3个 cron 任务 timeout：
  - `openclaw-news-monitor` (growth): timeout 15min → 运行超时
  - `daily-skill-evolution` (coding): timeout 30min → 运行超时
  - `github-daily-backup` (coding): timeout 30min → 运行超时（连续4次）

**修复方案**：
- 使用 `openclaw cron edit <job-id> --timeout-seconds <seconds>` 更新超时配置
- 修复结果：
  - openclaw-news-monitor: 900s → 1800s (30min)
  - daily-skill-evolution: 1800s → 2700s (45min)
  - github-daily-backup: 1800s → 2700s (45min)

**经验总结**：
- 监控类任务（openclaw-news-monitor）：建议至少 30min
- 技能进化/备份类任务：建议至少 45min
- 内容生成类任务：建议至少 2h (7200s)
- 定期观察实际执行时间进行调整

---

## 📊 Memory 提炼 | 2026-03-15 08:05

### Cron 任务超时问题持续优化（第四轮）

**问题描述**：
- 3个任务持续 timeout：openclaw-news-monitor、daily-skill-evolution、github-daily-backup
- 调整路径：15min → 30min → 45min → 60min
- 根因：任务实际执行时间接近或超过超时限制

**经验总结**：
- 监控类任务（openclaw-news-monitor）：建议至少 60min
- 技能进化/备份类任务：建议至少 60min
- 内容生成类任务：建议至少 2h
- 定期观察实际执行时间进行调整

---

> 最后更新: 2026-03-16 10:04

## 📊 Memory 提炼 | 2026-03-16 10:04

### SupaData API 调用已验证可用

**问题**：SupaData API 连接失败 - 域名错误
- 错误域名：`api.supadata.io`（不存在）
- 正确域名：`api.supadata.ai`
- Skill 位置：`/root/.openclaw/workspace-coding/tmp/2ndbrain/skills/supadata/`

**调用方式**：
```python
from supadata_client import SupadataClient
client = SupadataClient()
result = client.get_transcript("https://youtu.be/VIDEO_ID")
```

**凭据**：`/root/.openclaw/credentials/supadata.json`

**战略含义**：
- YouTube/Twitter/TikTok 等内容抓取优先使用 Supadata
- 比 YouTube Data API 更可靠（不需要配置 API Key）

---

## 📊 Memory 提炼 | 2026-03-15 04:10

### Cron任务超时问题的持续优化

**问题描述**：
- sync-supabase-30m 任务持续超时
- 初始timeoutSeconds: 300s (5分钟) → 超时
- 多次调整: 300s → 600s → 1200s → 1800s

**解决方案**：
- 根据任务复杂度设置合理的timeoutSeconds
- 高频同步任务(如30分钟一次)建议至少600s
- 内容生成类任务建议至少1800s
- 定期观察实际执行时间进行调整

**经验**：
- timeoutSeconds调整后需要等待下一次执行验证
- 不要只看lastStatus，要查看实际的durationMs
- 有时代理执行时间可能比预期长

## 📊 Memory 提炼 | 2026-03-15 00:10

### GitHub push 失败处理：远程有本地没有的 commit

**问题描述**：
- 本地 `git push` 失败，错误：`error: failed to push some refs... Updates were rejected because the remote contains work that you do not have locally`
- 原因：远程仓库有本地没有的 commit（可能是其他设备或手动提交）

**解决方案**：
- 执行 `git pull --rebase` 合并远程更改
- 然后再 `git push`

**命令**：
```bash
git pull --rebase
git push
```

**战略含义**：
- 不要在有外部提交的仓库上直接 force push
- 先 pull 再 push 是更安全的协作方式

---

### Edge-TTS 语音合成时 emoji 导致音频损坏

**问题描述**：
- 用户反馈 TTS 语音播放时出现杂音
- 原因：edge-tts 会把 emoji 字符当作异常文本处理，导致生成的音频极短（1.59秒）且损坏

**解决方案**：
- 在 `build_feishu_voice.py` 中添加 `remove_emoji()` 函数
- TTS 合成前过滤掉 emoji，保留原文显示
- Emoji 正则只匹配 emoji 字符范围，不触及其他 Unicode 字符（如中文）

**技术细节**：
- 分离"显示文本"和"朗读文本"
- 朗读时过滤 emoji，显示时保留原样

**战略含义**：
- 语音合成前需清理特殊字符
- 正则需精确范围，避免误删 CJK 字符

---

## 📊 Memory 提炼 | 2026-03-14 02:05

### Cron 任务超时问题的系统性修复：任务超时从 1h 调整为 2h

**问题描述**：
- 多个 cron 任务（daily-content-publish、ai-kol-daily-newsletter、sync-github-18-00）因执行超时被系统强杀
- 错误信息：`Error: cron: job execution timed out`
- 超时限制默认为 1 小时，部分长跑任务（如内容生成）无法在时限内完成

**修复方案**：
- 将任务超时从 3600s (1h) 调整为 7200s (2h)
- 修复命令：`openclaw cron edit <job-id> --timeout 7200000`
- 同时补全 ai-kol-daily-newsletter 的飞书投递目标配置

**修复的任务**：
| 任务 | 修复内容 |
|------|---------|
| daily-content-publish | 超时 1h → 2h |
| ai-kol-daily-newsletter | 超时 1h → 2h + 飞书投递 target |
| sync-github-18-00 | 超时 1h → 2h |

**战略含义**：
- Cron 任务超时应根据任务性质差异化配置，不能一刀切
- 内容生成类任务（需要研究、写作、多格式输出）建议至少配置 2h 超时
- 后续新增 cron 任务时，应根据任务复杂度预估合理的超时时间

### OpenClaw 2026.3.12 / 3.14 版本新特性

**版本号**：2026.3.14 (最新)
**发布时间**：2026-03-14

**新功能**：
- 🖥️ Android 聊天设置重构：分组设备/媒体区域，更紧凑的移动端布局
- 📱 iOS 引导页优化：首次欢迎页 + QR 扫描指引，停止自动打开扫描器
- 🔌 Chrome DevTools MCP：官方支持附加到已登录 Chrome 会话
- 🌐 Browser profiles：`profile="user"` (主机浏览器) / `profile="chrome-relay"` (扩展中继)
- ⚡ 批量浏览器操作：支持 batched actions、selector 定位、延迟点击
- 🐳 Docker 时区覆盖：新增 `OPENCLAW_TZ` 环境变量
- 📦 Pi 依赖更新：升级到 0.58.0

**关键修复**：
- Dashboard 性能优化：工具结果不再触发完整历史重载
- Gateway 超时处理：RPC 调用增加 bounded timeout
- Ollama 推理隐藏：不再泄露内部思考内容
- 浏览器会话加强：driver 验证加强，断线自动重连

**升级建议**：移动端体验优化明显，推荐升级 🚀

---

### OpenClaw 2026.3.8 版本新特性

**版本号**：2026.3.8 (3caab92)
**发布时间**：2026-03-13

**新功能**：
- 🖥️ Control UI/dashboard-v2：全新模块化仪表盘，支持 command palette、移动端底部标签
- ⚡ OpenAI GPT-5.4 / Claude Fast Mode：会话级快速切换
- ☸️ K8s 安装文档上线
- 💬 Slack Block Kit 支持
- 🔄 sessions_yield：编排器可提前结束当前 turn 并携带隐藏 payload 进入下一轮

**安全修复**：
- 🔐 设备配对改为短效 bootstrap token
- 🔒 禁用 workspace 插件自动加载（防止克隆仓库自动执行恶意代码）

**Bug 修复**：20+ 项，包括 Kimi Coding 工具调用、TUI 重复消息、Cron 投递等

---

## 📊 Memory 提炼 | 2026-03-09 04:05

### 今日新增（2026-03-09）

**1. 飞书多维表格写入格式已验证**
- 写入 Bitable 必须使用中文字段名，不能用 field_id
- ❌ `{"fldhqf2zi3": "值"}` → 报错 FieldNameNotFound
- ✅ `{"案例名称": "值"}` → 成功写入

**2. KIE AI 生图异步链路已跑通**
- 官方端点：`POST https://api.kie.ai/api/v1/jobs/createTask`
- 请求结构：`{ model, callBackUrl?, input }`
- 回调字段：`data.resultJson.resultUrls[]`
- 关键坑位：KIE 图床有时返回 403，下载必须用 `curl -L` fallback
- 已集成到 baoyu-slide-deck skill

**⚠️ 重要：KIE 回调服务器必须先启动**
- 问题：回调服务器未运行时，KIE 回调无法接收，任务一直 pending
- 解决：每次使用 KIE 前必须先启动：
  1. `python3 ~/.agents/skills/baoyu-slide-deck/scripts/kie-callback-server.py &`
  2. `cloudflared tunnel --url http://127.0.0.1:8787`（每次地址不同！）
- 回调地址会变：每次启动 Tunnel 都会生成新的 trycloudflare.com 地址
- 解决方案：Tunnel 日志中提取最新地址，或在提交任务时动态获取

**3. 2nd Brain 云端稳定性三层设计**
- 本地可用 + 云端可用 + 数据缺失可降级
- Next.js 多 workspace 需显式 `outputFileTracingRoot: process.cwd()`
- 前端搜索必须 null-safe 处理
- 图表/API 数据必须有 Supabase fallback

---

> 最后更新: 2026-03-15 16:05

---

## 📊 重要经验沉淀 | 2026-03-08

### 1. Skill 路径管理机制（重要）
- **问题**：isolated session 中的 agent 无法自动找到已注册的 skill
- **解决方案**：在 AGENTS.md 中建立 Skill Catalog，所有 Sub Agent 启动时必读
- **配置要求**：所有调用 skill 的 cron 任务，必须在配置中添加 `skill_path` 字段
- **文件位置**：
  - AGENTS.md - Skill Catalog（真相源）
  - cron-agent-dispatch.yaml - 任务级配置
  - memory/agents/{agent}/memory.md - Agent 私有记忆

### 2. 飞书凭据配置
- **状态**：飞书多维表格凭据未完整配置（缺少 feishu.json）
- **临时方案**：优先使用飞书云文档（feishu-doc）代替多维表格
- **待配置**：需要在 credentials/ 目录添加飞书应用凭据

### 3. 飞书多维表格写入格式（重要经验）
- **问题**：写入记录报错 `FieldNameNotFound`
- **根因**：错误使用 field_id 作为 key
- **正确方式**：使用中文字段名作为 key
  - ❌ `{"fldhqf2zi3": "值"}`
  - ✅ `{"案例名称": "值"}`
- **结论**：飞书 Bitable API 需要使用人类可读的中文字段名，不是内部 ID

### 4. 飞书文档权限问题
- **现象**：创建文档时无法自动添加用户权限
- **原因**：runtime 以 app 模式运行，无法获取用户 identity
- **错误信息**：`trusted requester identity unavailable`
- **临时方案**：需要手动在飞书中添加编辑权限
- **长期方案**：需要配置 user_access_token 或使用用户授权模式

### 5. 飞书文档权限添加成功 (10:52)
- 使用 Python 脚本直接调用飞书 API 成功添加编辑权限
- API 端点：`POST /drive/v1/permissions/{token}/members`
- 参数：`type=docx/bitable`, `member_type=openid`, `member_id`, `perm=edit`
- 已添加权限的文档：
  - ✅ 案例清单 (docx)
  - ✅ 价格对比 (docx)
  - ✅ 多维表格 (bitable)

### 3. 模型切换
- 当前主力模型：openai-code/gpt-5.4
- Fallback 链：minimax-cn/MiniMax-M2.5 → kimi-coding/k2p5

---

## 📊 工具映射表 | 2026-03-08

### 微信公众号抓取
- 工具：`tools/wechat-article-for-ai`
- 位置：`/root/.openclaw/workspace/tools/wechat-article-for-ai/`
- 已封装为 Skill：SKILL.md 已存在
- 调用方式：`python main.py "文章URL"`
- MCP 模式：`python mcp_server.py`（可选）

### Chief 路由关键词
- "公众号" → Content Agent
- "抓取" → Content Agent  
- "提取" → Content Agent

### Content Agent 内部映射
见 `memory/agents/content/memory.md`

---

## 📊 Memory 提炼 | 2026-03-08 12:06

### 今日新增（2026-03-08 上午）

**1. 图片生成 API 现状**
- GLM API：已配置并验证 `cogview-3` / `cogview-3-plus` 可用于生图
- KIE API (nano-banana-2)：已实测跑通异步生图链路
  - 官方端点：`POST https://api.kie.ai/api/v1/jobs/createTask`
  - 请求结构：`{ model, callBackUrl?, input }`
  - 回调字段：`data.resultJson`，解析后读取 `resultUrls[]`
  - 已验证：本地 callback server + Cloudflare Tunnel + 自动下载结果图
- KIE 已集成进 PPT 生成 Skill：`/root/.agents/skills/baoyu-slide-deck/`
- 关键坑位：KIE 图床有时对 `urllib` 返回 403，下载逻辑必须保留 `curl -L` fallback
- 备选方案：Replicate / OpenAI DALL-E / DashScope

**2. 飞书凭据配置**
- 飞书应用凭据已添加到 credentials/feishu-default-allowFrom.json
- 多维表格权限添加已跑通（Python 脚本调用 API）

---

## 📊 Memory 提炼 | 2026-03-08 02:00

### 今日新增（2026-03-08）

**1. EvoMap 拉取脚本修复**
- 问题：Coding Agent 报告 "无新报告"
- 根因：
  1. 缺少 `Authorization: Bearer <node_secret>` 认证头
  2. JSON 格式错误 (`status: "promfilters": {"oted"}`)
  3. 数据路径错误 (读取 `payload.capsules` 而非 `payload.results`)
  4. 缺少去重机制
- 修复：
  - 添加 `Authorization: Bearer <node_secret>` 认证头
  - 修正 JSON 结构
  - 添加 node_secret 持久化 (`/root/.openclaw/credentials/evomap.json`)
  - 添加 processed.json 去重
- 结果：成功拉取 16 个新胶囊（confidence ≥ 0.9, streak ≥ 5）
- 脚本位置：`/root/.openclaw/workspace/scripts/evomap_auto_pull.sh`

**2. Vercel 构建失败处理**
- 项目：github.com/jeffli2002/2ndbrain
- 错误：`No Next.js version detected`
- 原因：package.json 缺少 `next` 依赖声明
- 状态：待修复

---

> 最后更新: 2026-03-08 13:42

---

## 📊 Memory 提炼 | 2026-03-07 22:05

### 近2日应沉淀的长期信息（2026-03-06 ~ 2026-03-07）

**1. 飞书语音回复必须使用专用 Skill**
- 语音文件必须存放在 Workspace 下：`/root/.openclaw/workspace/temp/voice/`，禁止用 /tmp
- 必须使用 feishu-voice-reply Skill，不能直接用 tts 工具
- 技术链路：Edge TTS → ffmpeg 转 Ogg/Opus → Feishu asVoice 发送
- 所有 Sub Agent 启动时必须读取 `skills/feishu-voice-reply/SKILL.md`

**2. 小红书运营最佳实践**
- cookies 注入方案验证通过：通过 CDP Network.setCookies 注入远端 Chrome
- 登录态备份位置：`/root/.openclaw/credentials/xiaohongshu.json`
- 内容规则：标题≤20字、正文≤1000字（建议800~1000）、首句不重复标题、开头emoji、结尾#tag
- fallback 封面：`skills/xiaohongshu-skills/assets/fallback-cover.png`

**3. 数据核实硬规则（持续强调）**
- 禁止在对外内容中编造任何数据
- 价格、参数、排名等信息必须来自官方或权威来源
- 正确流程：先查证 → 写作 → 发布前复核
- 不确定时明确标注"待核实"

**4. Chief 私聊委派已具备真实执行能力**
- 分类方式：`config/agent_keyword_router.yaml`
- 委派方式：`sessions_spawn(runtime="subagent", mode="run")` 即时拉起 worker
- 回传协议：JSON 格式，结果写入 `/output/dispatch_results/`
- 强校验参数：allowed_dir + expected_dispatch_id + expected_agent + expected_route_debug

**5. 模型配置**
- Main / Coding：GPT-5.4 → MiniMax M2.5 → Kimi 2.5
- 其他 Sub Agent：MiniMax M2.5 → Kimi 2.5

**6. 微信公众号发布**
- 凭据位置：`skills/content-factory/.env`
python3 -X- 发布命令：` utf8 scripts/wechat_publish.py --html "path/to/article.html"`
- 必须加 `-X utf8` 参数

---

> 最后更新: 2026-03-07 16:05

---

## 📊 Memory 提炼 | 2026-03-07 16:05

### 今日提炼 (2026-03-07)

**1. 微信公众号文章读取 - 镜像+搜索方案**
- 微信原文章有登录墙，直接抓取会失败
- 可行方案：搜文章标题 → 找腾讯新闻/其他平台镜像 → web_fetch 抓取镜像站全文
- 备选方案：Agent-Reach 的 wechat-article-for-ai（需要配置）

**2. 小红书发布 - cookies 注入方案验证通过**
- 用户提供 cookies（含 a1、web_session、creator token）
- 通过 CDP Network.setCookies 注入远端 Chrome
- 验证结果：可直接进入 creator.xiaohongshu.com 发布页
- 备份位置：`/root/.openclaw/credentials/xiaohongshu.json`

**3. 小红书发布规则已标准化**
- 标题：≤20 字
- 正文：≤1000 字（建议 800~1000）
- 首句不重复标题
- 开头带 emoji
- 结尾带 #tag
- 脚本校验：`content_rules.py`

**4. Cron 健康检查**
- 22个任务，16个 ok，1个 error（product-competitor-analysis 投递失败）
- 其他正常运行

---

## 📊 Memory 提炼 | 2026-03-07 14:05

### 今日新沉淀 (2026-03-07 下午)

**1. Fallback 机制已修复**
- 问题根因：原 fallback 链只有 `kimi-coding/k2p5`，没有 MiniMax；当 gpt-5.4 失败时无法切换到稳定模型
- 已修复：添加 `minimax-cn/MiniMax-M2.5` 到 fallback 链
- 当前 fallback 顺序：`gpt-5.4 (primary) → kimi-coding/k2p5 → minimax-cn/MiniMax-M2.5`
- 后续影响：Cron 任务失败时应该会正确切换到 MiniMax，不再卡在 gpt-5.4 额度耗尽

**2. Content Factory 的 GLM-Image API 未配置**
- 微信公众号封面图生成依赖 GLM-Image API (`https://open.bigmodel.cn/api/paas/v4/images/generations`)
- 当前 `.env` 只配置了微信公众号 AppID/AppSecret
- GLM API Key 需要从 https://open.bigmodel.cn 获取
- 影响：封面图生成会失败，需配置 API Key 或使用备用方案

**3. Cron 任务失败监控**
- `sync-github-12-00` 失败原因：gpt-5.4 API 额度用完 (400 limit exceeded)
- `product-competitor-analysis` 失败原因：消息投递失败 (⚠️ ✉️ Message failed)
- 大部分 Cron 任务正常，但需要持续监控失败率和 fallback 是否生效

**1. Chief 私聊委派链路已从"概念路由"升级为"真实闭环"**
- 已完成真相源收敛：Chief 读取 `openclaw.json` bindings + `config/agent_keyword_router.yaml` 做分类与执行规划，不再依赖伪 session_key / 旧路由配置。
- 当前 Feishu 通道下，稳定委派方式已明确为：`sessions_spawn(runtime="subagent", mode="run")` 按任务即时拉起 worker，而不是假设存在持久 thread worker。
- 已跑通 content / coding / growth / product / finance 五类 worker 的完整闭环：**分类 → delegate_spawn → worker执行 → JSON结果桥回传 → Chief消费结果**。
- 已加固 `scripts/wait_dispatch_result.py` 与 `scripts/chief_dispatch.py`：结果桥默认走 JSON 协议，并强校验 `allowed_dir + expected_dispatch_id + expected_agent + expected_route_debug`，降低误读旧文件或脏结果的风险。
- 已归档 legacy 路由文件并补充 `docs/chief-dispatch-truth-sources.md`，避免再次出现"双真相源"与"看起来能派活、实际没派"的配置幻觉。
- **战略含义**：Chief 的私聊分发现在已经具备真实执行能力，下一阶段重点应放在稳定性、观测性和交互体验，而不是继续堆抽象路由设计。

**2. 小红书发布路径已从"登录受阻"推进到"可复用登录态 + 半自动发布验证"**
- 03-06 暴露的核心阻塞点是：纯服务器 Headless 环境无法完成小红书登录验证；滑块/验证链路不适合无 GUI 的纯自动登录。
- 03-07 在老板提供关键 cookies 后，已通过 CDP `Network.setCookies` 将登录态注入远端 Chrome，并验证可直接进入 creator 发布页：`https://creator.xiaohongshu.com/publish/publish?source=official`。
- 发布页上传区域与创作者相关元素已可见，说明后续可继续做图文发布半链路测试。
- 当前登录态已备份到：`/root/.openclaw/credentials/xiaohongshu.json`。
- **战略含义**：小红书现阶段的现实可行方案不是"纯自动登录"，而是**可复用 cookies/登录态备份 + 浏览器会话注入**。这条路径比继续死磕 Headless 登录更稳。

**3. 小红书发布 Skill 已从临时脚本升级为"前置校验 + 资产兜底"的可复用流程**
- 已把内容规则固化进 `skills/xiaohongshu-skills/skills/xhs-publish/SKILL.md`：标题≤20、正文≤1000（建议 800~1000）、首句不重复标题、开头带 emoji、结尾带 #tag。
- 已新增 `skills/xiaohongshu-skills/scripts/content_rules.py`，把内容校验与轻量规范化提前到发布前，而不是等浏览器流程里才报错。
- 已修改 `skills/xiaohongshu-skills/scripts/cli.py` 与 `scripts/publish_pipeline.py`：未提供图片时自动尝试 fallback 封面。
- 已沉淀稳定 fallback 资源：`skills/xiaohongshu-skills/assets/fallback-cover.png`。
- **战略含义**：内容合规、基础素材与失败兜底已经前移，后续小红书发布失败会更多暴露在"平台交互/风控"层，而不是文案规则或素材缺失这类低级问题。

**4. GitHub 备份与工作区同步机制继续有效**
- 已检查 workspace 仓库状态：工作区干净，本地 `main` 一度领先远端 4 个提交。
- 已成功执行 `git push origin main`，把小红书登录态备份流程、发布规则固化等关键工作同步到 GitHub 仓库 `jeffli2002/openclaw`。
- **战略含义**：与发布链路、技能固化相关的关键资产已完成远端留档，降低"只存在本机会话里"的单点风险。

### 当前应持续坚持的方向
- **外部内容与发布**：继续坚持"前置规则校验 + 自动化到草稿/半链路 + 人工把关最终发布"的稳妥策略。
- **系统建设**：Chief→Worker 真实闭环已经具备，现阶段优先补稳定性、日志、失败恢复与用户可见状态反馈。
- **平台攻坚**：遇到小红书这类强风控平台，优先利用已验证的登录态复用与浏览器注入方案，不再把纯 Headless 登录当主路径。

---

## 📊 Memory 提炼 | 2026-03-06 18:00

### 今日核心进展

**GPT-5.4 vs Claude 对比文章发布** (2026-03-06 下午)
- 主题：GPT-5.4发布，最强AI大脑来了，OpenClaw配它才更香
- 修改次数：4次（根据老板反馈不断调整）
- 最终状态：草稿已创建，需手动发布
- 关键修改点：
  - 核心逻辑：OpenClaw是AI Agent框架，需要配"大脑"（大模型）
  - Claude Code关系：Pro订阅是桌面应用，和OpenClaw里用是两回事
  - GPT-5.4价格：$20/月起（不是$200）
  - API支持：GPT-5.4有官方API（$2.5/M输入/$15/M输出）
  - 模型名称：GPT Codex 5.3（不是GPT-5.3-Codex）

**小红书发布失败** (2026-03-06 下午)
- 问题：服务器环境无X server，无法运行图形界面Chrome
- 原因：Headless模式无法完成小红书登录验证（需要滑动验证码）
- 结论：需要本地有GUI的电脑来运行小红书发布

**飞书语音Skill固化完成** (2026-03-06 14:30)
- 已创建：`skills/feishu-voice-reply/`
- 技术链路：Edge TTS → ffmpeg 转 Ogg/Opus → Feishu asVoice 发送
- 默认形态：用户说"语音播放"时，默认同时发送**文字 + Ogg/Opus语音消息**
- 已打包：`dist/skills/feishu-voice-reply.skill`

**模型配置最终确认** (2026-03-06 14:30)
- Main / Coding：`GPT-5.4 → Minimax M2.5 → Kimi 2.5`
- 其他 Sub Agent：`Minimax M2.5 → Kimi 2.5`

**重大教训：数据核实硬规则** (2026-03-06)
- 错误：撰写GPT-5.4文章时编造API价格 $30/M（实际$2.5/M）
- 正确流程：先查证官方数据 → 再写作 → 完成后再次核实
- 规则：价格/参数/排名等信息必须来自官方或权威来源，不确定时标注"待核实"

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

**1. 内容生产进入"半自动发布"阶段**
- 微信公众号链路已跑通到"创建草稿"这一步，凭据应写入 `skills/content-factory/.env`，发布命令固定为：`python3 -X utf8 scripts/wechat_publish.py --html "path/to/article.html"`
- 当前API权限不足以完成preview/最终发布，因此现实可用流程是：**AI生成内容 → 脚本创建草稿 → 人工后台确认发布**
- 这意味着内容自动化已经能显著提效，但最后一步仍需人工把关，适合作为当前稳定工作流

**2. 建立"先核实、后写作"的硬规则**
- 已出现一次严重质量事故：GPT-5.4文章中错误编造API价格
- 战略上必须把"数据核实"前置到写作前，尤其是**价格、参数、榜单、基准测试、订阅方案**这类高风险信息
- 后续所有对外内容默认执行：**官网/权威来源核实 → 写作 → 发布前复核**；若无法确认，则明确标注"待核实"

**3. 多Agent基础设施已形成可复用框架**
- Sub Agent身份问题已修复：所有Agent必须称呼用户为"老板"或"Jeff"，不能直呼姓名
- 已形成可复制的多Agent配置模板：**独立workspace + 独立记忆 + 群聊bindings + 明确system prompt约束**
- 对Jeff的长期价值是：后续新增Agent或新群聊时，可以按同一模板快速扩展，而不是每次从零调试身份与上下文

**4. Cron → Agent调度体系已经成型，但稳定性仍需补强**
- 已完成 `config/cron-agent-dispatch.yaml` + `scripts/cron_dispatcher.py` 的调度骨架，并迁移8个主要Cron任务
- 这标志着日常运营任务开始从"单点脚本执行"升级为"按职能分发给对应Agent执行"
- 当前主要瓶颈集中在：`strategic.md`编辑失败、部分Cron报错、Chief日报发送失败、session send权限限制
- 下一阶段重点不是继续扩任务数量，而是**先补稳定性和可观测性**，把已有自动化跑稳

**5. Agent模型分工已更新，已正式引入 GPT-5.4**
- Main / Coding：GPT-5.4 主力，Minimax M2.5 第一Fallback，Kimi 2.5 第二Fallback
- 其他 Sub Agent（Content / Growth / Product / Finance）：Minimax M2.5 主力，Kimi 2.5 Fallback
- 这代表系统已从"MiniMax/Kimi 二选一"升级为"主Agent高能力模型 + 其他Agent性价比模型"的分层策略
- 后续优化原则：主Agent与Coding优先保证推理/编码质量，其余Sub Agent优先平衡速度、成本与稳定性

**6. 飞书语音播放链路已沉淀为可复用 Skill**
- 已验证可行链路：**Edge TTS → ffmpeg 转 Ogg/Opus → 飞书语音消息播放条**
- 结论：飞书里若想展示可播放/暂停的原生播放条，不能停留在 raw mp3 文件，必须走 Opus/Ogg 方向
- 已封装为可分享技能：`skills/feishu-voice-reply/`
- 已打包产物：`dist/skills/feishu-voice-reply.skill`
- 默认能力形态：用户说"语音播放一下……"，系统同时返回**文字回复 + 飞书语音播放条**

### 当前应持续坚持的方向
- **对外内容**：先保证真实性，再追求爆款效率
- **系统建设**：先保证现有Cron/Agent链路稳定，再扩更多自动化场景
- **组织方式**：继续强化Chief统筹 + 专业Sub Agent执行的分工模式
- **人工介入点**：保留在"最终发布、重大策略、敏感外发"这些高风险环节

## 📊 Memory 提炼 | 2026-03-06 14:30

### 今日新增固化能力

**飞书语音播放 Skill 已完成封装** (2026-03-06)
- 新建 Skill：`skills/feishu-voice-reply/`
- 统一安装路径：`/root/.openclaw/workspace/skills/feishu-voice-reply`
- 已打包产物：`/root/.openclaw/workspace/dist/skills/feishu-voice-reply.skill`
- 能力链路：Edge TTS → ffmpeg 转 Ogg/Opus → Feishu 语音消息（可播放/暂停）
- 使用约定：用户说"语音播放一下……"时，默认同时返回文字 + 飞书语音播放条
- 安全结论：Skill 内未写入私人凭据、Token、Secret，可对外分享

**模型分工记忆已修正** (2026-03-06)
- Main / Coding：GPT-5.4 → Minimax M2.5 → Kimi 2.5
- 其他 Sub Agent 默认：Minimax M2.5 → Kimi 2.5
- 旧记忆中关于 Chief/Content/Coding 与 Growth/Product/Finance 的模型分工已过期，后续以本条为准

## 📊 Memory 提炼 | 2026-03-06 16:00

### 近2日应沉淀为长期规则的信息（2026-03-05 ~ 2026-03-06）

**1. 内容自动化的稳定形态已经明确：生成草稿自动化，最终发布人工把关**
- 微信公众号发布链路已经验证可用，但当前最稳妥的工作流不是"全自动发布"，而是 **AI生成内容 → 脚本创建草稿 → 人工在公众号后台确认发布**
- 凭据应固化在 `skills/content-factory/.env`，发布命令固定使用 `python3 -X utf8 scripts/wechat_publish.py --html "path/to/article.html"`
- 这条经验值得长期保留，因为它定义了内容业务当前"可规模化但不过度冒险"的运营边界

**2. 对外内容必须执行"先核实、后写作、发布前复核"**
- GPT-5.4 价格数据编造事故说明：只要涉及 **价格、参数、排行榜、基准测试、订阅方案**，就必须先查官方或权威来源
- 该规则不是内容写作细节，而是品牌可信度的底线规则
- 后续若信息无法确认，默认明确标注"待核实"，而不是靠猜测补齐

**3. 多 Agent 体系已经从"能跑"进入"可复制"阶段**
- Sub Agent 身份与称呼问题已修复，统一要求称呼用户为"老板"或"Jeff"
- 已形成一套可复用模板：**独立 workspace + 独立记忆 + 群聊 bindings + system prompt 强约束**
- 这意味着后续扩 Agent、扩群聊、扩任务，不需要重新摸索基础设施，重点转向复用与规范化

**4. Cron 调度的下一阶段重点不是扩数量，而是补稳定性**
- `config/cron-agent-dispatch.yaml` 与 `scripts/cron_dispatcher.py` 已经把"任务 → Agent"的分发骨架搭起来
- 已迁移的主要任务说明方向正确，但当前暴露的问题也很明确：`strategic.md` 编辑失败、部分 Cron 报错、Chief 日报发送失败、session send 权限限制
- 战略上应优先投入到 **稳定性、错误恢复、可观测性**，而不是继续增加新自动化任务数量

**5. 模型与能力分层已经成型，可作为现阶段默认配置**
- Main / Coding：`GPT-5.4 → Minimax M2.5 → Kimi 2.5`
- 其他 Sub Agent：`Minimax M2.5 → Kimi 2.5`
- 飞书语音能力已沉淀为可复用 Skill：`skills/feishu-voice-reply/`，标准链路为 **Edge TTS → ffmpeg → Ogg/Opus → 飞书原生语音播放条**
- 这代表系统建设已不止于"完成任务"，而是在积累可复制、可分享、可安装的能力资产

### 当前阶段的总判断
- **业务侧**：内容生产已经具备稳定提效条件，但最终发布与事实核查仍应保留人工把关
- **系统侧**：多 Agent + Cron + Skill 封装这条路已经验证可行，接下来应从"堆功能"转到"跑稳定"
- **组织侧**：Chief 统筹、Sub Agent 专业执行的分工继续成立，且开始产生复利效应

## 📊 Memory 提炼 | 2026-03-07 08:00

### 近2日新增应固化的战略信息（2026-03-06 ~ 2026-03-07）

**1. AI 竞争判断应从"模型参数战"升级为"平台系统战"**
- 结合 2026-03-07 AI 日报整理的 6 条主线：OpenAI 超大额融资、Anthropic 与 Pentagon 冲突升级、Google Gemini 3 Deep Think、Nvidia FY2026 Q4 财报、华为 Atlas 950 SuperPoD、Cursor 异步 AI coding agents。
- 当前更关键的判断不是单点模型谁更强，而是竞争重心正在转向：**模型能力 + 算力供给 + 分发入口 + 合规渠道** 的平台级组合能力。
- **战略含义**：Jeff 的产品与内容布局不能只追模型榜单，要优先捕捉"谁掌握入口、算力、企业落地与 Agent 工作流"这类更高层信号。

**2. Agent 产品趋势已明确进入"异步并行执行"阶段**
- 03-07 日报已把 Cursor 的异步 AI coding agents 更新列为核心观察点。
- 结合 Chief 在 03-06 已跑通的 worker 委派闭环，内部能力演进方向与外部产品趋势已经对齐：不是让单个 Agent 在前台长时间独占，而是把复杂任务拆给后台 worker 并行处理，再回传结果。
- **战略含义**：后续应继续强化 Chief 的任务编排、状态回传、失败恢复与用户可见进度，而不是把主会话做成单线程长阻塞执行器。

**3. 小红书现阶段最稳路径已收敛为"登录态复用 + 发布前强校验 + 素材兜底"**
- 03-06 暴露出 Headless + 滑块验证不可行；03-07 已通过注入 cookies 成功进入 creator 发布页，确认登录态复用是现实路径。
- 同时已把文案规则前置到 `content_rules.py`，并加入 fallback 封面机制，意味着低级失败点已被前移拦截。
- **战略含义**：小红书后续优化重点应转向平台交互稳定性、发布动作成功率和风控兼容，而不是继续消耗时间在纯自动登录上。

**4. 内容自动化的长期底线规则进一步明确：先核实，再生成，再沉淀为可复用资产**
- 03-06 的价格编造事故已经形成硬规则；03-07 又把小红书规则、脚本校验、fallback 资源、登录态备份都沉淀为文件化资产，并完成 GitHub 远端备份。
- 说明当前最优工作方式不是"临场拼一把"，而是把每次验证过的流程尽快固化成：**规则文件 + 校验脚本 + 凭据备份 + 远端留档**。
- **战略含义**：对外内容必须坚持真实性优先；对内流程必须坚持资产化沉淀，减少关键能力只存在于单次会话里的风险。

### 当前阶段建议继续坚持
- **外部判断**：内容选题继续围绕平台级 AI 竞争、Agent 工作流、企业落地与算力格局，不陷入纯模型参数比较。
- **内部建设**：优先补强 Chief/Worker 的状态展示、失败恢复、日志和观测性。
- **平台运营**：小红书采用"可复用登录态 + 发布规则前置校验 + fallback 素材"作为默认工作流。
- **资产管理**：凡是跑通的链路，都要同步做到本地固化 + GitHub 备份，防止知识和流程只留在临时上下文里。

## 📊 Memory 提炼 | 2026-03-07 18:05

### 今日新增应固化的操作信息（2026-03-07）

**1. Sub Agent 必须读取飞书语音 Skill 规则**
- 问题：Sub Agent 在飞书群聊里使用语音自我介绍时，显示的是 MP3 文件而不是播放条
- 根因：飞书语音 Skill 规则没有同步到各 Sub Agent 的 workspace
- 修复方案：
  - 更新 `AGENTS.md`：Sub Agent 启动时必须读取 `skills/feishu-voice-reply/SKILL.md`
  - 更新各 `SOUL.md`：强制写入飞书语音规则 Sub Agent 的
  - 同步所有 workspace：`cp -r workspace/* workspace-{content,growth,coding,product,finance}/`
- 关键规则：
  - **语音文件必须存放在 Workspace 下**：`/root/.openclaw/workspace/temp/voice/`，禁止用 /tmp
  - 必须用 feishu-voice-reply Skill，不能直接用 tts 工具

**2. 小红书发布规则已固化**
- 标题：≤20 字符
- 正文：≤1000 字符（建议 800~1000）
- 首句不能重复标题
- 开头带 emoji
- 结尾带 #tag
- 脚本位置：`skills/xiaohongshu-skills/scripts/content_rules.py`
- fallback 封面：`skills/xiaohongshu-skills/assets/fallback-cover.png`

**3. 今日 Cron 异常**
- `product-competitor-analysis` (14:00) 执行失败，状态 error
- 需要后续调查 Product Agent 问题

**4. 今日完成 Chief 每日汇报**
- 已于 19:30 成功发送每日汇报到飞书
- 包含：各 Agent 进展、GitHub 同步、Supabase 同步、OpenClaw 动态、需要确认事项

## 📊 Memory 提炼 | 2026-03-08 20:18

### 近2日新增应固化的长期信息（2026-03-07 ~ 2026-03-08 晚）

**1. Cron 的 `summary_only` 任务必须显式区分“常规摘要”与“老板通知”路径**
- `product-competitor-analysis` 的失败根因已确认：isolated cron 会话里，Agent 在需要老板确认产品方向时尝试发消息，但未显式指定 `channel` / `target`，导致 `⚠️ ✉️ Message failed`。
- 修复原则：
  - `summary_only` 任务的常规 delivery 应设为 `none`，不要默认 announce 给老板。
  - 只有在确实需要老板决策时，Agent 才调用 `message`。
  - 一旦调用 `message`，必须显式传入 `channel=feishu` 与 `target=user:ou_aeb3984fc66ae7c78e396255f7c7a11b`，不能依赖当前会话上下文。
- **战略含义**：Cron 任务设计不能只写“需要时通知老板”，必须把“怎么通知”固化到 prompt / config，否则会反复出现 delivery 类假失败。

**2. 2nd Brain 的线上稳定性应优先做“环境差异兜底”而不是只在本地跑通**
- Vercel 构建修复说明：多 workspace / 多 lockfile 环境下，需要显式固定 Next 的 tracing root（`outputFileTracingRoot: process.cwd()`），否则平台可能误判根目录或依赖边界。
- 搜索功能修复说明：前端搜索必须对所有可空字段做 null-safe 处理，不能默认任何 Supabase 数据字段都非空。
- Agents Token 图表修复说明：页面不能只依赖本地 cron runs 文件；在云部署场景下，应提供 Supabase snapshot fallback，确保图表至少有可展示的当前数据。
- **战略含义**：2nd Brain 后续开发要优先遵循“本地可用 + 云端可用 + 数据缺失可降级”的三层设计，而不是默认生产环境等同于本地环境。

## 📊 Memory 提炼 | 2026-03-11 02:02

### Cron 修复后的首轮验证，必须等下一次真实触发，不能拿修复前旧 run 直接下结论

**新确认的长期运行规则**：当某个 cron 的 delivery / routing / config 刚被修复后，旧 run history 里残留的 `not-delivered`、`error`、或其他失败状态，不能被直接当成“当前仍异常”的证据；必须等修复后的**下一次真实触发**完成，再做最终收口判断。

**这次保留的长期信息**：
- 2026-03-11 00:08 巡检时，`trustmrr-daily-analysis` 与 `product-competitor-analysis` 的最近一次 run 仍显示 `deliveryStatus=not-delivered`，但对应配置已在前一晚补齐为明确的 Feishu announce 目标。
- 因此，这类状态在修复刚落地后的观察窗口里，应标记为**待验证项**，而不是立即判为“当前配置仍坏”或反向判为“已经彻底恢复”。
- 正确做法应分三步：
  1. 先确认配置已真实改动并落盘；
  2. 再区分旧 run 是修复前遗留，还是修复后首轮结果；
  3. 只有看到修复后的首轮 run 正常完成，才能正式关闭该问题。

**战略含义**：
- 这条规则能避免两种常见误判：一是把历史失败当成当前故障，制造假红灯；二是配置刚改完就直接宣告恢复，制造假绿灯。
- 对后续 cron 巡检、投递修复、路由修复和可观测性治理，都属于可跨任务复用的收口规则。

---

## 📊 Memory 提炼 | 2026-03-11 12:02

### 高频/重复 cron 必须显式设置与任务周期匹配的超时，不要依赖默认 3600s

**新确认的长期运行规则**：凡是会周期性重复执行的 cron，尤其是高频任务（如 30 分钟级同步）和易长跑的报告任务，都不应继续依赖默认 `timeoutSeconds=3600`。应根据任务类型显式设置更短、与调度周期匹配的超时上限，避免单次长跑拖垮后续调度。

**这次保留的长期信息**：
- 2026-03-11 10:39 巡检中，`trustmrr-daily-analysis` 最近一次运行因默认 `3600s` 超时而报错，`sync-supabase-30m` 则出现单次运行 **约 59 分 53 秒**，直接把下一次 `nextRunAtMs` 拖到过去，形成调度积压/假异常。
- 已采取的修复动作说明了正确方向：
  1. 为长报告任务显式设置更合理的上限（如 `trustmrr-daily-analysis=1800s`）；
  2. 为高频同步任务把超时压到明显小于调度周期（如 `sync-supabase-30m=600s`）；
  3. 把“超时是否小于任务周期并留有缓冲”纳入 cron 健康检查，而不是只看最后一次 status。
- 长期判断标准应固定为：**若任务的最长允许执行时间接近或超过其调度间隔，就不是单次慢，而是系统级调度风险。**

**战略含义**：
- 这条规则能减少三类问题：默认超时过长导致的长时间假挂起、单次慢任务拖住后续调度、以及“主任务其实卡住了但系统迟迟不报错”的观测盲区。
- 对后续所有同步类、巡检类、报告类 cron，都属于可跨任务复用的治理规则；后面新增 cron 时，也应把显式 timeout 当成配置检查项，而不是事后补洞。

---

## 📊 Memory 提炼 | 2026-03-11 14:05

### 报告类 cron 的同日补跑应优先复用已存在产物，并把飞书云文档“内容已写入”纳入成功判定

**新确认的长期运行规则**：当报告类 cron 在同一天内因为飞书写入、投递或收尾步骤失败而需要补跑时，若本地 Markdown 已经完整存在，就不应再次从头做全量生成；应优先复用现有产物，只修复后半段交付链路。同时，飞书云文档不能只以“文档已创建”判成功，必须核实**正文内容真的写进去了**。

**这次保留的长期信息**：
- 2026-03-11 对 `trustmrr-daily-analysis` 的排查显示：本地报告 `reports/trustmrr-detailed-2026-03-11.md` 已成功生成，但飞书侧出现了“文档创建成功、正文写入失败、并留下重复空白文档”的情况。
- 这说明报告任务的补救路径应固定为两段式：
  1. **先检查现有本地产物是否已完整落盘**；
  2. 若已存在，则优先复用该产物，只执行飞书云文档补写/更新与核心总结投递，不再重复全量重算。
- 同时，飞书交付的成功判定应至少覆盖三点：
  1. 保留的目标文档唯一且明确；
  2. 文档不是空白壳子，正文已真实写入；
  3. 重复创建出来的空白文档应被识别并清理，避免后续引用到错误版本。

**战略含义**：
- 这条规则能同时减少三类系统性问题：重复补跑导致的长时间超时、飞书侧“创建成功但内容为空”的假成功、以及同名重复文档造成的归档混乱。
- 对后续所有报告型任务（日报、竞品分析、TrustMRR、KOL 通讯、Chief 日报等）的重试、补发和归档治理，都属于可跨任务复用的恢复规则。

---

## 2026-03-12 记忆提取

### 运营变更
- **模型切换**: MiniMax额度用尽，已切到 `kimi-coding/k2p5`，多个cron任务恢复
- **AI KOL监控**: 新增15人watchlist (`config/ai-kol-watchlist.yaml`)，日报聚焦这15个KOL的X/Twitter更新

### 稳定结论
- Supabase同步链路正常 (30分钟一次)
- TrustMRR分析产出稳定，方向: 高意向获客Agent、Agentic Social Ops、垂直ROI Copilot、Agent Delivery
