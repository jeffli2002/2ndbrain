#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chief Dispatch Planner

职责：
- 判断一条用户消息是否应由 Chief 直接处理
- 如需委派，生成可直接用于 sessions_spawn(mode="run") 的执行计划
- 统一 Chief -> Worker 的 prompt 模板，避免每次临时拼接

注意：
- 本脚本不直接调用 OpenClaw tools
- 真正的 sessions_spawn 由 runtime/tool 层执行
"""

from __future__ import annotations

import argparse
import json
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

import yaml

from agent_keyword_router import AgentKeywordRouter

WORKSPACE = Path("/root/.openclaw/workspace")
WORKERS_CONFIG = WORKSPACE / "config" / "chief_dispatch_workers.yaml"

SIMPLE_FRONTDESK_PATTERNS = [
    r"^hi$",
    r"^hello$",
    r"^hey$",
    r"^在吗$",
    r"^在不在$",
    r"^你在吗$",
    r"^啥进度了[？?]?$",
    r"^什么进度[？?]?$",
    r"^现在怎么样了[？?]?$",
    r"^你现在什么模型[？?]?$",
    r"^你用的什么模型[？?]?$",
]


class ChiefDispatchPlanner:
    def __init__(self, workers_config: Path = WORKERS_CONFIG):
        self.router = AgentKeywordRouter()
        self.workers_config_path = workers_config
        self.workers_config = self._load_workers_config(workers_config)

    def _load_workers_config(self, path: Path) -> Dict[str, Any]:
        if not path.exists():
            raise FileNotFoundError(f"workers config not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def _is_simple_frontdesk(self, message: str) -> bool:
        msg = message.strip().lower()
        return any(re.match(pattern, msg) for pattern in SIMPLE_FRONTDESK_PATTERNS)

    def _build_result_bridge(self, agent: str) -> Dict[str, Any]:
        bridge_cfg = (self.workers_config.get("runtime") or {}).get("result_bridge") or {}
        result_dir = Path(bridge_cfg.get("result_dir", "/root/.openclaw/workspace/output/dispatch_results"))
        bridge_format = str(bridge_cfg.get("format", "json")).lower()
        dispatch_id = f"{datetime.now().strftime('%Y%m%d-%H%M%S')}-{agent}-{uuid.uuid4().hex[:8]}"
        ext = ".json" if bridge_format == "json" else ".md"
        result_file = result_dir / f"{dispatch_id}{ext}"
        return {
            "enabled": bool(bridge_cfg.get("enabled", True)),
            "format": bridge_format,
            "dispatch_id": dispatch_id,
            "result_file": str(result_file),
            "allowed_dir": str(result_dir),
            "wait_timeout_seconds": int(bridge_cfg.get("wait_timeout_seconds", 180)),
        }

    def _bridge_instruction_json(self, agent: str, model: str, bridge: Dict[str, Any]) -> str:
        example_obj = {
            "protocol": "chief_result_bridge/v1",
            "status": "ok",
            "route_debug": f"route={agent};dispatch=spawn;model={model}",
            "dispatch_id": bridge["dispatch_id"],
            "agent": agent,
            "body": "<your final answer here>",
        }
        example_json = json.dumps(example_obj, ensure_ascii=False, indent=2)
        return f"""
Explicit return bridge (mandatory, JSON protocol):
- When you finish, use the write tool to create this exact JSON file: {bridge['result_file']}
- The file must be valid JSON object with these keys:
  - protocol: "chief_result_bridge/v1"
  - status: "ok" | "misrouted" | "error"
  - route_debug: "route={agent};dispatch=spawn;model={model}"
  - dispatch_id: "{bridge['dispatch_id']}"
  - agent: "{agent}"
  - body: string, your final answer
- Example JSON:
{example_json}
- If clearly misrouted, set status to "misrouted" and explain briefly in body
- If you hit a blocking failure, set status to "error" and explain briefly in body
- Do not skip writing this JSON file; this is the delivery bridge back to Chief
"""

    def _bridge_instruction_text(self, agent: str, model: str, bridge: Dict[str, Any]) -> str:
        return f"""
Explicit return bridge (mandatory):
- When you finish, use the write tool to create this exact file: {bridge['result_file']}
- File format must be exactly:
  STATUS: ok
  ROUTE_DEBUG: route={agent};dispatch=spawn;model={model}
  DISPATCH_ID: {bridge['dispatch_id']}
  AGENT: {agent}

  <your final answer here>
- If clearly misrouted, write STATUS: misrouted and explain briefly in the body
- If you hit a blocking failure, write STATUS: error and explain briefly in the body
- Do not skip writing this file; this is the delivery bridge back to Chief
"""

    def _worker_prompt(self, agent: str, worker_cfg: Dict[str, Any], user_message: str, route: Dict[str, Any], bridge: Dict[str, Any]) -> str:
        role = worker_cfg.get("role", f"{agent.title()} Agent")
        scope = worker_cfg.get("scope", [])
        scope_text = "、".join(scope) if scope else "对应领域任务"
        matched_keywords = ", ".join(route.get("matched_keywords", [])) or "无"
        secondary_agents = ", ".join(route.get("secondary_agents", [])) or "无"
        model = worker_cfg.get("model")

        if bridge.get("enabled"):
            if bridge.get("format") == "json":
                bridge_text = self._bridge_instruction_json(agent, model, bridge)
            else:
                bridge_text = self._bridge_instruction_text(agent, model, bridge)
        else:
            bridge_text = ""

        return f"""You are a one-shot {role} worker delegated by Chief.

Startup requirements:
1. Immediately read USER.md
2. Immediately read TOOLS.md
3. Immediately read memory/global/strategic.md, memory/global/rules.md, memory/global/vision.md if they exist
4. Immediately read memory/agents/{agent}/memory.md if it exists
5. Immediately read today's and yesterday's daily logs if they exist

Role scope:
- Your main domain is: {scope_text}
- If the task is clearly outside your domain, start your reply with: MISROUTED:

Execution rules:
- Be concise, structured, and action-oriented
- Do the actual domain work, not meta discussion
- If assumptions are needed, state them briefly
- Return the result directly in Chinese unless the task explicitly requires another language
- Do not discuss internal tooling unless relevant to the task output
{bridge_text}
Routing context from Chief:
- target_agent: {agent}
- matched_keywords: {matched_keywords}
- secondary_agents: {secondary_agents}
- route_debug: route={agent};dispatch=spawn;model={model}

User task:
{user_message}
"""

    def plan(self, message: str) -> Dict[str, Any]:
        message = (message or "").strip()
        if not message:
            return {
                "action": "error",
                "error": "empty_message",
                "next_step": "Chief 直接要求用户补充消息内容。",
            }

        if self._is_simple_frontdesk(message):
            return {
                "action": "chief_direct",
                "reason": "simple_frontdesk",
                "next_step": "Chief 直接回复，不做委派。",
                "route_debug": "route=chief;dispatch=direct",
            }

        route = self.router.route_message(message)
        target_agent = route.get("target_agent", "chief")

        if route.get("is_ambiguous"):
            return {
                "action": "triage",
                "reason": "ambiguous_route",
                "route": route,
                "next_step": "Chief 先追问或拆分任务，再决定是否委派。",
                "route_debug": f"route={target_agent};dispatch=triage",
            }

        if target_agent == "chief":
            return {
                "action": "chief_direct",
                "reason": "chief_fallback",
                "route": route,
                "next_step": "Chief 直接处理。",
                "route_debug": "route=chief;dispatch=direct",
            }

        worker_cfg = (self.workers_config.get("workers") or {}).get(target_agent)
        runtime_cfg = self.workers_config.get("runtime") or {}
        if not worker_cfg:
            return {
                "action": "chief_fallback",
                "reason": f"worker_config_missing:{target_agent}",
                "route": route,
                "next_step": "缺少 worker 配置，Chief 降级执行。",
                "route_debug": f"route={target_agent};dispatch=fallback;reason=missing_worker_config",
            }

        bridge = self._build_result_bridge(target_agent)
        spawn_request = {
            "runtime": runtime_cfg.get("runtime", "subagent"),
            "mode": runtime_cfg.get("mode", "run"),
            "agentId": runtime_cfg.get("agent_id", "main"),
            "model": worker_cfg.get("model"),
            "cwd": str(WORKSPACE),
            "label": worker_cfg.get("label", f"dispatch-{target_agent}"),
            "cleanup": "delete",
            "sandbox": "inherit",
            "timeoutSeconds": int(bridge.get("wait_timeout_seconds", 180)),
            "task": self._worker_prompt(target_agent, worker_cfg, message, route, bridge),
        }

        return {
            "action": "delegate_spawn",
            "reason": "target_domain_worker",
            "target_agent": target_agent,
            "route": route,
            "spawn_request": spawn_request,
            "result_bridge": bridge,
            "next_step": "使用 sessions_spawn(mode=run) 拉起一次性 worker；然后等待 JSON result_bridge 文件并把结果回传给用户。",
            "route_debug": f"route={target_agent};dispatch=spawn;model={worker_cfg.get('model')}",
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Chief dispatch planner")
    parser.add_argument("message", help="用户消息")
    parser.add_argument("--json", action="store_true", help="输出 JSON")
    args = parser.parse_args()

    planner = ChiefDispatchPlanner()
    plan = planner.plan(args.message)

    if args.json:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return

    print(f"action: {plan.get('action')}")
    print(f"reason: {plan.get('reason')}")
    print(f"next_step: {plan.get('next_step')}")
    print(f"route_debug: {plan.get('route_debug')}")
    if plan.get("target_agent"):
        print(f"target_agent: {plan['target_agent']}")


if __name__ == "__main__":
    main()
