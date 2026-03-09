---
name: trustmrr-podcast
description: 生成TrustMRR分析报告的中文双人对谈播客。使用Edge TTS不同音色模拟两人对话，ffmpeg合并为Opus音频，发往飞书语音消息。
---

# TrustMRR 双人对谈播客生成

将TrustMRR分析报告转化为中文双人对谈播客，支持两种不同音色交替对话。

## 技术架构

```
分析报告文本 → 对话分镜 → Edge TTS分角色生成 → ffmpeg合并(Opus) → 飞书语音发送
```

## 关键技术点

### 1. 角色定义与音色选择
- **男性角色**：zh-CN-YunxiNeural（成熟男声）
- **女性角色**：zh-CN-XiaoxiaoNeural（标准女声）

### 2. 对话分镜设计
- 每轮对话：角色A问 + 角色B答
- 不念名字，直接用不同音色切换
- 精简内容，每段约5-10秒

### 3. Edge TTS 生成
```bash
python3 scripts/build_feishu_voice.py \
  --text "对话文本内容" \
  --voice "zh-CN-YunxiNeural" \
  --out-dir /root/.openclaw/workspace/temp/voice \
  --basename "segment_a_1"
```

### 4. ffmpeg 合并（关键：Opus编码）
```bash
ffmpeg -y \
  -i "seg1_a.ogg" -i "seg1_b.ogg" \
  -i "seg2_a.ogg" -i "seg2_b.ogg" \
  -filter_complex "[0:a]aformat=sample_fmts=s16:sample_rates=48000[a0];[1:a]..." \
  -map "[out]" -c:a libopus podcast_final.ogg
```

⚠️ **关键**：必须使用 `-c:a libopus` 编码，不能用默认vorbis，否则飞书播放会有杂音

### 5. 飞书发送
```python
message(
  action="send",
  channel="feishu",
  asVoice=True,
  filePath="/workspace/temp/voice/podcast_final.ogg",
  mimeType="audio/ogg"
)
```

## 使用场景

- 每日TrustMRR报告自动转播客
- 任何需要双人对谈的语音内容
- 资讯摘要语音播报

## 输出规范

- 音频格式：Ogg Opus
- 采样率：48000 Hz
- 存储路径：`/root/.openclaw/workspace/temp/voice/`
- 时长：建议30-60秒

## 示例对话

```
角色A(小李): 哎，老王，你看了没？最近那个Postiz火得一塌糊涂！
角色B(老王): 啥？Postiz？干嘛的？
角色A: 对，就是那个做社交媒体自动排程的。AI驱动的，能自动发帖子、自动点赞评论。
角色B: 一个月69k美元了！184%增长！全年80多万美元收入！
角色A: 你想啊，国内多少博主需要这种工具？短视频矩阵管理、小红书、抖音...全是痛点！
角色B: 那确实！国内做的话，你觉得哪个方向最靠谱？
角色A: 对，就是这个方向。工具类产品，边际成本低，做起来快。
角色B: 有道理！先从社交媒体工具开始，对吧？
```

## 相关文件

- `scripts/build_feishu_voice.py`：Edge TTS语音合成
- `temp/voice/`：音频文件存储目录
