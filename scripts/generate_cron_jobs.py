#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cron Job 配置生成器 v2
LEGACY/COMPAT: 这是 Cron 消息生成脚本，不是当前 Chief 私聊任务分配的主执行链。
使用 session:main 触发关键词自动路由

原理：
- Cron 任务发送到 main session
- 消息内容包含关键词，触发 agent_keyword_router 匹配
- 匹配到对应的 Sub Agent 后，通过 sessions_spawn 调用

用法:
    python3 generate_cron_jobs.py          # 列出所有任务
    python3 generate_cron_jobs.py setup    # 生成 Cron 任务
    python3 generate_cron_jobs.py <task>   # 生成单个任务命令
"""

import os
import sys
import re

CONFIG_PATH = "/root/.openclaw/workspace/config/cron-agent-dispatch.yaml"

class CronJobGenerator:
    """Cron 任务生成器"""
    
    # 任务到关键词的映射（触发自动路由）
    TASK_KEYWORDS = {
        "daily-content-publish": "写一篇公众号文章",
        "ai-daily-newsletter": "写AI日报",
        "ai-kol-daily-newsletter": "KOL动态追踪",
        "openclaw-news-monitor": "搜索OpenClaw安全新闻",
        "product-competitor-analysis": "竞品分析报告",
        "daily-skill-evolution": "检查Skill更新",
        "daily-memory-extractor": "提取每日记忆",
        "chief-daily-report": "生成Chief日报",
        "cron-health-check": "检查Cron任务状态",
    }
    
    def __init__(self):
        self.config = self._load_config()
        self.task_map = self.config.get("task_agent_mapping", {})
        
    def _load_config(self):
        """加载配置文件"""
        import yaml
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    def generate_cron_command(self, task_name: str) -> str:
        """生成 Cron 命令 - 使用 session:main 触发自动路由"""
        task_config = self._find_task_config(task_name)
        if not task_name in self.TASK_KEYWORDS:
            return None
        
        schedule = task_config.get("schedule", "")
        description = task_config.get("description", "")
        priority = task_config.get("priority", "P2")
        
        # 生成任务消息（包含触发关键词）
        keyword = self.TASK_KEYWORDS.get(task_name, task_name)
        message = f"【定时任务】{description}\n\n请执行相关工作。"
        
        # 生成 openclaw cron add 命令
        # 使用 session:main 让消息发送到主会话，触发关键词路由
        cmd = f'''# {task_name} - {description}
openclaw cron add \\
  --name "{task_name}" \\
  --cron "{schedule}" \\
  --message "{message}" \\
  --session main \\
  --expect-final \\
  --deliver \\
  --description "[{priority}] {description}"'''
        
        return cmd
    
    def _find_task_config(self, task_name: str) -> dict:
        """查找任务配置"""
        if task_name in self.task_map:
            return self.task_map[task_name]
        
        import fnmatch
        for pattern in self.task_map.keys():
            if '*' in pattern and fnmatch.fnmatch(task_name, pattern):
                return self.task_map[pattern]
        
        return None
    
    def setup_all_crons(self, dry_run=True) -> list:
        """设置所有 Cron 任务"""
        commands = []
        
        for task_name in self.TASK_KEYWORDS.keys():
            cmd = self.generate_cron_command(task_name)
            if cmd:
                commands.append({
                    "task": task_name,
                    "command": cmd,
                    "action": "add" if not dry_run else "skip"
                })
        
        return commands
    
    def migrate_existing_jobs(self) -> list:
        """生成迁移现有任务的命令"""
        # 列出需要更新的任务
        migrations = []
        
        for task_name in self.TASK_KEYWORDS.keys():
            schedule = ""
            if task_name in self.task_map:
                schedule = self.task_map[task_name].get("schedule", "")
            
            migrations.append({
                "task": task_name,
                "schedule": schedule,
                "new_cmd": self.generate_cron_command(task_name)
            })
        
        return migrations


def main():
    generator = CronJobGenerator()
    
    if len(sys.argv) < 2:
        print("用法:")
        print("  python3 generate_cron_jobs.py          # 列出所有任务")
        print("  python3 generate_cron_jobs.py setup     # 生成添加命令")
        print("  python3 generate_cron_jobs.py <task>   # 生成单个任务命令")
        print("  python3 generate_cron_jobs.py migrate  # 迁移现有任务")
        print()
        print("任务列表:")
        for task, kw in generator.TASK_KEYWORDS.items():
            desc = ""
            if task in generator.task_map:
                desc = generator.task_map[task].get("description", "")
            print(f"  - {task}: {desc}")
        return 0
    
    arg = sys.argv[1]
    
    if arg == "setup":
        print("# 添加新的 Cron 任务的命令")
        print("# 使用 session:main 触发关键词自动路由到 Sub Agent\n")
        
        for item in generator.setup_all_crons():
            print(f"\n# {item['task']}")
            print(item['command'])
        
    elif arg == "migrate":
        print("# 迁移现有 Cron 任务")
        print("# 先删除旧任务，再添加新任务\n")
        
        # 现有任务ID映射
        existing_jobs = {
            "daily-content-publish": "5a160378-5922-404b-931c-3fdff950f9a3",
            "ai-daily-newsletter": "adfad5d3-6463-45d2-bd3d-bea50ccf7be3",
            "ai-kol-daily-newsletter": "1873b4bc-7ba5-4dec-9b32-52a141151d2c",
            "product-competitor-analysis": "fa50b8aa-04bd-4c59-879a-c12c3baba9d1",
            "daily-skill-evolution": "4517c896-6e4f-4a81-aafe-13502374689e",
            "cron-health-check": "d658456b-52fc-4e65-9917-70dce4168497",
            "chief-daily-report": "b3d07bf5-f15c-47e5-ad51-c07810a9aedd",
            "openclaw-news-monitor": "be2a305f-82e8-4c22-97be-bd07d12c5b1c",
        }
        
        for task, job_id in existing_jobs.items():
            print(f"\n# {task}")
            print(f"# 旧任务 ID: {job_id}")
            print(f"# openclaw cron rm {job_id}")
            cmd = generator.generate_cron_command(task)
            if cmd:
                print(cmd)
        
        print("\n\n# 注意: 复制上面的命令，先删除旧任务，再添加新任务")
        
    else:
        # 生成单个任务命令
        cmd = generator.generate_cron_command(arg)
        if cmd:
            print(f"# {arg}")
            print(cmd)
        else:
            print(f"未找到任务: {arg}")
            print("\n可用任务:")
            for task in generator.TASK_KEYWORDS.keys():
                print(f"  - {task}")
            return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
