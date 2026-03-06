#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cron Agent Dispatcher - Cron任务调度器
LEGACY SCAFFOLD: 这是 Cron 路由骨架，不是当前 Chief 私聊任务分配的主执行链。
根据 cron-agent-dispatch.yaml 配置调度 Sub Agent

用法:
    python3 cron_dispatcher.py <task_name>
    python3 cron_dispatcher.py daily-content-publish
"""

import os
import sys
import json
import yaml
import time
from datetime import datetime
from pathlib import Path

# 配置路径
CONFIG_PATH = "/root/.openclaw/workspace/config/cron-agent-dispatch.yaml"
WORKSPACE = "/root/.openclaw/workspace"

class CronDispatcher:
    """Cron 任务调度器"""
    
    def __init__(self):
        self.config = self._load_config()
        self.task_map = self.config.get("task_agent_mapping", {})
        
    def _load_config(self):
        """加载配置文件"""
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    def dispatch(self, task_name: str) -> dict:
        """
        调度任务到对应的 Sub Agent
        
        Args:
            task_name: 任务名称 (如 daily-content-publish)
            
        Returns:
            执行结果
        """
        print(f"\n{'='*60}")
        print(f"[Cron Dispatcher] 收到任务: {task_name}")
        print(f"{'='*60}\n")
        
        # 1. 查找任务配置
        task_config = self._find_task_config(task_name)
        if not task_config:
            return {"success": False, "error": f"未找到任务配置: {task_name}"}
        
        agent = task_config.get("agent")
        print(f"[Step 1] 匹配到 Agent: {agent}")
        
        # 2. 如果是 system 任务，直接执行
        if agent == "system":
            return self._execute_system_task(task_name, task_config)
        
        # 3. 调度到 Sub Agent
        return self._dispatch_to_agent(task_name, task_config, agent)
    
    def _find_task_config(self, task_name: str) -> dict:
        """查找任务配置（支持通配符）"""
        # 精确匹配
        if task_name in self.task_map:
            return self.task_map[task_name]
        
        # 通配符匹配
        for pattern in self.task_map.keys():
            if '*' in pattern:
                import fnmatch
                if fnmatch.fnmatch(task_name, pattern):
                    return self.task_map[pattern]
        
        return None
    
    def _execute_system_task(self, task_name: str, config: dict) -> dict:
        """执行系统任务"""
        print(f"[System] 执行系统任务: {task_name}")
        
        workflow = config.get("workflow", [])
        for step in workflow:
            step_name = step.get("step")
            print(f"  - {step_name}")
        
        return {"success": True, "task": task_name, "agent": "system"}
    
    def _dispatch_to_agent(self, task_name: str, task_config: dict, agent: str) -> dict:
        """调度到 Sub Agent"""
        agent_name = task_config.get("agent_name", agent)
        workflow = task_config.get("workflow", [])
        
        print(f"[Step 2] 准备调度工作流:")
        for i, step in enumerate(workflow, 1):
            print(f"  {i}. {step.get('step')}: {step.get('description')}")
        
        # 检查是否需要用户交互
        needs_interaction = any(step.get("mode") == "interactive" for step in workflow)
        
        if needs_interaction:
            print(f"\n[注意] 此任务需要用户交互，将以交互模式运行")
            return self._run_interactive_task(task_name, task_config, agent)
        else:
            return self._run_auto_task(task_name, task_config, agent)
    
    def _run_auto_task(self, task_name: str, config: dict, agent: str) -> dict:
        """运行自动任务（通过 sessions_spawn）"""
        print(f"\n[Step 3] 通过 sessions_spawn 调度 {agent}")
        
        # 构建任务描述
        task_description = self._build_task_description(task_name, config)
        
        # TODO: 实际调用 sessions_spawn
        # 这里先返回模拟结果
        print(f"[模拟] 任务描述: {task_description[:100]}...")
        
        return {
            "success": True,
            "task": task_name,
            "agent": agent,
            "mode": "auto",
            "description": task_description
        }
    
    def _run_interactive_task(self, task_name: str, config: dict, agent: str) -> dict:
        """运行交互任务（需要用户确认）"""
        print(f"\n[Step 3] 交互任务，需要用户确认")
        
        # 构建任务描述，包含等待用户确认的步骤
        task_description = self._build_task_description(task_name, config)
        
        # TODO: 实际调用 sessions_spawn with thread=True
        return {
            "success": True,
            "task": task_name,
            "agent": agent,
            "mode": "interactive",
            "description": task_description,
            "note": "等待用户确认后继续执行"
        }
    
    def _build_task_description(self, task_name: str, config: dict) -> str:
        """构建任务描述"""
        description = config.get("description", "")
        workflow = config.get("workflow", [])
        
        lines = [
            f"# 任务: {task_name}",
            f"# 描述: {description}",
            f"# Agent: {config.get('agent_name')}",
            "",
            "## 工作流:"
        ]
        
        for i, step in enumerate(workflow, 1):
            lines.append(f"{i}. **{step.get('step')}**: {step.get('description')}")
        
        return "\n".join(lines)
    
    def list_tasks(self) -> list:
        """列出所有配置的任务"""
        tasks = []
        for name, config in self.task_map.items():
            tasks.append({
                "name": name,
                "agent": config.get("agent"),
                "agent_name": config.get("agent_name"),
                "description": config.get("description"),
                "schedule": config.get("schedule"),
                "priority": config.get("priority")
            })
        return tasks


def main():
    if len(sys.argv) < 2:
        print("用法: python3 cron_dispatcher.py <task_name>")
        print("\n可用任务:")
        dispatcher = CronDispatcher()
        for task in dispatcher.list_tasks():
            print(f"  - {task['name']}: {task['description']} ({task['agent']})")
        sys.exit(1)
    
    task_name = sys.argv[1]
    dispatcher = CronDispatcher()
    result = dispatcher.dispatch(task_name)
    
    print(f"\n{'='*60}")
    print(f"[结果] {'成功' if result.get('success') else '失败'}")
    if not result.get("success"):
        print(f"[错误] {result.get('error')}")
    print(f"{'='*60}\n")
    
    return 0 if result.get("success") else 1


if __name__ == "__main__":
    sys.exit(main())
