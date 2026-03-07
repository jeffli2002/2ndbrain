#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase Sync - 数据同步到 Supabase
功能:
1. 同步 workspace 的 memories / documents
2. 从真实 OpenClaw cron 状态与 run usage 同步 Second Brain tasks

依赖: pip install supabase
"""

import json
import os
import re
import subprocess
from datetime import datetime
from typing import Any, Dict, List, Optional

from supabase import Client, create_client

# Supabase 配置
SUPABASE_URL = 'https://njxjuvxosvwvluxefrzg.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qeGp1dnhvc3Z3dmx1eGVmcnpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTgyOTI1NSwiZXhwIjoyMDg3NDA1MjU1fQ.hNxgmLO2OOG75jmRKcFmddDq0fF21C0Uqh8XFFqydDU'

TASK_MAPPINGS = [
    {'task_id': 'task-ai-daily', 'job_name': 'ai-daily-newsletter', 'schedule': '07:30 每天'},
    {'task_id': 'task-content-publish', 'job_name': 'daily-content-publish', 'schedule': '09:00 每天'},
    {'task_id': 'task-kol', 'job_name': 'ai-kol-daily-newsletter', 'schedule': '11:00 每天'},
    {'task_id': 'task-seo', 'job_name': 'openclaw-news-monitor', 'schedule': '每2小时'},
    {'task_id': 'task-chief', 'job_name': 'chief-daily-report', 'schedule': '19:30 每天'},
    {'task_id': 'task-evolution', 'job_name': 'daily-skill-evolution', 'schedule': '22:00 每天'},
    {'task_id': 'task-product', 'job_name': 'product-competitor-analysis', 'schedule': '14:00 每天'},
    {'task_id': 'task-health', 'job_name': 'cron-health-check', 'schedule': '每2小时'},
]


class SupabaseSync:
    def __init__(self):
        self.workspace = '/root/.openclaw/workspace'
        self.jobs_path = '/root/.openclaw/cron/jobs.json'
        self.client: Optional[Client] = None

    def connect(self):
        """连接 Supabase"""
        try:
            self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
            print('✓ 已连接到 Supabase')
            return True
        except Exception as e:
            print(f'✗ 连接失败: {e}')
            return False

    def get_files(self, directory, extension='.md'):
        """递归获取目录下的文件"""
        files = []
        if not os.path.exists(directory):
            return files

        for root, _dirs, filenames in os.walk(directory):
            for filename in filenames:
                if filename.endswith(extension):
                    files.append(os.path.join(root, filename))
        return files

    def sync_memories(self):
        """同步记忆数据"""
        print('\n📝 同步 Memories...')

        memories = []

        memory_path = os.path.join(self.workspace, 'MEMORY.md')
        if os.path.exists(memory_path):
            with open(memory_path, 'r', encoding='utf-8') as f:
                content = f.read()
                memories.append({
                    'id': 'mem-long-term',
                    'title': 'MEMORY.md - 长期记忆',
                    'content': content[:5000],
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'type': 'long-term',
                })

        memory_dir = os.path.join(self.workspace, 'memory', 'daily')
        if os.path.exists(memory_dir):
            files = self.get_files(memory_dir, '.md')
            seen_ids = {'mem-long-term'}

            for filepath in files:
                filename = os.path.basename(filepath)
                if 'report' in filename or 'lessons' in filename or 'morning' in filename:
                    continue

                date_match = re.search(r'(\d{4}-\d{2}-\d{2})', filename)
                date = date_match.group(1) if date_match else 'unknown'
                base_name = filename.replace('.md', '')
                mem_id = f'mem-{base_name}'

                if mem_id in seen_ids:
                    continue
                seen_ids.add(mem_id)

                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    memories.append({
                        'id': mem_id,
                        'title': f'工作日志 {base_name}',
                        'content': content[:3000],
                        'date': date,
                        'type': 'daily',
                    })

        agents_dir = os.path.join(self.workspace, 'memory', 'agents')
        if os.path.exists(agents_dir):
            for agent_name in os.listdir(agents_dir):
                agent_path = os.path.join(agents_dir, agent_name)
                if os.path.isdir(agent_path):
                    agent_files = self.get_files(agent_path, '.md')
                    for filepath in agent_files:
                        filename = os.path.basename(filepath)
                        mem_id = f'mem-{agent_name}-{filename.replace(".md", "")}'
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                            memories.append({
                                'id': mem_id,
                                'title': f'{agent_name} Agent - {filename}',
                                'content': content[:3000],
                                'date': datetime.now().strftime('%Y-%m-%d'),
                                'type': f'agent-{agent_name}',
                            })

        if memories and self.client:
            try:
                self.client.table('memories').upsert(memories).execute()
                print(f'  ✓ 已同步 {len(memories)} 条记忆')
                return True
            except Exception as e:
                print(f'  ✗ 同步失败: {e}')
                return False

        print('  ⚠ 没有需要同步的记忆')
        return True

    def sync_documents(self):
        """同步文档列表"""
        print('\n📄 同步 Documents...')

        docs = []
        doc_files = ['MEMORY.md', 'AGENTS.md', 'SOUL.md', 'USER.md', 'TOOLS.md', 'HEARTBEAT.md']

        for doc_file in doc_files:
            filepath = os.path.join(self.workspace, doc_file)
            if os.path.exists(filepath):
                stats = os.stat(filepath)
                docs.append({
                    'id': f'doc-{doc_file.replace(".md", "")}',
                    'title': doc_file,
                    'path': f'/{self.workspace}/{doc_file}',
                    'type': 'config',
                    'date': datetime.fromtimestamp(stats.st_mtime).strftime('%Y-%m-%d'),
                    'size': stats.st_size,
                })

        if docs and self.client:
            try:
                self.client.table('documents').upsert(docs).execute()
                print(f'  ✓ 已同步 {len(docs)} 个文档')
                return True
            except Exception as e:
                print(f'  ✗ 同步失败: {e}')
                return False

        print('  ⚠ 没有需要同步的文档')
        return True

    def load_cron_jobs(self) -> Dict[str, Any]:
        if not os.path.exists(self.jobs_path):
            return {}
        with open(self.jobs_path, 'r', encoding='utf-8') as f:
            obj = json.load(f)
        return {job['name']: job for job in obj.get('jobs', [])}

    def get_latest_run(self, job_id: str) -> Optional[Dict[str, Any]]:
        try:
            result = subprocess.run(
                ['openclaw', 'cron', 'runs', '--id', job_id, '--limit', '1'],
                capture_output=True,
                text=True,
                timeout=15,
                check=True,
            )
            payload = json.loads(result.stdout or '{}')
            entries = payload.get('entries') or []
            return entries[0] if entries else None
        except Exception:
            return None

    @staticmethod
    def ms_to_iso(ms: Optional[int]) -> Optional[str]:
        if not ms:
            return None
        return datetime.fromtimestamp(ms / 1000).isoformat()

    @staticmethod
    def ms_to_duration(ms: Optional[int]) -> Optional[str]:
        if ms is None:
            return None
        seconds = max(0, round(ms / 1000))
        return f'{seconds}s'

    def get_existing_tasks(self) -> Dict[str, Dict[str, Any]]:
        try:
            rows = self.client.table('tasks').select('*').execute().data or []
            return {row['id']: row for row in rows}
        except Exception:
            return {}

    def build_task_row(self, mapping: Dict[str, str], jobs_by_name: Dict[str, Any], existing: Dict[str, Any]) -> Dict[str, Any]:
        task_id = mapping['task_id']
        job_name = mapping['job_name']
        existing_row = existing.get(task_id, {})
        job = jobs_by_name.get(job_name)
        now = datetime.now().isoformat()

        row = {
            'id': task_id,
            'name': job_name,
            'schedule': mapping['schedule'],
            'status': existing_row.get('status', 'idle'),
            'last_run': None,
            'last_duration': None,
            'next_run': None,
            'error_count': 0,
            'token_usage': existing_row.get('token_usage', 0),
            'updated_at': now,
        }

        if not job:
            return row

        state = job.get('state', {}) or {}
        latest_run = self.get_latest_run(job['id'])
        row['status'] = 'disabled' if not job.get('enabled', True) else 'idle'

        row['status'] = (
            (latest_run or {}).get('status')
            or state.get('lastStatus')
            or row['status']
        )
        row['last_run'] = self.ms_to_iso((latest_run or {}).get('runAtMs') or state.get('lastRunAtMs'))
        row['next_run'] = self.ms_to_iso((latest_run or {}).get('nextRunAtMs') or state.get('nextRunAtMs'))
        row['last_duration'] = self.ms_to_duration((latest_run or {}).get('durationMs') or state.get('lastDurationMs'))
        row['error_count'] = state.get('consecutiveErrors', 0)

        usage = (latest_run or {}).get('usage') or {}
        total_tokens = usage.get('total_tokens')
        if total_tokens is not None:
            row['token_usage'] = total_tokens

        return row

    def sync_tasks(self):
        """同步 Second Brain tasks: 使用真实 cron 状态和 token usage"""
        print('\n📊 同步 Tasks...')

        jobs_by_name = self.load_cron_jobs()
        existing = self.get_existing_tasks()
        tasks = [self.build_task_row(mapping, jobs_by_name, existing) for mapping in TASK_MAPPINGS]

        if tasks and self.client:
            try:
                self.client.table('tasks').upsert(tasks).execute()
                print(f'  ✓ 已同步 {len(tasks)} 个任务状态（真实 cron + token usage）')
                for task in tasks:
                    print(
                        f"    - {task['id']}: status={task['status']}, token={task.get('token_usage', 0)}, last_run={task.get('last_run')}"
                    )
                return True
            except Exception as e:
                print(f'  ✗ 同步失败: {e}')
                return False

        print('  ⚠ 没有需要同步的任务')
        return True

    def run(self):
        print('🔄 Supabase 数据同步')
        print(f'   时间: {datetime.now().isoformat()}')

        if not self.connect():
            return False

        success = True
        success = self.sync_memories() and success
        success = self.sync_documents() and success
        success = self.sync_tasks() and success

        if success:
            print('\n✅ 同步完成!')
        else:
            print('\n❌ 同步部分失败')

        return success


if __name__ == '__main__':
    sync = SupabaseSync()
    sync.run()
