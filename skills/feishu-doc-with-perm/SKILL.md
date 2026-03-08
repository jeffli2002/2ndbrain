---
name: feishu-doc-with-perm
description: 飞书文档创建并自动添加编辑权限。创建飞书云文档或多维表格后，自动将编辑权限授予指定用户（默认：老板 Jeff）。当用户要求创建飞书文档并添加编辑权限时触发。
---

# 飞书文档创建（自动授权版）

在飞书中创建文档或多维表格，并自动添加编辑权限。

## 功能

- 创建飞书云文档（docx）
- 创建飞书多维表格（bitable）
- 创建后自动添加老板（Jeff）的编辑权限

## 使用方式

```bash
# 创建云文档（自动添加权限）
python3 ~/.openclaw/workspace/skills/feishu-doc-with-perm/scripts/create_doc.py "文档标题"

# 创建多维表格（自动添加权限）
python3 ~/.openclaw/workspace/skills/feishu-doc-with-perm/scripts/create_doc.py --type bitable "表格标题"

# 指定其他用户
python3 ~/.openclaw/workspace/skills/feishu-doc-with-perm/scripts/create_doc.py --user "ou_xxx" "文档标题"
```

## 参数

| 参数 | 说明 | 默认值 |
|------|------|-------|
| `--type` | 类型：docx, bitable | docx |
| `--user` | 用户 open_id | Jeff 的 open_id |
| `--folder` | 文件夹 token（可选） | 根目录 |

## 输出

- 文档链接
- 权限添加状态

## 依赖

- requests 库
- 飞书应用 app_id / app_secret（已配置在 openclaw.json）

## 注意事项

- 使用前确保飞书应用有 `drive:file` 和 `docs:document:create` 权限
- 权限添加使用正确的 API：`POST /drive/v1/permissions/{token}/members`
