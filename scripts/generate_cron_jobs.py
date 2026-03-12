#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cron Job 配置生成器 v4

目标：
- 固定归属的 cron 任务：直接打到 owner agent（session=isolated + agentTurn）
- 调度 / 监督类 cron：按配置走 main/systemEvent 或 isolated/agentTurn
- 通知策略显式配置：deliver_and_alert / summary_only / failure_only

用法:
    python3 generate_cron_jobs.py            # 列出所有任务
    python3 generate_cron_jobs.py setup      # 生成所有任务命令
    python3 generate_cron_jobs.py <task>     # 生成单个任务命令
"""

from __future__ import annotations

import fnmatch
import shlex
import sys
from pathlib import Path
from typing import Iterable, Optional

import yaml

CONFIG_PATH = Path("/root/.openclaw/workspace/config/cron-agent-dispatch.yaml")


class CronJobGenerator:
    """根据 cron-agent-dispatch.yaml 生成 openclaw cron add 命令。"""

    TASK_KEYWORDS = {
        "daily-content-publish": "写一篇公众号文章",
        "ai-daily-newsletter": "写AI日报",
        "ai-daily-delivery-guard": "检查AI日报是否漏发并立即补发",
        "daily-content-publish-guard": "检查内容发布是否漏发并立即补跑",
        "ai-kol-daily-newsletter": "KOL动态追踪",
        "openclaw-news-monitor": "搜索OpenClaw安全新闻",
        "product-competitor-analysis": "竞品分析报告",
        "daily-skill-evolution": "检查Skill更新",
        "daily-memory-extractor": "提取每日记忆",
        "chief-daily-report": "生成Chief日报",
        "cron-health-check": "检查Cron任务状态",
    }

    def __init__(self, config_path: Path = CONFIG_PATH):
        self.config_path = config_path
        self.config = self._load_config()
        self.task_map = self.config.get("task_agent_mapping", {})
        self.delivery_defaults = self.config.get("message_delivery", {}) or {}

    def _load_config(self) -> dict:
        with self.config_path.open("r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def list_task_names(self) -> Iterable[str]:
        for name in self.task_map.keys():
            if "*" in name:
                continue
            yield name

    def _find_task_config(self, task_name: str) -> Optional[dict]:
        if task_name in self.task_map:
            return self.task_map[task_name]
        for pattern, config in self.task_map.items():
            if "*" in pattern and fnmatch.fnmatch(task_name, pattern):
                return config
        return None

    def _resolve_session_target(self, task_name: str, task_config: dict) -> str:
        explicit = str(task_config.get("session_target", "")).strip()
        if explicit in {"main", "isolated"}:
            return explicit

        dispatch_mode = str(task_config.get("dispatch_mode", "")).strip()
        agent = str(task_config.get("agent", "")).strip()
        if dispatch_mode == "direct_agent" and agent not in {"", "chief", "system"}:
            return "isolated"
        return "main"

    def _resolve_payload_kind(self, session_target: str) -> str:
        return "agentTurn" if session_target == "isolated" else "systemEvent"

    def _resolve_notify_policy(self, task_config: dict, session_target: str) -> str:
        policy = str(task_config.get("notify_policy", "")).strip()
        if policy:
            return policy
        return "deliver_and_alert" if session_target == "isolated" else "failure_only"

    def _default_channel(self) -> str:
        return str(self.delivery_defaults.get("default_channel", "feishu")).strip() or "feishu"

    def _default_target(self) -> str:
        return str(self.delivery_defaults.get("default_target", "")).strip()

    def _default_alert_after(self) -> int:
        return int(self.delivery_defaults.get("default_failure_alert_after", 1))

    def _build_direct_agent_message(self, task_name: str, task_config: dict) -> str:
        description = task_config.get("description", task_name)
        agent = task_config.get("agent", "")
        agent_name = task_config.get("agent_name", agent)
        required_skill = task_config.get("required_skill")
        required_format = task_config.get("required_format")
        instructions = task_config.get("message_instructions", []) or []

        lines = [
            f"【定时任务】{description}",
            "",
            f"任务标识：{task_name}",
            f"归属Agent：{agent}",
            f"当前执行者：{agent_name}",
            "该任务已由 cron 直接分配给你执行，不需要再经 Chief 二次分流。",
        ]

        if required_skill:
            lines.append(f"必读Skill：{required_skill}")
        if required_format:
            lines.append(f"必读格式要求：{required_format}")

        if instructions:
            lines.extend(["", "执行要求："])
            lines.extend(f"- {item}" for item in instructions)

        lines.extend([
            "",
            "请以 owner agent 身份直接执行，并严格遵守上面的 skill / format / 交互约束。",
        ])
        return "\n".join(lines)

    def _build_main_session_event(self, task_name: str, task_config: dict) -> str:
        description = task_config.get("description", task_name)
        keyword = self.TASK_KEYWORDS.get(task_name, task_name)
        agent = task_config.get("agent")
        required_skill = task_config.get("required_skill")
        required_format = task_config.get("required_format")
        instructions = task_config.get("message_instructions", []) or []

        lines = [
            f"【定时任务】{description}",
            "",
            f"路由关键词：{keyword}",
            f"任务标识：{task_name}",
        ]
        if agent and agent != "system":
            lines.append(f"目标Agent：{agent}")
        if required_skill:
            lines.append(f"必读Skill：{required_skill}")
        if required_format:
            lines.append(f"必读格式要求：{required_format}")
        if instructions:
            lines.extend(["", "执行要求："])
            lines.extend(f"- {item}" for item in instructions)
        lines.extend([
            "",
            "请先确认执行路径，再开始执行，不要忽略上面的 skill / agent / 格式约束。",
        ])
        return "\n".join(lines)

    def build_payload_text(self, task_name: str, task_config: dict, session_target: str) -> str:
        if session_target == "isolated":
            return self._build_direct_agent_message(task_name, task_config)
        return self._build_main_session_event(task_name, task_config)

    def _append_failure_alert_flags(self, cmd_lines: list[str], task_config: dict, policy: str) -> None:
        enabled = task_config.get("failure_alert_enabled")
        if enabled is None:
            enabled = policy in {"deliver_and_alert", "summary_only", "failure_only"}
        if not enabled:
            return

        channel = str(task_config.get("failure_alert_channel", self._default_channel())).strip()
        target = str(task_config.get("failure_alert_to", self._default_target())).strip()
        after = int(task_config.get("failure_alert_after", self._default_alert_after()))
        if not channel or not target:
            return
        cmd_lines.append("  --failure-alert \\")
        cmd_lines.append(f"  --failure-alert-channel {shlex.quote(channel)} \\")
        cmd_lines.append(f"  --failure-alert-to {shlex.quote(target)} \\")
        cmd_lines.append(f"  --failure-alert-after {after} \\")

    def generate_cron_command(self, task_name: str) -> Optional[str]:
        task_config = self._find_task_config(task_name)
        if not task_config:
            return None

        schedule = str(task_config.get("schedule", "")).strip()
        if not schedule:
            return None

        description = task_config.get("description", "")
        priority = task_config.get("priority", "P2")
        timeout_seconds = int(task_config.get("timeout_seconds", 300))
        tz = str(task_config.get("tz", "Asia/Shanghai")).strip() or "Asia/Shanghai"
        exact = bool(task_config.get("exact", False))
        light_context = bool(task_config.get("light_context", False))
        agent = str(task_config.get("agent", "")).strip()
        session_target = self._resolve_session_target(task_name, task_config)
        payload_kind = self._resolve_payload_kind(session_target)
        payload_text = self.build_payload_text(task_name, task_config, session_target)
        model = str(task_config.get("model", "")).strip()
        thinking = str(task_config.get("thinking", "")).strip()
        notify_policy = self._resolve_notify_policy(task_config, session_target)

        cmd_lines = [
            f"# {task_name} - {description}",
            "openclaw cron add \\",
            f"  --name {shlex.quote(task_name)} \\",
            f"  --cron {shlex.quote(schedule)} \\",
            f"  --session {shlex.quote(session_target)} \\",
            f"  --timeout-seconds {timeout_seconds} \\",
            f"  --tz {shlex.quote(tz)} \\",
        ]

        if exact:
            cmd_lines.append("  --exact \\")

        if session_target == "isolated" and agent and agent != "system":
            cmd_lines.append(f"  --agent {shlex.quote(agent)} \\")

        if light_context and payload_kind == "agentTurn":
            cmd_lines.append("  --light-context \\")

        if payload_kind == "agentTurn":
            cmd_lines.append(f"  --message {shlex.quote(payload_text)} \\")
            cmd_lines.append("  --expect-final \\")
            if notify_policy == "deliver_and_alert":
                channel = str(task_config.get("delivery_channel", self._default_channel())).strip()
                target = str(task_config.get("delivery_to", self._default_target())).strip()
                cmd_lines.append("  --announce \\")
                if channel:
                    cmd_lines.append(f"  --channel {shlex.quote(channel)} \\")
                if target:
                    cmd_lines.append(f"  --to {shlex.quote(target)} \\")
            else:
                cmd_lines.append("  --no-deliver \\")
        else:
            cmd_lines.append(f"  --system-event {shlex.quote(payload_text)} \\")

        self._append_failure_alert_flags(cmd_lines, task_config, notify_policy)

        if model:
            cmd_lines.append(f"  --model {shlex.quote(model)} \\")
        if thinking:
            cmd_lines.append(f"  --thinking {shlex.quote(thinking)} \\")

        cmd_lines.append(f"  --description {shlex.quote(f'[{priority}] {description}')}")
        return "\n".join(cmd_lines)

    def setup_all_crons(self) -> list[dict]:
        commands = []
        for task_name in self.list_task_names():
            cmd = self.generate_cron_command(task_name)
            if not cmd:
                continue
            commands.append({"task": task_name, "command": cmd})
        return commands


def main() -> int:
    generator = CronJobGenerator()

    if len(sys.argv) < 2:
        print("用法:")
        print("  python3 generate_cron_jobs.py          # 列出所有任务")
        print("  python3 generate_cron_jobs.py setup    # 生成添加命令")
        print("  python3 generate_cron_jobs.py <task>   # 生成单个任务命令")
        print()
        print("任务列表:")
        for task in generator.list_task_names():
            desc = generator.task_map.get(task, {}).get("description", "")
            print(f"  - {task}: {desc}")
        return 0

    arg = sys.argv[1]
    if arg == "setup":
        print("# 按当前 direct-agent / via-chief + notify_policy 架构生成的 Cron 任务")
        print("# deliver_and_alert => 显式直达 Feishu")
        print("# summary_only / failure_only => 不常规打扰，仅 failure alert 或日报汇总\n")
        for item in generator.setup_all_crons():
            print(f"\n# {item['task']}")
            print(item["command"])
        return 0

    cmd = generator.generate_cron_command(arg)
    if not cmd:
        print(f"未找到任务: {arg}")
        print("\n可用任务:")
        for task in generator.list_task_names():
            print(f"  - {task}")
        return 1

    print(f"# {arg}")
    print(cmd)
    return 0


if __name__ == "__main__":
    sys.exit(main())
