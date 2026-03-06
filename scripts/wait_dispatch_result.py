#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wait for a Chief dispatch result bridge file.

Primary protocol: JSON
Legacy compatibility: text bridge with STATUS/ROUTE_DEBUG/DISPATCH_ID/AGENT header

Usage:
  python3 scripts/wait_dispatch_result.py /path/to/result.json --timeout 180 --json
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any


def _safe_resolve(path: Path) -> Path:
    return path.expanduser().resolve(strict=False)


def _is_within(path: Path, allowed_dir: Path) -> bool:
    try:
        path.relative_to(allowed_dir)
        return True
    except ValueError:
        return False


def _coerce_json_contract(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "status": data.get("status"),
        "route_debug": data.get("route_debug"),
        "dispatch_id": data.get("dispatch_id"),
        "agent": data.get("agent"),
        "body": data.get("body") or data.get("result") or "",
        "protocol": data.get("protocol") or "json",
        "raw_obj": data,
    }


def _parse_json_result(path: Path) -> dict[str, Any]:
    raw_obj = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw_obj, dict):
        raise ValueError("json_result_must_be_object")
    return _coerce_json_contract(raw_obj)


def _parse_legacy_text_result(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8").strip()
    lines = text.splitlines()
    status = None
    route_debug = None
    dispatch_id = None
    agent = None
    body_start = 0

    for i, line in enumerate(lines[:10]):
        if line.startswith("STATUS:"):
            status = line.split(":", 1)[1].strip()
        elif line.startswith("ROUTE_DEBUG:"):
            route_debug = line.split(":", 1)[1].strip()
        elif line.startswith("DISPATCH_ID:"):
            dispatch_id = line.split(":", 1)[1].strip()
        elif line.startswith("AGENT:"):
            agent = line.split(":", 1)[1].strip()
        elif line.strip() == "":
            body_start = i + 1
            break

    body = "\n".join(lines[body_start:]).strip() if lines else ""
    return {
        "status": status,
        "route_debug": route_debug,
        "dispatch_id": dispatch_id,
        "agent": agent,
        "body": body,
        "protocol": "legacy_text",
        "raw_text": text,
    }


def parse_result(
    path: Path,
    expected_dispatch_id: str | None = None,
    expected_agent: str | None = None,
    expected_route_debug: str | None = None,
) -> dict:
    parse_error = None
    parsed: dict[str, Any]

    try:
        parsed = _parse_json_result(path)
    except Exception as e:
        parse_error = str(e)
        parsed = _parse_legacy_text_result(path)

    status = parsed.get("status")
    route_debug = parsed.get("route_debug")
    dispatch_id = parsed.get("dispatch_id")
    agent = parsed.get("agent")
    body = parsed.get("body") or ""

    # 兼容历史 worker：如果头部缺失，但外部调用已提供 expected_*，则用 expected_* 补齐契约字段。
    if dispatch_id is None and expected_dispatch_id:
        dispatch_id = expected_dispatch_id
    if agent is None and expected_agent:
        agent = expected_agent
    if route_debug is None and expected_route_debug:
        route_debug = expected_route_debug
    if status is None and body:
        status = "ok"

    header_complete = all([status, route_debug, dispatch_id, agent])
    dispatch_matches = (not expected_dispatch_id) or (dispatch_id == expected_dispatch_id)
    agent_matches = (not expected_agent) or (agent == expected_agent)
    route_matches = (not expected_route_debug) or (route_debug == expected_route_debug)
    contract_valid = header_complete and dispatch_matches and agent_matches and route_matches

    raw = parsed.get("raw_obj") if parsed.get("protocol") == "json" else parsed.get("raw_text")

    return {
        "path": str(path),
        "status": status,
        "route_debug": route_debug,
        "dispatch_id": dispatch_id,
        "agent": agent,
        "body": body,
        "protocol": parsed.get("protocol"),
        "raw": raw,
        "header_complete": header_complete,
        "dispatch_matches": dispatch_matches,
        "agent_matches": agent_matches,
        "route_matches": route_matches,
        "contract_valid": contract_valid,
        "parse_error": parse_error,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Wait for dispatch result file")
    parser.add_argument("path", help="result file path")
    parser.add_argument("--timeout", type=int, default=180, help="seconds to wait")
    parser.add_argument("--interval", type=float, default=1.0, help="poll interval seconds")
    parser.add_argument("--allowed-dir", default="/root/.openclaw/workspace/output/dispatch_results")
    parser.add_argument("--expected-dispatch-id", default=None)
    parser.add_argument("--expected-agent", default=None)
    parser.add_argument("--expected-route-debug", default=None)
    parser.add_argument("--json", action="store_true", help="output json")
    args = parser.parse_args()

    path = _safe_resolve(Path(args.path))
    allowed_dir = _safe_resolve(Path(args.allowed_dir))
    deadline = time.time() + max(args.timeout, 1)

    if not _is_within(path, allowed_dir):
        payload = {
            "ready": False,
            "path": str(path),
            "error": "path_outside_allowed_dir",
            "allowed_dir": str(allowed_dir),
        }
        if args.json:
            print(json.dumps(payload, ensure_ascii=False, indent=2))
        else:
            print(payload["error"])
        return

    while time.time() < deadline:
        if path.exists() and path.stat().st_size > 0:
            parsed = parse_result(
                path,
                expected_dispatch_id=args.expected_dispatch_id,
                expected_agent=args.expected_agent,
                expected_route_debug=args.expected_route_debug,
            )
            if not parsed["contract_valid"]:
                time.sleep(max(args.interval, 0.2))
                continue
            if args.json:
                print(json.dumps({"ready": True, "allowed_dir": str(allowed_dir), **parsed}, ensure_ascii=False, indent=2))
            else:
                if parsed["protocol"] == "json":
                    print(json.dumps(parsed["raw"], ensure_ascii=False, indent=2))
                else:
                    print(parsed["raw"])
            return
        time.sleep(max(args.interval, 0.2))

    payload = {
        "ready": False,
        "path": str(path),
        "allowed_dir": str(allowed_dir),
        "error": "timeout_waiting_for_dispatch_result",
    }
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(payload["error"])


if __name__ == "__main__":
    main()
