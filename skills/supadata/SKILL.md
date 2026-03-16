# Supadata Skill

提取 YouTube、TikTok、Twitter、Facebook 等平台的视频字幕 Transcript。

## 配置

**凭据**：`/root/.openclaw/credentials/supadata.json`
```json
{
  "api_key": "sd_xxxxxxxxxxxxxx",
  "base_url": "https://api.supadata.ai/v1"
}
```

## 调用方式

```bash
# 方式1：直接运行脚本
python3 /root/.openclaw/workspace/skills/supadata/scripts/supadata_client.py transcript --url "https://youtu.be/VIDEO_ID"

# 方式2：Python 调用
cd /root/.openclaw/workspace/skills/supadata/scripts
python3 -c "
from supadata_client import SupadataClient
client = SupadataClient()
result = client.get_transcript('https://youtu.be/eaEwIIKEKPw')
print(result)
"
```

## 功能

- YouTube 字幕提取
- TikTok 字幕提取
- Twitter/X 视频字幕提取
- Facebook 视频字幕提取
- 视频元数据获取

## 示例

提取 YouTube 视频字幕：
```python
from supadata_client import SupadataClient
client = SupadataClient()
result = client.get_transcript("https://youtu.be/eaEwIIKEKPw")
# 返回 JSON，包含 content 字段（字幕段列表）
```

## 支持平台

- YouTube (youtube.com, youtu.be)
- TikTok (tiktok.com)
- Instagram (instagram.com)
- X/Twitter (x.com, twitter.com)
- Facebook (facebook.com)
