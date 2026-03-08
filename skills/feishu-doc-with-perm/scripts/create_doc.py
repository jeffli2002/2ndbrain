#!/usr/bin/env python3
"""
飞书文档创建并自动添加编辑权限
"""

import argparse
import json
import os
import requests

# 从环境变量或配置文件获取飞书凭据
# 读取 openclaw.json
def get_feishu_credentials():
    """从 openclaw.json 获取飞书凭据"""
    config_path = os.path.expanduser("~/.openclaw/openclaw.json")
    try:
        with open(config_path, "r") as f:
            config = json.load(f)
            feishu = config.get("channels", {}).get("feishu", {})
            return {
                "app_id": feishu.get("appId"),
                "app_secret": feishu.get("appSecret")
            }
    except Exception as e:
        print(f"Warning: Failed to read config: {e}")
    return None

# 默认用户 - Jeff
DEFAULT_USER_OPEN_ID = "ou_aeb3984fc66ae7c78e396255f7c7a11b"

def get_tenant_token(app_id: str, app_secret: str) -> str:
    """获取 tenant_access_token"""
    url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
    resp = requests.post(url, json={
        "app_id": app_id,
        "app_secret": app_secret
    })
    data = resp.json()
    if data.get("code") != 0:
        raise Exception(f"Failed to get token: {data}")
    return data.get("tenant_access_token")

def create_docx(token: str, title: str) -> dict:
    """创建飞书云文档"""
    url = "https://open.feishu.cn/open-apis/docx/v1/documents"
    resp = requests.post(url, headers={"Authorization": f"Bearer {token}"}, json={
        "title": title
    })
    data = resp.json()
    if data.get("code") != 0:
        raise Exception(f"Failed to create doc: {data}")
    doc = data.get("data", {}).get("document", {})
    return {
        "token": doc.get("document_id"),
        "url": f"https://feishu.cn/docx/{doc.get('document_id')}",
        "title": title
    }

def create_bitable(token: str, title: str) -> dict:
    """创建飞书多维表格"""
    # 先创建一个文档作为容器
    url = "https://open.feishu.cn/open-apis/bitable/v1/apps"
    resp = requests.post(url, headers={"Authorization": f"Bearer {token}"}, json={
        "name": title
    })
    data = resp.json()
    if data.get("code") != 0:
        raise Exception(f"Failed to create bitable: {data}")
    app = data.get("data", {})
    return {
        "token": app.get("app_token"),
        "url": f"https://my.feishu.cn/base/{app.get('app_token')}",
        "title": title
    }

def add_permission(token: str, doc_token: str, doc_type: str, user_open_id: str) -> bool:
    """添加编辑权限"""
    url = f"https://open.feishu.cn/open-apis/drive/v1/permissions/{doc_token}/members"
    resp = requests.post(
        url,
        headers={"Authorization": f"Bearer {token}"},
        params={"type": doc_type},
        json={
            "member_type": "openid",
            "member_id": user_open_id,
            "perm": "edit"
        }
    )
    data = resp.json()
    if data.get("code") != 0:
        print(f"Warning: Failed to add permission: {data}")
        return False
    return True

def main():
    parser = argparse.ArgumentParser(description="飞书文档创建并自动添加编辑权限")
    parser.add_argument("title", help="文档标题")
    parser.add_argument("--type", choices=["docx", "bitable"], default="docx", help="文档类型")
    parser.add_argument("--user", default=DEFAULT_USER_OPEN_ID, help="用户 open_id")
    parser.add_argument("--folder", help="文件夹 token（可选）")
    
    args = parser.parse_args()
    
    # 获取凭据
    creds = get_feishu_credentials()
    if not creds or not creds.get("app_id"):
        print("Error: No Feishu credentials found")
        return
    
    print(f"Creating {args.type}: {args.title}")
    
    # 获取 token
    token = get_tenant_token(creds["app_id"], creds["app_secret"])
    
    # 创建文档
    if args.type == "docx":
        result = create_docx(token, args.title)
        doc_type = "docx"
    else:
        result = create_bitable(token, args.title)
        doc_type = "bitable"
    
    print(f"Created: {result['url']}")
    
    # 添加权限
    success = add_permission(token, result["token"], doc_type, args.user)
    
    if success:
        print(f"✅ Added edit permission for user: {args.user}")
    else:
        print(f"❌ Failed to add permission (may already have access)")
    
    # 输出 JSON 供程序调用
    print(json.dumps({
        "success": True,
        "url": result["url"],
        "token": result["token"],
        "permission_added": success
    }))

if __name__ == "__main__":
    main()
