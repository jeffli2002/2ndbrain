#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEPRECATED compatibility wrapper for old auto_route entrypoint.

Use `chief_dispatch.py` for real executable planning.
This file remains only so old notes/scripts do not break immediately.
"""

import argparse
import json

from chief_dispatch import ChiefDispatchPlanner


def main():
    parser = argparse.ArgumentParser(description="Deprecated auto_route wrapper -> chief_dispatch")
    parser.add_argument("message", help="用户消息内容")
    parser.add_argument("--json", action="store_true", help="输出 JSON 格式")
    args = parser.parse_args()

    planner = ChiefDispatchPlanner()
    plan = planner.plan(args.message)
    payload = {
        "deprecated_entrypoint": "auto_route.py",
        "replacement": "/root/.openclaw/workspace/scripts/chief_dispatch.py",
        **plan,
    }

    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    print("[DEPRECATED] auto_route.py -> 请改用 chief_dispatch.py")
    print(json.dumps(payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
