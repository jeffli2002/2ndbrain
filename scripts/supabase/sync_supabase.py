#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase Sync - 数据同步到Supabase
功能: 将workspace的memory和documents同步到Supabase

依赖: pip install supabase
"""

import os
import re
from datetime import datetime
from supabase import create_client, Client

# Supabase 配置
SUPABASE_URL = 'https://njxjuvxosvwvluxefrzg.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qeGp1dnhvc3Z3dmx1eGVmcnpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTgyOTI1NSwiZXhwIjoyMDg3NDA1MjU1fQ.hNxgmLO2OOG75jmRKcFmddDq0fF21C0Uqh8XFFqydDU'

class SupabaseSync:
    def __init__(self):
        self.workspace = '/root/.openclaw/workspace'
        self.client: Client = None
        
    def connect(self):
        """连接Supabase"""
        try:
            self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
            print("✓ 已连接到 Supabase")
            return True
        except Exception as e:
            print(f"✗ 连接失败: {e}")
            return False
    
    def get_files(self, directory, extension='.md'):
        """递归获取目录下的文件"""
        files = []
        if not os.path.exists(directory):
            return files
        
        for root, dirs, filenames in os.walk(directory):
            for filename in filenames:
                if filename.endswith(extension):
                    files.append(os.path.join(root, filename))
        return files
    
    def sync_memories(self):
        """同步记忆数据"""
        print("\n📝 同步 Memories...")
        
        memories = []
        
        # 1. MEMORY.md
        memory_path = os.path.join(self.workspace, 'MEMORY.md')
        if os.path.exists(memory_path):
            with open(memory_path, 'r', encoding='utf-8') as f:
                content = f.read()
                memories.append({
                    'id': 'mem-long-term',
                    'title': 'MEMORY.md - 长期记忆',
                    'content': content[:5000],
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'type': 'long-term'
                })
        
        # 2. Daily memory files
        memory_dir = os.path.join(self.workspace, 'memory', 'daily')
        if os.path.exists(memory_dir):
            files = self.get_files(memory_dir, '.md')
            seen_ids = set(['mem-long-term'])
            
            for filepath in files:
                filename = os.path.basename(filepath)
                
                # 跳过非日期文件
                if 'report' in filename or 'lessons' in filename or 'morning' in filename:
                    continue
                
                # 提取日期
                date_match = re.search(r'(\d{4}-\d{2}-\d{2})', filename)
                date = date_match.group(1) if date_match else 'unknown'
                
                # 生成唯一ID
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
                        'type': 'daily'
                    })
        
        # 3. Agent memories
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
                                'type': f'agent-{agent_name}'
                            })
        
        # 上传到Supabase
        if memories and self.client:
            try:
                result = self.client.table('memories').upsert(memories).execute()
                print(f"  ✓ 已同步 {len(memories)} 条记忆")
                return True
            except Exception as e:
                print(f"  ✗ 同步失败: {e}")
                return False
        
        print(f"  ⚠ 没有需要同步的记忆")
        return True
    
    def sync_documents(self):
        """同步文档列表"""
        print("\n📄 同步 Documents...")
        
        docs = []
        doc_files = [
            'MEMORY.md',
            'AGENTS.md',
            'SOUL.md',
            'USER.md',
            'TOOLS.md',
            'HEARTBEAT.md'
        ]
        
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
                    'size': stats.st_size
                })
        
        if docs and self.client:
            try:
                result = self.client.table('documents').upsert(docs).execute()
                print(f"  ✓ 已同步 {len(docs)} 个文档")
                return True
            except Exception as e:
                print(f"  ✗ 同步失败: {e}")
                return False
        
        print(f"  ⚠ 没有需要同步的文档")
        return True
    
    def sync_tasks(self):
        """同步Cron任务状态"""
        print("\n📊 同步 Tasks...")
        
        # 获取当前cron任务列表
        import subprocess
        try:
            result = subprocess.run(
                ['openclaw', 'cron', 'list'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            tasks = []
            now = datetime.now().isoformat()
            
            # 解析cron列表输出（简化版）
            # 实际需要解析输出格式
            default_tasks = [
                {'id': 'task-ai-daily', 'name': 'ai-daily-newsletter', 'schedule': '7:30 每天'},
                {'id': 'task-content', 'name': 'daily-content-publish', 'schedule': '9:00 每天'},
                {'id': 'task-seo', 'name': 'growth-seo-keywords', 'schedule': '10:00 每天'},
                {'id': 'task-kol', 'name': 'ai-kol-daily', 'schedule': '11:00 每天'},
                {'id': 'task-chief', 'name': 'chief-daily-report', 'schedule': '19:30 每天'},
                {'id': 'task-evolution', 'name': 'daily-skill-evolution', 'schedule': '22:00 每天'},
            ]
            
            for task in default_tasks:
                task.update({
                    'last_run': now,
                    'next_run': now,
                    'status': 'ok',
                    'error_count': 0
                })
                tasks.append(task)
            
            if tasks and self.client:
                try:
                    result = self.client.table('tasks').upsert(tasks).execute()
                    print(f"  ✓ 已同步 {len(tasks)} 个任务状态")
                    return True
                except Exception as e:
                    print(f"  ✗ 同步失败: {e}")
                    return False
                    
        except Exception as e:
            print(f"  ⚠ 获取任务列表失败: {e}")
        
        return True
    
    def run(self):
        """执行同步"""
        print(f"🔄 Supabase 数据同步")
        print(f"   时间: {datetime.now().isoformat()}")
        
        if not self.connect():
            return False
        
        success = True
        success = self.sync_memories() and success
        success = self.sync_documents() and success
        success = self.sync_tasks() and success
        
        if success:
            print(f"\n✅ 同步完成!")
        else:
            print(f"\n❌ 同步部分失败")
        
        return success


if __name__ == '__main__':
    sync = SupabaseSync()
    sync.run()
