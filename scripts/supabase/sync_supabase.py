#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase Sync - 数据同步到 Supabase
功能:
1. 同步 workspace 的 memories / documents
2. 从真实 OpenClaw cron 状态与 run usage 同步 Second Brain tasks
3. 回填本地 cron runs 历史，补齐旧任务的 last_run / token_usage

依赖: pip install supabase
"""

import glob
import json
import os
import re
import subprocess
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from supabase import Client, create_client

CREDENTIALS_PATH = '/root/.openclaw/credentials/supabase.json'
with open(CREDENTIALS_PATH, 'r', encoding='utf-8') as f:
    _creds = json.load(f)
SUPABASE_URL = _creds['url']
SUPABASE_KEY = _creds['service_key']

TASK_MAPPINGS = [
    {'task_id': 'task-ai-daily', 'job_name': 'ai-daily-newsletter', 'schedule': '07:30 每天', 'agent': 'content'},
    {'task_id': 'task-content-publish', 'job_name': 'daily-content-publish', 'schedule': '09:00 每天', 'agent': 'content'},
    {'task_id': 'task-kol', 'job_name': 'ai-kol-daily-newsletter', 'schedule': '11:00 每天', 'agent': 'content'},
    {'task_id': 'task-seo', 'job_name': 'openclaw-news-monitor', 'schedule': '每2小时', 'agent': 'growth'},
    {'task_id': 'task-chief', 'job_name': 'chief-daily-report', 'schedule': '19:30 每天', 'agent': 'chief'},
    {'task_id': 'task-evolution', 'job_name': 'daily-skill-evolution', 'schedule': '22:00 每天', 'agent': 'coding'},
    {'task_id': 'task-product', 'job_name': 'product-competitor-analysis', 'schedule': '14:00 每天', 'agent': 'product'},
    {'task_id': 'task-health', 'job_name': 'cron-health-check', 'schedule': '每2小时', 'agent': 'chief'},
]

# Agent aggregate task mappings (for team page lastActive display)
AGENT_AGGREGATE_MAPPINGS = [
    {'agent_id': 'chief', 'name': 'Chief Agent', 'task_ids': ['task-chief', 'task-health']},
    {'agent_id': 'content', 'name': 'Content Agent', 'task_ids': ['task-ai-daily', 'task-content-publish', 'task-kol']},
    {'agent_id': 'growth', 'name': 'Growth Agent', 'task_ids': ['task-seo']},
    {'agent_id': 'coding', 'name': 'Coding Agent', 'task_ids': ['task-evolution']},
    {'agent_id': 'product', 'name': 'Product Agent', 'task_ids': ['task-product']},
    {'agent_id': 'finance', 'name': 'Finance Agent', 'task_ids': []},
]
SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000


class SupabaseSync:
    def __init__(self):
        self.workspace = '/root/.openclaw/workspace'
        self.jobs_path = '/root/.openclaw/cron/jobs.json'
        self.cron_dir = '/root/.openclaw/cron'
        self.runs_dir = '/root/.openclaw/cron/runs'
        self.client: Optional[Client] = None

    def connect(self):
        try:
            self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
            print('✓ 已连接到 Supabase')
            return True
        except Exception as e:
            print(f'✗ 连接失败: {e}')
            return False

    def get_files(self, directory, extension='.md'):
        files = []
        if not os.path.exists(directory):
            return files
        for root, _dirs, filenames in os.walk(directory):
            for filename in filenames:
                if filename.endswith(extension):
                    files.append(os.path.join(root, filename))
        return files

    def sync_memories(self):
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
                    for filepath in self.get_files(agent_path, '.md'):
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

        now_iso = datetime.now(timezone.utc).isoformat()
        if memories and self.client:
            try:
                payload = [{**row, 'updated_at': now_iso} for row in memories]
                self.client.table('memories').upsert(payload).execute()
                print(f'  ✓ 已同步 {len(memories)} 条记忆')
                return True
            except Exception as e:
                print(f'  ✗ 同步失败: {e}')
                return False

        print('  ⚠ 没有需要同步的记忆')
        return True

    def sync_documents(self):
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

        historical_token_docs = self.build_historical_token_snapshots()
        docs.extend(historical_token_docs)

        now_iso = datetime.now(timezone.utc).isoformat()
        if docs and self.client:
            try:
                payload = [{**row, 'updated_at': row.get('updated_at', now_iso)} for row in docs]
                self.client.table('documents').upsert(payload).execute()
                print(f'  ✓ 已同步 {len(docs)} 个文档（其中 token 日快照 {len(historical_token_docs)} 条）')
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

    def get_job_ids_for_name(self, job_name: str) -> List[str]:
        ids = set()
        for path in glob.glob(os.path.join(self.cron_dir, 'jobs.json*')):
            try:
                obj = json.load(open(path, 'r', encoding='utf-8'))
            except Exception:
                continue
            for job in obj.get('jobs', []):
                if job.get('name') == job_name and job.get('id'):
                    ids.add(job['id'])
        return sorted(ids)

    def iter_finished_run_entries(self, job_name: str):
        for job_id in self.get_job_ids_for_name(job_name):
            run_file = os.path.join(self.runs_dir, f'{job_id}.jsonl')
            if not os.path.exists(run_file):
                continue
            try:
                with open(run_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        entry = json.loads(line)
                        if entry.get('action') == 'finished':
                            yield entry
            except Exception:
                continue

    def get_latest_historical_run(self, job_name: str) -> Optional[Dict[str, Any]]:
        latest = None
        for entry in self.iter_finished_run_entries(job_name):
            if latest is None or (entry.get('runAtMs') or 0) > (latest.get('runAtMs') or 0):
                latest = entry
        return latest

    @staticmethod
    def shanghai_date(ms: int) -> str:
        return datetime.fromtimestamp((ms + SHANGHAI_OFFSET_MS) / 1000, tz=timezone.utc).strftime('%Y-%m-%d')

    def build_historical_token_snapshots(self) -> List[Dict[str, Any]]:
        by_date: Dict[str, Dict[str, Any]] = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        for mapping in TASK_MAPPINGS:
            seen_run_keys = set()
            for entry in self.iter_finished_run_entries(mapping['job_name']):
                run_at_ms = entry.get('runAtMs')
                total_tokens = (entry.get('usage') or {}).get('total_tokens')
                if not run_at_ms or not isinstance(total_tokens, (int, float)):
                    continue

                run_key = f"{mapping['task_id']}:{run_at_ms}:{total_tokens}"
                if run_key in seen_run_keys:
                    continue
                seen_run_keys.add(run_key)

                date_key = self.shanghai_date(run_at_ms)
                point = by_date.setdefault(date_key, {
                    'date': date_key,
                    'totalTokens': 0,
                    'taskBreakdown': {},
                })
                point['totalTokens'] += total_tokens
                point['taskBreakdown'][mapping['task_id']] = point['taskBreakdown'].get(mapping['task_id'], 0) + total_tokens

        docs = []
        for date_key in sorted(by_date.keys()):
            point = by_date[date_key]
            content = json.dumps(point, ensure_ascii=False)
            docs.append({
                'id': f"doc-token-daily-{date_key}",
                'title': f"Token Daily Snapshot {date_key}",
                'path': f"/metrics/token-daily/{date_key}.json",
                'type': 'metric-token-daily',
                'date': date_key,
                'size': len(content),
                'content': content,
                'updated_at': now_iso,
            })
        return docs

    @staticmethod
    def pick_latest_run(*runs: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        candidates = [r for r in runs if r]
        if not candidates:
            return None
        return max(candidates, key=lambda r: (r.get('runAtMs') or 0, r.get('ts') or 0))

    @staticmethod
    def ms_to_iso(ms: Optional[int]) -> Optional[str]:
        if not ms:
            return None
        return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).isoformat()

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
        now = datetime.now(timezone.utc).isoformat()

        row = {
            'id': task_id,
            'name': job_name,
            'schedule': mapping['schedule'],
            'status': existing_row.get('status', 'idle'),
            'last_run': existing_row.get('last_run'),
            'last_duration': existing_row.get('last_duration'),
            'next_run': existing_row.get('next_run'),
            'error_count': existing_row.get('error_count', 0),
            'token_usage': existing_row.get('token_usage', 0),
            'updated_at': now,
        }

        latest_cli_run = self.get_latest_run(job['id']) if job else None
        latest_hist_run = self.get_latest_historical_run(job_name)
        latest_run = self.pick_latest_run(latest_cli_run, latest_hist_run)
        state = (job or {}).get('state', {}) or {}

        if job:
            row['status'] = 'disabled' if not job.get('enabled', True) else 'idle'
            row['error_count'] = state.get('consecutiveErrors', row['error_count'])
            row['next_run'] = self.ms_to_iso(state.get('nextRunAtMs')) or row['next_run']

        row['status'] = (latest_run or {}).get('status') or state.get('lastStatus') or row['status']
        row['last_run'] = self.ms_to_iso((latest_run or {}).get('runAtMs') or state.get('lastRunAtMs')) or row['last_run']
        row['last_duration'] = self.ms_to_duration((latest_run or {}).get('durationMs') or state.get('lastDurationMs')) or row['last_duration']

        usage = (latest_run or {}).get('usage') or {}
        total_tokens = usage.get('total_tokens')
        if total_tokens is not None:
            row['token_usage'] = total_tokens

        return row

    def build_agent_aggregate_row(self, agent_mapping: Dict[str, Any], all_tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Build aggregated agent row from all tasks (for team page lastActive display)."""
        agent_id = agent_mapping['agent_id']
        task_ids = agent_mapping['task_ids']

        # Find tasks belonging to this agent
        agent_tasks = [t for t in all_tasks if t.get('id') in task_ids]

        # Calculate aggregate stats
        completed = sum(1 for t in agent_tasks if t.get('status') == 'ok')
        failed = sum(1 for t in agent_tasks if t.get('status') == 'error')
        running = sum(1 for t in agent_tasks if t.get('status') == 'running')

        # Find latest last_run and updated_at from agent's tasks
        latest_last_run = None
        latest_updated_at = None

        for task in agent_tasks:
            task_last_run = task.get('last_run')
            task_updated_at = task.get('updated_at')

            if task_last_run and (not latest_last_run or task_last_run > latest_last_run):
                latest_last_run = task_last_run
            if task_updated_at and (not latest_updated_at or task_updated_at > latest_updated_at):
                latest_updated_at = task_updated_at

        # Also check recent session activity (from OpenClaw sessions)
        try:
            result = subprocess.run(
                ['openclaw', 'sessions', '--json', '--all-agents', '--active', '20160'],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                import re
                match = re.search(r'\{[\s\S]*\}', result.stdout)
                if match:
                    data = json.loads(match.group())
                    sessions = data.get('sessions', [])
                    for session in sessions:
                        agent = session.get('agentId', '')
                        # Normalize agent ID
                        if agent == 'main':
                            agent = 'chief'
                        if agent != agent_id:
                            continue
                        # Skip cron sessions
                        if ':cron:' in str(session.get('key', '')):
                            continue
                        session_updated = session.get('updatedAt')
                        if session_updated:
                            # Convert to ISO format
                            session_iso = datetime.fromtimestamp(session_updated / 1000, tz=timezone.utc).isoformat()
                            if not latest_updated_at or session_iso > latest_updated_at:
                                latest_updated_at = session_iso
        except Exception as e:
            print(f'    ⚠ Failed to load recent sessions: {e}')

        # Determine status
        status = 'idle'
        if running > 0:
            status = 'running'
        elif failed > 0:
            status = 'error'
        elif completed > 0:
            status = 'ok'

        # Calculate token usage
        token_usage = sum(t.get('token_usage', 0) for t in agent_tasks)

        now = datetime.now(timezone.utc).isoformat()

        return {
            'id': f'agent-{agent_id}',
            'name': agent_mapping['name'],
            'schedule': f'{len(task_ids)} tasks',
            'status': status,
            'last_run': latest_last_run,
            'last_duration': None,
            'next_run': None,
            'error_count': failed,
            'token_usage': token_usage,
            'updated_at': latest_updated_at or now,
        }

    def sync_tasks(self):
        print('\n📊 同步 Tasks...')
        jobs_by_name = self.load_cron_jobs()
        existing = self.get_existing_tasks()
        tasks = [self.build_task_row(mapping, jobs_by_name, existing) for mapping in TASK_MAPPINGS]

        # Build agent aggregate rows for team page
        agent_aggregate_tasks = []
        for agent_mapping in AGENT_AGGREGATE_MAPPINGS:
            agent_row = self.build_agent_aggregate_row(agent_mapping, tasks)
            agent_aggregate_tasks.append(agent_row)

        all_tasks = tasks + agent_aggregate_tasks

        if all_tasks and self.client:
            try:
                self.client.table('tasks').upsert(all_tasks).execute()
                print(f'  ✓ 已同步 {len(all_tasks)} 个任务状态（{len(tasks)} 个 cron + {len(agent_aggregate_tasks)} 个 agent 聚合）')
                for task in all_tasks:
                    print(f"    - {task['id']}: status={task['status']}, last_run={task.get('last_run')}, updated_at={task.get('updated_at')}")
                return True
            except Exception as e:
                print(f'  ✗ 同步失败: {e}')
                return False

        print('  ⚠ 没有需要同步的任务')
        return True

    def run(self):
        print('🔄 Supabase 数据同步')
        print(f'   时间: {datetime.now(timezone.utc).isoformat()}')
        if not self.connect():
            return False

        success = True
        success = self.sync_memories() and success
        success = self.sync_documents() and success
        success = self.sync_tasks() and success

        print('\n✅ 同步完成!' if success else '\n❌ 同步部分失败')
        return success


if __name__ == '__main__':
    sync = SupabaseSync()
    sync.run()
